import { Role, VisitStage } from '@/lib/types';

export function getNextAction(visit: any, tasks: any, viewerRole: Role) {
  const isEmergency = visit.priority === 'EMERGENCY';
  const prefix = isEmergency ? '🚨 ' : '';

  let action = {
    whereNow: `${prefix}Unknown stage`,
    whatHappened: '',
    whatNext: 'Await further instructions',
    ownerRole: null as Role | null,
    primaryAction: null as any | null,
  };

  if (visit.priority === 'UNASSESSED') {
    return {
      whereNow: `${prefix}Triage`,
      whatHappened: 'Patient arrived',
      whatNext: 'Awaiting assessment - set priority',
      ownerRole: Role.NURSE,
      primaryAction: {
        label: 'Assess Priority',
        href: `/visits/${visit.id}/triage`,
        variant: 'primary',
      },
    };
  }

  switch (visit.stage) {
    case VisitStage.REGISTERED:
      action.whereNow = `${prefix}Appointment booked`;
      action.whatNext = 'Check in patient';
      action.ownerRole = Role.RECEPTIONIST;
      action.primaryAction = {
        label: 'Check In',
        href: `/visits/${visit.id}/check-in`,
        variant: 'primary',
      };
      break;

    case VisitStage.CHECKED_IN:
      action.whereNow = `${prefix}Checked In`;
      action.whatNext = 'Send to queue';
      action.ownerRole = Role.RECEPTIONIST;
      break;

    case VisitStage.WAITING:
      action.whereNow = `${prefix}Waiting Room`;
      action.whatNext = 'Call patient';
      action.ownerRole = Role.NURSE; // or DOCTOR depending on dept
      break;

    case VisitStage.IN_CONSULTATION:
      action.whereNow = `${prefix}Consultation`;
      action.whatNext = 'Doctor is consulting';
      action.ownerRole = Role.DOCTOR;
      break;

    case VisitStage.INVESTIGATIONS_PENDING:
      if (tasks.labOrders?.some((l: any) => l.status === 'ORDERED' || l.status === 'SAMPLE_PENDING')) {
        action.whereNow = `${prefix}Laboratory`;
        action.whatNext = 'Send patient to Laboratory';
        action.ownerRole = Role.LAB_TECH;
      } else if (tasks.labOrders?.some((l: any) => l.status === 'PROCESSING')) {
        action.whereNow = `${prefix}Laboratory`;
        action.whatNext = 'Processing lab tests';
        action.ownerRole = Role.LAB_TECH;
      }
      break;

    case VisitStage.REVIEW_PENDING:
      action.whereNow = `${prefix}Doctor Review`;
      action.whatNext = 'Doctor review needed';
      action.ownerRole = Role.DOCTOR;
      break;

    case VisitStage.PHARMACY_PENDING:
      const hasOutOfStock = tasks.prescriptions?.some((p: any) => p.items?.some((i: any) => i.status === 'OUT_OF_STOCK'));
      if (hasOutOfStock) {
        action.whereNow = `${prefix}Pharmacy`;
        action.whatNext = 'Ask doctor for a substitute';
        action.ownerRole = Role.PHARMACIST;
        action.primaryAction = {
          label: 'Request Substitute',
          href: `/visits/${visit.id}/pharmacy/substitute`,
          variant: 'warning',
        };
      } else {
        action.whereNow = `${prefix}Pharmacy`;
        action.whatNext = 'Dispense medicines';
        action.ownerRole = Role.PHARMACIST;
      }
      break;

    case VisitStage.ADMISSION_PENDING:
      action.whereNow = `${prefix}Admissions`;
      action.whatNext = 'Find a bed';
      action.ownerRole = Role.ADMISSION_STAFF;
      break;

    case VisitStage.ADMITTED:
      action.whereNow = `${prefix}Ward`;
      action.whatNext = 'Patient admitted';
      action.ownerRole = Role.NURSE;
      break;

    case VisitStage.BILLING_PENDING:
      const invoice = tasks.invoice;
      action.whereNow = `${prefix}Billing`;
      if (invoice && invoice.paidPaise > 0 && invoice.paidPaise < invoice.totalPaise) {
        action.whatNext = 'Collect remaining payment';
      } else {
        action.whatNext = 'Collect payment';
      }
      action.ownerRole = Role.BILLING_STAFF;
      break;

    case VisitStage.READY_FOR_DISCHARGE:
      action.whereNow = `${prefix}Discharge Area`;
      action.whatNext = 'Ready for discharge';
      action.ownerRole = Role.ADMISSION_STAFF;
      action.primaryAction = {
        label: 'Complete discharge',
        href: `/visits/${visit.id}/discharge`,
        variant: 'primary',
      };
      break;

    case VisitStage.REFERRED:
      action.whereNow = `${prefix}Referred`;
      action.whatNext = 'Send to receiving department';
      action.ownerRole = Role.RECEPTIONIST;
      break;

    case VisitStage.COMPLETED:
      action.whereNow = `${prefix}Discharged`;
      action.whatNext = 'Visit completed';
      action.ownerRole = null;
      break;
      
    case VisitStage.CANCELLED:
      action.whereNow = `${prefix}Cancelled`;
      action.whatNext = 'Visit cancelled';
      action.ownerRole = null;
      break;
  }

  return action;
}
