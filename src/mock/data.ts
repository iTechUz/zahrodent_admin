import { Patient, Doctor, Booking, Visit, Payment, Notification, Service } from '@/shared/types';

export const mockServices: Service[] = [
  { id: 's1', name: 'Umumiy ko\'rik', category: 'Diagnostika', price: 50000, duration: 30, description: 'To\'liq og\'iz bo\'shlig\'i tekshiruvi' },
  { id: 's2', name: 'Professional tozalash', category: 'Profilaktika', price: 120000, duration: 45, description: 'Tish toshi va yog\'lar tozalash' },
  { id: 's3', name: 'Kompozit plomba', category: 'Davolash', price: 150000, duration: 40, description: 'Yoriq yoki kariyes plombalash' },
  { id: 's4', name: 'Ildiz kanali davolash', category: 'Endodontiya', price: 450000, duration: 90, description: 'Ildiz kanali tozalash va plombalash' },
  { id: 's5', name: 'Tish sug\'urish', category: 'Jarrohlik', price: 200000, duration: 30, description: 'Oddiy tish sug\'urib olish' },
  { id: 's6', name: 'Aql tishi sug\'urish', category: 'Jarrohlik', price: 350000, duration: 60, description: 'Murakkab aql tishi operatsiyasi' },
  { id: 's7', name: 'Toj o\'rnatish', category: 'Ortopediya', price: 800000, duration: 60, description: 'Metall-keramika toj' },
  { id: 's8', name: 'Vinir', category: 'Estetika', price: 1200000, duration: 60, description: 'Keramik vinir qoplama' },
  { id: 's9', name: 'Breket tizimi', category: 'Ortodontiya', price: 5000000, duration: 120, description: 'To\'liq breket tizimi o\'rnatish' },
  { id: 's10', name: 'Tishlarni oqartirish', category: 'Estetika', price: 300000, duration: 60, description: 'Professional tish oqartirish' },
  { id: 's11', name: 'Implant o\'rnatish', category: 'Implantologiya', price: 3500000, duration: 90, description: 'Titan implant o\'rnatish' },
  { id: 's12', name: 'Panoramik rentgen', category: 'Diagnostika', price: 80000, duration: 15, description: 'To\'liq jag\' rentgen surati' },
];

