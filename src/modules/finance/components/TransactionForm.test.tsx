import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/utils';
import type { Payment } from '@/shared/types';
import { TransactionForm } from './TransactionForm';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);

const expense: Payment = {
  id: 'e1',
  patientId: null,
  patient: null,
  amount: 250000,
  method: 'cash',
  status: 'paid',
  type: 'EXPENSE',
  date: '2026-06-10',
  description: 'Ijara',
};

function renderForm(editing: Payment | null, onSave = vi.fn()) {
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <TransactionForm open onOpenChange={vi.fn()} editing={editing} onSave={onSave} />
    </QueryClientProvider>,
  );
  return onSave;
}

describe('TransactionForm', () => {
  it('editing a patient-less expense does not crash, hides the patient picker and keeps the free-text label', async () => {
    renderForm(expense);
    expect(await screen.findByText('Kimga / Nima uchun')).toBeInTheDocument();
    expect(screen.queryByText('Bemorni tanlang')).not.toBeInTheDocument();
  });

  it('saves an expense without a patient', async () => {
    const onSave = renderForm(expense);
    fireEvent.click(await screen.findByRole('button', { name: 'Yangilash' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0]).toMatchObject({ type: 'EXPENSE', amount: 250000, patientId: undefined });
  });

  it('an income still requires a patient', async () => {
    const onSave = renderForm(null);
    fireEvent.change(screen.getByPlaceholderText('150 000'), { target: { value: '100000' } });
    fireEvent.change(screen.getByPlaceholderText('Xizmat tavsifi...'), { target: { value: 'Plomba' } });
    fireEvent.click(screen.getByRole('button', { name: 'Qayd etish' }));
    expect(await screen.findByText('Bemor kiritilishi shart')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
