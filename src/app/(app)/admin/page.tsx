import React from 'react';
import { requirePermission } from '@/lib/auth-helpers';
import { Capabilities } from '@/server/permissions';
import { 
  getHospitalOverview, 
  getDepartmentStatus, 
  getBottleneckAnalytics, 
  getAuditLog, 
  getUsers, 
  getSettings 
} from '@/server/services/analytics-service';
import { AdminClient } from './admin-client';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await requirePermission(Capabilities.VIEW_ANALYTICS);

  const [
    overview,
    departments,
    bottlenecks,
    auditLogs,
    users,
    settings,
  ] = await Promise.all([
    getHospitalOverview(),
    getDepartmentStatus(),
    getBottleneckAnalytics(),
    getAuditLog(),
    getUsers(),
    getSettings(),
  ]);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl">
      <AdminClient
        overview={overview}
        departments={departments}
        bottlenecks={bottlenecks}
        auditLogs={auditLogs}
        users={users}
        settings={settings}
      />
    </div>
  );
}
