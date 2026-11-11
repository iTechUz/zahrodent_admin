import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { UserRole } from '@/shared/types/auth';
import { useStore } from '@/store/useStore';
import { loginAs } from '@/test/utils';
import { ProtectedRoute } from './ProtectedRoute';

function LoginProbe() {
  const state = useLocation().state as { from?: string } | null;
  return <div>LOGIN {state?.from}</div>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginProbe />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>DASHBOARD</div>} />
          <Route path="/patients" element={<div>PATIENTS</div>} />
          <Route path="/patients/:id" element={<div>PATIENT PROFILE</div>} />
          <Route path="/doctors/:id" element={<div>DOCTOR DETAILS</div>} />
          <Route path="/finance" element={<div>FINANCE</div>} />
          <Route path="/users" element={<div>USERS</div>} />
          <Route path="/leads" element={<div>LEADS</div>} />
          <Route path="/pharmacy" element={<div>PHARMACY</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => loginAs(null));

  it('redirects anonymous users to /login', () => {
    loginAs(null);
    renderAt('/patients');
    expect(screen.getByText(/^LOGIN/)).toBeInTheDocument();
  });

  it('remembers the requested page (path + query) for the return after login', () => {
    renderAt('/patients/p1?tab=history');
    expect(screen.getByText('LOGIN /patients/p1?tab=history')).toBeInTheDocument();
  });

  it('redirects to /login when authenticated flag is set but the user is missing', () => {
    loginAs('admin');
    useStore.setState({ currentUser: null });
    renderAt('/');
    expect(screen.getByText(/^LOGIN/)).toBeInTheDocument();
  });

  it.each<[UserRole, string, string]>([
    ['admin', '/finance', 'FINANCE'],
    ['admin', '/users', 'USERS'],
    ['admin', '/doctors/d1', 'DOCTOR DETAILS'],
    ['doctor', '/patients', 'PATIENTS'],
    ['doctor', '/patients/p1', 'PATIENT PROFILE'],
    ['receptionist', '/leads', 'LEADS'],
    ['pharmacist', '/pharmacy', 'PHARMACY'],
    ['pharmacist', '/', 'PHARMACY'],
    ['admin', '/pharmacy', 'PHARMACY'],
  ])('%s may open %s', (role, path, text) => {
    loginAs(role);
    renderAt(path);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it.each<[UserRole, string]>([
    ['doctor', '/finance'],
    ['doctor', '/leads'],
    ['doctor', '/doctors/d1'],
    ['receptionist', '/finance'],
    ['receptionist', '/users'],
    ['receptionist', '/pharmacy'],
  ])('%s is sent to the dashboard from %s', (role, path) => {
    loginAs(role);
    renderAt(path);
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();
  });
});
