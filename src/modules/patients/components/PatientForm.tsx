import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { BOOKING_SOURCES, BOOKING_SOURCE_LABELS } from '@/shared/constants';
import { Patient, BookingSource } from '@/shared/types';
import { PatientSchema } from '@/shared/lib/validation';
import * as z from 'zod';

type PatientFormValues = z.infer<typeof PatientSchema>;
type PatientFormInput = z.input<typeof PatientSchema>;

interface PatientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Patient | null;
  onSave: (data: PatientFormValues) => void;
}

export const PatientForm = ({ open, onOpenChange, editing, onSave }: PatientFormProps) => {
  const form = useForm<PatientFormInput>({
    resolver: zodResolver(PatientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      age: '',
      phone: '',
      source: 'walk-in',
      notes: '',
      allergies: '',
      bloodType: '',
    },
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        firstName: editing.firstName,
        lastName: editing.lastName,
        age: editing.age || '',
        phone: editing.phone,
        source: editing.source,
        notes: editing.notes || '',
        allergies: editing.allergies || '',
        bloodType: editing.bloodType || '',
      });
    } else {
      form.reset({
        firstName: '',
        lastName: '',
        age: '',
        phone: '',
        source: 'walk-in',
        notes: '',
        allergies: '',
        bloodType: '',
      });
    }
  }, [editing, form, open]);

  const handleSubmit = (values: PatientFormValues) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Bemorni tahrirlash" : "Yangi bemor qo'shish"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ism *</FormLabel>
                    <FormControl>
                      <Input placeholder="Masalan: Ali" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Familiya *</FormLabel>
                    <FormControl>
                      <Input placeholder="Masalan: Valiyev" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yosh</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="25" {...field} value={field.value != null ? String(field.value) : ''} onChange={e => field.onChange(e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon *</FormLabel>
                    <FormControl>
                      <Input placeholder="+998 90 123 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="bloodType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qon guruhi</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Noma'lum</SelectItem>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                          <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manba</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BOOKING_SOURCES.map((s) => (
                          <SelectItem key={s} value={s}>{BOOKING_SOURCE_LABELS[s as BookingSource]}</SelectItem>
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
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergiyalar</FormLabel>
                  <FormControl>
                    <Input placeholder="Masalan: Lidokain, Penisilin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Izoh</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Bemor haqida qo'shimcha ma'lumot..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              {editing ? "Yangilash" : "Qo'shish"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
