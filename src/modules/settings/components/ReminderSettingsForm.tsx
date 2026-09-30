import { useEffect, useRef } from 'react';
import { useForm, useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reminderSchema, type ReminderValues } from '../lib/schemas';
import { MessageSquare, Save, Send, AlertTriangle } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { REMINDER_DAYS_MAX, TEMPLATE_MAX_LENGTH, TEMPLATE_PLACEHOLDERS } from '@/lib/api/endpoints';
import type { ClinicSettings } from '@/shared/types';
import {
  PLACEHOLDER_LABELS,
  findUnknownPlaceholders,
  insertAt,
  previewValues,
  renderTemplate,
  type TemplateValues,
} from '../lib/template';




type TemplateName = 'smsReminderTemplate' | 'telegramReminderTemplate';

const pick = (s: ClinicSettings): ReminderValues => ({
  smsReminderTemplate: s.smsReminderTemplate ?? '',
  telegramReminderTemplate: s.telegramReminderTemplate ?? '',
  reminderDaysAhead: s.reminderDaysAhead ?? 1,
});


function TemplateEditor({
  name,
  label,
  icon: Icon,
  control,
  setValue,
  canEdit,
  values,
}: {
  name: TemplateName;
  label: string;
  icon: typeof Send;
  control: Control<ReminderValues>;
  setValue: UseFormSetValue<ReminderValues>;
  canEdit: boolean;
  values: TemplateValues;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const text = useWatch({ control, name }) ?? '';
  const unknown = findUnknownPlaceholders(text);

  const insert = (placeholder: string) => {
    const el = ref.current;
    const { value, caret } = insertAt(text, placeholder, el?.selectionStart, el?.selectionEnd);
    setValue(name, value, { shouldDirty: true, shouldValidate: true });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground" /> {label}
          </FormLabel>
          {canEdit && (
            <div className="flex flex-wrap gap-1.5" aria-label={`${label}: o'rinbosarlar`}>
              {TEMPLATE_PLACEHOLDERS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => insert(p)}
                  title={PLACEHOLDER_LABELS[p]}
                  className="px-2 py-0.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-mono hover:bg-primary/10"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          <FormControl>
            <Textarea
              rows={4}
              maxLength={TEMPLATE_MAX_LENGTH}
              {...field}
              ref={(el) => {
                field.ref(el);
                ref.current = el;
              }}
            />
          </FormControl>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <FormMessage />
            <span className="ml-auto tabular-nums">
              {text.length}/{TEMPLATE_MAX_LENGTH}
            </span>
          </div>
          {unknown.length > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-warning">
              <AlertTriangle className="w-3.5 h-3.5" />
              Noma'lum o'rinbosar: {unknown.join(', ')} — o'zgarmasdan yuboriladi
            </p>
          )}
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Namuna</p>
            <p className="text-sm whitespace-pre-wrap break-words" data-testid={`${name}-preview`}>
              {renderTemplate(text, values) || '—'}
            </p>
          </div>
        </FormItem>
      )}
    />
  );
}

interface Props {
  settings: ClinicSettings;
  canEdit: boolean;
  isSaving: boolean;
  onSave: (values: ReminderValues) => Promise<unknown>;
}

export function ReminderSettingsForm({ settings, canEdit, isSaving, onSave }: Props) {
  const form = useForm<ReminderValues>({ resolver: zodResolver(reminderSchema), defaultValues: pick(settings) });

  useEffect(() => {
    if (!form.formState.isDirty) form.reset(pick(settings));
  }, [settings, form]);

  const days = Number(useWatch({ control: form.control, name: 'reminderDaysAhead' }));
  const values = previewValues(settings.clinicName, days);

  const submit = form.handleSubmit(async (v) => {
    try {
      await onSave(v);
      form.reset(v);
    } catch {
      /* toast shown by the query client; keep the edits */
    }
  });

  return (
    <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm shadow-xl max-w-3xl">
      <CardHeader>
        <CardTitle className="text-xl">Eslatma shablonlari</CardTitle>
        <CardDescription>
          Bemorlarga qabul oldidan yuboriladigan SMS va Telegram xabarlari. O'rinbosarlar yuborishda haqiqiy
          qiymatlar bilan almashtiriladi.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={submit} noValidate>
          <fieldset disabled={!canEdit} className="contents">
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="reminderDaysAhead"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Necha kun oldin eslatilsin</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={REMINDER_DAYS_MAX} step={1} {...field} />
                    </FormControl>
                    <FormDescription>0 — qabul kunining o'zida, {REMINDER_DAYS_MAX} gacha</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <TemplateEditor
                name="smsReminderTemplate"
                label="SMS shablon"
                icon={MessageSquare}
                control={form.control}
                setValue={form.setValue}
                canEdit={canEdit}
                values={values}
              />
              <TemplateEditor
                name="telegramReminderTemplate"
                label="Telegram shablon"
                icon={Send}
                control={form.control}
                setValue={form.setValue}
                canEdit={canEdit}
                values={values}
              />
            </CardContent>
          </fieldset>
          {canEdit && (
            <CardFooter className="bg-muted/20 border-t border-border justify-end pt-5 rounded-b-2xl">
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
