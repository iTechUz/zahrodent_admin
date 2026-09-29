import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CONDITION_KEYS, CONDITION_LABELS, ToothChart } from './ToothChart';

describe('ToothChart', () => {
  it('has a label for every tooth condition in the type', () => {
    expect([...CONDITION_KEYS].sort()).toEqual(
      ['cavity', 'crown', 'filled', 'healthy', 'implant', 'missing', 'root-canal'].sort(),
    );
    CONDITION_KEYS.forEach((k) => expect(CONDITION_LABELS[k].label).toBeTruthy());
  });

  it('renders all 32 FDI teeth, defaulting to healthy', () => {
    const { container } = render(<ToothChart toothChart={{}} onToothClick={() => {}} />);
    const teeth = container.querySelectorAll('[title]');
    expect(teeth).toHaveLength(32);
    expect(screen.getByTitle("11: Sog'lom")).toBeInTheDocument();
  });

  it('shows condition and notes in the title', () => {
    render(
      <ToothChart
        toothChart={{
          16: { toothNumber: 16, condition: 'filled', notes: 'Kompozit' },
          26: { toothNumber: 26, condition: 'cavity' },
        }}
        onToothClick={() => {}}
      />,
    );
    expect(screen.getByTitle('16: Plombalangan - Kompozit')).toBeInTheDocument();
    expect(screen.getByTitle('26: Kariyes')).toBeInTheDocument();
  });

  it('reports the clicked tooth number', () => {
    const onClick = vi.fn();
    render(<ToothChart toothChart={{}} onToothClick={onClick} />);
    fireEvent.click(screen.getByTitle("48: Sog'lom"));
    expect(onClick).toHaveBeenCalledWith(48);
  });
});
