import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Doctor, Patient, Visit, VisitStatus } from '@/shared/types';
import { VISIT_STATUSES, VISIT_STATUS_LABELS } from '@/shared/constants';
import { DoctorSchema, VisitSchema } from '@/shared/lib/validation';
import * as z from 'zod';

type DoctorFormValues = z.infer<typeof DoctorSchema>;

interface DoctorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Doctor | null;
  onSave: (data: DoctorFormValues) => void;
}

export const DoctorForm = ({ open, onOpenChange, editing, onSave }: DoctorFormProps) => {
  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(DoctorSchema),
    defaultValues: {
      name: '',
      specialty: '',
      phone: '',
      workingHours: '',
    },
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        name: editing.name,
        specialty: editing.specialty,
        phone: editing.phone,
        workingHours: editing.workingHours,
      });
    } else {
      form.reset({
        name: '',
        specialty: '',
        phone: '',
        workingHours: '',
      });
    }
  }, [editing, form, open]);

  const handleSubmit = (values: DoctorFormValues) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Shifokorni tahrirlash" : "Yangi shifokor qo'shish"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ism familiya</FormLabel>
                  <FormControl>
                    <Input placeholder="Dr. Ism Familiya" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specialty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mutaxassislik</FormLabel>
                  <FormControl>
                    <Input placeholder="Masalan: Umumiy stomatologiya" {...field} />
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
                  <FormLabel>Telefon</FormLabel>
                  <FormControl>
                    <Input placeholder="+998 90 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="workingHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ish vaqti</FormLabel>
                  <FormControl>
                    <Input placeholder="Du-Ju 9:00-17:00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">{editing ? "Yangilash" : "Qo'shish"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

type VisitFormValues = z.infer<typeof VisitSchema>;

interface VisitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingVisit: Visit | null;
  doctor: Doctor | null;
  patients: Patient[];
  onSave: (data: VisitFormValues) => void;
}

export const DoctorVisitForm = ({ 
  open, 
  onOpenChange, 
  editingVisit, 
  doctor, 
  patients, 
  onSave 
}: VisitFormProps) => {
  const form = useForm<VisitFormValues>({
    resolver: zodResolver(VisitSchema),
    defaultValues: {
      patientId: '',
      status: 'not-started',
      diagnosis: '',
      treatment: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (editingVisit) {
      form.reset({
        patientId: editingVisit.patientId,
        status: editingVisit.status,
        diagnosis: editingVisit.diagnosis || '',
        treatment: editingVisit.treatment || '',
        notes: editingVisit.notes || '',
      });
    } else {
      form.reset({
        patientId: '',
        status: 'not-started',
        diagnosis: '',
        treatment: '',
        notes: '',
      });
    }
  }, [editingVisit, form, open]);

  const handleSubmit = (values: VisitFormValues) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingVisit ? "Tashrifni tahrirlash" : "Yangi tashrif"} — {doctor?.name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bemor</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Bemorni tanlang" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VISIT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{VISIT_STATUS_LABELS[s as VisitStatus]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tashxis</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Bemorning tashxisi..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="treatment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Davolash</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Bajarilgan davolash usuli..." {...field} />
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
                    <Textarea placeholder="Qo'shimcha izoh..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">{editingVisit ? "Yangilash" : "Yaratish"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
