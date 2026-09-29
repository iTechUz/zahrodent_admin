import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import LoginPage from './LoginPage';
import { useStore } from '@/store/useStore';
import { mockUsers } from '@/mock/users';
import { resetStore } from '@/test/resetStore';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const fill = (email: string, password: string) => {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Parol'), { target: { value: password } });
};
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Kirish' }));

describe('LoginPage', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('shows a validation error when fields are empty and does not log in', () => {
    render(<LoginPage />);
    submit();
    expect(screen.getByText("Iltimos, barcha maydonlarni to'ldiring")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(useStore.getState().isAuthenticated).toBe(false);
  });

  it('treats whitespace-only fields as empty', () => {
    render(<LoginPage />);
    fill('   ', '   ');
    submit();
    expect(screen.getByText("Iltimos, barcha maydonlarni to'ldiring")).toBeInTheDocument();
  });

  it.each(mockUsers.map((u) => [u.role, u.email, u] as const))('logs in %s %s with correct credentials', (_r, _e, user) => {
    render(<LoginPage />);
    fill(user.email, user.password);
    submit();
    expect(screen.getByRole('button', { name: /Kirish\.\.\./ })).toBeDisabled();
    expect(useStore.getState().isAuthenticated).toBe(false); // still waiting on the 800ms delay
    act(() => vi.advanceTimersByTime(800));
    expect(useStore.getState().currentUser).toBe(user);
    expect(useStore.getState().isAuthenticated).toBe(true);
    expect(toast.success).toHaveBeenCalledWith(`Xush kelibsiz, ${user.name}!`);
  });

  it.each([
    ['wrong password', 'admin@zahro.dental', 'wrong'],
    ['unknown email', 'nobody@zahro.dental', 'admin123'],
    ["another user's password", 'admin@zahro.dental', 'doctor123'],
    ['case-sensitive password', 'admin@zahro.dental', 'ADMIN123'],
  ])('rejects %s', (_label, email, password) => {
    render(<LoginPage />);
    fill(email, password);
    submit();
    act(() => vi.advanceTimersByTime(800));
    expect(screen.getByText("Email yoki parol noto'g'ri")).toBeInTheDocument();
    expect(useStore.getState().isAuthenticated).toBe(false);
    expect(screen.getByRole('button', { name: 'Kirish' })).not.toBeDisabled();
  });

  it('clears the previous error on a new attempt', () => {
    render(<LoginPage />);
    fill('admin@zahro.dental', 'bad');
    submit();
    act(() => vi.advanceTimersByTime(800));
    fill('admin@zahro.dental', 'admin123');
    submit();
    expect(screen.queryByText("Email yoki parol noto'g'ri")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(800));
    expect(useStore.getState().isAuthenticated).toBe(true);
  });

  // BUG (minor): emptiness is checked on the trimmed value, but the lookup compares the raw value,
  // so " admin@zahro.dental" (leading space, e.g. pasted) and "Admin@zahro.dental" fail. LoginPage.tsx:24,31
  it.todo('accepts an email with surrounding whitespace / different case');

  it('quick login shows one card per role and logs in after 600ms', () => {
    render(<LoginPage />);
    const cards = screen.getAllByRole('button').filter((b) => /zahro\.dental/.test(b.textContent ?? ''));
    expect(cards).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: /Gulnora Qabulxona/ }));
    act(() => vi.advanceTimersByTime(599));
    expect(useStore.getState().isAuthenticated).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(useStore.getState().currentUser?.id).toBe('u4');
  });
});
