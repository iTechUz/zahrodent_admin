import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Payment, Patient, PaymentMethod, PaymentStatus } from '@/shared/types';
import { 
  PAYMENT_METHODS, 
  PAYMENT_STATUSES, 
  PAYMENT_METHOD_LABELS, 
  PAYMENT_STATUS_LABELS 
} from '@/shared/constants';
import { PaymentSchema } from '@/shared/lib/validation';
import { SearchableSelect } from '@/components/ui/searchable-select';
import * as z from 'zod';

type PaymentFormValues = z.infer<typeof PaymentSchema>;

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Payment | null;
  patients: Patient[];
  onSave: (data: PaymentFormValues) => void;
}

export const TransactionForm = ({ 
  open, 
  onOpenChange, 
  editing, 
  patients, 
  onSave 
}: TransactionFormProps) => {
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(PaymentSchema),
    defaultValues: {
      patientId: '',
      amount: undefined as unknown as number,
      method: 'cash',
      status: 'paid',
      type: 'INCOME',
      description: '',
    },
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        patientId: editing.patientId,
        amount: editing.amount,
        method: editing.method,
        status: editing.status,
        type: editing.type || 'INCOME',
        description: editing.description,
      });
    } else {
      form.reset({
        patientId: '',
        amount: undefined as unknown as number,
        method: 'cash',
        status: 'paid',
        type: 'INCOME',
        description: '',
      });
    }
  }, [editing, form, open]);

  const handleSubmit = (values: PaymentFormValues) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "To'lovni tahrirlash" : "Yangi to'lov qayd etish"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bemor <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={patients.map(p => ({ value: p.id, label: `${p.firstName} ${p.lastName} (${p.phone})` }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Bemorni tanlang"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summa <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <MoneyInput placeholder="150 000" value={field.value ?? ''} onChange={v => field.onChange(Number(v))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INCOME">Kirim</SelectItem>
                        <SelectItem value="EXPENSE">Chiqim</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To'lov usuli</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m as PaymentMethod]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Holat</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{PAYMENT_STATUS_LABELS[s as PaymentStatus]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tavsif</FormLabel>
                  <FormControl>
                    <Input placeholder="Xizmat tavsifi..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              {editing ? "Yangilash" : "Qayd etish"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
