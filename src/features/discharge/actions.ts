'use server'

import { z } from 'zod';
import { requirePermission } from '@/lib/auth-helpers';
import { Capabilities } from '@/server/permissions';
import * as dischargeService from '@/server/services/discharge-service';
import { logAudit } from '@/server/audit';
import { AuditAction } from '@/lib/types';

export type ActionResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: { code: string; messageKey: string } };

export async function getDischargeReadiness(visitId: string): Promise<ActionResult<any>> {
  try {
    const readiness = await dischargeService.getDischargeReadiness(visitId);
    return { ok: true, data: readiness };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_READINESS_FAILED', messageKey: error.message } };
  }
}

export async function clinicalSignOff(
  visitId: string,
  summary: string,
  followUpAt?: Date | null,
  followUpDoctorId?: string | null
): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.CLINICAL_SIGN_OFF);
    const record = await dischargeService.clinicalSignOff(
      visitId,
      user.id,
      summary,
      followUpAt || null,
      followUpDoctorId || null
    );

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Doctor',
      action: AuditAction.UPDATE,
      entityType: 'DischargeRecord',
      entityId: visitId,
      reason: 'Doctor clinical sign-off for discharge',
    });

    return { ok: true, data: record };
  } catch (error: any) {
    return { ok: false, error: { code: 'CLINICAL_SIGN_OFF_FAILED', messageKey: error.message } };
  }
}

export async function finalizeDischarge(visitId: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.FINALIZE_DISCHARGE);
    const visit = await dischargeService.finalizeDischarge(visitId, user.id);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Staff',
      action: AuditAction.UPDATE,
      entityType: 'DischargeRecord',
      entityId: visitId,
      reason: 'Finalized discharge',
    });

    return { ok: true, data: visit };
  } catch (error: any) {
    return { ok: false, error: { code: 'FINALIZE_DISCHARGE_FAILED', messageKey: error.message } };
  }
}
