import { PaymentFormValues, PaymentSchema } from '@/shared/lib/validation';
import { Payment } from '@/shared/types';

export const FinanceService = {
  initialState: (): PaymentFormValues => ({
    patientId: '',
    amount: 0,
    method: 'cash',
    status: 'unpaid',
    description: '',
  }),

  mapToForm: (p: Payment): PaymentFormValues => ({
    patientId: p.patientId,
    amount: p.amount,
    method: p.method,
    status: p.status,
    description: p.description || '',
  }),

  validate: (form: PaymentFormValues) => {
    const result = PaymentSchema.safeParse(form);
    if (!result.success) return result.error.errors[0].message;
    return null;
  }
};
