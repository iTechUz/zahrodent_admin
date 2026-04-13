import { Patient } from '@/shared/types';
import { PatientFormInput, PatientFormValues, PatientSchema } from '@/shared/lib/validation';

export const PatientService = {
  /**
   * Initial form state
   */
  initialState: (): PatientFormInput => ({
    firstName: '',
    lastName: '',
    age: '',
    phone: '',
    source: 'walk-in',
    notes: '',
    allergies: '',
    bloodType: '',
  }),

  /**
   * Maps a Patient object back to form values
   */
  mapToForm: (p: Patient): PatientFormInput => ({
    firstName: p.firstName,
    lastName: p.lastName,
    age: p.age,
    phone: p.phone,
    source: p.source,
    notes: p.notes || '',
    allergies: p.allergies || '',
    bloodType: p.bloodType || '',
  }),

  /**
   * Basic validation
   */
  validate: (form: PatientFormValues) => {
    const result = PatientSchema.safeParse(form);
    if (!result.success) {
      return result.error.errors[0].message;
    }
    return null;
  }
};
