import { mockDoctors } from '@/mock/data';
import { Doctor } from '@/shared/types';
import { describeCrudSlice } from '@/test/crudSliceCases';

describeCrudSlice<Doctor>({
  name: 'doctorSlice',
  listKey: 'doctors',
  initial: mockDoctors,
  add: (s, d) => s.addDoctor(d),
  update: (s, id, d) => s.updateDoctor(id, d),
  remove: (s, id) => s.deleteDoctor(id),
  makeNew: () => ({
    id: 'd-new',
    name: 'Dr. Test',
    specialty: 'Terapiya',
    phone: '+998 90 999 9999',
    workingHours: 'Du-Ju 9:00-18:00',
  }),
  patch: { specialty: 'Jarrohlik', daysOff: ['2024-04-01'] },
});