export const mockPatients: Patient[] = [
  { id: 'p1', firstName: 'Oisha', lastName: 'Karimova', age: 28, phone: '+998 90 123 4567', source: 'telegram', notes: 'Muntazam tekshiruv bemori', createdAt: '2024-01-15', allergies: 'Lidokain', bloodType: 'A+',
    toothChart: {
      16: { toothNumber: 16, condition: 'filled', notes: 'Kompozit plomba', date: '2024-01-15' },
      26: { toothNumber: 26, condition: 'cavity', notes: 'Kichik kariyes', date: '2024-03-31' },
      36: { toothNumber: 36, condition: 'crown', notes: 'Metall-keramika toj', date: '2023-06-10' },
      46: { toothNumber: 46, condition: 'filled', notes: 'Amalgam plomba', date: '2023-08-20' },
    }
  },
  { id: 'p2', firstName: 'Rustam', lastName: 'Aliyev', age: 35, phone: '+998 91 234 5678', source: 'walk-in', notes: 'Pastki chap tishda sezuvchanlik', createdAt: '2024-02-20', bloodType: 'B+',
    toothChart: {
      37: { toothNumber: 37, condition: 'cavity', notes: 'Chuqur kariyes', date: '2024-03-31' },
      18: { toothNumber: 18, condition: 'missing', notes: 'Sug\'urilgan', date: '2022-05-15' },
      28: { toothNumber: 28, condition: 'missing', notes: 'Sug\'urilgan', date: '2022-05-15' },
    }
  },
  { id: 'p3', firstName: 'Dilnoza', lastName: 'Yusupova', age: 22, phone: '+998 93 345 6789', source: 'website', notes: 'Ortodontik davolash', createdAt: '2024-03-05', bloodType: 'O+' },
  { id: 'p4', firstName: 'Bobur', lastName: 'Toshmatov', age: 45, phone: '+998 94 456 7890', source: 'phone', notes: 'Toj almashtirish kerak', createdAt: '2024-03-10', allergies: 'Penisilin',
    toothChart: {
      11: { toothNumber: 11, condition: 'crown', notes: 'Eski toj, almashtirish kerak', date: '2020-03-10' },
      21: { toothNumber: 21, condition: 'crown', notes: 'Keramik toj', date: '2020-03-10' },
      45: { toothNumber: 45, condition: 'root-canal', notes: 'Ildiz kanali davolangan', date: '2023-11-05' },
      48: { toothNumber: 48, condition: 'missing', notes: 'Aql tishi sug\'urilgan', date: '2019-07-20' },
    }
  },
  { id: 'p5', firstName: 'Malika', lastName: 'Rahimova', age: 31, phone: '+998 90 567 8901', source: 'telegram', notes: 'Tishlarni oqartirish', createdAt: '2024-03-15' },
  { id: 'p6', firstName: 'Jahongir', lastName: 'Nazarov', age: 52, phone: '+998 91 678 9012', source: 'walk-in', notes: 'Implant bo\'yicha maslahat', createdAt: '2024-03-18',
    toothChart: {
      36: { toothNumber: 36, condition: 'implant', notes: 'Titan implant', date: '2023-09-15' },
      46: { toothNumber: 46, condition: 'missing', notes: 'Implant rejalashtirilgan', date: '2024-03-18' },
      15: { toothNumber: 15, condition: 'filled', notes: 'Kompozit', date: '2022-01-10' },
      25: { toothNumber: 25, condition: 'filled', notes: 'Kompozit', date: '2022-01-10' },
    }
  },
  { id: 'p7', firstName: 'Nargiza', lastName: 'Sultanova', age: 19, phone: '+998 93 789 0123', source: 'website', notes: 'Aql tishini sug\'urib olish', createdAt: '2024-03-20' },
  { id: 'p8', firstName: 'Sardor', lastName: 'Mirzayev', age: 40, phone: '+998 94 890 1234', source: 'phone', notes: 'Ildiz kanali davolash', createdAt: '2024-03-22', allergies: 'Lateks',
    toothChart: {
      14: { toothNumber: 14, condition: 'root-canal', notes: 'Ildiz kanali davolash tugallangan', date: '2024-03-22' },
      24: { toothNumber: 24, condition: 'cavity', notes: 'Yangi kariyes', date: '2024-03-22' },
    }
  },
  { id: 'p9', firstName: 'Zarina', lastName: 'Abdullayeva', age: 26, phone: '+998 90 901 2345', source: 'telegram', notes: 'Tozalash uchun qabul', createdAt: '2024-03-25' },
  { id: 'p10', firstName: 'Timur', lastName: 'Xo\'jayev', age: 38, phone: '+998 91 012 3456', source: 'walk-in', notes: 'Plomba almashtirish', createdAt: '2024-03-28', bloodType: 'AB+',
    toothChart: {
      35: { toothNumber: 35, condition: 'filled', notes: 'Eskirgan plomba almashtirildi', date: '2024-03-30' },
    }
  },
];

