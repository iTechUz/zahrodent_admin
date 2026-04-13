import { DoctorFormValues, DoctorSchema } from '@/shared/lib/validation';
import { Doctor } from '@/shared/types';

export const DoctorService = {
  initialState: (): DoctorFormValues => ({
    name: '',
    specialty: '',
    phone: '',
    workingHours: '',
  }),

  mapToForm: (d: Doctor): DoctorFormValues => ({
    name: d.name,
    specialty: d.specialty,
    phone: d.phone,
    workingHours: d.workingHours,
  }),

  validate: (form: DoctorFormValues) => {
    const result = DoctorSchema.safeParse(form);
    if (!result.success) return result.error.errors[0].message;
    return null;
  }
};
