import { db } from '@/lib/db';

export async function orderTests(
  visitId: string,
  testIds: string[],
  orderedById: string,
  priority: string = 'NORMAL'
) {
  return db.$transaction(async (tx) => {
    const orders = await Promise.all(
      testIds.map((testId) =>
        tx.labOrder.create({
          data: {
            visitId,
            labTestId: testId,
            orderedById,
            priority,
            status: 'ORDERED',
          },
        })
      )
    );

    // Update visit stage if currently in consultation or waiting
    await tx.visit.update({
      where: { id: visitId },
      data: { stage: 'INVESTIGATIONS_PENDING' },
    });

    const actor = await tx.user.findUnique({ where: { id: orderedById } });
    await tx.flowEvent.create({
      data: {
        visitId,
        type: 'LAB_UPDATE',
        stage: 'INVESTIGATIONS_PENDING',
        actorId: orderedById,
        actorName: actor?.name || 'Doctor',
        metadata: JSON.stringify({ action: 'TESTS_ORDERED', testCount: testIds.length }),
      },
    });

    return orders;
  });
}

export async function getLabOrders(visitId?: string) {
  return db.labOrder.findMany({
    where: visitId ? { visitId } : undefined,
    include: {
      labTest: true,
      orderedBy: true,
      collectedBy: true,
      resultEnteredBy: true,
      reviewedBy: true,
      visit: { include: { patient: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPendingLabOrders() {
  return db.labOrder.findMany({
    where: { status: { in: ['ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING'] } },
    include: {
      labTest: true,
      orderedBy: true,
      visit: { include: { patient: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getLabOrdersByStatus(status: string) {
  return db.labOrder.findMany({
    where: { status },
    include: {
      labTest: true,
      orderedBy: true,
      visit: { include: { patient: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function collectSample(orderId: string, collectedById: string) {
  return db.labOrder.update({
    where: { id: orderId },
    data: {
      status: 'SAMPLE_COLLECTED',
      collectedById,
      collectedAt: new Date(),
    },
  });
}

export async function startProcessing(orderId: string) {
  return db.labOrder.update({
    where: { id: orderId },
    data: {
      status: 'PROCESSING',
      processedAt: new Date(),
    },
  });
}

export async function enterResult(orderId: string, result: any, enteredById: string) {
  return db.$transaction(async (tx) => {
    const resultJson = typeof result === 'string' ? result : JSON.stringify(result);

    const order = await tx.labOrder.update({
      where: { id: orderId },
      data: {
        status: 'RESULT_ENTERED',
        result: resultJson,
        resultEnteredById: enteredById,
        resultEnteredAt: new Date(),
      },
      include: { visit: true },
    });

    // Check if all lab orders for this visit are now result entered or reviewed
    const pendingCount = await tx.labOrder.count({
      where: {
        visitId: order.visitId,
        status: { in: ['ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING'] },
      },
    });

    if (pendingCount === 0) {
      await tx.visit.update({
        where: { id: order.visitId },
        data: {
          needsDoctorReview: true,
          stage: 'REVIEW_PENDING',
        },
      });

      // Notification to ordering doctor
      await tx.notification.create({
        data: {
          targetUserId: order.orderedById,
          title: 'Lab Results Ready',
          message: `All lab results for visit token ${order.visit.tokenNumber} are ready for review.`,
          type: 'LAB_RESULT',
          priority: 'HIGH',
          link: `/consultation?visitId=${order.visitId}`,
        },
      });
    }

    return order;
  });
}

export async function reviewResult(orderId: string, reviewedById: string) {
  return db.labOrder.update({
    where: { id: orderId },
    data: {
      status: 'REVIEWED',
      reviewedById,
      reviewedAt: new Date(),
    },
  });
}

export async function getLabTestCatalog() {
  return db.labTest.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
}
