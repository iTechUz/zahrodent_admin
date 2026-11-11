import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { rememberReturnPath } from '@/lib/api/return-to';
import { PostLoginRedirect } from './PostLoginRedirect';

function renderLogin(state?: unknown) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: '/login', state }]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/login" element={<PostLoginRedirect />} />
        <Route path="/" element={<div>DASHBOARD</div>} />
        <Route path="/patients/:id" element={<div>PATIENT</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PostLoginRedirect', () => {
  beforeEach(() => sessionStorage.clear());

  it('goes to the dashboard by default', () => {
    renderLogin();
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();
  });

  it('returns to the route-state path', () => {
    renderLogin({ from: '/patients/7' });
    expect(screen.getByText('PATIENT')).toBeInTheDocument();
  });

  it('returns to the path saved when the session expired, then forgets it', () => {
    rememberReturnPath('/patients/9');
    renderLogin();
    expect(screen.getByText('PATIENT')).toBeInTheDocument();
    expect(sessionStorage.getItem('zahro_return_to')).toBeNull();
  });

  it.each(['//evil.com', 'https://evil.com', '/\\evil.com'])('ignores the unsafe target %s', (from) => {
    renderLogin({ from });
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();
  });
});
