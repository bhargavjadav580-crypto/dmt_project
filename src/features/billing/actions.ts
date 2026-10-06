'use server'

import { z } from 'zod';
import { requirePermission } from '@/lib/auth-helpers';
import { Capabilities } from '@/server/permissions';
import * as billingService from '@/server/services/billing-service';
import { logAudit } from '@/server/audit';
import { AuditAction } from '@/lib/types';

export type ActionResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: { code: string; messageKey: string } };

export async function generateInvoice(visitId: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.CREATE_INVOICE);
    const invoice = await billingService.generateInvoice(visitId);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Billing Staff',
      action: AuditAction.CREATE,
      entityType: 'Invoice',
      entityId: invoice.id,
      reason: 'Generated itemized invoice',
    });

    return { ok: true, data: invoice };
  } catch (error: any) {
    return { ok: false, error: { code: 'GENERATE_INVOICE_FAILED', messageKey: error.message } };
  }
}

export async function getInvoice(visitId: string): Promise<ActionResult<any>> {
  try {
    await requirePermission(Capabilities.VIEW_BILLING);
    const invoice = await billingService.getInvoice(visitId);
    return { ok: true, data: invoice };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_INVOICE_FAILED', messageKey: error.message } };
  }
}

export async function addManualItem(
  invoiceId: string,
  item: { description: string; unitPricePaise: number; quantity?: number; category?: string },
  reason: string
): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.CREATE_INVOICE);
    const updated = await billingService.addManualItem(invoiceId, item, reason);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Billing Staff',
      action: AuditAction.UPDATE,
      entityType: 'Invoice',
      entityId: invoiceId,
      reason: `Added manual item: ${item.description}. Reason: ${reason}`,
    });

    return { ok: true, data: updated };
  } catch (error: any) {
    return { ok: false, error: { code: 'ADD_ITEM_FAILED', messageKey: error.message } };
  }
}

export async function recordPayment(
  invoiceId: string,
  method: string,
  amountPaise: number,
  reference?: string | null
): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.COLLECT_PAYMENT);
    const updated = await billingService.recordPayment(
      invoiceId,
      method,
      amountPaise,
      reference || null,
      user.id
    );

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Billing Staff',
      action: AuditAction.CREATE,
      entityType: 'Payment',
      entityId: invoiceId,
      reason: `Collected payment of ${amountPaise} paise via ${method}`,
    });

    return { ok: true, data: updated };
  } catch (error: any) {
    return { ok: false, error: { code: 'RECORD_PAYMENT_FAILED', messageKey: error.message } };
  }
}

export async function waiveInvoice(invoiceId: string, reason: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.COLLECT_PAYMENT);
    const updated = await billingService.waiveInvoice(invoiceId, reason, user.id);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Staff',
      action: AuditAction.UPDATE,
      entityType: 'Invoice',
      entityId: invoiceId,
      reason: `Waived bill: ${reason}`,
    });

    return { ok: true, data: updated };
  } catch (error: any) {
    return { ok: false, error: { code: 'WAIVE_INVOICE_FAILED', messageKey: error.message } };
  }
}
