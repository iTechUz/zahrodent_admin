import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './button';

describe('Button tooltip', () => {
  it('uses the tooltip text as the accessible name of an icon button', () => {
    render(<Button size="icon" tooltip="O'chirish">x</Button>);
    expect(screen.getByRole('button', { name: "O'chirish" })).toBeInTheDocument();
  });

  it('keeps an explicit aria-label', () => {
    render(<Button size="icon" tooltip="Hint" aria-label="Boshqa">x</Button>);
    expect(screen.getByRole('button', { name: 'Boshqa' })).toBeInTheDocument();
  });

  it('shows the hint on keyboard focus', async () => {
    render(<Button size="icon" tooltip="Tahrirlash">x</Button>);
    fireEvent.focus(screen.getByRole('button', { name: 'Tahrirlash' }));
    expect((await screen.findAllByText('Tahrirlash')).length).toBeGreaterThan(0);
  });

  it('renders a plain button without tooltip', () => {
    render(<Button>Saqlash</Button>);
    expect(screen.getByRole('button', { name: 'Saqlash' })).toBeInTheDocument();
  });
});
