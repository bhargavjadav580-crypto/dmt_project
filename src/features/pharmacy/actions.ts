'use server'

import { z } from 'zod';
import { requirePermission } from '@/lib/auth-helpers';
import { Capabilities } from '@/server/permissions';
import * as pharmacyService from '@/server/services/pharmacy-service';
import { logAudit } from '@/server/audit';
import { AuditAction } from '@/lib/types';

export type ActionResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: { code: string; messageKey: string } };

export async function getPendingPrescriptions(): Promise<ActionResult<any[]>> {
  try {
    await requirePermission(Capabilities.DISPENSE);
    const prescriptions = await pharmacyService.getPendingPrescriptions();
    return { ok: true, data: prescriptions };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_PENDING_RX_FAILED', messageKey: error.message } };
  }
}

export async function getPrescription(id: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.VIEW_PRESCRIPTION);
    const prescription = await pharmacyService.getPrescription(id);

    if (prescription) {
      await logAudit({
        actorId: user.id,
        actorName: user.name || 'Staff',
        action: AuditAction.VIEW,
        entityType: 'Prescription',
        entityId: id,
      });
    }

    return { ok: true, data: prescription };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_PRESCRIPTION_FAILED', messageKey: error.message } };
  }
}

export async function dispenseMedicines(
  prescriptionId: string,
  itemUpdates: { itemId: string; dispenseQuantity: number }[]
): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.DISPENSE);
    const prescription = await pharmacyService.dispenseMedicines(
      prescriptionId,
      itemUpdates,
      user.id
    );

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Pharmacist',
      action: AuditAction.UPDATE,
      entityType: 'Prescription',
      entityId: prescriptionId,
      reason: 'Dispensed medicines',
    });

    return { ok: true, data: prescription };
  } catch (error: any) {
    return { ok: false, error: { code: 'DISPENSE_FAILED', messageKey: error.message } };
  }
}

export async function markSubstituteNeeded(itemId: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.DISPENSE);
    const item = await pharmacyService.markSubstituteNeeded(itemId, user.id);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Pharmacist',
      action: AuditAction.UPDATE,
      entityType: 'PrescriptionItem',
      entityId: itemId,
      reason: 'Marked as out of stock / substitute needed',
    });

    return { ok: true, data: item };
  } catch (error: any) {
    return { ok: false, error: { code: 'SUBSTITUTE_FAILED', messageKey: error.message } };
  }
}

export async function getMedicineCatalog(): Promise<ActionResult<any[]>> {
  try {
    const medicines = await pharmacyService.getMedicineCatalog();
    return { ok: true, data: medicines };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_CATALOG_FAILED', messageKey: error.message } };
  }
}
