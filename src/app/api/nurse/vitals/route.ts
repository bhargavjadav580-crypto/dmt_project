import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logAudit } from '@/server/audit';
import { AuditAction } from '@/lib/types';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { visitId, bp, pulse, tempC, spo2, weightKg, priority } = body;

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Record vital signs
      const vitals = await tx.vitalSigns.create({
        data: {
          visitId,
          recordedById: session.user.id,
          bp,
          pulse,
          tempC,
          spo2,
          weightKg,
        },
      });

      // 2. Update visit priority & advance stage from REGISTERED to WAITING if needed
      const visit = await tx.visit.update({
        where: { id: visitId },
        data: {
          priority,
          stage: 'WAITING',
        },
      });

      // 3. Update queue entry priority
      await tx.queueEntry.updateMany({
        where: { visitId },
        data: { priority },
      });

      // 4. Log FlowEvent
      await tx.flowEvent.create({
        data: {
          visitId,
          type: 'PRIORITY_CHANGE',
          stage: 'WAITING',
          actorId: session.user.id,
          actorName: session.user.name || 'Nurse',
          metadata: JSON.stringify({ priority, bp, pulse, tempC, spo2 }),
        },
      });

      return vitals;
    });

    await logAudit({
      actorId: session.user.id,
      actorName: session.user.name || 'Nurse',
      action: AuditAction.UPDATE,
      entityType: 'Visit',
      entityId: visitId,
      reason: `Recorded vitals and set priority to ${priority}`,
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
