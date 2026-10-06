import { db } from '@/lib/db';
import { checkDischargeReadiness } from '@/server/workflow/discharge-guard';

export async function getDischargeReadiness(visitId: string) {
  return checkDischargeReadiness(visitId);
}

export async function clinicalSignOff(
  visitId: string,
  doctorId: string,
  summary: string,
  followUpAt?: Date | null,
  followUpDoctorId?: string | null
) {
  return db.$transaction(async (tx) => {
    const record = await tx.dischargeRecord.upsert({
      where: { visitId },
      update: {
        summary,
        clinicalSignOffById: doctorId,
        clinicalSignOffAt: new Date(),
        followUpAt: followUpAt || null,
        followUpDoctorId: followUpDoctorId || null,
      },
      create: {
        visitId,
        summary,
        clinicalSignOffById: doctorId,
        clinicalSignOffAt: new Date(),
        followUpAt: followUpAt || null,
        followUpDoctorId: followUpDoctorId || null,
      },
    });

    await tx.visit.update({
      where: { id: visitId },
      data: { stage: 'READY_FOR_DISCHARGE' },
    });

    const actor = await tx.user.findUnique({ where: { id: doctorId } });
    await tx.flowEvent.create({
      data: {
        visitId,
        type: 'DISCHARGE',
        stage: 'READY_FOR_DISCHARGE',
        actorId: doctorId,
        actorName: actor?.name || 'Doctor',
        metadata: JSON.stringify({ action: 'CLINICAL_SIGN_OFF' }),
      },
    });

    return record;
  });
}

export async function finalizeDischarge(visitId: string, actorId: string) {
  // Hard stop: server-side verification of discharge readiness
  const readiness = await checkDischargeReadiness(visitId);
  if (!readiness.ready) {
    const missing = readiness.checks.filter(c => !c.passed).map(c => c.label).join(', ');
    throw new Error(`Discharge blocked: Incomplete requirements (${missing})`);
  }

  return db.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({ where: { id: actorId } });
    const actorName = actor?.name || 'Staff';

    await tx.dischargeRecord.upsert({
      where: { visitId },
      update: {
        finalizedById: actorId,
        dischargedAt: new Date(),
      },
      create: {
        visitId,
        finalizedById: actorId,
        dischargedAt: new Date(),
      },
    });

    const visit = await tx.visit.update({
      where: { id: visitId },
      data: {
        status: 'COMPLETED',
        stage: 'COMPLETED',
      },
      include: { admission: true },
    });

    await tx.flowEvent.create({
      data: {
        visitId,
        type: 'DISCHARGE',
        stage: 'COMPLETED',
        actorId,
        actorName,
        metadata: JSON.stringify({ action: 'DISCHARGE_FINALIZED' }),
      },
    });

    await tx.queueEntry.updateMany({
      where: { visitId },
      data: { status: 'COMPLETED' },
    });

    if (visit.admission?.bedId) {
      await tx.bed.update({
        where: { id: visit.admission.bedId },
        data: { status: 'CLEANING' },
      });
      
      await tx.admission.update({
        where: { id: visit.admission.id },
        data: { status: 'DISCHARGED', dischargedAt: new Date() },
      });
    }

    return visit;
  });
}

export async function getDischargeRecord(visitId: string) {
  return db.dischargeRecord.findUnique({
    where: { visitId },
    include: {
      clinicalSignOffBy: true,
      finalizedBy: true,
      followUpDoctor: true,
    },
  });
}
