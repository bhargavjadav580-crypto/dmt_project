import { db } from '@/lib/db';

export async function createNotification(data: {
  title: string;
  message: string;
  type: string;
  targetUserId?: string;
  targetRole?: string;
  targetDepartmentId?: string;
  priority?: string;
  link?: string;
}) {
  return db.notification.create({
    data: {
      title: data.title,
      message: data.message,
      type: data.type,
      targetUserId: data.targetUserId || null,
      targetRole: data.targetRole || null,
      targetDepartmentId: data.targetDepartmentId || null,
      priority: data.priority || 'NORMAL',
      link: data.link || null,
    },
  });
}

export async function getNotifications(userId: string, role: string, departmentId?: string) {
  const orConditions: any[] = [
    { targetUserId: userId },
    { targetRole: role },
  ];
  if (departmentId) {
    orConditions.push({ targetDepartmentId: departmentId });
  }

  return db.notification.findMany({
    where: {
      OR: orConditions,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function markRead(notificationId: string) {
  return db.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
}

export async function getUnreadCount(userId: string, role: string, departmentId?: string) {
  const orConditions: any[] = [
    { targetUserId: userId },
    { targetRole: role },
  ];
  if (departmentId) {
    orConditions.push({ targetDepartmentId: departmentId });
  }

  return db.notification.count({
    where: {
      readAt: null,
      OR: orConditions,
    },
  });
}
