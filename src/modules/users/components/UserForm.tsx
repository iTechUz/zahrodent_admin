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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const userSchema = z.object({
  name: z.string().min(2, "Kamida 2 ta belgi bo'lishi kerak"),
  phone: z.string().regex(/^\+998\d{9}$/, "Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak"),
  // Doctors are managed on the Shifokorlar page; here only admin / reception.
  role: z.enum(['admin', 'doctor', 'receptionist', 'pharmacist']),
  password: z.string().min(6, "Kamida 6 ta belgi").optional().or(z.literal('')),
  specialty: z.string().nullish(),
});

export type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Partial<UserFormValues> | null;
  onSave: (data: Partial<UserFormValues>) => void;
  isPending?: boolean;
}

export function UserForm({ open, onOpenChange, editing, onSave, isPending = false }: UserFormProps) {
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
          <form onSubmit={form.handleSubmit(handleSubmit, (errors) => {
            console.error('UserForm validation failed', errors);
            toast.error(Object.values(errors)[0]?.message?.toString() || "Forma noto'g'ri to'ldirilgan");
          })} className="space-y-4 py-4">
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
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* A doctor keeps its role when editing one; new doctors are added on the Shifokorlar page */}
                      {field.value === 'doctor' && <SelectItem value="doctor">Shifokor</SelectItem>}
                      <SelectItem value="receptionist">Qabulxona</SelectItem>
                      <SelectItem value="pharmacist">Apteka</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Shifokorlar bu yerda emas, «Shifokorlar» sahifasida qo'shiladi.
                  </FormDescription>
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
              <Button type="submit" className="w-full" disabled={isPending}>Saqlash</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
