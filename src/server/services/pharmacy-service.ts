import { db } from '@/lib/db';

export interface PrescriptionItemInput {
  medicineId?: string | null;
  medicineName: string;
  dose: string;
  frequency: string;
  durationDays?: number | null;
  quantity: number;
}

export async function createPrescription(
  visitId: string,
  prescribedById: string,
  items: PrescriptionItemInput[]
) {
  return db.$transaction(async (tx) => {
    const prescription = await tx.prescription.create({
      data: {
        visitId,
        prescribedById,
        status: 'PENDING',
        items: {
          create: items.map((item) => ({
            medicineId: item.medicineId || null,
            medicineName: item.medicineName,
            dose: item.dose,
            frequency: item.frequency,
            durationDays: item.durationDays || null,
            quantity: item.quantity,
            dispensedQty: 0,
            status: 'PENDING',
          })),
        },
      },
      include: { items: true },
    });

    // Update visit stage to PHARMACY_PENDING if not already further
    await tx.visit.update({
      where: { id: visitId },
      data: { stage: 'PHARMACY_PENDING' },
    });

    const actor = await tx.user.findUnique({ where: { id: prescribedById } });
    await tx.flowEvent.create({
      data: {
        visitId,
        type: 'PHARMACY_UPDATE',
        stage: 'PHARMACY_PENDING',
        actorId: prescribedById,
        actorName: actor?.name || 'Doctor',
        metadata: JSON.stringify({ action: 'PRESCRIPTION_CREATED', itemCount: items.length }),
      },
    });

    return prescription;
  });
}

export async function getPendingPrescriptions() {
  return db.prescription.findMany({
    where: { status: { in: ['PENDING', 'PARTIAL'] } },
    include: {
      visit: {
        include: { patient: true, department: true },
      },
      prescribedBy: true,
      items: {
        include: { medicine: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPrescription(prescriptionId: string) {
  return db.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      items: { include: { medicine: true } },
      prescribedBy: true,
      visit: { include: { patient: true, department: true } },
    },
  });
}

export async function dispenseMedicines(
  prescriptionId: string,
  itemUpdates: { itemId: string; dispenseQuantity: number }[],
  actorId: string
) {
  return db.$transaction(async (tx) => {
    for (const update of itemUpdates) {
      const item = await tx.prescriptionItem.findUniqueOrThrow({
        where: { id: update.itemId },
      });

      if (update.dispenseQuantity > 0) {
        if (item.medicineId) {
          await tx.medicine.update({
            where: { id: item.medicineId },
            data: { stockQty: { decrement: update.dispenseQuantity } },
          });
        }

        const newDispensed = item.dispensedQty + update.dispenseQuantity;
        const newStatus = newDispensed >= item.quantity ? 'DISPENSED' : 'PENDING';

        await tx.prescriptionItem.update({
          where: { id: update.itemId },
          data: {
            dispensedQty: newDispensed,
            status: newStatus,
          },
        });
      }
    }

    const allItems = await tx.prescriptionItem.findMany({ where: { prescriptionId } });
    const allDispensed = allItems.every((i) => i.status === 'DISPENSED');
    const someDispensed = allItems.some((i) => i.dispensedQty > 0);

    const newPrescriptionStatus = allDispensed ? 'DISPENSED' : someDispensed ? 'PARTIAL' : 'PENDING';

    const updatedPrescription = await tx.prescription.update({
      where: { id: prescriptionId },
      data: { status: newPrescriptionStatus },
      include: { visit: true },
    });

    const actor = await tx.user.findUnique({ where: { id: actorId } });
    await tx.flowEvent.create({
      data: {
        visitId: updatedPrescription.visitId,
        type: 'PHARMACY_UPDATE',
        stage: allDispensed ? 'BILLING_PENDING' : 'PHARMACY_PENDING',
        actorId,
        actorName: actor?.name || 'Pharmacist',
        metadata: JSON.stringify({ action: 'DISPENSE', allDispensed }),
      },
    });

    return updatedPrescription;
  });
}

export async function markSubstituteNeeded(itemId: string, actorId: string) {
  return db.prescriptionItem.update({
    where: { id: itemId },
    data: { status: 'SUBSTITUTE_NEEDED' },
  });
}

export async function getMedicineCatalog() {
  return db.medicine.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
}
