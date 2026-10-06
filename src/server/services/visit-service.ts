import { db } from '@/lib/db';
import { generateVisitNo } from '@/lib/utils';

export async function createVisit(
  patientId: string,
  departmentId: string,
  type: string,
  reasonForVisit: string,
  registeredById: string
) {
  return db.$transaction(async (tx) => {
    // Generate token
    const todayDateStr = new Date().toISOString().split('T')[0];
    
    const counter = await tx.tokenCounter.upsert({
      where: { 
        departmentId_date: { departmentId, date: todayDateStr }
      },
      update: { lastSeq: { increment: 1 } },
      create: { departmentId, date: todayDateStr, lastSeq: 1 }
    });

    const dept = await tx.department.findUniqueOrThrow({ where: { id: departmentId } });
    const actor = await tx.user.findUnique({ where: { id: registeredById } });
    const actorName = actor?.name || 'Reception Staff';
    const tokenNumber = `${dept.tokenPrefix}-${counter.lastSeq.toString().padStart(3, '0')}`;
    const visitNo = generateVisitNo();

    const visit = await tx.visit.create({
      data: {
        visitNo,
        patientId,
        departmentId,
        type,
        priority: type === 'EMERGENCY' ? 'UNASSESSED' : 'NORMAL',
        reasonForVisit,
        status: 'OPEN',
        tokenNumber,
        registeredById,
        stage: 'REGISTERED',
        flowEvents: {
          create: {
            type: 'STAGE_CHANGE',
            stage: 'REGISTERED',
            actorId: registeredById,
            actorName,
            metadata: JSON.stringify({ reasonForVisit }),
          }
        },
        queueEntries: {
          create: {
            departmentId,
            status: 'WAITING',
            priority: type === 'EMERGENCY' ? 'UNASSESSED' : 'NORMAL',
          }
        }
      },
    });

    return visit;
  });
}

export async function getVisitById(id: string) {
  return db.visit.findUnique({
    where: { id },
    include: {
      patient: true,
      department: true,
      registeredBy: true,
      consultation: {
        include: {
          doctor: true,
          addenda: { include: { addedBy: true } },
        },
      },
      labOrders: {
        include: {
          labTest: true,
          orderedBy: true,
          collectedBy: true,
          resultEnteredBy: true,
          reviewedBy: true,
        },
      },
      prescriptions: {
        include: {
          prescribedBy: true,
          items: {
            include: { medicine: true },
          },
        },
      },
      referrals: {
        include: { fromDept: true, toDept: true, createdBy: true },
      },
      admission: {
        include: { bed: { include: { ward: true } }, requestedBy: true },
      },
      invoice: {
        include: { items: true, payments: { include: { receivedBy: true } } },
      },
      flowEvents: { orderBy: { createdAt: 'desc' } },
      vitals: { orderBy: { recordedAt: 'desc' }, include: { recordedBy: true } },
      dischargeRecord: {
        include: { clinicalSignOffBy: true, finalizedBy: true, followUpDoctor: true },
      },
    }
  });
}

export async function getVisitsByPatientId(patientId: string) {
  return db.visit.findMany({
    where: { patientId },
    include: { department: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getActiveVisits(departmentId?: string) {
  const where: any = { status: 'OPEN' };
  if (departmentId) where.departmentId = departmentId;

  return db.visit.findMany({
    where,
    include: {
      patient: true,
      department: true,
      queueEntries: {
        where: { status: { in: ['WAITING', 'CALLED', 'IN_CONSULTATION'] } },
        orderBy: { enteredAt: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getVisitStats(departmentId?: string) {
  const baseWhere: any = {};
  if (departmentId) baseWhere.departmentId = departmentId;

  const today = new Date();
  today.setHours(0,0,0,0);

  const [waiting, inConsultation, completedToday, emergency] = await Promise.all([
    db.queueEntry.count({ where: { ...baseWhere, status: 'WAITING' } }),
    db.queueEntry.count({ where: { ...baseWhere, status: 'IN_CONSULTATION' } }),
    db.visit.count({ where: { ...baseWhere, status: 'COMPLETED', createdAt: { gte: today } } }),
    db.visit.count({ where: { ...baseWhere, type: 'EMERGENCY', status: 'OPEN' } })
  ]);

  return { waiting, inConsultation, completedToday, emergency };
}

export async function cancelVisit(visitId: string, actorId: string, reason: string) {
  return db.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({ where: { id: actorId } });
    const actorName = actor?.name || 'Staff';

    const visit = await tx.visit.update({
      where: { id: visitId },
      data: { status: 'CANCELLED', stage: 'CANCELLED' }
    });

    await tx.flowEvent.create({
      data: {
        visitId,
        type: 'STAGE_CHANGE',
        stage: 'CANCELLED',
        actorId,
        actorName,
        metadata: JSON.stringify({ reason }),
      }
    });

    await tx.queueEntry.updateMany({
      where: { visitId },
      data: { status: 'COMPLETED' }
    });

    return visit;
  });
}
