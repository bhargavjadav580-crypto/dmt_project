import db from '@/lib/db';
import { LabOrderStatus, PrescriptionStatus, InvoiceStatus, AdmissionStatus } from '@/lib/types';

export async function checkDischargeReadiness(visitId: string): Promise<{ ready: boolean; checks: Array<{ label: string; passed: boolean; link?: string }> }> {
  // Assuming relational fetch via generic DB ORM
  const visit = await (db as any).visit.findUnique({
    where: { id: visitId },
    include: {
      dischargeRecord: true,
      labOrders: true,
      prescriptions: true,
      invoice: true,
      admission: true,
    },
  });

  if (!visit) {
    throw new Error('Visit not found');
  }

  const checks = [];
  let ready = true;

  // 1. Doctor clinical sign-off
  const clinicalSignOffPassed = !!visit.dischargeRecord?.clinicalSignOffById;
  checks.push({
    label: 'Doctor clinical sign-off',
    passed: clinicalSignOffPassed,
    link: `/visits/${visitId}/discharge/clinical`,
  });
  if (!clinicalSignOffPassed) ready = false;

  // 2. All lab orders reviewed (or none ordered)
  const allLabsReviewed = visit.labOrders.every(
    (order: any) => (order.status === LabOrderStatus.REVIEWED || (order.status === LabOrderStatus.RESULT_ENTERED && order.reviewedAt !== null))
  ) || visit.labOrders.length === 0;
  
  checks.push({
    label: 'All lab orders reviewed',
    passed: allLabsReviewed,
    link: `/visits/${visitId}/labs`,
  });
  if (!allLabsReviewed) ready = false;

  // 3. All prescriptions dispensed or explicitly closed (or none prescribed)
  const allPrescriptionsDispensed = visit.prescriptions.every(
    (rx: any) => rx.status === PrescriptionStatus.DISPENSED
  ) || visit.prescriptions.length === 0;

  checks.push({
    label: 'All prescriptions dispensed or closed',
    passed: allPrescriptionsDispensed,
    link: `/visits/${visitId}/pharmacy`,
  });
  if (!allPrescriptionsDispensed) ready = false;

  // 4. Invoice PAID or WAIVED
  const invoiceCleared = !visit.invoice || visit.invoice.status === InvoiceStatus.PAID || visit.invoice.status === InvoiceStatus.WAIVED;
  checks.push({
    label: 'Billing clearance',
    passed: invoiceCleared,
    link: `/visits/${visitId}/billing`,
  });
  if (!invoiceCleared) ready = false;

  // 5. Bed clearance for inpatients (or not inpatient)
  const bedCleared = !visit.admission || visit.admission.status === AdmissionStatus.DISCHARGED;
  checks.push({
    label: 'Bed clearance',
    passed: bedCleared,
    link: `/visits/${visitId}/admission`,
  });
  if (!bedCleared) ready = false;

  return { ready, checks };
}
