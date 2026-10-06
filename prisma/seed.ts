import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Departments
  const departmentsData = [
    { code: 'GENERAL_OPD', name: 'General OPD', type: 'OPD', tokenPrefix: 'A' },
    { code: 'CARDIOLOGY', name: 'Cardiology', type: 'OPD', tokenPrefix: 'C' },
    { code: 'ORTHOPEDIC', name: 'Orthopedic', type: 'OPD', tokenPrefix: 'O' },
    { code: 'PEDIATRICS', name: 'Pediatrics', type: 'OPD', tokenPrefix: 'P' },
    { code: 'GYNECOLOGY', name: 'Gynecology', type: 'OPD', tokenPrefix: 'G' },
    { code: 'EMERGENCY', name: 'Emergency', type: 'EMERGENCY', tokenPrefix: 'E' },
    { code: 'LABORATORY', name: 'Laboratory', type: 'LAB', tokenPrefix: 'L' },
    { code: 'PHARMACY', name: 'Pharmacy', type: 'PHARMACY', tokenPrefix: 'PH' },
  ];

  for (const dept of departmentsData) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: dept,
      create: dept,
    });
  }
  
  const depts = await prisma.department.findMany();
  const getDept = (code: string) => depts.find(d => d.code === code)!;

  // 2. Users
  const userPasswordMap: Record<string, string> = {
    'admin@hospital.flow': 'admin123',
    'reception@hospital.flow': 'reception123',
    'nurse@hospital.flow': 'nurse123',
    'doctor1@hospital.flow': 'doctor123',
    'doctor2@hospital.flow': 'doctor123',
    'lab@hospital.flow': 'lab123',
    'pharma@hospital.flow': 'pharma123',
    'admission@hospital.flow': 'admission123',
    'billing@hospital.flow': 'billing123',
  };

  const usersData = [
    { email: 'admin@hospital.flow', name: 'Dr. Rajesh Kumar', role: 'ADMIN', passwordHash: bcrypt.hashSync(userPasswordMap['admin@hospital.flow'], 10) },
    { email: 'reception@hospital.flow', name: 'Priya Sharma', role: 'RECEPTIONIST', passwordHash: bcrypt.hashSync(userPasswordMap['reception@hospital.flow'], 10) },
    { email: 'nurse@hospital.flow', name: 'Anjali Verma', role: 'NURSE', passwordHash: bcrypt.hashSync(userPasswordMap['nurse@hospital.flow'], 10) },
    { email: 'doctor1@hospital.flow', name: 'Dr. Amit Patel', role: 'DOCTOR', passwordHash: bcrypt.hashSync(userPasswordMap['doctor1@hospital.flow'], 10), departmentId: getDept('GENERAL_OPD').id },
    { email: 'doctor2@hospital.flow', name: 'Dr. Sneha Gupta', role: 'DOCTOR', passwordHash: bcrypt.hashSync(userPasswordMap['doctor2@hospital.flow'], 10), departmentId: getDept('CARDIOLOGY').id },
    { email: 'lab@hospital.flow', name: 'Ravi Desai', role: 'LAB_TECH', passwordHash: bcrypt.hashSync(userPasswordMap['lab@hospital.flow'], 10), departmentId: getDept('LABORATORY').id },
    { email: 'pharma@hospital.flow', name: 'Meena Iyer', role: 'PHARMACIST', passwordHash: bcrypt.hashSync(userPasswordMap['pharma@hospital.flow'], 10), departmentId: getDept('PHARMACY').id },
    { email: 'admission@hospital.flow', name: 'Suresh Nair', role: 'ADMISSION_STAFF', passwordHash: bcrypt.hashSync(userPasswordMap['admission@hospital.flow'], 10) },
    { email: 'billing@hospital.flow', name: 'Kavita Joshi', role: 'BILLING_STAFF', passwordHash: bcrypt.hashSync(userPasswordMap['billing@hospital.flow'], 10) },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: u,
      create: u,
    });
  }

  // 3. Settings
  const settingsData = [
    { key: 'queue_warning_minutes', value: '20' },
    { key: 'queue_critical_minutes', value: '45' },
    { key: 'consultation_fee_paise', value: '50000' },
    { key: 'idle_timeout_seconds', value: '900' },
    { key: 'tax_rates', value: JSON.stringify({ CONSULTATION: 0, LAB: 0, MEDICINE: 0, BED: 0, PROCEDURE: 0, MANUAL: 0 }) },
    { key: 'token_prefix_format', value: JSON.stringify({ padLength: 3 }) },
  ];
  for (const s of settingsData) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: s,
      create: s,
    });
  }

  // 4. Wards & Beds
  const wardsData = [
    { id: 'ward_general', name: 'General Ward', type: 'GENERAL', dailyTariffPaise: 50000 },
    { id: 'ward_icu', name: 'ICU', type: 'ICU', dailyTariffPaise: 500000 },
    { id: 'ward_pvt', name: 'Private Ward', type: 'PRIVATE', dailyTariffPaise: 200000 },
  ];

  for (const w of wardsData) {
    await prisma.ward.upsert({
      where: { id: w.id },
      update: w,
      create: w,
    });
  }

  const bedsData = [
    // General - 10 beds
    ...Array.from({ length: 10 }).map((_, i) => ({
      id: `bed_g_${i + 1}`,
      wardId: 'ward_general',
      number: `G-${(i + 1).toString().padStart(2, '0')}`,
      status: 'AVAILABLE',
    })),
    // ICU - 6 beds
    ...Array.from({ length: 6 }).map((_, i) => ({
      id: `bed_icu_${i + 1}`,
      wardId: 'ward_icu',
      number: `ICU-${(i + 1).toString().padStart(2, '0')}`,
      status: i === 4 ? 'MAINTENANCE' : i === 5 ? 'CLEANING' : 'AVAILABLE',
    })),
    // Private - 4 beds
    ...Array.from({ length: 4 }).map((_, i) => ({
      id: `bed_pvt_${i + 1}`,
      wardId: 'ward_pvt',
      number: `PVT-${(i + 1).toString().padStart(2, '0')}`,
      status: 'AVAILABLE',
    })),
  ];

  for (const b of bedsData) {
    await prisma.bed.upsert({
      where: { id: b.id },
      update: b,
      create: b,
    });
  }

  // 5. Lab Tests
  const labTestsData = [
    {
      code: 'CBC', name: 'CBC (Complete Blood Count)', category: 'LAB', pricePaise: 50000,
      parameters: JSON.stringify([
        { name: 'Hemoglobin', unit: 'g/dL', refLow: 12, refHigh: 17.5 },
        { name: 'WBC', unit: 'cells/μL', refLow: 4000, refHigh: 11000 },
        { name: 'Platelets', unit: 'cells/μL', refLow: 150000, refHigh: 400000 },
        { name: 'RBC', unit: 'million/μL', refLow: 4.5, refHigh: 5.5 }
      ])
    },
    { code: 'BSF', name: 'Blood Sugar Fasting', category: 'LAB', pricePaise: 30000, parameters: JSON.stringify([{ name: 'Glucose', unit: 'mg/dL', refLow: 70, refHigh: 100 }]) },
    { code: 'BSPP', name: 'Blood Sugar PP', category: 'LAB', pricePaise: 30000, parameters: JSON.stringify([{ name: 'Glucose', unit: 'mg/dL', refLow: 70, refHigh: 140 }]) },
    {
      code: 'LIPID', name: 'Lipid Profile', category: 'LAB', pricePaise: 80000,
      parameters: JSON.stringify([
        { name: 'Total Cholesterol', unit: 'mg/dL', refLow: 0, refHigh: 200 },
        { name: 'HDL', unit: 'mg/dL', refLow: 40, refHigh: 100 },
        { name: 'LDL', unit: 'mg/dL', refLow: 0, refHigh: 100 },
        { name: 'Triglycerides', unit: 'mg/dL', refLow: 0, refHigh: 150 }
      ])
    },
    {
      code: 'THYROID', name: 'Thyroid Profile', category: 'LAB', pricePaise: 60000,
      parameters: JSON.stringify([
        { name: 'TSH', unit: 'mIU/L', refLow: 0.4, refHigh: 4.0 },
        { name: 'T3', unit: 'ng/dL', refLow: 80, refHigh: 200 },
        { name: 'T4', unit: 'μg/dL', refLow: 4.5, refHigh: 12 }
      ])
    },
    {
      code: 'LFT', name: 'Liver Function Test', category: 'LAB', pricePaise: 70000,
      parameters: JSON.stringify([
        { name: 'SGOT', unit: 'U/L', refLow: 5, refHigh: 40 },
        { name: 'SGPT', unit: 'U/L', refLow: 7, refHigh: 56 },
        { name: 'Bilirubin Total', unit: 'mg/dL', refLow: 0.1, refHigh: 1.2 }
      ])
    },
    {
      code: 'KFT', name: 'Kidney Function Test', category: 'LAB', pricePaise: 60000,
      parameters: JSON.stringify([
        { name: 'Creatinine', unit: 'mg/dL', refLow: 0.6, refHigh: 1.2 },
        { name: 'BUN', unit: 'mg/dL', refLow: 7, refHigh: 20 },
        { name: 'Uric Acid', unit: 'mg/dL', refLow: 3.4, refHigh: 7.0 }
      ])
    },
    {
      code: 'URINE', name: 'Urine Routine', category: 'LAB', pricePaise: 20000,
      parameters: JSON.stringify([
        { name: 'pH', unit: '-', refLow: 4.5, refHigh: 8.0 },
        { name: 'Specific Gravity', unit: '-', refLow: 1.005, refHigh: 1.030 },
        { name: 'Protein', unit: 'mg/dL', refLow: 0, refHigh: 15 }
      ])
    },
    { code: 'HBA1C', name: 'HbA1c', category: 'LAB', pricePaise: 80000, parameters: JSON.stringify([{ name: 'HbA1c', unit: '%', refLow: 4, refHigh: 5.6 }]) },
    { code: 'CXR', name: 'Chest X-Ray', category: 'RADIOLOGY', pricePaise: 50000, parameters: JSON.stringify([]) },
    { code: 'ECG', name: 'ECG', category: 'RADIOLOGY', pricePaise: 30000, parameters: JSON.stringify([]) },
    { code: 'USG_ABD', name: 'Ultrasound Abdomen', category: 'RADIOLOGY', pricePaise: 150000, parameters: JSON.stringify([]) },
  ];

  for (const test of labTestsData) {
    await prisma.labTest.upsert({
      where: { code: test.code },
      update: test,
      create: test,
    });
  }

  // 6. Medicines
  const medicinesData = [
    { id: 'MED01', name: 'Paracetamol 500mg', form: 'TABLET', stockQty: 500, pricePaise: 200 },
    { id: 'MED02', name: 'Amoxicillin 500mg', form: 'CAPSULE', stockQty: 300, pricePaise: 800 },
    { id: 'MED03', name: 'Azithromycin 500mg', form: 'TABLET', stockQty: 200, pricePaise: 1500 },
    { id: 'MED04', name: 'Omeprazole 20mg', form: 'CAPSULE', stockQty: 400, pricePaise: 500 },
    { id: 'MED05', name: 'Metformin 500mg', form: 'TABLET', stockQty: 350, pricePaise: 300 },
    { id: 'MED06', name: 'Atorvastatin 10mg', form: 'TABLET', stockQty: 250, pricePaise: 700 },
    { id: 'MED07', name: 'Cetirizine 10mg', form: 'TABLET', stockQty: 400, pricePaise: 200 },
    { id: 'MED08', name: 'Ibuprofen 400mg', form: 'TABLET', stockQty: 300, pricePaise: 300 },
    { id: 'MED09', name: 'Ranitidine 150mg', form: 'TABLET', stockQty: 200, pricePaise: 400 },
    { id: 'MED10', name: 'Ciprofloxacin 500mg', form: 'TABLET', stockQty: 150, pricePaise: 1000 },
    { id: 'MED11', name: 'Diclofenac 50mg', form: 'TABLET', stockQty: 250, pricePaise: 300 },
    { id: 'MED12', name: 'Cough Syrup 100ml', form: 'SYRUP', stockQty: 100, pricePaise: 6000 },
    { id: 'MED13', name: 'ORS Powder', form: 'SACHET', stockQty: 500, pricePaise: 1000 },
    { id: 'MED14', name: 'Insulin Glargine', form: 'INJECTION', stockQty: 50, pricePaise: 50000 },
    { id: 'MED15', name: 'Betadine Cream', form: 'CREAM', stockQty: 80, pricePaise: 4000 },
    { id: 'MED16', name: 'Salbutamol Inhaler', form: 'INHALER', stockQty: 30, pricePaise: 12000 },
    { id: 'MED17', name: 'Aspirin 75mg', form: 'TABLET', stockQty: 400, pricePaise: 200 },
    { id: 'MED18', name: 'Losartan 50mg', form: 'TABLET', stockQty: 200, pricePaise: 600 },
    { id: 'MED19', name: 'Amlodipine 5mg', form: 'TABLET', stockQty: 300, pricePaise: 400 },
    { id: 'MED20', name: 'Metoprolol 50mg', form: 'TABLET', stockQty: 200, pricePaise: 500 },
    { id: 'MED21', name: 'Clopidogrel 75mg', form: 'TABLET', stockQty: 150, pricePaise: 800 },
    { id: 'MED22', name: 'Pantoprazole 40mg', form: 'TABLET', stockQty: 350, pricePaise: 600 },
    { id: 'MED23', name: 'Doxycycline 100mg', form: 'CAPSULE', stockQty: 100, pricePaise: 500 },
    { id: 'MED24', name: 'Metronidazole 400mg', form: 'TABLET', stockQty: 200, pricePaise: 300 },
    { id: 'MED25', name: 'Prednisolone 5mg', form: 'TABLET', stockQty: 150, pricePaise: 400 },
    { id: 'MED26', name: 'Montelukast 10mg', form: 'TABLET', stockQty: 200, pricePaise: 800 },
    { id: 'MED27', name: 'Vitamin D3 60000IU', form: 'CAPSULE', stockQty: 100, pricePaise: 3000 },
    { id: 'MED28', name: 'Iron + Folic Acid', form: 'TABLET', stockQty: 5, pricePaise: 300, reorderLevel: 50 },
    { id: 'MED29', name: 'Tramadol 50mg', form: 'CAPSULE', stockQty: 0, pricePaise: 1000, reorderLevel: 20 },
    { id: 'MED30', name: 'Gabapentin 300mg', form: 'CAPSULE', stockQty: 3, pricePaise: 1200, reorderLevel: 20 },
  ];

  for (const med of medicinesData) {
    await prisma.medicine.upsert({
      where: { id: med.id },
      update: med,
      create: med,
    });
  }

  // 7. Patients
  const names = [
    'Rajesh Mehta', 'Sunita Devi', 'Mohammed Arif', 'Lakshmi Narayanan', 'Arjun Singh',
    'Pooja Kumari', 'Ramesh Chandra', 'Kavita Iyer', 'Vikram Desai', 'Neha Gupta',
    'Amit Patel', 'Sneha Sharma', 'Suresh Kumar', 'Anjali Verma', 'Rahul Joshi',
    'Priya Nair', 'Rajiv Menon', 'Meena Reddy', 'Ravi Pillai', 'Geeta Bhatt',
    'Deepak Tiwari', 'Kiran Agarwal', 'Sanjay Yadav', 'Anita Mistry', 'Vijay Rao',
    'Swati Chauhan', 'Manoj Pandey', 'Rekha Das', 'Ashok Sengupta', 'Manju Kaur',
    'Tarun Chawla', 'Seema Kapoor', 'Rakesh Sinha', 'Aarti Khatri', 'Sandeep Ahuja',
    'Nisha Goyal', 'Gaurav Jain', 'Shalini Malhotra', 'Baby Sharma', 'Unknown Male ~40y'
  ];

  const patientsData = names.map((name, i) => {
    const isUnidentified = i >= 38;
    return {
      uhid: `P${(i + 1).toString().padStart(5, '0')}`,
      name,
      ageYears: isUnidentified ? (i === 38 ? 0 : 40) : 20 + (i % 50),
      gender: ['MALE', 'FEMALE', 'MALE', 'FEMALE', 'MALE'][i % 5] || 'MALE',
      phone: isUnidentified ? null : `98765432${(10 + i).toString().slice(-2)}`,
      allergies: i === 3 ? JSON.stringify(['Penicillin']) : i === 5 ? JSON.stringify(['Sulfa drugs']) : i === 6 ? JSON.stringify(['Aspirin', 'Ibuprofen']) : '[]',
      isUnidentified
    };
  });

  for (const p of patientsData) {
    await prisma.patient.upsert({
      where: { uhid: p.uhid },
      update: p,
      create: p,
    });
  }

  const users = await prisma.user.findMany();
  const reception = users.find(u => u.role === 'RECEPTIONIST')!;
  const doc1 = users.find(u => u.email === 'doctor1@hospital.flow')!;
  const doc2 = users.find(u => u.email === 'doctor2@hospital.flow')!;
  
  // 8. Visits & Flow
  // For the sake of simplicity and idempotency, we will create visits using fixed visitNo
  const visitScenarios: any[] = [
    // 5 WAITING in General OPD
    ...Array.from({ length: 5 }).map((_, i) => ({ patientIndex: i, dept: 'GENERAL_OPD', stage: 'WAITING_FOR_DOCTOR', queueStatus: 'WAITING', doc: doc1 })),
    // 2 WAITING in Emergency (1 UNASSESSED)
    { patientIndex: 5, dept: 'EMERGENCY', stage: 'TRIAGE', queueStatus: 'WAITING', doc: doc1, priority: 'UNASSESSED' },
    { patientIndex: 6, dept: 'EMERGENCY', stage: 'WAITING_FOR_DOCTOR', queueStatus: 'WAITING', doc: doc1, priority: 'URGENT' },
    // 2 IN_CONSULTATION doc1
    { patientIndex: 7, dept: 'GENERAL_OPD', stage: 'IN_CONSULTATION', queueStatus: 'IN_CONSULTATION', doc: doc1 },
    { patientIndex: 8, dept: 'GENERAL_OPD', stage: 'IN_CONSULTATION', queueStatus: 'IN_CONSULTATION', doc: doc1 },
    // 1 IN_CONSULTATION doc2
    { patientIndex: 9, dept: 'CARDIOLOGY', stage: 'IN_CONSULTATION', queueStatus: 'IN_CONSULTATION', doc: doc2 },
    // 2 INVESTIGATIONS_PENDING
    { patientIndex: 10, dept: 'GENERAL_OPD', stage: 'INVESTIGATIONS_PENDING', queueStatus: 'SKIPPED', doc: doc1, hasLab: true },
    { patientIndex: 11, dept: 'CARDIOLOGY', stage: 'INVESTIGATIONS_PENDING', queueStatus: 'SKIPPED', doc: doc2, hasLab: true },
    // 1 REVIEW_PENDING
    { patientIndex: 12, dept: 'GENERAL_OPD', stage: 'REVIEW_PENDING', queueStatus: 'WAITING', doc: doc1, hasLab: true, reviewNeeded: true },
    // 2 PHARMACY_PENDING
    { patientIndex: 13, dept: 'GENERAL_OPD', stage: 'PHARMACY_PENDING', queueStatus: 'COMPLETED', doc: doc1, hasRx: true },
    { patientIndex: 14, dept: 'CARDIOLOGY', stage: 'PHARMACY_PENDING', queueStatus: 'COMPLETED', doc: doc2, hasRx: true },
    // 1 ADMISSION_PENDING
    { patientIndex: 15, dept: 'EMERGENCY', stage: 'ADMISSION_PENDING', queueStatus: 'COMPLETED', doc: doc1, hasAdmission: true, admStatus: 'REQUESTED' },
    // 1 ADMITTED
    { patientIndex: 16, dept: 'GENERAL_OPD', stage: 'ADMITTED', queueStatus: 'COMPLETED', doc: doc2, hasAdmission: true, admStatus: 'ADMITTED' },
    // 2 BILLING_PENDING
    { patientIndex: 17, dept: 'GENERAL_OPD', stage: 'BILLING_PENDING', queueStatus: 'COMPLETED', doc: doc1, hasInvoice: true },
    { patientIndex: 18, dept: 'GENERAL_OPD', stage: 'BILLING_PENDING', queueStatus: 'COMPLETED', doc: doc1, hasInvoice: true },
    // 1 READY_FOR_DISCHARGE
    { patientIndex: 19, dept: 'GENERAL_OPD', stage: 'READY_FOR_DISCHARGE', queueStatus: 'COMPLETED', doc: doc1, isDischarging: true },
    // 5 COMPLETED
    ...Array.from({ length: 5 }).map((_, i) => ({ patientIndex: 20 + i, dept: 'GENERAL_OPD', stage: 'COMPLETED', queueStatus: 'COMPLETED', doc: doc1, isCompleted: true })),
  ];

  const patients = await prisma.patient.findMany({ orderBy: { uhid: 'asc' } });
  
  // Clean up existing visit-related data to make seed rerun safe
  // We can just wipe visits generated by seed by deleting today's visits? Actually, upserts or find-first are safer.
  // Instead of deleting, we will use check and create
  
  const todayDateStr = '20261005';
  
  let seq = 1;
  for (const s of visitScenarios) {
    const patient = patients[s.patientIndex];
    const visitNo = `V-${todayDateStr}-${seq.toString().padStart(3, '0')}`;
    seq++;

    const existingVisit = await prisma.visit.findUnique({ where: { visitNo } });
    if (existingVisit) continue; // Skip if already created

    const department = getDept(s.dept);
    const tokenNumber = `${department.tokenPrefix}-${seq.toString().padStart(3, '0')}`;

    const visit = await prisma.visit.create({
      data: {
        visitNo,
        patientId: patient.id,
        departmentId: department.id,
        type: s.dept === 'EMERGENCY' ? 'EMERGENCY' : 'OPD',
        priority: s.priority || 'NORMAL',
        stage: s.stage,
        status: s.isCompleted ? 'COMPLETED' : 'OPEN',
        tokenNumber,
        registeredById: reception.id,
        needsDoctorReview: s.reviewNeeded || false,
      }
    });

    await prisma.queueEntry.create({
      data: {
        visitId: visit.id,
        departmentId: department.id,
        status: s.queueStatus,
        priority: visit.priority,
      }
    });

    await prisma.flowEvent.create({
      data: {
        visitId: visit.id,
        type: 'STAGE_CHANGE',
        stage: s.stage,
        actorId: reception.id,
        actorName: reception.name,
      }
    });

    if (['IN_CONSULTATION', 'INVESTIGATIONS_PENDING', 'REVIEW_PENDING', 'PHARMACY_PENDING', 'ADMISSION_PENDING', 'ADMITTED', 'BILLING_PENDING', 'READY_FOR_DISCHARGE', 'COMPLETED'].includes(s.stage)) {
      await prisma.consultation.create({
        data: {
          visitId: visit.id,
          doctorId: s.doc.id,
          notes: 'Patient presented with typical symptoms.',
          status: s.isCompleted ? 'COMPLETED' : 'DRAFT',
        }
      });
      await prisma.vitalSigns.create({
        data: {
          visitId: visit.id,
          recordedById: reception.id,
          bp: '120/80',
          pulse: 75,
          tempC: 37,
        }
      });
    }

    if (s.hasLab) {
      const cbc = await prisma.labTest.findUnique({ where: { code: 'CBC' } });
      if (cbc) {
        await prisma.labOrder.create({
          data: {
            visitId: visit.id,
            labTestId: cbc.id,
            orderedById: s.doc.id,
            priority: 'NORMAL',
            status: s.reviewNeeded ? 'RESULT_ENTERED' : 'ORDERED',
            result: s.reviewNeeded ? JSON.stringify({ Hemoglobin: '13.5 g/dL', WBC: '7200 /μL', Platelets: '250000 /μL', RBC: '4.8 million/μL' }) : null,
          }
        });
      }
    }

    if (s.hasRx) {
      await prisma.prescription.create({
        data: {
          visitId: visit.id,
          prescribedById: s.doc.id,
          status: 'PENDING',
          items: {
            create: [
              {
                medicineId: 'MED01',
                medicineName: 'Paracetamol 500mg',
                dose: '500mg',
                frequency: 'BID',
                durationDays: 5,
                quantity: 10,
                status: 'PENDING',
              }
            ]
          }
        }
      });
    }

    if (s.hasAdmission) {
      await prisma.admission.create({
        data: {
          visitId: visit.id,
          requestedById: s.doc.id,
          reason: 'Observation',
          status: s.admStatus!,
          bedId: s.admStatus === 'ADMITTED' ? (await prisma.bed.findFirst({ where: { status: 'AVAILABLE' } }))?.id : null,
        }
      });
    }

    if (s.hasInvoice) {
      const iv = await prisma.invoice.create({
        data: {
          visitId: visit.id,
          status: 'PENDING',
          subtotalPaise: 50000,
          totalPaise: 50000,
        }
      });
      await prisma.invoiceItem.create({
        data: {
          invoiceId: iv.id,
          category: 'CONSULTATION',
          description: 'OPD Consultation Fee',
          quantity: 1,
          unitPricePaise: 50000,
          totalPaise: 50000,
        }
      });
    }
  }

  // Generate TokenCounters based on the above
  const deptsCounter: Record<string, any> = {};
  for (const d of depts) {
    deptsCounter[d.id] = { departmentId: d.id, date: todayDateStr, lastSeq: 0 };
  }
  for (const s of visitScenarios) {
    const dept = getDept(s.dept);
    deptsCounter[dept.id].lastSeq += 1;
  }
  
  for (const dId of Object.keys(deptsCounter)) {
    const data = deptsCounter[dId];
    await prisma.tokenCounter.upsert({
      where: { departmentId_date: { departmentId: data.departmentId, date: data.date } },
      update: { lastSeq: data.lastSeq },
      create: data,
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
