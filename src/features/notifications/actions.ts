'use server'

import { requirePermission, getCurrentUser } from '@/lib/auth-helpers';
import { Capabilities } from '@/server/permissions';
import * as notificationService from '@/server/services/notification-service';

export type ActionResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: { code: string; messageKey: string } };

export async function getNotifications(): Promise<ActionResult<any[]>> {
  try {
    const user = await getCurrentUser();
    await requirePermission(Capabilities.MANAGE_NOTIFICATIONS);
    const notifications = await notificationService.getNotifications(
      user.id,
      user.role,
      user.departmentId || undefined
    );
    return { ok: true, data: notifications };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_NOTIFICATIONS_FAILED', messageKey: error.message } };
  }
}

export async function markNotificationRead(id: string): Promise<ActionResult<any>> {
  try {
    await requirePermission(Capabilities.MANAGE_NOTIFICATIONS);
    const notification = await notificationService.markRead(id);
    return { ok: true, data: notification };
  } catch (error: any) {
    return { ok: false, error: { code: 'MARK_READ_FAILED', messageKey: error.message } };
  }
}

export async function getUnreadCount(): Promise<ActionResult<number>> {
  try {
    const user = await getCurrentUser();
    const count = await notificationService.getUnreadCount(
      user.id,
      user.role,
      user.departmentId || undefined
    );
    return { ok: true, data: count };
  } catch (error: any) {
    return { ok: false, error: { code: 'GET_UNREAD_COUNT_FAILED', messageKey: error.message } };
  }
}
