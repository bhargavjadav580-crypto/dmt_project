import { db } from '@/lib/db';
import { NurseStationClient } from './nurse-station-client';

export default async function NursePage() {
  const visits = await db.visit.findMany({
    where: {
      status: 'OPEN',
      stage: { in: ['REGISTERED', 'CHECKED_IN', 'WAITING'] },
    },
    include: {
      patient: true,
      department: true,
      vitals: { orderBy: { recordedAt: 'desc' }, take: 1 },
      queueEntries: { where: { status: 'WAITING' }, take: 1 },
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' },
    ],
  });

  return <NurseStationClient initialVisits={visits} />;
}
