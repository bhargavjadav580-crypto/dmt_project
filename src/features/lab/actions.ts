'use server'

import { z } from 'zod';
import { requirePermission } from '@/lib/auth-helpers';
import { Capabilities } from '@/server/permissions';
import * as labService from '@/server/services/lab-service';
import { logAudit } from '@/server/audit';
import { AuditAction } from '@/lib/types';

export type ActionResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: { code: string; messageKey: string } };

export async function orderTests(
  visitId: string,
  testIds: string[],
  priority: string = 'NORMAL'
): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.ORDER_TESTS);
    const orders = await labService.orderTests(visitId, testIds, user.id, priority);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Doctor',
      action: AuditAction.CREATE,
      entityType: 'LabOrder',
      entityId: visitId,
      reason: `Ordered ${testIds.length} lab tests`,
    });

    return { ok: true, data: orders };
  } catch (error: any) {
    return { ok: false, error: { code: 'ORDER_TESTS_FAILED', messageKey: error.message } };
  }
}

export async function getPendingLabOrders(): Promise<ActionResult<any[]>> {
  try {
    await requirePermission(Capabilities.PROCESS_LAB);
    const orders = await labService.getPendingLabOrders();
    return { ok: true, data: orders };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_PENDING_FAILED', messageKey: error.message } };
  }
}

export async function collectSample(orderId: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.PROCESS_LAB);
    const order = await labService.collectSample(orderId, user.id);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Lab Tech',
      action: AuditAction.UPDATE,
      entityType: 'LabOrder',
      entityId: orderId,
      reason: 'Sample collected',
    });

    return { ok: true, data: order };
  } catch (error: any) {
    return { ok: false, error: { code: 'COLLECT_SAMPLE_FAILED', messageKey: error.message } };
  }
}

export async function startProcessing(orderId: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.PROCESS_LAB);
    const order = await labService.startProcessing(orderId);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Lab Tech',
      action: AuditAction.UPDATE,
      entityType: 'LabOrder',
      entityId: orderId,
      reason: 'Started lab test processing',
    });

    return { ok: true, data: order };
  } catch (error: any) {
    return { ok: false, error: { code: 'START_PROCESSING_FAILED', messageKey: error.message } };
  }
}

export async function enterResult(orderId: string, result: any): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.PROCESS_LAB);
    const order = await labService.enterResult(orderId, result, user.id);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Lab Tech',
      action: AuditAction.UPDATE,
      entityType: 'LabOrder',
      entityId: orderId,
      reason: 'Lab result entered',
    });

    return { ok: true, data: order };
  } catch (error: any) {
    return { ok: false, error: { code: 'ENTER_RESULT_FAILED', messageKey: error.message } };
  }
}

export async function reviewResult(orderId: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.VIEW_LAB_RESULTS);
    const order = await labService.reviewResult(orderId, user.id);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Doctor',
      action: AuditAction.UPDATE,
      entityType: 'LabOrder',
      entityId: orderId,
      reason: 'Lab result reviewed by doctor',
    });

    return { ok: true, data: order };
  } catch (error: any) {
    return { ok: false, error: { code: 'REVIEW_RESULT_FAILED', messageKey: error.message } };
  }
}

export async function getLabTestCatalog(): Promise<ActionResult<any[]>> {
  try {
    const catalog = await labService.getLabTestCatalog();
    return { ok: true, data: catalog };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_CATALOG_FAILED', messageKey: error.message } };
  }
}

export async function getLabOrdersForVisit(visitId: string): Promise<ActionResult<any[]>> {
  try {
    await requirePermission(Capabilities.VIEW_LAB_RESULTS);
    const orders = await labService.getLabOrders(visitId);
    return { ok: true, data: orders };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_VISIT_LABS_FAILED', messageKey: error.message } };
  }
}
