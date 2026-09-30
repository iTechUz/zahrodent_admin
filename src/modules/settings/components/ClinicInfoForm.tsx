import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clinicInfoSchema, type ClinicInfoValues } from '../lib/schemas';
import { Clock, MapPin, Phone, Save, Building2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { ClinicSettings } from '@/shared/types';



interface Props {
  settings: ClinicSettings;
  canEdit: boolean;
  isSaving: boolean;
  onSave: (values: ClinicInfoValues) => Promise<unknown>;
}

const pick = (s: ClinicSettings): ClinicInfoValues => ({
  clinicName: s.clinicName ?? '',
  address: s.address ?? '',
  phone: s.phone ?? '',
  workingHours: s.workingHours ?? '',
});

export function ClinicInfoForm({ settings, canEdit, isSaving, onSave }: Props) {
  const form = useForm<ClinicInfoValues>({ resolver: zodResolver(clinicInfoSchema), defaultValues: pick(settings) });

  // server data changed (saved here or refetched) → show it, unless the user is mid-edit
  useEffect(() => {
    if (!form.formState.isDirty) form.reset(pick(settings));
  }, [settings, form]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSave(values);
      form.reset(values);
    } catch {
      /* toast shown by the query client; keep the edits */
    }
  });

  const fields: { name: keyof ClinicInfoValues; label: string; icon: typeof Phone; placeholder: string }[] = [
    { name: 'phone', label: 'Telefon', icon: Phone, placeholder: '+998 71 123 45 67' },
    { name: 'workingHours', label: 'Ish vaqti', icon: Clock, placeholder: 'Du–Sha, 09:00–18:00' },
    { name: 'address', label: 'Manzil', icon: MapPin, placeholder: 'Toshkent sh., …' },
  ];

  return (
    <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl">Klinika ma'lumotlari</CardTitle>
        <CardDescription>
          Eslatmalardagi <code className="text-xs">{'{clinic}'}</code> klinika nomidan olinadi
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={submit} noValidate>
          <fieldset disabled={!canEdit} className="contents">
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="clinicName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" /> Klinika nomi
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Zahro Dental" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {fields.map(({ name, label, icon: Icon, placeholder }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" /> {label}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={placeholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </fieldset>
          {canEdit && (
            <CardFooter className="bg-muted/20 border-t border-border mt-4 justify-end pt-5 rounded-b-2xl">
              <Button type="submit" className="gradient-primary" disabled={isSaving || !form.formState.isDirty}>
                <Save className="w-4 h-4 mr-2" /> Saqlash
              </Button>
            </CardFooter>
          )}
        </form>
      </Form>
    </Card>
  );
}
