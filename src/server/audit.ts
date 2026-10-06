import { db } from '@/lib/db';
import { AuditActionType } from '@/lib/types';

export interface AuditLogParams {
  actorId: string;
  actorName: string;
  action: AuditActionType;
  entityType: string;
  entityId: string;
  reason?: string | null;
  before?: string | Record<string, unknown> | null;
  after?: string | Record<string, unknown> | null;
  ip?: string | null;
}

/**
 * Logs an audit event to the database.
 * @param params Audit log parameters.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  const {
    actorId,
    actorName,
    action,
    entityType,
    entityId,
    reason,
    before,
    after,
    ip,
  } = params;

  try {
    const beforeStr = typeof before === 'string' ? before : before ? JSON.stringify(before) : undefined;
    const afterStr = typeof after === 'string' ? after : after ? JSON.stringify(after) : undefined;

    await db.auditLog.create({
      data: {
        actorId,
        actorName,
        action,
        entityType,
        entityId,
        reason: reason || undefined,
        before: beforeStr,
        after: afterStr,
        ip: ip || undefined,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error, params);
  }
}
