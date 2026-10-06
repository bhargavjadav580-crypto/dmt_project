import { db } from '@/lib/db';
import { DischargeClient } from './discharge-client';

export default async function DischargePage({
  searchParams,
}: {
  searchParams: Promise<{ visitId?: string }>;
}) {
  const { visitId } = await searchParams;

  const visits = await db.visit.findMany({
    where: {
      status: 'OPEN',
      stage: { in: ['READY_FOR_DISCHARGE', 'BILLING_PENDING', 'ADMITTED', 'IN_CONSULTATION'] },
    },
    include: {
      patient: true,
      department: true,
      dischargeRecord: { include: { clinicalSignOffBy: true } },
      invoice: true,
      labOrders: true,
      prescriptions: true,
      admission: { include: { bed: true } },
    },
    orderBy: [
      { stage: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  return <DischargeClient initialVisits={visits} activeVisitId={visitId} />;
}