export const mockDoctors: Doctor[] = [
  { id: 'd1', name: 'Dr. Kamila Usmanova', specialty: 'Umumiy stomatologiya', phone: '+998 90 111 2233', workingHours: 'Du-Ju 9:00-17:00',
    schedule: [
      { day: 0, startTime: '09:00', endTime: '17:00', isWorking: true },
      { day: 1, startTime: '09:00', endTime: '17:00', isWorking: true },
      { day: 2, startTime: '09:00', endTime: '17:00', isWorking: true },
      { day: 3, startTime: '09:00', endTime: '17:00', isWorking: true },
      { day: 4, startTime: '09:00', endTime: '17:00', isWorking: true },
      { day: 5, startTime: '00:00', endTime: '00:00', isWorking: false },
      { day: 6, startTime: '00:00', endTime: '00:00', isWorking: false },
    ]
  },
  { id: 'd2', name: 'Dr. Farrukh Ismoilov', specialty: 'Ortodontiya', phone: '+998 91 222 3344', workingHours: 'Du-Sha 10:00-18:00',
    schedule: [
      { day: 0, startTime: '10:00', endTime: '18:00', isWorking: true },
      { day: 1, startTime: '10:00', endTime: '18:00', isWorking: true },
      { day: 2, startTime: '10:00', endTime: '18:00', isWorking: true },
      { day: 3, startTime: '10:00', endTime: '18:00', isWorking: true },
      { day: 4, startTime: '10:00', endTime: '18:00', isWorking: true },
      { day: 5, startTime: '10:00', endTime: '16:00', isWorking: true },
      { day: 6, startTime: '00:00', endTime: '00:00', isWorking: false },
    ]
  },
  { id: 'd3', name: 'Dr. Nodira Azimova', specialty: 'Og\'iz jarrohligi', phone: '+998 93 333 4455', workingHours: 'Se-Sha 8:00-16:00',
    schedule: [
      { day: 0, startTime: '00:00', endTime: '00:00', isWorking: false },
      { day: 1, startTime: '08:00', endTime: '16:00', isWorking: true },
      { day: 2, startTime: '08:00', endTime: '16:00', isWorking: true },
      { day: 3, startTime: '08:00', endTime: '16:00', isWorking: true },
      { day: 4, startTime: '08:00', endTime: '16:00', isWorking: true },
      { day: 5, startTime: '08:00', endTime: '16:00', isWorking: true },
      { day: 6, startTime: '00:00', endTime: '00:00', isWorking: false },
    ]
  },
  { id: 'd4', name: 'Dr. Alisher Raxmov', specialty: 'Bolalar stomatologiyasi', phone: '+998 94 444 5566', workingHours: 'Du-Ju 9:00-15:00',
    schedule: [
      { day: 0, startTime: '09:00', endTime: '15:00', isWorking: true },
      { day: 1, startTime: '09:00', endTime: '15:00', isWorking: true },
      { day: 2, startTime: '09:00', endTime: '15:00', isWorking: true },
      { day: 3, startTime: '09:00', endTime: '15:00', isWorking: true },
      { day: 4, startTime: '09:00', endTime: '15:00', isWorking: true },
      { day: 5, startTime: '00:00', endTime: '00:00', isWorking: false },
      { day: 6, startTime: '00:00', endTime: '00:00', isWorking: false },
    ]
  },
];

export const mockBookings: Booking[] = [
  { id: 'b1', patientId: 'p1', doctorId: 'd1', date: '2024-03-31', time: '09:00', source: 'telegram', status: 'confirmed', createdAt: '2024-03-28' },
  { id: 'b2', patientId: 'p2', doctorId: 'd1', date: '2024-03-31', time: '10:00', source: 'walk-in', status: 'pending', createdAt: '2024-03-29' },
  { id: 'b3', patientId: 'p3', doctorId: 'd2', date: '2024-03-31', time: '11:00', source: 'website', status: 'arrived', createdAt: '2024-03-27' },
  { id: 'b4', patientId: 'p4', doctorId: 'd3', date: '2024-03-31', time: '14:00', source: 'phone', status: 'confirmed', createdAt: '2024-03-30' },
  { id: 'b5', patientId: 'p5', doctorId: 'd1', date: '2024-04-01', time: '09:30', source: 'telegram', status: 'pending', createdAt: '2024-03-30' },
  { id: 'b6', patientId: 'p6', doctorId: 'd3', date: '2024-04-01', time: '11:00', source: 'walk-in', status: 'confirmed', createdAt: '2024-03-29' },
  { id: 'b7', patientId: 'p7', doctorId: 'd3', date: '2024-04-02', time: '08:30', source: 'website', status: 'pending', createdAt: '2024-03-31' },
  { id: 'b8', patientId: 'p8', doctorId: 'd1', date: '2024-04-02', time: '15:00', source: 'phone', status: 'no-show', createdAt: '2024-03-28' },
  { id: 'b9', patientId: 'p9', doctorId: 'd1', date: '2024-03-30', time: '10:00', source: 'telegram', status: 'completed', createdAt: '2024-03-25' },
  { id: 'b10', patientId: 'p10', doctorId: 'd2', date: '2024-03-30', time: '14:00', source: 'walk-in', status: 'completed', createdAt: '2024-03-26' },
];

