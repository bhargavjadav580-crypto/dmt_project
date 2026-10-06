import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dept: string }> }
) {
  try {
    const { dept } = await params;

    // Find department by code or ID
    const department = await db.department.findFirst({
      where: {
        OR: [
          { id: dept },
          { code: dept.toUpperCase() },
        ],
        isActive: true,
      },
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Now Serving
    const nowServingEntry = await db.queueEntry.findFirst({
      where: {
        departmentId: department.id,
        status: { in: ['CALLED', 'IN_CONSULTATION'] },
      },
      include: {
        visit: true,
        calledBy: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Next in line waiting (max 6, no PHI)
    const priorityWeight: Record<string, number> = {
      EMERGENCY: 4,
      URGENT: 3,
      UNASSESSED: 2,
      NORMAL: 1,
    };

    const waitingEntries = await db.queueEntry.findMany({
      where: {
        departmentId: department.id,
        status: 'WAITING',
      },
      include: {
        visit: true,
      },
      orderBy: { enteredAt: 'asc' },
    });

    waitingEntries.sort((a, b) => {
      const wA = priorityWeight[a.priority] || 1;
      const wB = priorityWeight[b.priority] || 1;
      if (wB !== wA) return wB - wA;
      return a.enteredAt.getTime() - b.enteredAt.getTime();
    });

    const nextTokens = waitingEntries.slice(0, 6).map((e) => ({
      tokenNumber: e.visit.tokenNumber,
      priority: e.priority,
    }));

    return NextResponse.json({
      department: {
        id: department.id,
        name: department.name,
        code: department.code,
        tokenPrefix: department.tokenPrefix,
      },
      nowServing: nowServingEntry
        ? {
            tokenNumber: nowServingEntry.visit.tokenNumber,
            status: nowServingEntry.status,
            calledAt: nowServingEntry.calledAt || nowServingEntry.updatedAt,
            counter: nowServingEntry.calledBy?.name || 'Counter 1',
          }
        : null,
      nextTokens,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
