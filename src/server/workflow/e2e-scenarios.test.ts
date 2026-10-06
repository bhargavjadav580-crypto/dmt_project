import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import * as patientService from '@/server/services/patient-service';
import * as visitService from '@/server/services/visit-service';
import * as queueService from '@/server/services/queue-service';
import * as consultationService from '@/server/services/consultation-service';
import * as labService from '@/server/services/lab-service';
import * as pharmacyService from '@/server/services/pharmacy-service';
import * as admissionService from '@/server/services/admission-service';
import * as billingService from '@/server/services/billing-service';
import * as dischargeService from '@/server/services/discharge-service';
import { transitionVisit } from '@/server/workflow/transition';
import { checkDischargeReadiness } from '@/server/workflow/discharge-guard';
import { authorize, hasPermission, Capabilities } from '@/server/permissions';
import { Role, Priority, VisitStage, VisitStatus, BedStatus } from '@/lib/types';

describe('Hospital Patient Flow Management - End-to-End Scenarios', () => {
  let receptionistUser: any;
  let nurseUser: any;
  let doctorUser: any;
  let labTechUser: any;
  let pharmacistUser: any;
  let admissionUser: any;
  let billingUser: any;
  let adminUser: any;
  let opdDept: any;
  let cbcTest: any;
  let paracetamolMed: any;

  beforeAll(async () => {
    receptionistUser = await db.user.findFirst({ where: { role: Role.RECEPTIONIST } });
    nurseUser = await db.user.findFirst({ where: { role: Role.NURSE } });
    doctorUser = await db.user.findFirst({ where: { role: Role.DOCTOR } });
    labTechUser = await db.user.findFirst({ where: { role: Role.LAB_TECH } });
    pharmacistUser = await db.user.findFirst({ where: { role: Role.PHARMACIST } });
    admissionUser = await db.user.findFirst({ where: { role: Role.ADMISSION_STAFF } });
    billingUser = await db.user.findFirst({ where: { role: Role.BILLING_STAFF } });
    adminUser = await db.user.findFirst({ where: { role: Role.ADMIN } });

    opdDept = await db.department.findFirst({ where: { code: 'GENERAL_OPD' } });
    cbcTest = await db.labTest.findFirst({ where: { code: 'CBC' } });
    paracetamolMed = await db.medicine.findFirst({ where: { name: { contains: 'Paracetamol' } } });
  });

  describe('Scenario 1: Standard Outpatient Journey (P0 Full Life-Cycle)', () => {
    let patient: any;
    let visit: any;
    let queueEntry: any;
    let consultation: any;
    let labOrder: any;
    let prescription: any;
    let invoice: any;

    it('Step 1: Receptionist registers a walk-in patient and generates atomic UHID', async () => {
      patient = await patientService.createPatient({
        name: 'Rohan E2E Sharma',
        ageYears: 34,
        gender: 'MALE',
        phone: '9988776655',
        allergies: ['Penicillin'],
      });

      expect(patient.id).toBeDefined();
      expect(patient.uhid).toMatch(/^P\d{5}$/);
      expect(patient.name).toBe('Rohan E2E Sharma');
    });

    it('Step 2: Receptionist creates visit and issues token into department queue', async () => {
      visit = await visitService.createVisit(
        patient.id,
        opdDept.id,
        'OPD',
        'Fever and persistent headache for 3 days',
        receptionistUser.id
      );

      expect(visit.id).toBeDefined();
      expect(visit.tokenNumber).toMatch(/^A-\d{3}$/);
      expect(visit.stage).toBe(VisitStage.REGISTERED);
      expect(visit.status).toBe(VisitStatus.OPEN);

      const queue = await queueService.getQueueByDepartment(opdDept.id);
      queueEntry = queue.waiting.find(e => e.visitId === visit.id);
      expect(queueEntry).toBeDefined();
      expect(queueEntry.status).toBe('WAITING');
    });

    it('Step 3: Nurse records vital signs and triages priority', async () => {
      const vitals = await db.vitalSigns.create({
        data: {
          visitId: visit.id,
          recordedById: nurseUser.id,
          bp: '120/80',
          pulse: 78,
          tempC: 38.6,
          spo2: 98,
          weightKg: 68.5,
          notes: 'Patient warm to touch, alert and oriented.',
        },
      });

      expect(vitals.id).toBeDefined();
      expect(vitals.tempC).toBe(38.6);

      // Nurse sets priority to NORMAL
      await db.visit.update({
        where: { id: visit.id },
        data: { priority: Priority.NORMAL },
      });
    });

    it('Step 4: Doctor calls patient into consultation', async () => {
      // Doctor starts consultation
      consultation = await consultationService.startConsultation(visit.id, doctorUser.id);
      expect(consultation.id).toBeDefined();
      expect(consultation.status).toBe('DRAFT');

      // Update consultation notes & diagnosis
      await consultationService.saveDraft(consultation.id, {
        reason: 'Viral pyrexia investigation',
        notes: 'Complaining of acute fever and body aches. No respiratory distress.',
        diagnosis: 'Acute febrile illness',
        icd10Code: 'R50.9',
      });

      const updated = await consultationService.getConsultation(visit.id);
      expect(updated?.diagnosis).toBe('Acute febrile illness');
    });

    it('Step 5: Doctor orders laboratory investigations (CBC)', async () => {
      expect(cbcTest).toBeDefined();
      const orders = await labService.orderTests(visit.id, [cbcTest.id], doctorUser.id, 'NORMAL');
      expect(orders.length).toBe(1);
      labOrder = orders[0];
      expect(labOrder.status).toBe('ORDERED');
      expect(labOrder.labTestId).toBe(cbcTest.id);
    });

    it('Step 6: Lab Tech collects sample, processes, and enters test parameters', async () => {
      await labService.collectSample(labOrder.id, labTechUser.id);
      let order = await db.labOrder.findUnique({ where: { id: labOrder.id } });
      expect(order?.status).toBe('SAMPLE_COLLECTED');

      await labService.startProcessing(labOrder.id);
      order = await db.labOrder.findUnique({ where: { id: labOrder.id } });
      expect(order?.status).toBe('PROCESSING');

      const resultsData = {
        Hemoglobin: '13.8',
        WBC: '8200',
        Platelets: '220000',
        RBC: '4.8',
      };

      await labService.enterResult(labOrder.id, resultsData, labTechUser.id);
      order = await db.labOrder.findUnique({ where: { id: labOrder.id } });
      expect(order?.status).toBe('RESULT_ENTERED');

      // Check that visit is flagged for doctor review
      const updatedVisit = await db.visit.findUnique({ where: { id: visit.id } });
      expect(updatedVisit?.needsDoctorReview).toBe(true);
    });

    it('Step 7: Doctor reviews the laboratory results', async () => {
      await labService.reviewResult(labOrder.id, doctorUser.id);
      const order = await db.labOrder.findUnique({ where: { id: labOrder.id } });
      expect(order?.status).toBe('REVIEWED');

      // Doctor clears needsDoctorReview flag
      await db.visit.update({
        where: { id: visit.id },
        data: { needsDoctorReview: false },
      });
    });

    it('Step 8: Doctor prescribes medications and completes consultation', async () => {
      expect(paracetamolMed).toBeDefined();
      prescription = await pharmacyService.createPrescription(
        visit.id,
        doctorUser.id,
        [
          {
            medicineId: paracetamolMed.id,
            medicineName: paracetamolMed.name,
            dose: '500mg',
            frequency: 'TDS (Three times a day)',
            durationDays: 5,
            quantity: 15,
          },
        ]
      );

      expect(prescription.id).toBeDefined();
      expect(prescription.status).toBe('PENDING');
      expect(prescription.items.length).toBe(1);

      // Doctor completes consultation
      await consultationService.completeConsultation(consultation.id, doctorUser.id);
      const finished = await consultationService.getConsultation(visit.id);
      expect(finished?.status).toBe('COMPLETED');
    });

    it('Step 9: Pharmacist dispenses medications with atomic inventory update', async () => {
      const initialStock = paracetamolMed.stockQty;
      const itemId = prescription.items[0].id;

      await pharmacyService.dispenseMedicines(
        prescription.id,
        [{ itemId, dispenseQuantity: 15 }],
        pharmacistUser.id
      );

      const updatedPrescription = await pharmacyService.getPrescription(prescription.id);
      expect(updatedPrescription?.status).toBe('DISPENSED');

      const updatedMed = await db.medicine.findUnique({ where: { id: paracetamolMed.id } });
      expect(updatedMed?.stockQty).toBe(initialStock - 15);
    });

    it('Step 10: Discharge is blocked BEFORE payment is cleared (Hard Stop Guard)', async () => {
      // Generate billing invoice first
      invoice = await billingService.generateInvoice(visit.id);
      expect(invoice.totalPaise).toBeGreaterThan(0);
      expect(invoice.status).toBe('PENDING');

      // Attempt discharge readiness check before payment
      const readiness = await checkDischargeReadiness(visit.id);
      expect(readiness.ready).toBe(false);
      const billingCheck = readiness.checks.find(c => c.label.includes('Billing clearance'));
      expect(billingCheck?.passed).toBe(false);
    });

    it('Step 11: Billing Staff collects payment and clears invoice', async () => {
      const payment = await billingService.recordPayment(
        invoice.id,
        'CASH',
        invoice.totalPaise,
        'REC-E2E-001',
        billingUser.id
      );

      expect(payment.id).toBeDefined();
      const updatedInvoice = await billingService.getInvoice(visit.id);
      expect(updatedInvoice?.status).toBe('PAID');
      expect(updatedInvoice?.paidPaise).toBe(updatedInvoice?.totalPaise);
    });

    it('Step 12: Doctor clinical sign-off and final discharge completion', async () => {
      await dischargeService.clinicalSignOff(
        visit.id,
        doctorUser.id,
        'Patient improved after symptomatic treatment. Review in 5 days if fever recurs.'
      );

      const readiness = await checkDischargeReadiness(visit.id);
      expect(readiness.ready).toBe(true);
      expect(readiness.checks.every(c => c.passed)).toBe(true);

      // Finalize discharge
      const finalized = await dischargeService.finalizeDischarge(visit.id, receptionistUser.id);
      expect(finalized.stage).toBe(VisitStage.COMPLETED);
      expect(finalized.status).toBe(VisitStatus.COMPLETED);

      // Verify FlowEvents recorded the complete journey
      const flowEvents = await db.flowEvent.findMany({
        where: { visitId: visit.id },
        orderBy: { createdAt: 'asc' },
      });

      expect(flowEvents.length).toBeGreaterThanOrEqual(2);
      expect(flowEvents.some(e => e.type === 'DISCHARGE')).toBe(true);
    });
  });

  describe('Scenario 2: Emergency Walk-in and Inpatient Admission', () => {
    let emergencyPatient: any;
    let emergencyVisit: any;
    let emergencyDept: any;
    let generalWard: any;
    let availableBed: any;

    beforeAll(async () => {
      emergencyDept = await db.department.findFirst({ where: { code: 'EMERGENCY' } });
      generalWard = await db.ward.findFirst({ where: { type: 'GENERAL' }, include: { beds: true } });
      availableBed = await db.bed.findFirst({ where: { status: BedStatus.AVAILABLE } });
      if (!availableBed) {
        const firstBed = await db.bed.findFirstOrThrow();
        availableBed = await db.bed.update({
          where: { id: firstBed.id },
          data: { status: BedStatus.AVAILABLE },
        });
      }
    });

    it('Step 1: Quick emergency registration with EMERGENCY priority', async () => {
      emergencyPatient = await patientService.createPatient({
        name: 'Emergency Patient 101',
        ageYears: 52,
        gender: 'MALE',
        isUnidentified: false,
      });

      emergencyVisit = await visitService.createVisit(
        emergencyPatient.id,
        emergencyDept.id,
        'EMERGENCY',
        'Acute chest discomfort and diaphoresis',
        receptionistUser.id
      );

      expect(emergencyVisit.tokenNumber).toMatch(/^E-\d{3}$/);

      // Update to emergency priority
      await db.visit.update({
        where: { id: emergencyVisit.id },
        data: { priority: Priority.EMERGENCY },
      });
    });

    it('Step 2: Doctor requests inpatient admission', async () => {
      const admission = await admissionService.requestAdmission(
        emergencyVisit.id,
        'Unstable angina for cardiac monitoring and serial enzymes',
        Priority.EMERGENCY,
        doctorUser.id
      );

      expect(admission.id).toBeDefined();
      expect(admission.status).toBe('REQUESTED');
      expect(admission.priority).toBe(Priority.EMERGENCY);
    });

    it('Step 3: Admission Staff assigns available bed and admits patient', async () => {
      expect(availableBed).toBeDefined();
      const admission = await db.admission.findUniqueOrThrow({
        where: { visitId: emergencyVisit.id },
      });

      const assigned = await admissionService.assignBed(admission.id, availableBed.id, admissionUser.id);
      expect(assigned.status).toBe('BED_ASSIGNED');
      expect(assigned.bedId).toBe(availableBed.id);

      // Admit patient
      const admitted = await admissionService.admitPatient(admission.id, admissionUser.id);
      expect(admitted.status).toBe('ADMITTED');

      // Verify bed is marked OCCUPIED in database
      const bed = await db.bed.findUnique({ where: { id: availableBed.id } });
      expect(bed?.status).toBe(BedStatus.OCCUPIED);
    });
  });

  describe('Scenario 3: RBAC and Security Enforcement', () => {
    it('Receptionist cannot create clinical consultation (throws Unauthorized)', () => {
      expect(() => {
        authorize(Role.RECEPTIONIST, Capabilities.CREATE_CONSULTATION);
      }).toThrow();
    });

    it('Billing Staff cannot order laboratory tests', () => {
      expect(hasPermission(Role.BILLING_STAFF, Capabilities.ORDER_TESTS)).toBe(false);
      expect(() => {
        authorize(Role.BILLING_STAFF, Capabilities.ORDER_TESTS);
      }).toThrow();
    });

    it('Nurse can record vitals and manage queue, but cannot prescribe medication', () => {
      expect(hasPermission(Role.NURSE, Capabilities.RECORD_VITALS)).toBe(true);
      expect(hasPermission(Role.NURSE, Capabilities.MANAGE_QUEUE)).toBe(true);
      expect(hasPermission(Role.NURSE, Capabilities.PRESCRIBE)).toBe(false);
    });

    it('Doctor can prescribe, order tests, and clinical sign-off, but cannot finalize discharge', () => {
      expect(hasPermission(Role.DOCTOR, Capabilities.PRESCRIBE)).toBe(true);
      expect(hasPermission(Role.DOCTOR, Capabilities.ORDER_TESTS)).toBe(true);
      expect(hasPermission(Role.DOCTOR, Capabilities.CLINICAL_SIGN_OFF)).toBe(true);
      expect(hasPermission(Role.DOCTOR, Capabilities.FINALIZE_DISCHARGE)).toBe(false);
    });

    it('Admin break-glass policy logged with reason', async () => {
      const log = await db.auditLog.create({
        data: {
          actorId: adminUser.id,
          actorName: adminUser.name,
          action: 'BREAK_GLASS',
          entityType: 'ClinicalNotes',
          entityId: 'consultation-test-id',
          reason: 'Emergency clinical review requested by medical director',
        },
      });

      expect(log.id).toBeDefined();
      expect(log.action).toBe('BREAK_GLASS');
      expect(log.reason).toContain('Emergency clinical review');
    });
  });
});
