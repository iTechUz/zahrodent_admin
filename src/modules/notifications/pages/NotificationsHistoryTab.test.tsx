import { render, screen } from '@testing-library/react';
import type { Notification } from '@/shared/types';
import { NotificationsHistoryTab } from './NotificationsPage';
import { channelLabel } from '../lib/channel';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);

const base: Notification = {
  id: 'n1',
  patientId: 'p1',
  type: 'sms',
  message: 'Eslatma',
  sentAt: '2026-06-01T10:00:00Z',
  status: 'sent',
};

const table = (data: Notification[], isLoading = false) => ({
  data,
  isLoading,
  totalPages: 1,
  totalCount: data.length,
  page: 0,
  setPage: vi.fn(),
});

describe('NotificationsHistoryTab', () => {
  it('shows the real channel of each row', () => {
    expect(channelLabel('telegram')).toBe('Telegram');
    expect(channelLabel('sms')).toBe('SMS');
    render(
      <NotificationsHistoryTab
        table={table([base, { ...base, id: 'n2', type: 'telegram' }])}
        patients={new Map()}
        doctors={new Map()}
      />,
    );
    expect(screen.getAllByText('SMS')).toHaveLength(1);
    expect(screen.getAllByText('Telegram')).toHaveLength(1);
  });

  it('prefers the embedded patient, falls back to the lookup, then to a dash', () => {
    render(
      <NotificationsHistoryTab
        table={table([
          { ...base, id: 'a', patient: { firstName: 'Ali', lastName: 'Valiyev' } },
          { ...base, id: 'b', patientId: 'p2' },
          { ...base, id: 'c', patientId: 'p3' },
        ])}
        patients={new Map([['p2', { firstName: 'Bobur', lastName: 'Karimov' }]])}
        doctors={new Map()}
      />,
    );
    expect(screen.getByText('Ali Valiyev')).toBeInTheDocument();
    expect(screen.getByText('Bobur Karimov')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(1);
  });

  it('shows a loading row, not "topilmadi", while the first page loads', () => {
    render(<NotificationsHistoryTab table={table([], true)} patients={new Map()} doctors={new Map()} />);
    expect(screen.getByText(/Yuklanmoqda/)).toBeInTheDocument();
    expect(screen.queryByText('Bildirishnomalar topilmadi')).not.toBeInTheDocument();
  });
});
