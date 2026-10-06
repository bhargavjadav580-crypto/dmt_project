import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export async function generateInvoice(visitId: string) {
  return db.$transaction(async (tx) => {
    // Check if invoice already exists
    let invoice = await tx.invoice.findUnique({
      where: { visitId },
      include: { items: true, payments: true },
    });

    if (invoice) {
      return invoice;
    }

    const visit = await tx.visit.findUniqueOrThrow({
      where: { id: visitId },
      include: {
        consultation: true,
        labOrders: { include: { labTest: true } },
        prescriptions: { include: { items: { include: { medicine: true } } } },
        admission: { include: { bed: { include: { ward: true } } } },
      },
    });

    const itemsToCreate: Array<{
      category: string;
      description: string;
      quantity: number;
      unitPricePaise: number;
      totalPaise: number;
      taxRate: number;
      taxPaise: number;
      referenceId?: string | null;
    }> = [];

    // 1. Consultation fee (default 50000 paise = ₹500)
    if (visit.consultation) {
      itemsToCreate.push({
        category: 'CONSULTATION',
        description: 'Doctor Consultation',
        quantity: 1,
        unitPricePaise: 50000,
        totalPaise: 50000,
        taxRate: 0,
        taxPaise: 0,
        referenceId: visit.consultation.id,
      });
    }

    // 2. Lab tests
    for (const order of visit.labOrders) {
      if (order.status !== 'ORDERED') {
        const price = order.labTest?.pricePaise || 30000;
        itemsToCreate.push({
          category: 'LAB',
          description: order.labTest?.name || 'Diagnostic Test',
          quantity: 1,
          unitPricePaise: price,
          totalPaise: price,
          taxRate: 0,
          taxPaise: 0,
          referenceId: order.id,
        });
      }
    }

    // 3. Dispensed medicines
    for (const rx of visit.prescriptions) {
      for (const item of rx.items) {
        if (item.dispensedQty > 0) {
          const unitPrice = item.medicine?.pricePaise || 500;
          const total = unitPrice * item.dispensedQty;
          itemsToCreate.push({
            category: 'MEDICINE',
            description: item.medicineName,
            quantity: item.dispensedQty,
            unitPricePaise: unitPrice,
            totalPaise: total,
            taxRate: 0,
            taxPaise: 0,
            referenceId: item.id,
          });
        }
      }
    }

    // 4. Inpatient bed charges
    if (visit.admission && visit.admission.admittedAt && visit.admission.bed?.ward) {
      const dailyTariff = visit.admission.bed.ward.dailyTariffPaise || 50000;
      itemsToCreate.push({
        category: 'BED',
        description: `Ward Bed (${visit.admission.bed.ward.name} - ${visit.admission.bed.number})`,
        quantity: 1,
        unitPricePaise: dailyTariff,
        totalPaise: dailyTariff,
        taxRate: 0,
        taxPaise: 0,
        referenceId: visit.admission.id,
      });
    }

    // Fallback if no items
    if (itemsToCreate.length === 0) {
      itemsToCreate.push({
        category: 'CONSULTATION',
        description: 'Hospital Visit Fee',
        quantity: 1,
        unitPricePaise: 50000,
        totalPaise: 50000,
        taxRate: 0,
        taxPaise: 0,
      });
    }

    const subtotalPaise = itemsToCreate.reduce((sum, item) => sum + item.totalPaise, 0);
    const taxPaise = itemsToCreate.reduce((sum, item) => sum + item.taxPaise, 0);
    const totalPaise = subtotalPaise + taxPaise;

    invoice = await tx.invoice.create({
      data: {
        visitId,
        status: 'PENDING',
        subtotalPaise,
        taxPaise,
        discountPaise: 0,
        totalPaise,
        paidPaise: 0,
        items: {
          create: itemsToCreate,
        },
      },
      include: { items: true, payments: true },
    });

    await tx.visit.update({
      where: { id: visitId },
      data: { stage: 'BILLING_PENDING' },
    });

    return invoice;
  });
}

