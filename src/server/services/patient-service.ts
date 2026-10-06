import { db } from '@/lib/db';
import { generateUHID } from '@/lib/utils';
import { logAudit } from '@/server/audit';
import { AuditAction } from '@/lib/types';

export interface CreatePatientInput {
  name: string;
  ageYears: number;
  dob?: Date | null;
  gender: string;
  phone?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  allergies?: string[];
  isUnidentified?: boolean;
}

export async function createPatient(data: CreatePatientInput) {
  // Generate UHID atomically by counting existing patients
  const count = await db.patient.count();
  const uhid = generateUHID('P', count + 1);

  const patient = await db.patient.create({
    data: {
      uhid,
      name: data.name,
      ageYears: data.ageYears,
      dob: data.dob || null,
      gender: data.gender,
      phone: data.phone || null,
      address: data.address || null,
      emergencyContactName: data.emergencyContactName || null,
      emergencyContactPhone: data.emergencyContactPhone || null,
      allergies: JSON.stringify(data.allergies || []),
      isUnidentified: data.isUnidentified || false,
    },
  });

  return patient;
}

export async function findDuplicates(name: string, phone?: string | null, ageYears?: number | null) {
  const conditions: any[] = [];

  if (phone && phone.trim().length > 0) {
    conditions.push({ phone: phone.trim() });
  }

  if (name && name.trim().length > 0) {
    // Similar name match
    const nameCondition: any = {
      name: { contains: name.trim() },
    };
    if (ageYears != null) {
      nameCondition.ageYears = {
        gte: Math.max(0, ageYears - 2),
        lte: ageYears + 2,
      };
    }
    conditions.push(nameCondition);
  }

  if (conditions.length === 0) return [];

  return db.patient.findMany({
    where: {
      deletedAt: null,
      OR: conditions,
    },
    take: 5,
  });
}

export async function searchPatients(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  return db.patient.findMany({
    where: {
      deletedAt: null,
      OR: [
        { name: { contains: trimmed } },
        { uhid: { contains: trimmed } },
        { phone: { contains: trimmed } },
        {
          visits: {
            some: {
              tokenNumber: { contains: trimmed },
            },
          },
        },
      ],
    },
    include: {
      visits: {
        where: { status: 'OPEN' },
        include: { department: true },
        take: 1,
      },
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPatientById(id: string) {
  return db.patient.findUnique({
    where: { id, deletedAt: null },
    include: {
      visits: {
        include: {
          department: true,
          consultation: true,
          flowEvents: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
}

export async function getPatientByUhid(uhid: string) {
  return db.patient.findUnique({
    where: { uhid, deletedAt: null },
    include: {
      visits: {
        include: { department: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
}

export async function updatePatient(
  id: string,
  data: Partial<CreatePatientInput>,
  reason: string,
  actorId?: string,
  actorName?: string
) {
  const before = await db.patient.findUnique({ where: { id } });
  if (!before) throw new Error('Patient not found');

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.ageYears !== undefined) updateData.ageYears = data.ageYears;
  if (data.gender !== undefined) updateData.gender = data.gender;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.emergencyContactName !== undefined) updateData.emergencyContactName = data.emergencyContactName;
  if (data.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = data.emergencyContactPhone;
  if (data.allergies !== undefined) updateData.allergies = JSON.stringify(data.allergies);

  const updated = await db.patient.update({
    where: { id },
    data: updateData,
  });

  if (actorId && actorName) {
    await logAudit({
      actorId,
      actorName,
      action: AuditAction.UPDATE,
      entityType: 'Patient',
      entityId: id,
      reason,
      before: JSON.stringify(before),
      after: JSON.stringify(updated),
    });
  }

  return updated;
}
