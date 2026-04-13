import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MoreHorizontal, Pencil, Trash2, Clock } from 'lucide-react';
import { Service } from '@/shared/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CATEGORIES } from '../hooks/useServices';
import { formatUzS } from '@/shared/lib/formatters';
import { ServiceSchema } from '@/shared/lib/validation';
import * as z from 'zod';

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
}

export const ServiceCard = ({ service, onEdit, onDelete }: ServiceCardProps) => {
  return (
    <div className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold truncate">{service.name}</h4>
          {service.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{service.description}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(service)}>
              <Pencil className="w-4 h-4 mr-2" />
              Tahrirlash
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(service.id)}>
              <Trash2 className="w-4 h-4 mr-2" />
              O'chirish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <span className="text-base font-bold text-primary">{formatUzS(service.price)}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />{service.duration} daq
        </span>
      </div>
    </div>
  );
};

type ServiceFormValues = z.infer<typeof ServiceSchema>;

interface ServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Service | null;
  onSave: (data: ServiceFormValues) => void;
}

export const ServiceForm = ({ 
  open, 
  onOpenChange, 
  editing, 
  onSave 
}: ServiceFormProps) => {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(ServiceSchema),
    defaultValues: {
      name: '',
      category: CATEGORIES[0] || '',
      price: '' as unknown as number,
      duration: '' as unknown as number,
      description: '',
    },
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        name: editing.name,
        category: editing.category,
        price: editing.price,
        duration: editing.duration,
        description: editing.description || '',
      });
    } else {
      form.reset({
        name: '',
        category: CATEGORIES[0] || '',
        price: '' as unknown as number,
        duration: '' as unknown as number,
        description: '',
      });
    }
  }, [editing, form, open]);

  const handleSubmit = (values: ServiceFormValues) => {
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Xizmatni tahrirlash" : "Yangi xizmat qo'shish"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Xizmat nomi</FormLabel>
                  <FormControl>
                    <Input placeholder="Masalan: Kompozit plomba" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategoriya</FormLabel>
                  <FormControl>
                    <select 
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" 
                      {...field}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Narxi (so'm)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="150000" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Davomiyligi (daq)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="30" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value)} />
                    </FormControl>
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
                    <Textarea placeholder="Xizmat haqida qo'shimcha ma'lumot..." {...field} />
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
