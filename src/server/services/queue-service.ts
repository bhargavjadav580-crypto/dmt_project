import { db } from '@/lib/db';

export async function getQueueByDepartment(departmentId: string) {
  const entries = await db.queueEntry.findMany({
    where: { departmentId, status: { in: ['WAITING', 'CALLED', 'SKIPPED', 'COMPLETED', 'IN_CONSULTATION'] } },
    include: {
      visit: {
        include: {
          patient: true,
          vitals: { orderBy: { recordedAt: 'desc' }, take: 1 },
        }
      },
      calledBy: true,
    },
    orderBy: [
      { priority: 'desc' },
      { enteredAt: 'asc' }
    ]
  });

  return {
    waiting: entries.filter(e => e.status === 'WAITING'),
    called: entries.filter(e => e.status === 'CALLED'),
    skipped: entries.filter(e => e.status === 'SKIPPED'),
    completed: entries.filter(e => e.status === 'COMPLETED'),
    inConsultation: entries.filter(e => e.status === 'IN_CONSULTATION'),
  };
}

export async function callNextPatient(departmentId: string, actorId: string) {
  return db.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({ where: { id: actorId } });
    const actorName = actor?.name || 'Staff';

    // Order: EMERGENCY > URGENT > UNASSESSED > NORMAL, then enteredAt
    // SQLite string ordering: 'URGENT', 'NORMAL', 'EMERGENCY', 'UNASSESSED'
    const entries = await tx.queueEntry.findMany({
      where: { departmentId, status: 'WAITING' },
      orderBy: { enteredAt: 'asc' },
    });

    const priorityWeight: Record<string, number> = {
      EMERGENCY: 4,
      URGENT: 3,
      UNASSESSED: 2,
      NORMAL: 1,
    };

    entries.sort((a, b) => {
      const wA = priorityWeight[a.priority] || 1;
      const wB = priorityWeight[b.priority] || 1;
      if (wB !== wA) return wB - wA;
      return a.enteredAt.getTime() - b.enteredAt.getTime();
    });

    const next = entries[0];
    if (!next) return null;

    const updated = await tx.queueEntry.update({
      where: { id: next.id },
      data: {
        status: 'CALLED',
        calledById: actorId,
        calledAt: new Date(),
        version: { increment: 1 },
      }
    });

    await tx.flowEvent.create({
      data: {
        visitId: next.visitId,
        type: 'QUEUE_ACTION',
        stage: 'CALLED',
        actorId,
        actorName,
        metadata: JSON.stringify({ action: 'CALLED', queueEntryId: next.id }),
      }
    });

    return updated;
  });
}

export async function callSpecificPatient(queueEntryId: string, actorId: string) {
  return db.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({ where: { id: actorId } });
    const actorName = actor?.name || 'Staff';

    const entry = await tx.queueEntry.findUniqueOrThrow({ where: { id: queueEntryId } });
    
    const updated = await tx.queueEntry.update({
      where: { id: queueEntryId },
      data: {
        status: 'CALLED',
        calledById: actorId,
        calledAt: new Date(),
        version: { increment: 1 },
      }
    });

    await tx.flowEvent.create({
      data: {
        visitId: entry.visitId,
        type: 'QUEUE_ACTION',
        stage: 'CALLED',
        actorId,
        actorName,
        metadata: JSON.stringify({ action: 'CALLED', queueEntryId }),
      }
    });

    return updated;
  });
}

export async function skipPatient(queueEntryId: string, actorId: string) {
  return db.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({ where: { id: actorId } });
    const actorName = actor?.name || 'Staff';

    const entry = await tx.queueEntry.findUniqueOrThrow({ where: { id: queueEntryId } });
    
    const updated = await tx.queueEntry.update({
      where: { id: queueEntryId },
      data: {
        status: 'SKIPPED',
        skipCount: { increment: 1 },
        version: { increment: 1 },
      }
    });

    await tx.flowEvent.create({
      data: {
        visitId: entry.visitId,
        type: 'QUEUE_ACTION',
        stage: 'SKIPPED',
        actorId,
        actorName,
        metadata: JSON.stringify({ action: 'SKIPPED', skipCount: entry.skipCount + 1 }),
      }
    });

    return updated;
  });
}

export async function recallPatient(queueEntryId: string, actorId: string) {
  return db.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({ where: { id: actorId } });
    const actorName = actor?.name || 'Staff';

    const entry = await tx.queueEntry.findUniqueOrThrow({ where: { id: queueEntryId } });
    
    const updated = await tx.queueEntry.update({
      where: { id: queueEntryId },
      data: {
        status: 'WAITING',
        version: { increment: 1 },
      }
    });

    await tx.flowEvent.create({
      data: {
        visitId: entry.visitId,
        type: 'QUEUE_ACTION',
        stage: 'WAITING',
        actorId,
        actorName,
        metadata: JSON.stringify({ action: 'RECALLED' }),
      }
    });

    return updated;
  });
}

export async function completeQueueEntry(queueEntryId: string, actorId: string) {
  return db.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({ where: { id: actorId } });
    const actorName = actor?.name || 'Staff';

    const entry = await tx.queueEntry.findUniqueOrThrow({ where: { id: queueEntryId } });
    
    const updated = await tx.queueEntry.update({
      where: { id: queueEntryId },
      data: {
        status: 'COMPLETED',
        version: { increment: 1 },
      }
    });

    await tx.flowEvent.create({
      data: {
        visitId: entry.visitId,
        type: 'QUEUE_ACTION',
        stage: 'COMPLETED',
        actorId,
        actorName,
        metadata: JSON.stringify({ action: 'QUEUE_COMPLETED' }),
      }
    });

    return updated;
  });
}

export async function startConsultation(queueEntryId: string, actorId: string) {
  return db.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({ where: { id: actorId } });
    const actorName = actor?.name || 'Staff';

    const entry = await tx.queueEntry.findUniqueOrThrow({ where: { id: queueEntryId } });
    
    const updated = await tx.queueEntry.update({
      where: { id: queueEntryId },
      data: { status: 'IN_CONSULTATION', version: { increment: 1 } }
    });

    await tx.visit.update({
      where: { id: entry.visitId },
      data: { stage: 'IN_CONSULTATION' }
    });

    await tx.flowEvent.create({
      data: {
        visitId: entry.visitId,
        type: 'STAGE_CHANGE',
        stage: 'IN_CONSULTATION',
        actorId,
        actorName,
        metadata: JSON.stringify({ action: 'START_CONSULTATION' }),
      }
    });

    return updated;
  });
}

export async function getEstimatedWait(departmentId: string): Promise<number | null> {
  const recentCompletions = await db.queueEntry.findMany({
    where: { departmentId, status: 'COMPLETED' },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    select: { enteredAt: true, updatedAt: true }
  });

  if (recentCompletions.length < 3) return null;

  const totalWaitTime = recentCompletions.reduce((acc, curr) => {
    return acc + (curr.updatedAt.getTime() - curr.enteredAt.getTime());
  }, 0);

  return Math.floor((totalWaitTime / recentCompletions.length) / 60000); // Wait in minutes
}

export async function getNowServing(departmentId: string) {
  return db.queueEntry.findFirst({
    where: { departmentId, status: { in: ['CALLED', 'IN_CONSULTATION'] } },
    include: {
      visit: {
        include: { patient: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
}
