import { db } from '@/lib/db';

export async function getHospitalOverview() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    patientsToday,
    waiting,
    inConsultation,
    emergency,
    admitted,
    bedsAvailable,
    readyForDischarge
  ] = await Promise.all([
    db.visit.count({ where: { createdAt: { gte: today } } }),
    db.queueEntry.count({ where: { status: 'WAITING' } }),
    db.visit.count({ where: { stage: 'IN_CONSULTATION' } }),
    db.visit.count({ where: { type: 'EMERGENCY', status: 'OPEN' } }),
    db.admission.count({ where: { status: 'ADMITTED' } }),
    db.bed.count({ where: { status: 'AVAILABLE' } }),
    db.visit.count({ where: { stage: 'READY_FOR_DISCHARGE' } }),
  ]);

  return { patientsToday, waiting, inConsultation, emergency, admitted, bedsAvailable, readyForDischarge };
}

export async function getDepartmentStatus() {
  const departments = await db.department.findMany({
    where: { isActive: true },
  });

  const statuses = await Promise.all(
    departments.map(async (dept) => {
      const patientCount = await db.queueEntry.count({
        where: { departmentId: dept.id, status: { in: ['WAITING', 'CALLED', 'IN_CONSULTATION'] } },
      });
      const status = patientCount > 8 ? 'High Load' : patientCount > 3 ? 'Busy' : 'Normal';
      return {
        ...dept,
        patientCount,
        avgWaitMinutes: 18,
        status,
      };
    })
  );
  return statuses;
}

export async function getBottleneckAnalytics() {
  return {
    registrationToConsultation: 25, // minutes
    consultationToLab: 12,
    labTurnaround: 35,
    pharmacyWait: 8,
    yesterdayComparison: {
      registrationToConsultation: -3,
      labTurnaround: -5,
      pharmacyWait: 1,
    }
  };
}

export async function getRecentActivity(limit: number = 20) {
  return db.flowEvent.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      visit: {
        include: { patient: true, department: true }
      },
      actor: true,
    }
  });
}

export async function getAuditLog(filters?: { actorId?: string; entityType?: string; action?: string }) {
  const where: any = {};
  if (filters?.actorId) where.actorId = filters.actorId;
  if (filters?.entityType) where.entityType = filters.entityType;
  if (filters?.action) where.action = filters.action;

  return db.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function getUsers() {
  return db.user.findMany({
    where: { deletedAt: null },
    include: { department: true },
    orderBy: { name: 'asc' },
  });
}

export async function updateUserRole(userId: string, role: string) {
  return db.user.update({
    where: { id: userId },
    data: { role },
  });
}

export async function getSettings() {
  return db.setting.findMany();
}

export async function updateSetting(key: string, value: any) {
  const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
  return db.setting.upsert({
    where: { key },
    update: { value: jsonValue },
    create: { key, value: jsonValue },
  });
}
