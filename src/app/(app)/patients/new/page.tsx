import { db } from '@/lib/db';
import { RegisterWizardClient } from './register-wizard-client';

export default async function NewPatientPage() {
  const departments = await db.department.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      tokenPrefix: true,
    },
    orderBy: { name: 'asc' },
  });

  return <RegisterWizardClient departments={departments} />;
}
