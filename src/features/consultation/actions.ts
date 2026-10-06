'use server'

import { z } from 'zod';
import { requirePermission } from '@/lib/auth-helpers';
import { Capabilities } from '@/server/permissions';
import * as consultationService from '@/server/services/consultation-service';
import * as labService from '@/server/services/lab-service';
import * as pharmacyService from '@/server/services/pharmacy-service';
import * as admissionService from '@/server/services/admission-service';
import * as dischargeService from '@/server/services/discharge-service';
import { logAudit } from '@/server/audit';
import { AuditAction } from '@/lib/types';
import { db } from '@/lib/db';

export type ActionResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: { code: string; messageKey: string } };

const draftSchema = z.object({
  notes: z.string().optional(),
  diagnosis: z.string().optional(),
  icd10Code: z.string().optional(),
  reason: z.string().optional(),
});

const nextStepsSchema = z.object({
  sendToLab: z.boolean().optional(),
  labTestIds: z.array(z.string()).optional(),
  sendToPharmacy: z.boolean().optional(),
  prescriptionItems: z.array(z.object({
    medicineId: z.string().optional().nullable(),
    medicineName: z.string(),
    dose: z.string(),
    frequency: z.string(),
    durationDays: z.number().optional().nullable(),
    quantity: z.number(),
  })).optional(),
  admitPatient: z.boolean().optional(),
  admissionReason: z.string().optional(),
  referPatient: z.boolean().optional(),
  referralDeptId: z.string().optional(),
  referralReason: z.string().optional(),
  discharge: z.boolean().optional(),
});

export async function startConsultation(visitId: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.CREATE_CONSULTATION);
    const consultation = await consultationService.startConsultation(visitId, user.id);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Doctor',
      action: AuditAction.CREATE,
      entityType: 'Consultation',
      entityId: consultation.id,
      reason: 'Started consultation',
    });

    return { ok: true, data: consultation };
  } catch (error: any) {
    return { ok: false, error: { code: 'START_CONSULTATION_FAILED', messageKey: error.message } };
  }
}

export async function saveDraft(consultationId: string, data: any): Promise<ActionResult<any>> {
  try {
    await requirePermission(Capabilities.CREATE_CONSULTATION);
    const parsedData = draftSchema.parse(data);
    const draft = await consultationService.saveDraft(consultationId, parsedData);
    return { ok: true, data: draft };
  } catch (error: any) {
    return { ok: false, error: { code: 'SAVE_DRAFT_FAILED', messageKey: error.message } };
  }
}

export async function completeConsultation(consultationId: string, nextSteps: any): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.CREATE_CONSULTATION);
    const parsedSteps = nextStepsSchema.parse(nextSteps);

    const consultation = await consultationService.completeConsultation(consultationId, user.id);
    const visitId = consultation.visitId;

    // Dispatch next steps in parallel or sequential
    if (parsedSteps.sendToLab && parsedSteps.labTestIds && parsedSteps.labTestIds.length > 0) {
      await labService.orderTests(visitId, parsedSteps.labTestIds, user.id);
    }

    if (parsedSteps.sendToPharmacy && parsedSteps.prescriptionItems && parsedSteps.prescriptionItems.length > 0) {
      await pharmacyService.createPrescription(visitId, user.id, parsedSteps.prescriptionItems);
    }

    if (parsedSteps.admitPatient) {
      await admissionService.requestAdmission(
        visitId,
        parsedSteps.admissionReason || 'Admitted from consultation',
        'NORMAL',
        user.id
      );
    }

    if (parsedSteps.referPatient && parsedSteps.referralDeptId) {
      const fromDept = await db.visit.findUnique({ where: { id: visitId } });
      if (fromDept) {
        await db.referral.create({
          data: {
            visitId,
            fromDeptId: fromDept.departmentId,
            toDeptId: parsedSteps.referralDeptId,
            reason: parsedSteps.referralReason || 'Referred for specialist evaluation',
            priority: 'NORMAL',
            status: 'SENT',
            createdById: user.id,
          },
        });
        await db.visit.update({
          where: { id: visitId },
          data: { stage: 'REFERRED' },
        });
      }
    }

    if (parsedSteps.discharge) {
      await dischargeService.clinicalSignOff(
        visitId,
        user.id,
        'Consultation completed with discharge clearance'
      );
    }

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Doctor',
      action: AuditAction.UPDATE,
      entityType: 'Consultation',
      entityId: consultationId,
      reason: 'Consultation completed and next steps triggered',
    });

    return { ok: true, data: consultation };
  } catch (error: any) {
    return { ok: false, error: { code: 'COMPLETE_CONSULTATION_FAILED', messageKey: error.message } };
  }
}

export async function addAddendum(consultationId: string, notes: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.CREATE_CONSULTATION);
    const result = await consultationService.addAddendum(consultationId, user.id, notes);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Doctor',
      action: AuditAction.UPDATE,
      entityType: 'Consultation',
      entityId: consultationId,
      reason: 'Clinical addendum appended',
    });

    return { ok: true, data: result };
  } catch (error: any) {
    return { ok: false, error: { code: 'ADD_ADDENDUM_FAILED', messageKey: error.message } };
  }
}

export async function getConsultation(visitId: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.VIEW_CONSULTATION);
    const consultation = await consultationService.getConsultation(visitId);

    if (consultation) {
      await logAudit({
        actorId: user.id,
        actorName: user.name || 'Staff',
        action: AuditAction.VIEW,
        entityType: 'Consultation',
        entityId: consultation.id,
      });
    }

    return { ok: true, data: consultation };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_CONSULTATION_FAILED', messageKey: error.message } };
  }
}
