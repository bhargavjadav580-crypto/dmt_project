export const Role = {
  RECEPTIONIST: 'RECEPTIONIST',
  NURSE: 'NURSE',
  DOCTOR: 'DOCTOR',
  LAB_TECH: 'LAB_TECH',
  PHARMACIST: 'PHARMACIST',
  ADMISSION_STAFF: 'ADMISSION_STAFF',
  BILLING_STAFF: 'BILLING_STAFF',
  ADMIN: 'ADMIN',
} as const;
export type RoleType = typeof Role[keyof typeof Role];

export const DepartmentType = {
  OPD: 'OPD',
  EMERGENCY: 'EMERGENCY',
  LAB: 'LAB',
  PHARMACY: 'PHARMACY',
  WARD: 'WARD',
  BILLING: 'BILLING',
} as const;
export type DepartmentTypeType = typeof DepartmentType[keyof typeof DepartmentType];

export const VisitType = {
  OPD: 'OPD',
  EMERGENCY: 'EMERGENCY',
  IPD: 'IPD',
  FOLLOW_UP: 'FOLLOW_UP',
} as const;
export type VisitTypeType = typeof VisitType[keyof typeof VisitType];

export const Priority = {
  UNASSESSED: 'UNASSESSED',
  NORMAL: 'NORMAL',
  URGENT: 'URGENT',
  EMERGENCY: 'EMERGENCY',
} as const;
export type PriorityType = typeof Priority[keyof typeof Priority];

export const VisitStage = {
  REGISTERED: 'REGISTERED',
  CHECKED_IN: 'CHECKED_IN',
  WAITING: 'WAITING',
  IN_CONSULTATION: 'IN_CONSULTATION',
  INVESTIGATIONS_PENDING: 'INVESTIGATIONS_PENDING',
  REVIEW_PENDING: 'REVIEW_PENDING',
  PHARMACY_PENDING: 'PHARMACY_PENDING',
  REFERRED: 'REFERRED',
  ADMISSION_PENDING: 'ADMISSION_PENDING',
  ADMITTED: 'ADMITTED',
  BILLING_PENDING: 'BILLING_PENDING',
  READY_FOR_DISCHARGE: 'READY_FOR_DISCHARGE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type VisitStageType = typeof VisitStage[keyof typeof VisitStage];

export const VisitStatus = {
  OPEN: 'OPEN',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type VisitStatusType = typeof VisitStatus[keyof typeof VisitStatus];

export const QueueStatus = {
  WAITING: 'WAITING',
  CALLED: 'CALLED',
  IN_CONSULTATION: 'IN_CONSULTATION',
  SKIPPED: 'SKIPPED',
  COMPLETED: 'COMPLETED',
} as const;
export type QueueStatusType = typeof QueueStatus[keyof typeof QueueStatus];

export const AppointmentStatus = {
  BOOKED: 'BOOKED',
  CHECKED_IN: 'CHECKED_IN',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;
export type AppointmentStatusType = typeof AppointmentStatus[keyof typeof AppointmentStatus];

export const ConsultationStatus = {
  DRAFT: 'DRAFT',
  COMPLETED: 'COMPLETED',
} as const;
export type ConsultationStatusType = typeof ConsultationStatus[keyof typeof ConsultationStatus];

export const LabOrderStatus = {
  ORDERED: 'ORDERED',
  SAMPLE_COLLECTED: 'SAMPLE_COLLECTED',
  PROCESSING: 'PROCESSING',
  RESULT_ENTERED: 'RESULT_ENTERED',
  REVIEWED: 'REVIEWED',
} as const;
export type LabOrderStatusType = typeof LabOrderStatus[keyof typeof LabOrderStatus];

export const PrescriptionStatus = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  DISPENSED: 'DISPENSED',
} as const;
export type PrescriptionStatusType = typeof PrescriptionStatus[keyof typeof PrescriptionStatus];

export const PrescriptionItemStatus = {
  PENDING: 'PENDING',
  DISPENSED: 'DISPENSED',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  SUBSTITUTE_NEEDED: 'SUBSTITUTE_NEEDED',
} as const;
export type PrescriptionItemStatusType = typeof PrescriptionItemStatus[keyof typeof PrescriptionItemStatus];

export const ReferralStatus = {
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  COMPLETED: 'COMPLETED',
} as const;
export type ReferralStatusType = typeof ReferralStatus[keyof typeof ReferralStatus];

export const BedStatus = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  CLEANING: 'CLEANING',
  MAINTENANCE: 'MAINTENANCE',
  RESERVED: 'RESERVED',
} as const;
export type BedStatusType = typeof BedStatus[keyof typeof BedStatus];

export const AdmissionStatus = {
  REQUESTED: 'REQUESTED',
  BED_ASSIGNED: 'BED_ASSIGNED',
  ADMITTED: 'ADMITTED',
  DISCHARGED: 'DISCHARGED',
} as const;
export type AdmissionStatusType = typeof AdmissionStatus[keyof typeof AdmissionStatus];

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  WAIVED: 'WAIVED',
} as const;
export type InvoiceStatusType = typeof InvoiceStatus[keyof typeof InvoiceStatus];

