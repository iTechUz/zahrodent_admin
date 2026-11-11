import { leadLangBadge, leadsToExportRows } from './export';
import type { Lead } from '@/shared/types';

const lead: Lead = {
  id: 'l1',
  name: 'Ali',
  phone: '+998901112233',
  status: 'converted',
  source: 'telegram_bot',
  lang: 'ru',
  notes: 'Qayta qo‘ng‘iroq',
  createdAt: '2026-06-01T10:00:00Z',
  updatedAt: '2026-06-02T10:00:00Z',
};

describe('leadsToExportRows', () => {
  it('uses Uzbek headers and labels and hides ids/internal fields', () => {
    const [row] = leadsToExportRows([lead]);
    expect(Object.keys(row)).toEqual(['Ism', 'Telefon', 'Xizmat', 'Xabar', 'Izoh', 'Holat', 'Manba', 'Til', 'Sana']);
    expect(row).toMatchObject({ Ism: 'Ali', Holat: 'Bemorga aylandi', Manba: 'Telegram bot', Til: 'RU', Xizmat: '' });
    expect(JSON.stringify(row)).not.toContain('l1');
  });

  it('falls back to the raw source when unknown and leaves language empty when absent', () => {
    const [row] = leadsToExportRows([{ ...lead, source: 'legacy', lang: undefined }]);
    expect(row.Manba).toBe('legacy');
    expect(row.Til).toBe('');
  });
});

describe('leadLangBadge', () => {
  it('shows RU/EN only', () => {
    expect(leadLangBadge('ru')).toBe('RU');
    expect(leadLangBadge('EN')).toBe('EN');
    expect(leadLangBadge('uz')).toBeNull();
    expect(leadLangBadge(null)).toBeNull();
  });
});