export const mockVisits: Visit[] = [
  { id: 'v1', patientId: 'p1', doctorId: 'd1', bookingId: 'b1', date: '2024-03-31', status: 'completed', diagnosis: 'Kichik kariyes', treatment: 'Kompozit plomba', notes: '6 oydan keyin nazorat' },
  { id: 'v2', patientId: 'p2', doctorId: 'd1', date: '2024-03-31', status: 'in-progress', diagnosis: 'Tish sezuvchanligi', treatment: 'Desensitizatsiya davolash', notes: 'Davom etmoqda' },
  { id: 'v3', patientId: 'p3', doctorId: 'd2', date: '2024-03-31', status: 'not-started', diagnosis: '', treatment: '', notes: 'Ortodontik konsultatsiya' },
  { id: 'v4', patientId: 'p9', doctorId: 'd1', bookingId: 'b9', date: '2024-03-30', status: 'completed', diagnosis: 'Tish toshi to\'planishi', treatment: 'Professional tozalash', notes: 'Og\'iz gigiyenasi yaxshi' },
  { id: 'v5', patientId: 'p10', doctorId: 'd2', bookingId: 'b10', date: '2024-03-30', status: 'completed', diagnosis: 'Eskirgan plomba', treatment: 'Plomba almashtirish', notes: 'Amalgam kompozitga almashtirildi' },
];

export const mockPayments: Payment[] = [
  { id: 'pay1', patientId: 'p1', amount: 150000, method: 'card', status: 'paid', date: '2024-03-31', description: 'Kompozit plomba', serviceId: 's3' },
  { id: 'pay2', patientId: 'p2', amount: 200000, method: 'cash', status: 'partial', date: '2024-03-31', description: 'Desensitizatsiya davolash' },
  { id: 'pay3', patientId: 'p3', amount: 500000, method: 'transfer', status: 'unpaid', date: '2024-03-31', description: 'Ortodontik konsultatsiya' },
  { id: 'pay4', patientId: 'p9', amount: 120000, method: 'cash', status: 'paid', date: '2024-03-30', description: 'Professional tozalash', serviceId: 's2' },
  { id: 'pay5', patientId: 'p10', amount: 180000, method: 'card', status: 'paid', date: '2024-03-30', description: 'Plomba almashtirish', serviceId: 's3' },
  { id: 'pay6', patientId: 'p4', amount: 350000, method: 'insurance', status: 'unpaid', date: '2024-03-28', description: 'Toj konsultatsiyasi' },
  { id: 'pay7', patientId: 'p6', amount: 800000, method: 'transfer', status: 'partial', date: '2024-03-25', description: 'Implant konsultatsiyasi', serviceId: 's11', discount: 10 },
  { id: 'pay8', patientId: 'p8', amount: 450000, method: 'cash', status: 'paid', date: '2024-03-22', description: 'Ildiz kanali davolash', serviceId: 's4' },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', patientId: 'p1', type: 'telegram', message: 'Eslatma: Sizning qabulingiz ertaga soat 9:00 da', sentAt: '2024-03-30T18:00:00', status: 'delivered' },
  { id: 'n2', patientId: 'p2', type: 'sms', message: 'Eslatma: Sizning qabulingiz ertaga soat 10:00 da', sentAt: '2024-03-30T18:00:00', status: 'sent' },
  { id: 'n3', patientId: 'p3', type: 'telegram', message: 'Sizning qabulingiz 31-mart kuni soat 11:00 ga tasdiqlandi', sentAt: '2024-03-27T10:00:00', status: 'delivered' },
  { id: 'n4', patientId: 'p4', type: 'sms', message: 'Eslatma: Sizning qabulingiz ertaga soat 14:00 da', sentAt: '2024-03-30T18:00:00', status: 'delivered' },
  { id: 'n5', patientId: 'p5', type: 'telegram', message: 'Sizning qabulingiz 1-aprel kuni soat 9:30 ga tasdiqlandi', sentAt: '2024-03-30T14:00:00', status: 'delivered' },
  { id: 'n6', patientId: 'p8', type: 'sms', message: 'Siz qabulga kelmadingiz. Iltimos, qayta yoziling.', sentAt: '2024-04-02T16:00:00', status: 'sent' },
];
