import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { BOOKING_SOURCES, BOOKING_SOURCE_LABELS } from '@/shared/constants';
import { Patient, BookingSource } from '@/shared/types';
import { PatientSchema } from '@/shared/lib/validation';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useQuery } from '@tanstack/react-query';
import { doctorsApi, patientsApi } from '@/lib/api/endpoints';
import { fetchAllPages } from '@/lib/api/helpers';
import { queryKeys } from '@/lib/api/query-keys';
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
      address: '',
      workplace: '',
      assignedDoctorId: '',
      source: 'walk-in',
      notes: '',
    },
  });

  const { data: doctorsData } = useQuery({
    queryKey: queryKeys.doctorsLookup(),
    queryFn: () => fetchAllPages(doctorsApi.list),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // list rows may not carry assignedDoctorId — the detail endpoint does
  const { data: detail } = useQuery({
    queryKey: queryKeys.patient(editing?.id ?? ''),
    queryFn: () => patientsApi.get(editing!.id),
    enabled: open && !!editing?.id && editing.assignedDoctorId === undefined,
  });
  const assignedDoctorId = editing?.assignedDoctorId ?? detail?.assignedDoctorId ?? '';

  const doctorOptions = (doctorsData?.data || []).map((d) => ({
    value: d.id,
    label: `${d.firstName} ${d.lastName} (${d.specialty})`,
  }));

  useEffect(() => {
    if (editing) {
      form.reset({
        firstName: editing.firstName,
        lastName: editing.lastName,
        age: editing.age || '',
        phone: editing.phone,
        address: editing.address || '',
        workplace: editing.workplace || '',
        assignedDoctorId: assignedDoctorId || '',
        source: editing.source,
        notes: editing.notes || '',
      });
    } else {
      form.reset({
        firstName: '',
        lastName: '',
        age: '',
        phone: '',
        address: '',
        workplace: '',
        assignedDoctorId: '',
        source: 'walk-in',
        notes: '',
      });
    }
  }, [editing, form, open, assignedDoctorId]);

  const handleSubmit = (values: PatientFormValues) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Bemorni tahrirlash" : "Yangi bemor qo'shish"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon *</FormLabel>
                    <FormControl>
                      <PhoneInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yosh *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="25" {...field} value={field.value != null ? String(field.value) : ''} onChange={e => field.onChange(e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manzil *</FormLabel>
                    <FormControl>
                      <Input placeholder="Masalan: Toshkent sh., Chilonzor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workplace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ish joyi *</FormLabel>
                    <FormControl>
                      <Input placeholder="Masalan: Zavod, Maktab" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedDoctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biriktirilgan shifokor</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={doctorOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Shifokorni tanlang"
                      />
                    </FormControl>
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Izoh</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Bemor haqida qo'shimcha ma'lumot..." 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-11 text-base font-semibold">
              {editing ? "Yangilash" : "Qo'shish"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
