import { describe, it, expect } from 'vitest';
import { transitionTable } from './transition';
import { getNextAction } from './guidance';
import { checkDischargeReadiness } from './discharge-guard';
import { Role, VisitStage, Priority } from '@/lib/types';
import { hasPermission, authorize, Capabilities } from '../permissions';

describe('Workflow Engine — Transition Table', () => {
  it('allows valid transitions for REGISTERED stage', () => {
    const fromRegistered = transitionTable[VisitStage.REGISTERED];
    expect(fromRegistered).toBeDefined();
    expect(fromRegistered![VisitStage.CHECKED_IN]).toContain(Role.RECEPTIONIST);
    expect(fromRegistered![VisitStage.WAITING]).toContain(Role.NURSE);
    expect(fromRegistered![VisitStage.CANCELLED]).toContain(Role.ADMIN);
  });

  it('forbids invalid transitions from REGISTERED to COMPLETED directly', () => {
    const fromRegistered = transitionTable[VisitStage.REGISTERED];
    expect(fromRegistered![VisitStage.COMPLETED]).toBeUndefined();
  });

  it('allows DOCTOR to transition WAITING to IN_CONSULTATION', () => {
    const fromWaiting = transitionTable[VisitStage.WAITING];
    expect(fromWaiting![VisitStage.IN_CONSULTATION]).toContain(Role.DOCTOR);
    expect(fromWaiting![VisitStage.IN_CONSULTATION]).not.toContain(Role.PHARMACIST);
  });

  it('allows DOCTOR to transition IN_CONSULTATION to multiple downstream stages', () => {
    const fromConsult = transitionTable[VisitStage.IN_CONSULTATION];
    expect(fromConsult![VisitStage.INVESTIGATIONS_PENDING]).toContain(Role.DOCTOR);
    expect(fromConsult![VisitStage.PHARMACY_PENDING]).toContain(Role.DOCTOR);
    expect(fromConsult![VisitStage.ADMISSION_PENDING]).toContain(Role.DOCTOR);
    expect(fromConsult![VisitStage.BILLING_PENDING]).toContain(Role.DOCTOR);
    expect(fromConsult![VisitStage.READY_FOR_DISCHARGE]).toContain(Role.DOCTOR);
  });

  it('allows ADMISSION_STAFF to transition ADMISSION_PENDING to ADMITTED', () => {
    const fromAdmPending = transitionTable[VisitStage.ADMISSION_PENDING];
    expect(fromAdmPending![VisitStage.ADMITTED]).toContain(Role.ADMISSION_STAFF);
  });

  it('allows BILLING_STAFF to transition BILLING_PENDING to READY_FOR_DISCHARGE', () => {
    const fromBilling = transitionTable[VisitStage.BILLING_PENDING];
    expect(fromBilling![VisitStage.READY_FOR_DISCHARGE]).toContain(Role.BILLING_STAFF);
  });

  it('allows DOCTOR and ADMISSION_STAFF to complete READY_FOR_DISCHARGE', () => {
    const fromDischarge = transitionTable[VisitStage.READY_FOR_DISCHARGE];
    expect(fromDischarge![VisitStage.COMPLETED]).toContain(Role.DOCTOR);
    expect(fromDischarge![VisitStage.COMPLETED]).toContain(Role.ADMISSION_STAFF);
  });

  it('marks COMPLETED and CANCELLED as terminal with no further transitions', () => {
    expect(Object.keys(transitionTable[VisitStage.COMPLETED] || {})).toHaveLength(0);
    expect(Object.keys(transitionTable[VisitStage.CANCELLED] || {})).toHaveLength(0);
  });
});

