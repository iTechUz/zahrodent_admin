import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { bookingsApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createWrapper } from '@/test/utils';
import {
  CancelReasonDialog,
  StatusHistoryDialog,
  StatusConfirmDialog,
  canCompleteBooking,
  needsStatusConfirm,
} from './BookingStatusDialogs';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);

beforeEach(() => resetApiMock());

describe('CancelReasonDialog', () => {
  it('passes the typed reason to onConfirm', async () => {
    const onConfirm = vi.fn();
    render(<CancelReasonDialog open onOpenChange={() => {}} onConfirm={onConfirm} />);
    fireEvent.change(screen.getByPlaceholderText('Sabab (majburiy)'), { target: { value: 'Shifokor kasal' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bekor qilish' }));
    expect(onConfirm).toHaveBeenCalledWith('Shifokor kasal');
  });

  it('reason is required', async () => {
    const onConfirm = vi.fn();
    render(<CancelReasonDialog open onOpenChange={() => {}} onConfirm={onConfirm} />);
    const btn = screen.getByRole('button', { name: 'Bekor qilish' });
    expect(btn).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('Sabab (majburiy)'), { target: { value: '   ' } });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe('StatusHistoryDialog', () => {
  it('shows who changed what and why', async () => {
    vi.mocked(bookingsApi.statusLog).mockResolvedValue([
      {
        id: 'l1',
        bookingId: 'b1',
        fromStatus: 'pending',
        toStatus: 'cancelled',
        reason: 'Bemor so‘radi',
        changedByName: 'Admin Aziz',
        createdAt: '2026-11-01T09:00:00Z',
      },
    ]);
    const { wrapper } = createWrapper();
    render(<StatusHistoryDialog bookingId="b1" onClose={() => {}} />, { wrapper });
    await waitFor(() => expect(screen.getByText(/Admin Aziz/)).toBeInTheDocument());
    expect(screen.getByText('Kutilmoqda → Bekor qilingan')).toBeInTheDocument();
    expect(screen.getByText('Sabab: Bemor so‘radi')).toBeInTheDocument();
    expect(bookingsApi.statusLog).toHaveBeenCalledWith('b1');
  });
});

describe('needsStatusConfirm', () => {
  it('asks before completing, marking a no-show, and moving away from completed', () => {
    expect(needsStatusConfirm('pending', 'completed')).toBe(true);
    expect(needsStatusConfirm('arrived', 'no-show')).toBe(true);
    expect(needsStatusConfirm('completed', 'arrived')).toBe(true);
    expect(needsStatusConfirm('completed', 'cancelled')).toBe(false); // has its own reason dialog
  });
  it('does not ask for harmless changes or a no-op', () => {
    expect(needsStatusConfirm('pending', 'confirmed')).toBe(false);
    expect(needsStatusConfirm('confirmed', 'arrived')).toBe(false);
    expect(needsStatusConfirm('completed', 'completed')).toBe(false);
  });
});

describe('canCompleteBooking', () => {
  it('needs a service', () => {
    expect(canCompleteBooking({ serviceId: 's1' })).toBe(true);
    expect(canCompleteBooking({ serviceId: undefined })).toBe(false);
    expect(canCompleteBooking({ serviceId: '' })).toBe(false);
  });
});

describe('StatusConfirmDialog', () => {
  it('shows the question for the change and confirms / cancels', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<StatusConfirmDialog change={{ from: 'arrived', to: 'no-show' }} onCancel={onCancel} onConfirm={onConfirm} />);
    expect(screen.getByText('Bemor kelmadimi?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: "Ha, o'zgartirish" }));
    expect(onConfirm).toHaveBeenCalled();
  });
  it('renders nothing without a pending change', () => {
    render(<StatusConfirmDialog change={null} onCancel={() => {}} onConfirm={() => {}} />);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});
