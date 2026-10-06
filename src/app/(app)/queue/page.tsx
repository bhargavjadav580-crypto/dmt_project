import { db } from '@/lib/db';
import { QueueManagerClient } from './queue-manager-client';

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string }>;
}) {
  const { dept } = await searchParams;

  const departments = await db.department.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, tokenPrefix: true },
    orderBy: { name: 'asc' },
  });

  const activeDept =
    departments.find((d) => d.code === dept || d.id === dept) ||
    departments.find((d) => d.code === 'GENERAL_OPD') ||
    departments[0];

  return (
    <QueueManagerClient
      departments={departments}
      initialDepartmentId={activeDept.id}
    />
  );
}
