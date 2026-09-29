import { mockPayments } from '@/mock/data';
import { Payment } from '@/shared/types';
import { describeCrudSlice } from '@/test/crudSliceCases';

describeCrudSlice<Payment>({
  name: 'financeSlice',
  listKey: 'payments',
  initial: mockPayments,
  add: (s, p) => s.addPayment(p),
  update: (s, id, p) => s.updatePayment(id, p),
  remove: (s, id) => s.deletePayment(id),
  makeNew: () => ({
    id: 'pay-new',
    patientId: 'p1',
    amount: 99000,
    method: 'cash',
    status: 'unpaid',
    date: '2024-04-01',
    description: 'Test',
  }),
  patch: { status: 'paid', amount: 1 },
});
