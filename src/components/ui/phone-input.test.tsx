import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { PhoneInput, normalizePhoneChunk } from './phone-input';

function type(input: HTMLInputElement, value: string) {
  fireEvent.input(input, { target: { value } });
}

function Controlled({ onValue }: { onValue: (v: string) => void }) {
  const [v, setV] = useState('');
  return (
    <PhoneInput
      aria-label="phone"
      value={v}
      onChange={((val: string) => {
        setV(val);
        onValue(val);
      }) as never}
    />
  );
}

describe('PhoneInput', () => {
  it('shows the +998 mask placeholder immediately (lazy=false)', () => {
    render(<PhoneInput aria-label="phone" value="" onChange={vi.fn() as never} />);
    expect((screen.getByLabelText('phone') as HTMLInputElement).value).toMatch(/^\+998/);
  });

  it('emits the E.164 value (+998XXXXXXXXX) without spaces while displaying the masked form', () => {
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} />);
    const input = screen.getByLabelText('phone') as HTMLInputElement;
    type(input, '+998 90 123 45 67');
    expect(onValue).toHaveBeenLastCalledWith('+998901234567');
    expect(input.value).toBe('+998 90 123 45 67');
  });

  it('accepts the 9 local digits and formats them after the fixed +998', () => {
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} />);
    const input = screen.getByLabelText('phone') as HTMLInputElement;
    type(input, '331112233');
    expect(onValue).toHaveBeenLastCalledWith('+998331112233');
    expect(input.value).toBe('+998 33 111 22 33');
  });

  it('emits "" when only the country prefix is left', () => {
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} />);
    const input = screen.getByLabelText('phone') as HTMLInputElement;
    type(input, '+998 90');
    expect(onValue).toHaveBeenLastCalledWith('+99890');
    type(input, '+998');
    expect(onValue).toHaveBeenLastCalledWith('');
  });

  it('ignores letters and caps the length at 9 local digits', () => {
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} />);
    const input = screen.getByLabelText('phone') as HTMLInputElement;
    type(input, '+998 9a0 123 45 67 89');
    expect(onValue).toHaveBeenLastCalledWith('+998901234567');
  });

  it.each(['998331112233', '998 33 111 22 33', '+998331112233'])(
    'a pasted full number with the country code (%s) is not doubled',
    (pasted) => {
      const onValue = vi.fn();
      render(<Controlled onValue={onValue} />);
      const input = screen.getByLabelText('phone') as HTMLInputElement;
      type(input, pasted);
      expect(onValue).toHaveBeenLastCalledWith('+998331112233');
      expect(input.value).toBe('+998 33 111 22 33');
    },
  );

  it('normalizePhoneChunk strips a leading 998 only from full-length chunks', () => {
    expect(normalizePhoneChunk('998331112233')).toBe('331112233');
    expect(normalizePhoneChunk('+998 33 111 22 33')).toBe('331112233');
    expect(normalizePhoneChunk('99833')).toBe('99833');
    expect(normalizePhoneChunk('9')).toBe('9');
  });
});
