import { act, renderHook, waitFor } from '@testing-library/react';
import { notificationsApi } from '@/lib/api/endpoints';
import { resetApiMock, toastMock } from '@/test/api-mock';
import { createWrapper, loginAs } from '@/test/utils';
import type { NotificationRecipient } from '@/shared/types';
import { useBulkSms } from './useBulkSms';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);
vi.mock('sonner', async () => ({ toast: (await import('@/test/api-mock')).toastMock }));

const api = vi.mocked(notificationsApi);
const NOW = new Date('2026-06-17T07:00:00Z'); // 12:00 in Tashkent

const recipient = (id: string): NotificationRecipient => ({
  id,
  firstName: id,
  lastName: 'X',
  phone: '+998901112233',
  bookingId: `b-${id}`,
  bookingDate: '2026-06-18',
  bookingTime: '10:00',
});

function setup() {
  const { wrapper, queryClient } = createWrapper();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  return { ...renderHook(() => useBulkSms(), { wrapper }), invalidate };
}

beforeEach(() => {
  resetApiMock();
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  loginAs('receptionist');
  api.getRecipients.mockResolvedValue([recipient('a'), recipient('b'), recipient('c')]);
});

afterEach(() => vi.useRealTimers());

describe('useBulkSms', () => {
  describe('recipients query', () => {
    it('defaults to patients for the "tomorrow" preset', async () => {
      const { result } = setup();
      await waitFor(() => expect(result.current.recipients).toHaveLength(3));
      expect(result.current.datePreset).toBe('tomorrow');
      expect(result.current.targetType).toBe('patient');
      expect(api.getRecipients).toHaveBeenCalledWith({
        startDate: '2026-06-18',
        endDate: '2026-06-18',
        targetType: 'patient',
      });
    });

    it('"nextWeek" spans today..today+7', async () => {
      const { result } = setup();
      act(() => result.current.setDatePreset('nextWeek'));
      await waitFor(() =>
        expect(api.getRecipients).toHaveBeenLastCalledWith({
          startDate: '2026-06-17',
          endDate: '2026-06-24',
          targetType: 'patient',
        }),
      );
    });

    it('"nextMonth" spans today..today+1 month', async () => {
      const { result } = setup();
      act(() => result.current.setDatePreset('nextMonth'));
      await waitFor(() =>
        expect(api.getRecipients).toHaveBeenLastCalledWith({
          startDate: '2026-06-17',
          endDate: '2026-07-17',
          targetType: 'patient',
        }),
      );
    });

    it('"custom" uses the default custom range (today..tomorrow)', async () => {
      const { result } = setup();
      act(() => result.current.setDatePreset('custom'));
      await waitFor(() =>
        expect(api.getRecipients).toHaveBeenLastCalledWith({
          startDate: '2026-06-17',
          endDate: '2026-06-18',
          targetType: 'patient',
        }),
      );
    });

    it('doctor target sends no dates and clears the selection', async () => {
      const { result } = setup();
      await waitFor(() => expect(result.current.recipients).toHaveLength(3));
      act(() => result.current.toggleSelect('a'));
      act(() => result.current.setTargetType('doctor'));
      expect(result.current.selectedIds).toEqual([]);
      expect(result.current.targetType).toBe('doctor');
      await waitFor(() =>
        expect(api.getRecipients).toHaveBeenLastCalledWith({
          startDate: undefined,
          endDate: undefined,
          targetType: 'doctor',
        }),
      );
    });

    it('"tomorrow" right after Tashkent midnight is the next clinic day, sent as YYYY-MM-DD (not a UTC instant)', async () => {
      vi.setSystemTime(new Date('2026-06-16T19:30:00Z')); // 00:30 on 06-17 in Tashkent
      setup();
      await waitFor(() => expect(api.getRecipients).toHaveBeenCalled());
      expect(api.getRecipients).toHaveBeenCalledWith({
        startDate: '2026-06-18',
        endDate: '2026-06-18',
        targetType: 'patient',
      });
    });

    it('setCustomRange drives the "custom" preset', async () => {
      const { result } = setup();
      act(() => result.current.setDatePreset('custom'));
      act(() => result.current.setCustomRange({ start: '2026-07-01', end: '2026-07-05' }));
      await waitFor(() =>
        expect(api.getRecipients).toHaveBeenLastCalledWith({
          startDate: '2026-07-01',
          endDate: '2026-07-05',
          targetType: 'patient',
        }),
      );
    });
  });

  describe('selection', () => {
    it('toggleSelect adds / removes ids', async () => {
      const { result } = setup();
      act(() => result.current.toggleSelect('a'));
      act(() => result.current.toggleSelect('b'));
      expect(result.current.selectedIds).toEqual(['a', 'b']);
      act(() => result.current.toggleSelect('a'));
      expect(result.current.selectedIds).toEqual(['b']);
    });

    it('toggleSelectAll selects all recipients, then clears when all are selected', async () => {
      const { result } = setup();
      await waitFor(() => expect(result.current.recipients).toHaveLength(3));
      act(() => result.current.toggleSelectAll());
      expect(result.current.selectedIds).toEqual(['a', 'b', 'c']);
      act(() => result.current.toggleSelectAll());
      expect(result.current.selectedIds).toEqual([]);
    });
  });

  describe('handleSend', () => {
    it('requires at least one recipient', () => {
      const { result } = setup();
      act(() => result.current.handleSend());
      expect(toastMock.error).toHaveBeenCalledWith('Kamida bitta qabul qiluvchini tanlang');
      expect(api.bulkSend).not.toHaveBeenCalled();
    });

    it('rejects messages shorter than 5 chars', () => {
      const { result } = setup();
      act(() => result.current.toggleSelect('a'));
      act(() => result.current.setMessage('Hi'));
      act(() => result.current.handleSend());
      expect(toastMock.error).toHaveBeenCalledWith('SMS xabari juda qisqa');
      expect(api.bulkSend).not.toHaveBeenCalled();
    });

    it('has a default reminder template', () => {
      const { result } = setup();
      expect(result.current.message).toContain('[sana]');
      expect(result.current.message).toContain('[vaqt]');
    });

    it('sends, toasts the result, clears the selection and invalidates history + recipients', async () => {
      api.bulkSend.mockResolvedValue({ sent: 2, failed: 1, total: 3 });
      const { result, invalidate } = setup();
      act(() => result.current.toggleSelect('a'));
      act(() => result.current.toggleSelect('b'));
      act(() => result.current.setMessage('Ertaga qabul bor'));
      act(() => result.current.handleSend());

      await waitFor(() =>
        expect(toastMock.success).toHaveBeenCalledWith('2 ta SMS muvaffaqiyatli yuborildi. 1 ta xato.'),
      );
      expect(api.bulkSend.mock.calls[0][0]).toEqual({
        targetIds: ['a', 'b'],
        targetType: 'patient',
        message: 'Ertaga qabul bor',
      });
      expect(result.current.selectedIds).toEqual([]);
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['notifications'] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['sms-recipients'] });
    });

    it('shows an error toast when sending fails and keeps the selection', async () => {
      api.bulkSend.mockRejectedValue(new Error('Eskiz down'));
      const { result } = setup();
      act(() => result.current.toggleSelect('a'));
      act(() => result.current.handleSend());
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('SMS yuborishda xatolik yuz berdi'));
      expect(result.current.selectedIds).toEqual(['a']);
    });

    it('isSending while the request is pending', async () => {
      let resolve!: (v: { sent: number; failed: number; total: number }) => void;
      api.bulkSend.mockReturnValue(new Promise((r) => (resolve = r)));
      const { result } = setup();
      act(() => result.current.toggleSelect('a'));
      act(() => result.current.handleSend());
      await waitFor(() => expect(result.current.isSending).toBe(true));
      await act(async () => resolve({ sent: 1, failed: 0, total: 1 }));
      await waitFor(() => expect(result.current.isSending).toBe(false));
    });
  });
});
