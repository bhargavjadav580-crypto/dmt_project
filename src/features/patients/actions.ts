'use server'

import { z } from 'zod';
import { requirePermission } from '@/lib/auth-helpers';
import { Capabilities } from '@/server/permissions';
import * as patientService from '@/server/services/patient-service';
import { logAudit } from '@/server/audit';
import { AuditAction } from '@/lib/types';

export type ActionResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: { code: string; messageKey: string } };

const registerPatientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  ageYears: z.coerce.number().min(0).max(150),
  dob: z.coerce.date().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().optional().nullable().refine(val => !val || /^[0-9]{10}$/.test(val), {
    message: 'Phone number needs 10 digits. Example: 98765 43210'
  }),
  address: z.string().max(500).optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  allergies: z.array(z.string()).optional(),
  isUnidentified: z.boolean().optional(),
});

const updatePatientSchema = registerPatientSchema.partial().extend({
  reason: z.string().min(1, 'Reason for correction is required'),
});

export async function registerPatient(data: any): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.REGISTER_PATIENT);
    const validated = registerPatientSchema.parse(data);
    const patient = await patientService.createPatient(validated);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Staff',
      action: AuditAction.CREATE,
      entityType: 'Patient',
      entityId: patient.id,
      reason: 'Patient registration',
    });

    return { ok: true, data: patient };
  } catch (error: any) {
    return { ok: false, error: { code: 'REGISTRATION_FAILED', messageKey: error.message } };
  }
}

export async function searchPatients(query: string): Promise<ActionResult<any[]>> {
  try {
    await requirePermission(Capabilities.SEARCH_PATIENT);
    const patients = await patientService.searchPatients(query);
    return { ok: true, data: patients };
  } catch (error: any) {
    return { ok: false, error: { code: 'SEARCH_FAILED', messageKey: error.message } };
  }
}

export async function getPatient(id: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.VIEW_PATIENT_IDENTITY);
    const patient = await patientService.getPatientById(id);
    if (!patient) {
      return { ok: false, error: { code: 'NOT_FOUND', messageKey: 'Patient not found' } };
    }

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Staff',
      action: AuditAction.VIEW,
      entityType: 'Patient',
      entityId: id,
    });

    return { ok: true, data: patient };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_PATIENT_FAILED', messageKey: error.message } };
  }
}

export async function updatePatient(id: string, data: any): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.REGISTER_PATIENT);
    const validated = updatePatientSchema.parse(data);
    const updated = await patientService.updatePatient(
      id,
      validated,
      validated.reason,
      user.id,
      user.name || 'Staff'
    );

    return { ok: true, data: updated };
  } catch (error: any) {
    return { ok: false, error: { code: 'UPDATE_FAILED', messageKey: error.message } };
  }
}

export async function findDuplicates(name: string, phone?: string | null, age?: number | null): Promise<ActionResult<any[]>> {
  try {
    await requirePermission(Capabilities.REGISTER_PATIENT);
    const duplicates = await patientService.findDuplicates(name, phone, age);
    return { ok: true, data: duplicates };
  } catch (error: any) {
    return { ok: false, error: { code: 'DUPLICATES_CHECK_FAILED', messageKey: error.message } };
  }
}
