import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff } from 'lucide-react';
import { PatientSelect } from '@/shared/components/PatientSelect';
import { Doctor, Visit, VisitStatus } from '@/shared/types';
import { VISIT_STATUSES, VISIT_STATUS_LABELS } from '@/shared/constants';
import { DoctorSchema, VisitSchema } from '@/shared/lib/validation';
import {
  defaultDoctorSchedule,
  DOCTOR_WEEKDAY_LABELS,
  normalizeDoctorSchedule,
} from '@/shared/lib/doctor-schedule';
import * as z from 'zod';

type DoctorFormValues = z.infer<typeof DoctorSchema>;

interface DoctorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Doctor | null;
  onSave: (data: DoctorFormValues) => void;
  isPending?: boolean;
}

export const DoctorForm = ({ open, onOpenChange, editing, onSave, isPending = false }: DoctorFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(DoctorSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      specialty: '',
      phone: '',
      password: '',
      schedule: defaultDoctorSchedule(),
      daysOffText: '',
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "schedule",
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        form.reset({
          firstName: editing.firstName,
          lastName: editing.lastName,
          specialty: editing.specialty,
          phone: editing.phone,
          password: '',
          schedule: normalizeDoctorSchedule(editing.schedule),
          daysOffText: editing.daysOff?.length ? editing.daysOff.join(', ') : '',
        });
      } else {
        form.reset({
          firstName: '',
          lastName: '',
          specialty: '',
          phone: '',
          password: '',
          schedule: defaultDoctorSchedule(),
          daysOffText: '',
        });
      }
    }
  }, [editing, form, open]);

  const handleSubmit = (values: DoctorFormValues) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Shifokorni tahrirlash" : "Yangi shifokor qo'shish"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ism</FormLabel>
                    <FormControl>
                      <Input placeholder="Ali" {...field} />
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
                    <FormLabel>Familiya</FormLabel>
                    <FormControl>
                      <Input placeholder="Valiyev" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                  <FormLabel>Telefon (Login uchun)</FormLabel>
                  <FormControl>
                    <PhoneInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{editing ? 'Yangi parol (ixtiyoriy)' : 'Parol'}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••" 
                          {...field} 
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            <div className="space-y-2">
              <p className="text-sm font-medium">Haftalik jadval</p>
              <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/20">
                {fields.map((field, index) => {
                  const working = form.watch(`schedule.${index}.isWorking`);
                  return (
                    <div
                      key={field.id}
                      className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="w-9 shrink-0 text-xs font-semibold text-muted-foreground">
                        {DOCTOR_WEEKDAY_LABELS[index]}
                      </span>
                      <FormField
                        control={form.control}
                        name={`schedule.${index}.isWorking`}
                        render={({ field: switchField }) => (
                          <FormItem className="flex flex-row items-center gap-2 space-y-0">
                            <FormControl>
                              <Switch checked={switchField.value} onCheckedChange={switchField.onChange} />
                            </FormControl>
                            <FormLabel className="text-xs font-normal">Ish kuni</FormLabel>
                          </FormItem>
                        )}
                      />
                      <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[200px]">
                        <FormField
                          control={form.control}
                          name={`schedule.${index}.startTime`}
                          render={({ field: startField }) => (
                            <FormItem className="space-y-0">
                              <FormControl>
                                <Input type="time" className="h-8 w-[7.5rem] text-xs" disabled={!working} {...startField} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span className="text-xs text-muted-foreground">—</span>
                        <FormField
                          control={form.control}
                          name={`schedule.${index}.endTime`}
                          render={({ field: endField }) => (
                            <FormItem className="space-y-0">
                              <FormControl>
                                <Input type="time" className="h-8 w-[7.5rem] text-xs" disabled={!working} {...endField} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* optional lunch break */}
                      <div className="flex w-full flex-wrap items-center gap-2 pl-11">
                        <span className="text-[11px] text-muted-foreground">Tanaffus</span>
                        <FormField
                          control={form.control}
                          name={`schedule.${index}.breakStart`}
                          render={({ field: bsField }) => (
                            <FormItem className="space-y-0">
                              <FormControl>
                                <Input
                                  type="time"
                                  aria-label={`${DOCTOR_WEEKDAY_LABELS[index]} tanaffus boshlanishi`}
                                  className="h-7 w-[7rem] text-xs"
                                  disabled={!working}
                                  {...bsField}
                                  value={bsField.value ?? ''}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span className="text-xs text-muted-foreground">—</span>
                        <FormField
                          control={form.control}
                          name={`schedule.${index}.breakEnd`}
                          render={({ field: beField }) => (
                            <FormItem className="space-y-0">
                              <FormControl>
                                <Input
                                  type="time"
                                  aria-label={`${DOCTOR_WEEKDAY_LABELS[index]} tanaffus tugashi`}
                                  className="h-7 w-[7rem] text-xs"
                                  disabled={!working}
                                  {...beField}
                                  value={beField.value ?? ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <FormField
              control={form.control}
              name="daysOffText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dam olish kunlari (ixtiyoriy)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Sanalarni vergul bilan: 2026-01-01, 2026-03-08"
                      rows={2}
                      className="resize-none text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>{editing ? "Yangilash" : "Qo'shish"}</Button>
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
  onSave: (data: VisitFormValues) => void;
  isPending?: boolean;
}

export const DoctorVisitForm = ({ 
  open, 
  onOpenChange, 
  editingVisit, 
  doctor, 
  onSave,
  isPending = false,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingVisit ? "Tashrifni tahrirlash" : "Yangi tashrif"} — {doctor ? `${doctor.firstName} ${doctor.lastName}` : ''}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bemor</FormLabel>
                  <FormControl>
                    <PatientSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      selected={editingVisit?.patient ? { id: editingVisit.patientId, ...editingVisit.patient } : null}
                    />
                  </FormControl>
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
            <Button type="submit" className="w-full" disabled={isPending}>{editingVisit ? "Yangilash" : "Yaratish"}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
