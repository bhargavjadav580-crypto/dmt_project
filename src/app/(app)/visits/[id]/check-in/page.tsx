import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { CheckInClient } from './check-in-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CheckInPage({ params }: PageProps) {
  const { id } = await params;

  const visit = await db.visit.findUnique({
    where: { id },
    include: {
      patient: true,
      department: true,
    },
  });

  if (!visit) {
    notFound();
  }

  return (
    <CheckInClient
      visit={{
        id: visit.id,
        visitNo: visit.visitNo,
        stage: visit.stage,
        priority: visit.priority,
        tokenNumber: visit.tokenNumber,
        reasonForVisit: visit.reasonForVisit,
        departmentName: visit.department.name,
        departmentCode: visit.department.code,
        patient: {
          id: visit.patient.id,
          name: visit.patient.name,
          uhid: visit.patient.uhid,
          ageYears: visit.patient.ageYears,
          gender: visit.patient.gender,
          phone: visit.patient.phone,
          allergies: JSON.parse(visit.patient.allergies || '[]'),
        },
      }}
    />
  );
}
