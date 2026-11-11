import { render, screen } from '@testing-library/react';
import { PhoneLink, telHref } from './PhoneLink';

describe('PhoneLink', () => {
  it('builds a dialable tel: href without spaces and dashes', () => {
    expect(telHref('+998 90 123-45-67')).toBe('tel:+998901234567');
  });
  it('renders a link with the original text', () => {
    render(<PhoneLink phone="+998 90 123 45 67" />);
    expect(screen.getByRole('link', { name: '+998 90 123 45 67' })).toHaveAttribute('href', 'tel:+998901234567');
  });
  it('shows a dash for a missing number', () => {
    render(<PhoneLink phone={undefined} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
