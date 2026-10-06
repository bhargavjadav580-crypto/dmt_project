import { db } from '@/lib/db';
import { LaboratoryClient } from './laboratory-client';

export default async function LaboratoryPage() {
  const labOrders = await db.labOrder.findMany({
    include: {
      labTest: true,
      orderedBy: true,
      visit: {
        include: { patient: true, department: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return <LaboratoryClient initialOrders={labOrders} />;
}
