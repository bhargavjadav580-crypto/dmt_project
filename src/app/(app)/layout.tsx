import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppShellClient } from './app-shell-client';
import { db } from '@/lib/db';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch departments for queue switcher / public display links
  const departments = await db.department.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, type: true, tokenPrefix: true },
  });

  return (
    <AppShellClient
      user={{
        id: session.user.id,
        name: session.user.name || 'Hospital Staff',
        email: session.user.email || '',
        role: session.user.role || 'RECEPTIONIST',
        departmentId: session.user.departmentId,
        language: session.user.language || 'en',
      }}
      departments={departments}
    >
      {children}
    </AppShellClient>
  );
}
