import { auth } from '@/lib/auth';
import { RoleType } from '@/lib/types';
import { hasPermission, CapabilityType } from '@/server/permissions';

export async function getCurrentUser() {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error('Not authenticated');
  }
  
  return session.user;
}

export async function requireRole(allowedRoles: RoleType[]) {
  const user = await getCurrentUser();
  
  if (!allowedRoles.includes(user.role as RoleType)) {
    throw new Error('Unauthorized role');
  }
  
  return user;
}

export async function requirePermission(capability: CapabilityType) {
  const user = await getCurrentUser();
  
  if (!hasPermission(user.role as RoleType, capability)) {
    throw new Error('Insufficient permissions');
  }
  
  return user;
}
