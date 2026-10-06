import React from 'react';
import { requirePermission, getCurrentUser } from '@/lib/auth-helpers';
import { Capabilities } from '@/server/permissions';
import { getNotifications } from '@/server/services/notification-service';
import { NotificationsClient } from './notifications-client';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  await requirePermission(Capabilities.MANAGE_NOTIFICATIONS);

  const notifications = await getNotifications(
    user.id,
    user.role,
    user.departmentId || undefined
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <NotificationsClient notifications={notifications} />
    </div>
  );
}
