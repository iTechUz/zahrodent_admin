import { useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { can as canRole, type Permission } from '@/shared/config/roles';

/** `const can = useCan(); can('services.create')` — role-based UI gating (see shared/config/roles.ts). */
export function useCan() {
  const role = useStore((s) => s.currentUser?.role);
  return useCallback((action: Permission) => canRole(role, action), [role]);
}
