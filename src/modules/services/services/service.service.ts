import { ServiceSchema, ServiceFormValues } from "@/shared/lib/validation";
import { Service } from '@/shared/types';

export const ServiceModuleService = {
  initialState: (): ServiceFormValues => ({
    name: '',
    category: 'Davolash',
    price: 0,
    duration: 0,
    description: '',
  }),

  mapToForm: (s: Service): ServiceFormValues => ({
    name: s.name,
    category: s.category,
    price: s.price,
    duration: s.duration,
    description: s.description || '',
  }),

  validate: (form: ServiceFormValues) => {
    const result = ServiceSchema.safeParse(form);
    if (!result.success) return result.error.errors[0].message;
    return null;
  }
};