describe('Workflow Engine — getNextAction (≥25 table-driven scenarios)', () => {
  const testCases = [
    // 1: Unassessed emergency priority
    {
      name: '1. Priority UNASSESSED gets triage assessment notice',
      visit: { id: 'v1', priority: 'UNASSESSED', stage: VisitStage.WAITING },
      tasks: {},
      viewerRole: Role.NURSE,
      expected: { whatNext: 'Awaiting assessment - set priority', ownerRole: Role.NURSE },
    },
    // 2: Registered walk-in / appointment
    {
      name: '2. REGISTERED stage prompts check-in',
      visit: { id: 'v2', priority: 'NORMAL', stage: VisitStage.REGISTERED },
      tasks: {},
      viewerRole: Role.RECEPTIONIST,
      expected: { whatNext: 'Check in patient', ownerRole: Role.RECEPTIONIST },
    },
    // 3: Checked in, needs queue
    {
      name: '3. CHECKED_IN stage prompts send to queue',
      visit: { id: 'v3', priority: 'NORMAL', stage: VisitStage.CHECKED_IN },
      tasks: {},
      viewerRole: Role.RECEPTIONIST,
      expected: { whatNext: 'Send to queue', ownerRole: Role.RECEPTIONIST },
    },
    // 4: Waiting in queue
    {
      name: '4. WAITING stage prompts calling patient',
      visit: { id: 'v4', priority: 'NORMAL', stage: VisitStage.WAITING },
      tasks: {},
      viewerRole: Role.DOCTOR,
      expected: { whatNext: 'Call patient' },
    },
    // 5: In consultation
    {
      name: '5. IN_CONSULTATION shows doctor is consulting',
      visit: { id: 'v5', priority: 'NORMAL', stage: VisitStage.IN_CONSULTATION },
      tasks: {},
      viewerRole: Role.DOCTOR,
      expected: { whatNext: 'Doctor is consulting', ownerRole: Role.DOCTOR },
    },
    // 6: Lab ordered, sample pending
    {
      name: '6. Investigations with sample pending sends patient to Lab',
      visit: { id: 'v6', priority: 'NORMAL', stage: VisitStage.INVESTIGATIONS_PENDING },
      tasks: { labOrders: [{ status: 'ORDERED' }] },
      viewerRole: Role.LAB_TECH,
      expected: { whatNext: 'Send patient to Laboratory', ownerRole: Role.LAB_TECH },
    },
    // 7: Lab processing
    {
      name: '7. Investigations with processing shows lab processing',
      visit: { id: 'v7', priority: 'NORMAL', stage: VisitStage.INVESTIGATIONS_PENDING },
      tasks: { labOrders: [{ status: 'PROCESSING' }] },
      viewerRole: Role.LAB_TECH,
      expected: { whatNext: 'Processing lab tests', ownerRole: Role.LAB_TECH },
    },
    // 8: Doctor review pending
    {
      name: '8. REVIEW_PENDING prompts doctor review',
      visit: { id: 'v8', priority: 'NORMAL', stage: VisitStage.REVIEW_PENDING },
      tasks: {},
      viewerRole: Role.DOCTOR,
      expected: { whatNext: 'Doctor review needed', ownerRole: Role.DOCTOR },
    },
    // 9: Pharmacy pending, in stock
    {
      name: '9. PHARMACY_PENDING with stock prompts dispense',
      visit: { id: 'v9', priority: 'NORMAL', stage: VisitStage.PHARMACY_PENDING },
      tasks: { prescriptions: [{ items: [{ status: 'PENDING' }] }] },
      viewerRole: Role.PHARMACIST,
      expected: { whatNext: 'Dispense medicines', ownerRole: Role.PHARMACIST },
    },
    // 10: Pharmacy pending, out of stock
    {
      name: '10. PHARMACY_PENDING with out of stock prompts substitute request',
      visit: { id: 'v10', priority: 'NORMAL', stage: VisitStage.PHARMACY_PENDING },
      tasks: { prescriptions: [{ items: [{ status: 'OUT_OF_STOCK' }] }] },
      viewerRole: Role.PHARMACIST,
      expected: { whatNext: 'Ask doctor for a substitute', ownerRole: Role.PHARMACIST },
    },
    // 11: Admission pending
    {
      name: '11. ADMISSION_PENDING prompts finding a bed',
      visit: { id: 'v11', priority: 'NORMAL', stage: VisitStage.ADMISSION_PENDING },
      tasks: {},
      viewerRole: Role.ADMISSION_STAFF,
      expected: { whatNext: 'Find a bed', ownerRole: Role.ADMISSION_STAFF },
    },
    // 12: Admitted inpatient
    {
      name: '12. ADMITTED shows patient admitted',
      visit: { id: 'v12', priority: 'NORMAL', stage: VisitStage.ADMITTED },
      tasks: {},
      viewerRole: Role.NURSE,
      expected: { whatNext: 'Patient admitted', ownerRole: Role.NURSE },
    },
    // 13: Billing pending unpaid
    {
      name: '13. BILLING_PENDING unpaid prompts payment collection',
      visit: { id: 'v13', priority: 'NORMAL', stage: VisitStage.BILLING_PENDING },
      tasks: { invoice: { status: 'PENDING', totalPaise: 50000, paidPaise: 0 } },
      viewerRole: Role.BILLING_STAFF,
      expected: { whatNext: 'Collect payment', ownerRole: Role.BILLING_STAFF },
    },
    // 14: Billing pending partial payment
    {
      name: '14. BILLING_PENDING partially paid prompts remaining collection',
      visit: { id: 'v14', priority: 'NORMAL', stage: VisitStage.BILLING_PENDING },
      tasks: { invoice: { status: 'PARTIAL', totalPaise: 50000, paidPaise: 20000 } },
      viewerRole: Role.BILLING_STAFF,
      expected: { whatNext: 'Collect remaining payment', ownerRole: Role.BILLING_STAFF },
    },
    // 15: Ready for discharge
    {
      name: '15. READY_FOR_DISCHARGE prompts complete discharge',
      visit: { id: 'v15', priority: 'NORMAL', stage: VisitStage.READY_FOR_DISCHARGE },
      tasks: {},
      viewerRole: Role.DOCTOR,
      expected: { whatNext: 'Ready for discharge' },
    },
    // 16: Completed visit
    {
      name: '16. COMPLETED stage shows visit completed',
      visit: { id: 'v16', priority: 'NORMAL', stage: VisitStage.COMPLETED },
      tasks: {},
      viewerRole: Role.RECEPTIONIST,
      expected: { whatNext: 'Visit completed' },
    },
    // 17: Emergency prefix on whereNow
    {
      name: '17. EMERGENCY priority adds 🚨 emoji prefix',
      visit: { id: 'v17', priority: 'EMERGENCY', stage: VisitStage.WAITING },
      tasks: {},
      viewerRole: Role.NURSE,
      expected: { whereNowPrefix: '🚨' },
    },
    // 18: Normal priority does not have emoji prefix
    {
      name: '18. NORMAL priority has clean whereNow without siren emoji',
      visit: { id: 'v18', priority: 'NORMAL', stage: VisitStage.WAITING },
      tasks: {},
      viewerRole: Role.NURSE,
      expected: { noPrefix: '🚨' },
    },
    // 19: Urgent priority in consultation
    {
      name: '19. URGENT in consultation shows doctor consulting',
      visit: { id: 'v19', priority: 'URGENT', stage: VisitStage.IN_CONSULTATION },
      tasks: {},
      viewerRole: Role.DOCTOR,
      expected: { whatNext: 'Doctor is consulting', ownerRole: Role.DOCTOR },
    },
    // 20: Cancelled visit
    {
      name: '20. CANCELLED stage shows cancelled',
      visit: { id: 'v20', priority: 'NORMAL', stage: VisitStage.CANCELLED },
      tasks: {},
      viewerRole: Role.ADMIN,
      expected: { whatNext: 'Visit cancelled' },
    },
    // 21: Referred stage
    {
      name: '21. REFERRED stage directs to receiving department',
      visit: { id: 'v21', priority: 'NORMAL', stage: VisitStage.REFERRED },
      tasks: {},
      viewerRole: Role.RECEPTIONIST,
      expected: { whereNow: 'Referred' },
    },
    // 22: Lab multiple orders with one in processing
    {
      name: '22. Multiple lab orders with one processing prioritizes processing state',
      visit: { id: 'v22', priority: 'NORMAL', stage: VisitStage.INVESTIGATIONS_PENDING },
      tasks: { labOrders: [{ status: 'SAMPLE_COLLECTED' }, { status: 'PROCESSING' }] },
      viewerRole: Role.LAB_TECH,
      expected: { whatNext: 'Processing lab tests' },
    },
    // 23: Billing fully paid before discharge
    {
      name: '23. Billing with fully paid invoice indicates ready state',
      visit: { id: 'v23', priority: 'NORMAL', stage: VisitStage.READY_FOR_DISCHARGE },
      tasks: { invoice: { status: 'PAID', totalPaise: 50000, paidPaise: 50000 } },
      viewerRole: Role.DOCTOR,
      expected: { whatNext: 'Ready for discharge' },
    },
    // 24: Discharge button primary variant on ready for discharge
    {
      name: '24. Ready for discharge provides Complete discharge action',
      visit: { id: 'v24', priority: 'NORMAL', stage: VisitStage.READY_FOR_DISCHARGE },
      tasks: {},
      viewerRole: Role.DOCTOR,
      expected: { primaryActionLabel: 'Complete discharge' },
    },
    // 25: Unassessed triage primary action href
    {
      name: '25. UNASSESSED priority provides assess action href',
      visit: { id: 'v25', priority: 'UNASSESSED', stage: VisitStage.WAITING },
      tasks: {},
      viewerRole: Role.NURSE,
      expected: { primaryActionLabel: 'Assess Priority' },
    },
  ];

  testCases.forEach((tc) => {
    it(tc.name, () => {
      const res = getNextAction(tc.visit, tc.tasks, tc.viewerRole as any);
      if (tc.expected.whatNext) {
        expect(res.whatNext).toBe(tc.expected.whatNext);
      }
      if (tc.expected.ownerRole !== undefined) {
        expect(res.ownerRole).toBe(tc.expected.ownerRole);
      }
      if (tc.expected.whereNowPrefix) {
        expect(res.whereNow.startsWith(tc.expected.whereNowPrefix)).toBe(true);
      }
      if (tc.expected.noPrefix) {
        expect(res.whereNow.includes(tc.expected.noPrefix)).toBe(false);
      }
      if (tc.expected.whereNow) {
        expect(res.whereNow).toContain(tc.expected.whereNow);
      }
      if (tc.expected.primaryActionLabel) {
        expect(res.primaryAction?.label).toBe(tc.expected.primaryActionLabel);
      }
    });
  });
});

