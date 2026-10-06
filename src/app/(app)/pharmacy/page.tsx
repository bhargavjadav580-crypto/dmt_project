import { db } from '@/lib/db';
import { PharmacyClient } from './pharmacy-client';

export default async function PharmacyPage() {
  const prescriptions = await db.prescription.findMany({
    include: {
      prescribedBy: true,
      visit: {
        include: { patient: true, department: true },
      },
      items: {
        include: { medicine: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return <PharmacyClient initialPrescriptions={prescriptions} />;
}
