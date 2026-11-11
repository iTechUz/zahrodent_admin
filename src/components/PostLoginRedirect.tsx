import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clearReturnPath, peekReturnPath, safeReturnPath } from '@/lib/api/return-to';

/**
 * Rendered instead of the login page once authenticated: back to the page the user was on
 * (route state from ProtectedRoute, or the path saved when the session expired), else the dashboard.
 * Only same-origin relative paths are honoured. ProtectedRoute still enforces the role's access afterwards.
 */
export function PostLoginRedirect() {
  const location = useLocation();
  const target = safeReturnPath((location.state as { from?: unknown } | null)?.from) ?? peekReturnPath() ?? '/';
  useEffect(() => clearReturnPath(), []);
  return <Navigate to={target} replace />;
}
