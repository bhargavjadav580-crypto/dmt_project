import { Role, RoleType } from '../lib/types';

export const Capabilities = {
  REGISTER_PATIENT: 'REGISTER_PATIENT',
  SEARCH_PATIENT: 'SEARCH_PATIENT',
  VIEW_PATIENT_IDENTITY: 'VIEW_PATIENT_IDENTITY',
  VIEW_PATIENT_CLINICAL: 'VIEW_PATIENT_CLINICAL',
  MANAGE_QUEUE: 'MANAGE_QUEUE',
  SET_PRIORITY: 'SET_PRIORITY',
  RECORD_VITALS: 'RECORD_VITALS',
  VIEW_VITALS: 'VIEW_VITALS',
  CREATE_CONSULTATION: 'CREATE_CONSULTATION',
  VIEW_CONSULTATION: 'VIEW_CONSULTATION',
  ORDER_TESTS: 'ORDER_TESTS',
  PROCESS_LAB: 'PROCESS_LAB',
  VIEW_LAB_RESULTS: 'VIEW_LAB_RESULTS',
  PRESCRIBE: 'PRESCRIBE',
  DISPENSE: 'DISPENSE',
  VIEW_PRESCRIPTION: 'VIEW_PRESCRIPTION',
  REQUEST_ADMISSION: 'REQUEST_ADMISSION',
  MANAGE_ADMISSION: 'MANAGE_ADMISSION',
  MANAGE_BEDS: 'MANAGE_BEDS',
  CREATE_INVOICE: 'CREATE_INVOICE',
  COLLECT_PAYMENT: 'COLLECT_PAYMENT',
  VIEW_BILLING: 'VIEW_BILLING',
  CLINICAL_SIGN_OFF: 'CLINICAL_SIGN_OFF',
  FINALIZE_DISCHARGE: 'FINALIZE_DISCHARGE',
  VIEW_ANALYTICS: 'VIEW_ANALYTICS',
  MANAGE_USERS: 'MANAGE_USERS',
  VIEW_AUDIT_LOG: 'VIEW_AUDIT_LOG',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
  CREATE_REFERRAL: 'CREATE_REFERRAL',
  MANAGE_NOTIFICATIONS: 'MANAGE_NOTIFICATIONS',
} as const;

export type CapabilityType = typeof Capabilities[keyof typeof Capabilities];

const RolePermissions: Record<RoleType, CapabilityType[]> = {
  [Role.RECEPTIONIST]: [
    Capabilities.REGISTER_PATIENT,
    Capabilities.SEARCH_PATIENT,
    Capabilities.VIEW_PATIENT_IDENTITY,
    Capabilities.MANAGE_QUEUE,
    Capabilities.MANAGE_NOTIFICATIONS,
  ],
  [Role.NURSE]: [
    Capabilities.SEARCH_PATIENT,
    Capabilities.VIEW_PATIENT_IDENTITY,
    Capabilities.VIEW_PATIENT_CLINICAL,
    Capabilities.MANAGE_QUEUE,
    Capabilities.SET_PRIORITY,
    Capabilities.RECORD_VITALS,
    Capabilities.VIEW_VITALS,
    Capabilities.VIEW_CONSULTATION,
    Capabilities.VIEW_PRESCRIPTION,
    Capabilities.MANAGE_NOTIFICATIONS,
  ],
  [Role.DOCTOR]: [
    Capabilities.SEARCH_PATIENT,
    Capabilities.VIEW_PATIENT_IDENTITY,
    Capabilities.VIEW_PATIENT_CLINICAL,
    Capabilities.MANAGE_QUEUE,
    Capabilities.SET_PRIORITY,
    Capabilities.RECORD_VITALS,
    Capabilities.VIEW_VITALS,
    Capabilities.CREATE_CONSULTATION,
    Capabilities.VIEW_CONSULTATION,
    Capabilities.ORDER_TESTS,
    Capabilities.VIEW_LAB_RESULTS,
    Capabilities.PRESCRIBE,
    Capabilities.VIEW_PRESCRIPTION,
    Capabilities.REQUEST_ADMISSION,
    Capabilities.CLINICAL_SIGN_OFF,
    Capabilities.VIEW_ANALYTICS,
    Capabilities.CREATE_REFERRAL,
    Capabilities.MANAGE_NOTIFICATIONS,
  ],
  [Role.LAB_TECH]: [
    Capabilities.SEARCH_PATIENT,
    Capabilities.VIEW_PATIENT_IDENTITY, // Identity only
    Capabilities.PROCESS_LAB,
    Capabilities.VIEW_LAB_RESULTS,
    Capabilities.MANAGE_NOTIFICATIONS,
  ],
  [Role.PHARMACIST]: [
    Capabilities.SEARCH_PATIENT,
    Capabilities.VIEW_PATIENT_IDENTITY, // Identity only
    Capabilities.DISPENSE,
    Capabilities.VIEW_PRESCRIPTION,
    Capabilities.MANAGE_NOTIFICATIONS,
  ],
  [Role.ADMISSION_STAFF]: [
    Capabilities.SEARCH_PATIENT,
    Capabilities.VIEW_PATIENT_IDENTITY,
    Capabilities.VIEW_CONSULTATION, // Summary only
    Capabilities.MANAGE_ADMISSION,
    Capabilities.MANAGE_BEDS,
    Capabilities.VIEW_BILLING,
    Capabilities.FINALIZE_DISCHARGE,
    Capabilities.MANAGE_NOTIFICATIONS,
  ],
  [Role.BILLING_STAFF]: [
    Capabilities.SEARCH_PATIENT,
    Capabilities.VIEW_PATIENT_IDENTITY, // Identity only
    Capabilities.CREATE_INVOICE,
    Capabilities.COLLECT_PAYMENT,
    Capabilities.VIEW_BILLING,
    Capabilities.VIEW_ANALYTICS, // Financial
    Capabilities.MANAGE_NOTIFICATIONS,
  ],
  [Role.ADMIN]: [
    Capabilities.REGISTER_PATIENT,
    Capabilities.SEARCH_PATIENT,
    Capabilities.VIEW_PATIENT_IDENTITY,
    Capabilities.VIEW_PATIENT_CLINICAL, // Break-glass
    Capabilities.MANAGE_QUEUE,
    Capabilities.VIEW_VITALS,
    Capabilities.VIEW_CONSULTATION, // Break-glass
    Capabilities.VIEW_LAB_RESULTS,
    Capabilities.VIEW_PRESCRIPTION,
    Capabilities.MANAGE_BEDS,
    Capabilities.VIEW_BILLING,
    Capabilities.VIEW_ANALYTICS,
    Capabilities.MANAGE_USERS,
    Capabilities.VIEW_AUDIT_LOG,
    Capabilities.MANAGE_SETTINGS,
    Capabilities.MANAGE_NOTIFICATIONS,
  ],
};

/**
 * Checks if a role has a specific permission capability.
 * @param role The role to check.
 * @param capability The required capability.
 * @returns true if allowed, false otherwise.
 */
export function hasPermission(role: RoleType, capability: CapabilityType): boolean {
  const allowedCapabilities = RolePermissions[role];
  if (!allowedCapabilities) return false;
  
  return allowedCapabilities.includes(capability);
}

/**
 * Authorizes a role for a specific capability. Throws an error if not allowed.
 * @param role The role to authorize.
 * @param capability The required capability.
 * @throws Error if authorization fails.
 */
export function authorize(role: RoleType, capability: CapabilityType): void {
  if (!hasPermission(role, capability)) {
    throw new Error(`Unauthorized: Role ${role} does not have permission ${capability}`);
  }
}
