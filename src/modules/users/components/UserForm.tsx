import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

const userSchema = z.object({
  name: z.string().min(2, "Kamida 2 ta belgi bo'lishi kerak"),
  phone: z.string().regex(/^\+998\d{9}$/, "Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak"),
  role: z.enum(['admin', 'doctor', 'receptionist']),
  password: z.string().min(6, "Kamida 6 ta belgi").optional().or(z.literal('')),
  specialty: z.string().optional(),
});

export type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Partial<UserFormValues> | null;
  onSave: (data: Partial<UserFormValues>) => void;
}

export function UserForm({ open, onOpenChange, editing, onSave }: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      phone: '',
      role: 'receptionist',
      password: '',
    },
    values: (editing as UserFormValues | null) || undefined,
  });

  const handleSubmit = (values: UserFormValues) => {
    // If empty password on edit, remove it from payload
    const payload: Partial<UserFormValues> = { ...values };
    if (!payload.password && editing) delete payload.password;
    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editing ? 'Xodimni tahrirlash' : 'Xodim qo\'shish'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ism-sharif</FormLabel>
                  <FormControl><Input {...field} placeholder="Masalan: Aziz Rahimov" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon raqami</FormLabel>
                  <FormControl><PhoneInput {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{editing ? 'Yangi parol (ixtiyoriy)' : 'Parol'}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        {...field} 
                        type={showPassword ? "text" : "password"} 
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
            <DialogFooter>
              <Button type="submit" className="w-full">Saqlash</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
