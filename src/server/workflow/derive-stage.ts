import { VisitStage, LabOrderStatus, PrescriptionStatus, AdmissionStatus, InvoiceStatus } from '@/lib/types';

export function deriveHeadlineStage(
  visit: any,
  labOrders: any[],
  prescriptions: any[],
  admission: any,
  invoice: any
): VisitStage {
  const currentStage = visit.stage as VisitStage;

  // Terminal stages
  if (currentStage === VisitStage.COMPLETED || currentStage === VisitStage.CANCELLED) {
    return currentStage;
  }

  // Pre-consultation stages shouldn't be overridden typically
  if (
    currentStage === VisitStage.REGISTERED ||
    currentStage === VisitStage.CHECKED_IN ||
    currentStage === VisitStage.WAITING ||
    currentStage === VisitStage.ADMITTED // Admitted is a strong state
  ) {
    return currentStage;
  }

  // Determine stage dynamically based on associated records
  
  // 1. Admission requested but no bed assigned
  if (admission && admission.status === AdmissionStatus.REQUESTED) {
    return VisitStage.ADMISSION_PENDING;
  }

  // 2. Pending lab orders (not all completed)
  if (labOrders && labOrders.length > 0) {
    const hasPendingLabs = labOrders.some(
      (order) => order.status === LabOrderStatus.ORDERED || order.status === LabOrderStatus.SAMPLE_COLLECTED || order.status === LabOrderStatus.PROCESSING
    );
    const hasUnreviewedLabs = labOrders.some(
      (order) => order.status === LabOrderStatus.RESULT_ENTERED && !order.reviewedAt
    );

    if (hasPendingLabs) {
      return VisitStage.INVESTIGATIONS_PENDING;
    }
    
    if (hasUnreviewedLabs) {
      return VisitStage.REVIEW_PENDING;
    }
  }

  // 3. Pending prescriptions (not all dispensed)
  if (prescriptions && prescriptions.length > 0) {
    const hasPendingPrescriptions = prescriptions.some(
      (rx) => rx.status === PrescriptionStatus.PENDING || rx.status === PrescriptionStatus.PARTIAL
    );
    if (hasPendingPrescriptions) {
      return VisitStage.PHARMACY_PENDING;
    }
  }

  // 4. Invoices pending payment
  if (invoice && invoice.status !== InvoiceStatus.PAID && invoice.status !== InvoiceStatus.WAIVED) {
    return VisitStage.BILLING_PENDING;
  }

  // 5. If clinical sign-off is done, ready for discharge
  if (visit.dischargeRecord && visit.dischargeRecord.clinicalSignOffById && !visit.dischargeRecord.finalizedById) {
    return VisitStage.READY_FOR_DISCHARGE;
  }

  // Default to returning the underlying DB stage if no rules trigger
  return currentStage;
}
