import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useStore } from '@/store/useStore';
import { mockUsers, roleAccess, UserRole } from '@/mock/users';
import { resetStore } from '@/test/resetStore';

const Where = () => <div data-testid="where">{useLocation().pathname}</div>;

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<div>login page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="*" element={<Where />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

const loginAs = (role: UserRole) => useStore.getState().login(mockUsers.find((u) => u.role === role)!);

const allPages = roleAccess.admin;

describe('ProtectedRoute', () => {
  beforeEach(resetStore);

  it('redirects anonymous users to /login', () => {
    renderAt('/patients');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('redirects when isAuthenticated is true but currentUser is missing', () => {
    useStore.setState({ isAuthenticated: true, currentUser: null });
    renderAt('/');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  describe.each<UserRole>(['admin', 'doctor', 'receptionist'])('%s', (role) => {
    it.each(allPages)('page %s', (page) => {
      loginAs(role);
      renderAt(page);
      const expected = roleAccess[role].includes(page) ? page : '/';
      expect(screen.getByTestId('where')).toHaveTextContent(expected);
    });
  });

  it('allows nested paths under an allowed base (/patients/p1)', () => {
    loginAs('receptionist');
    renderAt('/patients/p1');
    expect(screen.getByTestId('where')).toHaveTextContent('/patients/p1');
  });

  it('blocks nested paths under a forbidden base (/finance/x)', () => {
    loginAs('doctor');
    renderAt('/finance/x');
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/$/);
  });

  it('redirects unknown paths to /', () => {
    loginAs('admin');
    renderAt('/does-not-exist');
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/$/);
  });
});
