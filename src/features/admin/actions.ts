'use server'

import { requirePermission } from '@/lib/auth-helpers';
import { Capabilities } from '@/server/permissions';
import * as adminService from '@/server/services/analytics-service';
import { logAudit } from '@/server/audit';
import { AuditAction } from '@/lib/types';

export type ActionResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: { code: string; messageKey: string } };

export async function getHospitalOverview(): Promise<ActionResult<any>> {
  try {
    await requirePermission(Capabilities.VIEW_ANALYTICS);
    const data = await adminService.getHospitalOverview();
    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, error: { code: 'OVERVIEW_FAILED', messageKey: error.message } };
  }
}

export async function getDepartmentStatus(): Promise<ActionResult<any>> {
  try {
    await requirePermission(Capabilities.VIEW_ANALYTICS);
    const data = await adminService.getDepartmentStatus();
    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, error: { code: 'STATUS_FAILED', messageKey: error.message } };
  }
}

export async function getBottleneckAnalytics(): Promise<ActionResult<any>> {
  try {
    await requirePermission(Capabilities.VIEW_ANALYTICS);
    const data = await adminService.getBottleneckAnalytics();
    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, error: { code: 'BOTTLENECK_FAILED', messageKey: error.message } };
  }
}

export async function getAuditLog(filters?: any): Promise<ActionResult<any>> {
  try {
    await requirePermission(Capabilities.VIEW_AUDIT_LOG);
    const data = await adminService.getAuditLog(filters);
    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, error: { code: 'AUDIT_LOG_FAILED', messageKey: error.message } };
  }
}

export async function getUsers(): Promise<ActionResult<any>> {
  try {
    await requirePermission(Capabilities.MANAGE_USERS);
    const data = await adminService.getUsers();
    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_USERS_FAILED', messageKey: error.message } };
  }
}

export async function updateUserRole(userId: string, role: string): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.MANAGE_USERS);
    const data = await adminService.updateUserRole(userId, role);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Admin',
      action: AuditAction.UPDATE,
      entityType: 'User',
      entityId: userId,
      reason: `Updated role to ${role}`,
    });

    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, error: { code: 'UPDATE_ROLE_FAILED', messageKey: error.message } };
  }
}

export async function getSettings(): Promise<ActionResult<any>> {
  try {
    await requirePermission(Capabilities.MANAGE_SETTINGS);
    const data = await adminService.getSettings();
    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_SETTINGS_FAILED', messageKey: error.message } };
  }
}

export async function updateSetting(key: string, value: any): Promise<ActionResult<any>> {
  try {
    const user = await requirePermission(Capabilities.MANAGE_SETTINGS);
    const data = await adminService.updateSetting(key, value);

    await logAudit({
      actorId: user.id,
      actorName: user.name || 'Admin',
      action: AuditAction.UPDATE,
      entityType: 'Setting',
      entityId: key,
      reason: `Updated setting ${key}`,
    });

    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, error: { code: 'UPDATE_SETTING_FAILED', messageKey: error.message } };
  }
}
