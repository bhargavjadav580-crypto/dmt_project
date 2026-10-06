import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { DoctorConsultationClient } from './doctor-consultation-client';

export default async function ConsultationPage({
  searchParams,
}: {
  searchParams: Promise<{ visitId?: string }>;
}) {
  const { visitId } = await searchParams;
  const session = await auth();

  // Load lab test catalog and medicine catalog for consultation orders
  const [labTests, medicines, departments] = await Promise.all([
    db.labTest.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    db.medicine.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    db.department.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ]);

  // Load visits waiting for consultation or review
  const waitingVisits = await db.visit.findMany({
    where: {
      status: 'OPEN',
      stage: { in: ['WAITING', 'IN_CONSULTATION', 'REVIEW_PENDING'] },
    },
    include: {
      patient: true,
      department: true,
      vitals: { orderBy: { recordedAt: 'desc' }, take: 1 },
      consultation: { include: { addenda: true } },
      labOrders: { include: { labTest: true } },
      prescriptions: { include: { items: true } },
    },
    orderBy: [
      { needsDoctorReview: 'desc' },
      { priority: 'desc' },
      { createdAt: 'asc' },
    ],
  });

  return (
    <DoctorConsultationClient
      initialVisits={waitingVisits}
      activeVisitId={visitId}
      labCatalog={labTests}
      medicineCatalog={medicines}
      departments={departments}
      doctorId={session?.user?.id || ''}
      doctorName={session?.user?.name || 'Doctor'}
    />
  );
}
