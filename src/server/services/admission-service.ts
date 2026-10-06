import { db } from '@/lib/db';

export async function requestAdmission(
  visitId: string,
  reason: string,
  priority: string,
  requestedById: string
) {
  return db.$transaction(async (tx) => {
    const admission = await tx.admission.upsert({
      where: { visitId },
      update: {
        reason,
        priority,
        status: 'REQUESTED',
        requestedById,
      },
      create: {
        visitId,
        reason,
        priority,
        requestedById,
        status: 'REQUESTED',
      },
    });

    await tx.visit.update({
      where: { id: visitId },
      data: { stage: 'ADMISSION_PENDING' },
    });

    const actor = await tx.user.findUnique({ where: { id: requestedById } });
    await tx.flowEvent.create({
      data: {
        visitId,
        type: 'ADMISSION_UPDATE',
        stage: 'ADMISSION_PENDING',
        actorId: requestedById,
        actorName: actor?.name || 'Doctor',
        metadata: JSON.stringify({ action: 'ADMISSION_REQUESTED', reason }),
      },
    });

    return admission;
  });
}

export async function getAdmissionRequests() {
  return db.admission.findMany({
    where: { status: 'REQUESTED' },
    include: {
      visit: {
        include: {
          patient: true,
          department: true,
        },
      },
      requestedBy: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function assignBed(admissionId: string, bedId: string, actorId: string) {
  return db.$transaction(async (tx) => {
    const bed = await tx.bed.findUniqueOrThrow({ where: { id: bedId } });
    if (bed.status !== 'AVAILABLE') throw new Error('Bed is not available');

    await tx.bed.update({
      where: { id: bedId },
      data: { status: 'OCCUPIED' },
    });

    const admission = await tx.admission.update({
      where: { id: admissionId },
      data: { bedId, status: 'BED_ASSIGNED' },
    });

    return admission;
  });
}

export async function admitPatient(admissionId: string, actorId: string) {
  return db.$transaction(async (tx) => {
    const admission = await tx.admission.update({
      where: { id: admissionId },
      data: { status: 'ADMITTED', admittedAt: new Date() },
    });

    await tx.visit.update({
      where: { id: admission.visitId },
      data: { stage: 'ADMITTED' },
    });

    const actor = await tx.user.findUnique({ where: { id: actorId } });
    await tx.flowEvent.create({
      data: {
        visitId: admission.visitId,
        type: 'ADMISSION_UPDATE',
        stage: 'ADMITTED',
        actorId,
        actorName: actor?.name || 'Admission Staff',
        metadata: JSON.stringify({ action: 'PATIENT_ADMITTED', bedId: admission.bedId }),
      },
    });

    return admission;
  });
}

export async function getWards() {
  return db.ward.findMany({
    include: {
      beds: {
        include: {
          admissions: {
            where: { status: 'ADMITTED' },
            include: { visit: { include: { patient: true } } },
          },
        },
      },
    },
  });
}

export async function getBedBoard() {
  return db.ward.findMany({
    include: {
      beds: {
        include: {
          admissions: {
            where: { status: 'ADMITTED' },
            include: { visit: { include: { patient: true } } },
          },
        },
      },
    },
  });
}

export async function dischargeBed(admissionId: string, actorId: string) {
  return db.$transaction(async (tx) => {
    const admission = await tx.admission.update({
      where: { id: admissionId },
      data: { status: 'DISCHARGED', dischargedAt: new Date() },
    });

    if (admission.bedId) {
      await tx.bed.update({
        where: { id: admission.bedId },
        data: { status: 'CLEANING' },
      });
    }

    return admission;
  });
}
