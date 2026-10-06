'use server'

import { requirePermission } from '@/lib/auth-helpers';
import { Capabilities } from '@/server/permissions';
import * as queueService from '@/server/services/queue-service';
import { logAudit } from '@/server/audit';
import { AuditAction } from '@/lib/types';

export type ActionResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: { code: string; messageKey: string } };

export async function getQueue(departmentId: string): Promise<ActionResult<any>> {
  try {
    await requirePermission(Capabilities.MANAGE_QUEUE);
    const queue = await queueService.getQueueByDepartment(departmentId);
    return { ok: true, data: queue };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_QUEUE_FAILED', messageKey: error.message } };
  }
}

export async function callNextPatient(departmentId: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.MANAGE_QUEUE);
    const entry = await queueService.callNextPatient(departmentId, user.id);
    if (entry) {
      await logAudit({
        actorId: user.id,
        actorName: user.name || 'Staff',
        action: AuditAction.UPDATE,
        entityType: 'QueueEntry',
        entityId: entry.id,
        reason: 'Called next patient',
      });
    }
    return { ok: true, data: entry };
  } catch (error: any) {
    return { ok: false, error: { code: 'CALL_NEXT_FAILED', messageKey: error.message } };
  }
}

export async function callPatient(queueEntryId: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.MANAGE_QUEUE);
    const entry = await queueService.callSpecificPatient(queueEntryId, user.id);
    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Staff',
      action: AuditAction.UPDATE,
      entityType: 'QueueEntry',
      entityId: queueEntryId,
      reason: 'Called specific patient',
    });
    return { ok: true, data: entry };
  } catch (error: any) {
    return { ok: false, error: { code: 'CALL_PATIENT_FAILED', messageKey: error.message } };
  }
}

export async function skipPatient(queueEntryId: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.MANAGE_QUEUE);
    const entry = await queueService.skipPatient(queueEntryId, user.id);
    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Staff',
      action: AuditAction.UPDATE,
      entityType: 'QueueEntry',
      entityId: queueEntryId,
      reason: 'Skipped patient in queue',
    });
    return { ok: true, data: entry };
  } catch (error: any) {
    return { ok: false, error: { code: 'SKIP_PATIENT_FAILED', messageKey: error.message } };
  }
}

export async function recallPatient(queueEntryId: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.MANAGE_QUEUE);
    const entry = await queueService.recallPatient(queueEntryId, user.id);
    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Staff',
      action: AuditAction.UPDATE,
      entityType: 'QueueEntry',
      entityId: queueEntryId,
      reason: 'Recalled patient from skipped list',
    });
    return { ok: true, data: entry };
  } catch (error: any) {
    return { ok: false, error: { code: 'RECALL_PATIENT_FAILED', messageKey: error.message } };
  }
}

export async function completeQueueEntry(queueEntryId: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.MANAGE_QUEUE);
    const entry = await queueService.completeQueueEntry(queueEntryId, user.id);
    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Staff',
      action: AuditAction.UPDATE,
      entityType: 'QueueEntry',
      entityId: queueEntryId,
      reason: 'Completed queue entry',
    });
    return { ok: true, data: entry };
  } catch (error: any) {
    return { ok: false, error: { code: 'COMPLETE_ENTRY_FAILED', messageKey: error.message } };
  }
}

export async function startConsultationFromQueue(queueEntryId: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.CREATE_CONSULTATION);
    const entry = await queueService.startConsultation(queueEntryId, user.id);
    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Doctor',
      action: AuditAction.UPDATE,
      entityType: 'QueueEntry',
      entityId: queueEntryId,
      reason: 'Started consultation from queue',
    });
    return { ok: true, data: entry };
  } catch (error: any) {
    return { ok: false, error: { code: 'START_CONSULTATION_FAILED', messageKey: error.message } };
  }
}

export async function getEstimatedWait(departmentId: string): Promise<ActionResult<any>> {
  try {
    const waitTime = await queueService.getEstimatedWait(departmentId);
    return { ok: true, data: waitTime };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_WAIT_FAILED', messageKey: error.message } };
  }
}

export async function getNowServing(departmentId: string): Promise<ActionResult<any>> {
  try {
    const nowServing = await queueService.getNowServing(departmentId);
    return { ok: true, data: nowServing };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_NOW_SERVING_FAILED', messageKey: error.message } };
  }
}
