import { fireEvent, render, screen } from '@testing-library/react';
import { MoneyInput, formatMoney, parseMoney } from './money-input';

describe('formatMoney', () => {
  it.each([
    [300000, '300 000'],
    ['1234567', '1 234 567'],
    ['999', '999'],
    [0, '0'],
    ['', ''],
    ['12a3 4', '1 234'],
    ['1 000 000', '1 000 000'],
  ])('%p → %p', (input, out) => {
    expect(formatMoney(input)).toBe(out);
  });

  it('drops decimals separators (integer so\'m only)', () => {
    expect(formatMoney('1500.50')).toBe('150 050');
  });
});

describe('parseMoney', () => {
  it('removes spaces', () => {
    expect(parseMoney('1 234 567')).toBe('1234567');
    expect(parseMoney('')).toBe('');
  });

  it('round-trips with formatMoney', () => {
    expect(parseMoney(formatMoney(987654321))).toBe('987654321');
  });
});

describe('MoneyInput', () => {
  it('displays the formatted value and a so\'m suffix by default', () => {
    render(<MoneyInput aria-label="sum" value={300000} onChange={vi.fn()} />);
    expect(screen.getByLabelText('sum')).toHaveValue('300 000');
    expect(screen.getByText("so'm")).toBeInTheDocument();
    expect(screen.getByLabelText('sum')).toHaveAttribute('inputmode', 'numeric');
  });

  it('emits the raw digits on change', () => {
    const onChange = vi.fn();
    render(<MoneyInput aria-label="sum" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('sum'), { target: { value: '1 500 000' } });
    expect(onChange).toHaveBeenCalledWith('1500000');
  });

  it('ignores non-digit input', () => {
    const onChange = vi.fn();
    render(<MoneyInput aria-label="sum" value="10" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('sum'), { target: { value: '10a' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('allows clearing to ""', () => {
    const onChange = vi.fn();
    render(<MoneyInput aria-label="sum" value="10" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('sum'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('supports a custom or empty suffix and placeholder', () => {
    const { rerender } = render(<MoneyInput aria-label="sum" value="" onChange={vi.fn()} suffix="$" />);
    expect(screen.getByText('$')).toBeInTheDocument();
    expect(screen.getByLabelText('sum')).toHaveAttribute('placeholder', '0');
    rerender(<MoneyInput aria-label="sum" value="" onChange={vi.fn()} suffix="" placeholder="Summa" />);
    expect(screen.queryByText("so'm")).not.toBeInTheDocument();
    expect(screen.getByLabelText('sum')).toHaveAttribute('placeholder', 'Summa');
  });
});
