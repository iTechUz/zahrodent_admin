import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { roleAccess } from '@/mock/users';

export function ProtectedRoute() {
  const { isAuthenticated, currentUser } = useStore();
  const location = useLocation();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  const allowed = roleAccess[currentUser.role];
  const basePath = '/' + location.pathname.split('/')[1];
  if (!allowed.includes(location.pathname) && !allowed.includes(basePath)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
