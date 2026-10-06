'use server'

import { z } from 'zod';
import { requirePermission } from '@/lib/auth-helpers';
import { Capabilities } from '@/server/permissions';
import * as admissionService from '@/server/services/admission-service';
import { logAudit } from '@/server/audit';
import { AuditAction } from '@/lib/types';

export type ActionResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: { code: string; messageKey: string } };

export async function requestAdmission(
  visitId: string,
  reason: string,
  priority: string = 'NORMAL'
): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.REQUEST_ADMISSION);
    const admission = await admissionService.requestAdmission(visitId, reason, priority, user.id);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Doctor',
      action: AuditAction.CREATE,
      entityType: 'Admission',
      entityId: admission.id,
      reason,
    });

    return { ok: true, data: admission };
  } catch (error: any) {
    return { ok: false, error: { code: 'REQUEST_ADMISSION_FAILED', messageKey: error.message } };
  }
}

export async function getAdmissionRequests(): Promise<ActionResult<any[]>> {
  try {
    await requirePermission(Capabilities.MANAGE_ADMISSION);
    const requests = await admissionService.getAdmissionRequests();
    return { ok: true, data: requests };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_REQUESTS_FAILED', messageKey: error.message } };
  }
}

export async function assignBed(admissionId: string, bedId: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.MANAGE_ADMISSION);
    const admission = await admissionService.assignBed(admissionId, bedId, user.id);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Staff',
      action: AuditAction.UPDATE,
      entityType: 'Admission',
      entityId: admissionId,
      reason: `Assigned bed ${bedId}`,
    });

    return { ok: true, data: admission };
  } catch (error: any) {
    return { ok: false, error: { code: 'ASSIGN_BED_FAILED', messageKey: error.message } };
  }
}

export async function admitPatient(admissionId: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.MANAGE_ADMISSION);
    const admission = await admissionService.admitPatient(admissionId, user.id);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Staff',
      action: AuditAction.UPDATE,
      entityType: 'Admission',
      entityId: admissionId,
      reason: 'Patient admitted into ward',
    });

    return { ok: true, data: admission };
  } catch (error: any) {
    return { ok: false, error: { code: 'ADMIT_PATIENT_FAILED', messageKey: error.message } };
  }
}

export async function getWards(): Promise<ActionResult<any[]>> {
  try {
    await requirePermission(Capabilities.MANAGE_BEDS);
    const wards = await admissionService.getWards();
    return { ok: true, data: wards };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_WARDS_FAILED', messageKey: error.message } };
  }
}

export async function getBedBoard(): Promise<ActionResult<any[]>> {
  try {
    await requirePermission(Capabilities.MANAGE_BEDS);
    const bedBoard = await admissionService.getBedBoard();
    return { ok: true, data: bedBoard };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_BED_BOARD_FAILED', messageKey: error.message } };
  }
}
