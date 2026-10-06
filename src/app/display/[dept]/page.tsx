import React from 'react';
import { db } from '@/lib/db';
import { DisplayClient } from './display-client';

export const dynamic = 'force-dynamic';

export default async function DisplayPage({
  params,
}: {
  params: Promise<{ dept: string }>;
}) {
  const { dept } = await params;

  const department = await db.department.findFirst({
    where: {
      OR: [
        { id: dept },
        { code: dept.toUpperCase() },
      ],
      isActive: true,
    },
  });

  let initialData = null;

  if (department) {
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

    initialData = {
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
            calledAt: (nowServingEntry.calledAt || nowServingEntry.updatedAt).toISOString(),
            counter: nowServingEntry.calledBy?.name || 'Counter 1',
          }
        : null,
      nextTokens,
      timestamp: new Date().toISOString(),
    };
  }

  return (
    <DisplayClient 
      deptCode={dept} 
      initialData={initialData} 
    />
  );
}
