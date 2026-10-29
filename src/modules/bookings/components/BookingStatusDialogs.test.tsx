import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { bookingsApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createWrapper } from '@/test/utils';
import { CancelReasonDialog, StatusHistoryDialog } from './BookingStatusDialogs';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);

beforeEach(() => resetApiMock());

describe('CancelReasonDialog', () => {
  it('passes the typed reason to onConfirm', async () => {
    const onConfirm = vi.fn();
    render(<CancelReasonDialog open onOpenChange={() => {}} onConfirm={onConfirm} />);
    fireEvent.change(screen.getByPlaceholderText('Sabab (ixtiyoriy)'), { target: { value: 'Shifokor kasal' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bekor qilish' }));
    expect(onConfirm).toHaveBeenCalledWith('Shifokor kasal');
  });

  it('reason is optional', async () => {
    const onConfirm = vi.fn();
    render(<CancelReasonDialog open onOpenChange={() => {}} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bekor qilish' }));
    expect(onConfirm).toHaveBeenCalledWith('');
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
