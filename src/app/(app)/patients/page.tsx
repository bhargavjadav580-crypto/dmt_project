import { db } from '@/lib/db';
import { PatientDirectoryClient } from './patient-directory-client';

export default async function PatientsPage() {
  const initialPatients = await db.patient.findMany({
    where: { deletedAt: null },
    include: {
      visits: {
        where: { status: 'OPEN' },
        include: { department: true },
        take: 1,
      },
    },
    take: 25,
    orderBy: { createdAt: 'desc' },
  });

  return <PatientDirectoryClient initialPatients={initialPatients} />;
}