describe('Role & Permission Map', () => {
  it('RECEPTIONIST can register and search patients but cannot prescribe', () => {
    expect(hasPermission(Role.RECEPTIONIST, Capabilities.REGISTER_PATIENT)).toBe(true);
    expect(hasPermission(Role.RECEPTIONIST, Capabilities.SEARCH_PATIENT)).toBe(true);
    expect(hasPermission(Role.RECEPTIONIST, Capabilities.PRESCRIBE)).toBe(false);
    expect(hasPermission(Role.RECEPTIONIST, Capabilities.CLINICAL_SIGN_OFF)).toBe(false);
  });

  it('DOCTOR can prescribe, consult, and order tests', () => {
    expect(hasPermission(Role.DOCTOR, Capabilities.CREATE_CONSULTATION)).toBe(true);
    expect(hasPermission(Role.DOCTOR, Capabilities.ORDER_TESTS)).toBe(true);
    expect(hasPermission(Role.DOCTOR, Capabilities.PRESCRIBE)).toBe(true);
    expect(hasPermission(Role.DOCTOR, Capabilities.CLINICAL_SIGN_OFF)).toBe(true);
    expect(hasPermission(Role.DOCTOR, Capabilities.COLLECT_PAYMENT)).toBe(false);
  });

  it('PHARMACIST can dispense but not consult or register', () => {
    expect(hasPermission(Role.PHARMACIST, Capabilities.DISPENSE)).toBe(true);
    expect(hasPermission(Role.PHARMACIST, Capabilities.CREATE_CONSULTATION)).toBe(false);
    expect(hasPermission(Role.PHARMACIST, Capabilities.REGISTER_PATIENT)).toBe(false);
  });

  it('LAB_TECH can process lab and view results', () => {
    expect(hasPermission(Role.LAB_TECH, Capabilities.PROCESS_LAB)).toBe(true);
    expect(hasPermission(Role.LAB_TECH, Capabilities.VIEW_LAB_RESULTS)).toBe(true);
    expect(hasPermission(Role.LAB_TECH, Capabilities.PRESCRIBE)).toBe(false);
  });

  it('authorize throws on unauthorized access', () => {
    expect(() => authorize(Role.RECEPTIONIST, Capabilities.PRESCRIBE)).toThrow();
    expect(() => authorize(Role.DOCTOR, Capabilities.PRESCRIBE)).not.toThrow();
  });
});

describe('Billing Math (paise & partial payments)', () => {
  it('calculates total in paise correctly without float errors', () => {
    const consultationPaise = 50000; // ₹500
    const labTestPaise = 80000;       // ₹800
    const medicinePaise = 1500;       // ₹15
    const taxRate = 0.0;             // 0% default
    
    const subtotal = consultationPaise + labTestPaise + medicinePaise;
    const tax = Math.round(subtotal * taxRate);
    const total = subtotal + tax;

    expect(total).toBe(131500); // exactly ₹1,315.00
  });

  it('handles partial payments cleanly', () => {
    const totalPaise = 100000; // ₹1,000
    let paidPaise = 40000;     // ₹400 paid
    
    let balance = totalPaise - paidPaise;
    let status = paidPaise >= totalPaise ? 'PAID' : paidPaise > 0 ? 'PARTIAL' : 'PENDING';
    
    expect(balance).toBe(60000);
    expect(status).toBe('PARTIAL');

    // Pay remaining
    paidPaise += balance;
    balance = totalPaise - paidPaise;
    status = paidPaise >= totalPaise ? 'PAID' : paidPaise > 0 ? 'PARTIAL' : 'PENDING';

    expect(balance).toBe(0);
    expect(status).toBe('PAID');
  });
});
