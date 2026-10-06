import { db } from '@/lib/db';
import { BillingClient } from './billing-client';

export default async function BillingPage() {
  const invoices = await db.invoice.findMany({
    include: {
      items: true,
      payments: { include: { receivedBy: true } },
      visit: {
        include: { patient: true, department: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return <BillingClient initialInvoices={invoices} />;
}