export async function getInvoice(visitId: string) {
  return db.invoice.findUnique({
    where: { visitId },
    include: {
      items: true,
      payments: { include: { receivedBy: true }, orderBy: { createdAt: 'desc' } },
      visit: { include: { patient: true, department: true } },
    },
  });
}

export async function addManualItem(
  invoiceId: string,
  item: { description: string; unitPricePaise: number; quantity?: number; category?: string },
  reason: string
) {
  return db.$transaction(async (tx) => {
    const qty = item.quantity || 1;
    const total = item.unitPricePaise * qty;

    await tx.invoiceItem.create({
      data: {
        invoiceId,
        description: item.description,
        unitPricePaise: item.unitPricePaise,
        quantity: qty,
        totalPaise: total,
        category: item.category || 'MANUAL',
        taxRate: 0,
        taxPaise: 0,
        reason,
      },
    });

    return recalculateInvoiceInternal(tx, invoiceId);
  });
}

export async function recordPayment(
  invoiceId: string,
  method: string,
  amountPaise: number,
  reference: string | null = null,
  receivedById: string
) {
  return db.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        invoiceId,
        method,
        amountPaise,
        reference: reference || null,
        receivedById,
      },
    });

    const invoice = await tx.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: { visit: true },
    });

    const newPaid = invoice.paidPaise + amountPaise;
    const isPaid = newPaid >= invoice.totalPaise;
    const newStatus = isPaid ? 'PAID' : 'PARTIAL';

    const updated = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        paidPaise: newPaid,
        status: newStatus,
      },
    });

    if (isPaid) {
      await tx.visit.update({
        where: { id: invoice.visitId },
        data: { stage: 'READY_FOR_DISCHARGE' },
      });
    }

    const actor = await tx.user.findUnique({ where: { id: receivedById } });
    await tx.flowEvent.create({
      data: {
        visitId: invoice.visitId,
        type: 'BILLING_UPDATE',
        stage: isPaid ? 'READY_FOR_DISCHARGE' : 'BILLING_PENDING',
        actorId: receivedById,
        actorName: actor?.name || 'Billing Staff',
        metadata: JSON.stringify({ action: 'PAYMENT_RECORDED', amountPaise, method, isPaid }),
      },
    });

    return updated;
  });
}

export async function waiveInvoice(invoiceId: string, reason: string, actorId: string) {
  return db.$transaction(async (tx) => {
    const invoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: 'WAIVED' },
      include: { visit: true },
    });

    await tx.visit.update({
      where: { id: invoice.visitId },
      data: { stage: 'READY_FOR_DISCHARGE' },
    });

    const actor = await tx.user.findUnique({ where: { id: actorId } });
    await tx.flowEvent.create({
      data: {
        visitId: invoice.visitId,
        type: 'BILLING_UPDATE',
        stage: 'READY_FOR_DISCHARGE',
        actorId,
        actorName: actor?.name || 'Staff',
        metadata: JSON.stringify({ action: 'INVOICE_WAIVED', reason }),
      },
    });

    return invoice;
  });
}

async function recalculateInvoiceInternal(tx: Prisma.TransactionClient, invoiceId: string) {
  const items = await tx.invoiceItem.findMany({ where: { invoiceId } });
  const subtotalPaise = items.reduce((sum, item) => sum + item.totalPaise, 0);
  const taxPaise = items.reduce((sum, item) => sum + item.taxPaise, 0);
  const totalPaise = subtotalPaise + taxPaise;

  const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  const newStatus = invoice.paidPaise >= totalPaise ? 'PAID' : invoice.paidPaise > 0 ? 'PARTIAL' : 'PENDING';

  return tx.invoice.update({
    where: { id: invoiceId },
    data: {
      subtotalPaise,
      taxPaise,
      totalPaise,
      status: newStatus,
    },
    include: { items: true, payments: true },
  });
}

export async function recalculateInvoice(invoiceId: string) {
  return db.$transaction((tx) => recalculateInvoiceInternal(tx, invoiceId));
}
