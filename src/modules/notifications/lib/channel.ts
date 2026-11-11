import type { Notification } from '@/shared/types';

/** Real delivery channel of a log row (the API's `type`), not a hard-coded "SMS". */
export const channelLabel = (type: Notification['type']) => (type === 'telegram' ? 'Telegram' : 'SMS');
