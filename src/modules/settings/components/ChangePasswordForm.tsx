import { useState } from 'react';
import { useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PASSWORD_MIN_LENGTH } from '@/lib/api/endpoints';
import { changePasswordSchema, type ChangePasswordValues as Values } from '../lib/schemas';
import { getErrorMessage } from '@/lib/api/query-client';
import { useChangePassword } from '../hooks/useChangePassword';



const EMPTY: Values = { currentPassword: '', newPassword: '', confirmPassword: '' };

function PasswordField({
  name,
  label,
  autoComplete,
  control,
  visible,
}: {
  name: keyof Values;
  label: string;
  autoComplete: string;
  control: Control<Values>;
  visible: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={visible ? 'text' : 'password'} autoComplete={autoComplete} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** "Parolni o'zgartirish" — available to every signed-in user. */
export function ChangePasswordForm() {
  const [visible, setVisible] = useState(false);
  const mutation = useChangePassword();
  const form = useForm<Values>({ resolver: zodResolver(changePasswordSchema), defaultValues: EMPTY });

  const onSubmit = (values: Values) => {
    mutation.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      { onSuccess: () => form.reset(EMPTY) },
    );
  };

  return (
    <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm shadow-xl max-w-3xl">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" /> Parolni o'zgartirish
        </CardTitle>
        <CardDescription>
          Kamida {PASSWORD_MIN_LENGTH} ta belgi. O'zgartirilgandan so'ng boshqa qurilmalardagi sessiyalar yakunlanadi.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            <PasswordField
              name="currentPassword"
              label="Joriy parol"
              autoComplete="current-password"
              control={form.control}
              visible={visible}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PasswordField
                name="newPassword"
                label="Yangi parol"
                autoComplete="new-password"
                control={form.control}
                visible={visible}
              />
              <PasswordField
                name="confirmPassword"
                label="Parolni tasdiqlash"
                autoComplete="new-password"
                control={form.control}
                visible={visible}
              />
            </div>
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {visible ? 'Parollarni yashirish' : "Parollarni ko'rsatish"}
            </button>
            {mutation.isError && (
              <div
                role="alert"
                className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2.5 text-sm text-destructive"
              >
                {getErrorMessage(mutation.error, "Parolni o'zgartirib bo'lmadi")}
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saqlanmoqda...' : 'Parolni yangilash'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
