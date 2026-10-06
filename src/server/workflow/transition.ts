import db from '@/lib/db';
import { VisitStage, Role } from '@/lib/types';

export class ConflictError extends Error {
  constructor(message = 'Version mismatch: The record has been modified by another user.') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class TransitionError extends Error {
  code: string;
  messageKey: string;

  constructor(code: string, messageKey: string) {
    super(messageKey);
    this.name = 'TransitionError';
    this.code = code;
    this.messageKey = messageKey;
  }
}

type AllowedTransitions = {
  [key in VisitStage]?: {
    [target in VisitStage]?: Role[];
  };
};

export const transitionTable: AllowedTransitions = {
  [VisitStage.REGISTERED]: {
    [VisitStage.CHECKED_IN]: [Role.RECEPTIONIST, Role.ADMIN],
    [VisitStage.WAITING]: [Role.RECEPTIONIST, Role.NURSE, Role.ADMIN],
    [VisitStage.CANCELLED]: [Role.RECEPTIONIST, Role.ADMIN],
  },
  [VisitStage.CHECKED_IN]: {
    [VisitStage.WAITING]: [Role.RECEPTIONIST, Role.NURSE, Role.ADMIN],
    [VisitStage.CANCELLED]: [Role.RECEPTIONIST, Role.ADMIN],
  },
  [VisitStage.WAITING]: {
    [VisitStage.IN_CONSULTATION]: [Role.DOCTOR],
  },
  [VisitStage.IN_CONSULTATION]: {
    [VisitStage.INVESTIGATIONS_PENDING]: [Role.DOCTOR],
    [VisitStage.PHARMACY_PENDING]: [Role.DOCTOR],
    [VisitStage.BILLING_PENDING]: [Role.DOCTOR],
    [VisitStage.REFERRED]: [Role.DOCTOR],
    [VisitStage.ADMISSION_PENDING]: [Role.DOCTOR],
    [VisitStage.READY_FOR_DISCHARGE]: [Role.DOCTOR],
    [VisitStage.COMPLETED]: [Role.DOCTOR],
  },
  [VisitStage.INVESTIGATIONS_PENDING]: {
    [VisitStage.REVIEW_PENDING]: [], // system/auto transition
    [VisitStage.IN_CONSULTATION]: [Role.DOCTOR],
  },
  [VisitStage.REVIEW_PENDING]: {
    [VisitStage.IN_CONSULTATION]: [Role.DOCTOR],
    [VisitStage.PHARMACY_PENDING]: [Role.DOCTOR],
    [VisitStage.BILLING_PENDING]: [Role.DOCTOR],
    [VisitStage.REFERRED]: [Role.DOCTOR],
    [VisitStage.ADMISSION_PENDING]: [Role.DOCTOR],
    [VisitStage.READY_FOR_DISCHARGE]: [Role.DOCTOR],
  },
  [VisitStage.PHARMACY_PENDING]: {
    [VisitStage.BILLING_PENDING]: [Role.DOCTOR, Role.PHARMACIST],
    [VisitStage.READY_FOR_DISCHARGE]: [Role.DOCTOR],
  },
  [VisitStage.REFERRED]: {
    [VisitStage.WAITING]: [Role.RECEPTIONIST, Role.NURSE], // receiving dept
  },
  [VisitStage.ADMISSION_PENDING]: {
    [VisitStage.ADMITTED]: [Role.ADMISSION_STAFF],
  },
  [VisitStage.ADMITTED]: {
    [VisitStage.BILLING_PENDING]: [Role.DOCTOR],
    [VisitStage.READY_FOR_DISCHARGE]: [Role.DOCTOR],
  },
  [VisitStage.BILLING_PENDING]: {
    [VisitStage.READY_FOR_DISCHARGE]: [Role.BILLING_STAFF],
  },
  [VisitStage.READY_FOR_DISCHARGE]: {
    [VisitStage.COMPLETED]: [Role.DOCTOR, Role.ADMISSION_STAFF],
  },
  [VisitStage.COMPLETED]: {},
  [VisitStage.CANCELLED]: {},
};

export async function transitionVisit(
  visitId: string,
  targetStage: VisitStage,
  actorId: string,
  actorRole: Role,
  metadata?: any,
  currentVersion?: number
) {
  // Assuming a generic db client that supports transactions
  return await db.$transaction(async (tx: any) => {
    // 1. Fetch visit with version lock
    const visit = await tx.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new TransitionError('NOT_FOUND', 'Visit not found');
    }

    if (currentVersion !== undefined && visit.version !== currentVersion) {
      throw new ConflictError();
    }

    const currentStage = visit.stage as VisitStage;

    // 2. Check transition validity and role
    const allowedTargets = transitionTable[currentStage];
    if (!allowedTargets || !(targetStage in allowedTargets)) {
      throw new TransitionError('INVALID_TRANSITION', `Cannot transition from ${currentStage} to ${targetStage}`);
    }

    const allowedRoles = allowedTargets[targetStage];
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(actorRole)) {
      throw new TransitionError('UNAUTHORIZED', `Role ${actorRole} is not authorized for this transition`);
    }

    // 3. Guards (e.g. discharge guard would be evaluated here if transitioning to COMPLETED or READY_FOR_DISCHARGE)
    // Could import checkDischargeReadiness here, but keeping pure structure for now

    // 4. Update visit
    const updatedVisit = await tx.visit.update({
      where: {
        id: visitId,
        version: visit.version, // optimistic concurrency
      },
      data: {
        stage: targetStage,
        version: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
    });

    // 5. Write FlowEvent
    const actor = await tx.user.findUnique({ where: { id: actorId } });
    await tx.flowEvent.create({
      data: {
        visitId,
        type: 'STAGE_CHANGE',
        stage: targetStage,
        actorId,
        actorName: actor?.name || actorRole,
        metadata: JSON.stringify(metadata || { fromStage: currentStage, toStage: targetStage }),
      },
    });

    // 6. Notifications could be triggered here or returned to caller
    return updatedVisit;
  });
}
