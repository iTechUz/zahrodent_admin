import { render, screen, waitFor } from '@testing-library/react';
import { notificationLogsApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { createWrapper, loginAs } from '@/test/utils';
import { TelegramDeliveryAlert } from './TelegramDeliveryAlert';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);

beforeEach(() => {
  resetApiMock();
  loginAs('admin');
});

describe('TelegramDeliveryAlert', () => {
  it('warns when messages failed', async () => {
    vi.mocked(notificationLogsApi.summary).mockResolvedValue({ failed24h: 3, pending: 1 });
    const { wrapper } = createWrapper();
    render(<TelegramDeliveryAlert />, { wrapper });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByText(/3 ta Telegram xabar yuborilmadi/)).toBeInTheDocument();
  });

  it('renders nothing when all is fine', async () => {
    vi.mocked(notificationLogsApi.summary).mockResolvedValue({ failed24h: 0, pending: 0 });
    const { wrapper } = createWrapper();
    const { container } = render(<TelegramDeliveryAlert />, { wrapper });
    await waitFor(() => expect(notificationLogsApi.summary).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
