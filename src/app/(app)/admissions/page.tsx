import { db } from '@/lib/db';
import { AdmissionsClient } from './admissions-client';

export default async function AdmissionsPage() {
  const [requests, wards] = await Promise.all([
    db.admission.findMany({
      where: { status: { in: ['REQUESTED', 'BED_ASSIGNED'] } },
      include: {
        visit: {
          include: { patient: true, department: true },
        },
        requestedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.ward.findMany({
      include: {
        beds: {
          include: {
            admissions: {
              where: { status: 'ADMITTED' },
              include: { visit: { include: { patient: true } } },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return <AdmissionsClient initialRequests={requests} wards={wards} />;
}
