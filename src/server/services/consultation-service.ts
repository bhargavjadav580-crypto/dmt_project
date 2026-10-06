import { db } from '@/lib/db';

export async function startConsultation(visitId: string, doctorId: string) {
  return db.$transaction(async (tx) => {
    let consultation = await tx.consultation.findUnique({
      where: { visitId }
    });

    if (!consultation) {
      consultation = await tx.consultation.create({
        data: {
          visitId,
          doctorId,
          status: 'DRAFT',
        }
      });
    }

    await tx.visit.update({
      where: { id: visitId },
      data: { stage: 'IN_CONSULTATION' }
    });

    return consultation;
  });
}

export async function saveDraft(
  consultationId: string,
  data: { notes?: string; diagnosis?: string; icd10Code?: string; reason?: string }
) {
  return db.consultation.update({
    where: { id: consultationId },
    data,
  });
}

export async function completeConsultation(consultationId: string, doctorId: string) {
  return db.consultation.update({
    where: { id: consultationId },
    data: {
      status: 'COMPLETED',
      endedAt: new Date()
    }
  });
}

export async function addAddendum(consultationId: string, doctorId: string, notes: string) {
  return db.consultationAddendum.create({
    data: {
      consultationId,
      addedById: doctorId,
      notes,
    }
  });
}

export async function getConsultation(visitId: string) {
  return db.consultation.findUnique({
    where: { visitId },
    include: {
      addenda: {
        include: { addedBy: true },
        orderBy: { createdAt: 'desc' },
      },
      doctor: true,
    }
  });
}
