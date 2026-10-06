'use server'

import { z } from 'zod';
import { requirePermission } from '@/lib/auth-helpers';
import { Capabilities } from '@/server/permissions';
import * as visitService from '@/server/services/visit-service';
import { logAudit } from '@/server/audit';
import { AuditAction } from '@/lib/types';

export type ActionResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: { code: string; messageKey: string } };

const createVisitSchema = z.object({
  patientId: z.string().min(1),
  departmentId: z.string().min(1),
  type: z.string().default('OPD'),
  reasonForVisit: z.string().min(1, 'Reason for visit is required'),
});

const cancelVisitSchema = z.object({
  visitId: z.string().min(1),
  reason: z.string().min(1, 'Cancellation reason is required'),
});

export async function createVisit(
  patientId: string,
  departmentId: string,
  type: string,
  reasonForVisit: string
): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.REGISTER_PATIENT);
    const data = createVisitSchema.parse({ patientId, departmentId, type, reasonForVisit });
    const visit = await visitService.createVisit(
      data.patientId,
      data.departmentId,
      data.type,
      data.reasonForVisit,
      user.id
    );

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Staff',
      action: AuditAction.CREATE,
      entityType: 'Visit',
      entityId: visit.id,
      reason: `Visit created for patient`,
    });

    return { ok: true, data: visit };
  } catch (error: any) {
    return { ok: false, error: { code: 'CREATE_VISIT_FAILED', messageKey: error.message } };
  }
}

export async function getVisit(id: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.VIEW_PATIENT_IDENTITY);
    const visit = await visitService.getVisitById(id);
    if (!visit) {
      return { ok: false, error: { code: 'NOT_FOUND', messageKey: 'Visit not found' } };
    }

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Staff',
      action: AuditAction.VIEW,
      entityType: 'Visit',
      entityId: id,
    });

    return { ok: true, data: visit };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_VISIT_FAILED', messageKey: error.message } };
  }
}

export async function getActiveVisits(departmentId?: string): Promise<ActionResult<any[]>> {
  try {
    await requirePermission(Capabilities.VIEW_PATIENT_IDENTITY);
    const visits = await visitService.getActiveVisits(departmentId);
    return { ok: true, data: visits };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_ACTIVE_VISITS_FAILED', messageKey: error.message } };
  }
}

export async function getVisitStats(departmentId?: string): Promise<ActionResult<any>> {
  try {
    const stats = await visitService.getVisitStats(departmentId);
    return { ok: true, data: stats };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_STATS_FAILED', messageKey: error.message } };
  }
}

export async function cancelVisit(visitId: string, reason: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.REGISTER_PATIENT);
    const data = cancelVisitSchema.parse({ visitId, reason });
    const visit = await visitService.cancelVisit(data.visitId, user.id, data.reason);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Staff',
      action: AuditAction.UPDATE,
      entityType: 'Visit',
      entityId: visitId,
      reason: data.reason,
    });

    return { ok: true, data: visit };
  } catch (error: any) {
    return { ok: false, error: { code: 'CANCEL_VISIT_FAILED', messageKey: error.message } };
  }
}