export const PaymentMethod = {
  CASH: 'CASH',
  CARD: 'CARD',
  UPI: 'UPI',
  INSURANCE: 'INSURANCE',
} as const;
export type PaymentMethodType = typeof PaymentMethod[keyof typeof PaymentMethod];

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;
export type GenderType = typeof Gender[keyof typeof Gender];

export const AuditAction = {
  VIEW: 'VIEW',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  BREAK_GLASS: 'BREAK_GLASS',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;
export type AuditActionType = typeof AuditAction[keyof typeof AuditAction];

export const NotificationType = {
  LAB_RESULT: 'LAB_RESULT',
  PRESCRIPTION: 'PRESCRIPTION',
  ADMISSION: 'ADMISSION',
  DISCHARGE: 'DISCHARGE',
  QUEUE: 'QUEUE',
  SYSTEM: 'SYSTEM',
  EMERGENCY: 'EMERGENCY',
} as const;
export type NotificationTypeType = typeof NotificationType[keyof typeof NotificationType];

export const FlowEventType = {
  STAGE_CHANGE: 'STAGE_CHANGE',
  PRIORITY_CHANGE: 'PRIORITY_CHANGE',
  QUEUE_ACTION: 'QUEUE_ACTION',
  LAB_UPDATE: 'LAB_UPDATE',
  PHARMACY_UPDATE: 'PHARMACY_UPDATE',
  BILLING_UPDATE: 'BILLING_UPDATE',
  ADMISSION_UPDATE: 'ADMISSION_UPDATE',
  DISCHARGE: 'DISCHARGE',
  NOTE: 'NOTE',
} as const;
export type FlowEventTypeType = typeof FlowEventType[keyof typeof FlowEventType];

export const InvoiceItemCategory = {
  CONSULTATION: 'CONSULTATION',
  LAB: 'LAB',
  MEDICINE: 'MEDICINE',
  BED: 'BED',
  PROCEDURE: 'PROCEDURE',
  MANUAL: 'MANUAL',
} as const;
export type InvoiceItemCategoryType = typeof InvoiceItemCategory[keyof typeof InvoiceItemCategory];

// Convenient aliases for when imported as types
export type Role = RoleType;
export type VisitStage = VisitStageType;
export type Priority = PriorityType;
export type DepartmentType = DepartmentTypeType;
export type VisitType = VisitTypeType;
export type VisitStatus = VisitStatusType;
export type QueueStatus = QueueStatusType;
export type AppointmentStatus = AppointmentStatusType;
export type ConsultationStatus = ConsultationStatusType;
export type LabOrderStatus = LabOrderStatusType;
export type PrescriptionStatus = PrescriptionStatusType;
export type PrescriptionItemStatus = PrescriptionItemStatusType;
export type ReferralStatus = ReferralStatusType;
export type BedStatus = BedStatusType;
export type AdmissionStatus = AdmissionStatusType;
export type InvoiceStatus = InvoiceStatusType;
export type PaymentMethod = PaymentMethodType;
export type Gender = GenderType;
export type AuditAction = AuditActionType;
export type NotificationType = NotificationTypeType;
export type FlowEventType = FlowEventTypeType;
export type InvoiceItemCategory = InvoiceItemCategoryType;
