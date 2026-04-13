import { create } from 'zustand';
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createPatientSlice, PatientSlice } from './slices/patientSlice';
import { createBookingSlice, BookingSlice } from './slices/bookingSlice';
import { createDoctorSlice, DoctorSlice } from './slices/doctorSlice';
import { createFinanceSlice, FinanceSlice } from './slices/financeSlice';
import { createServiceSlice, ServiceSlice } from './slices/serviceSlice';
import { createAppSlice, AppSlice } from './slices/appSlice';

export type StoreState = AuthSlice & 
  PatientSlice & 
  BookingSlice & 
  DoctorSlice & 
  FinanceSlice & 
  ServiceSlice & 
  AppSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createPatientSlice(...a),
  ...createBookingSlice(...a),
  ...createDoctorSlice(...a),
  ...createFinanceSlice(...a),
  ...createServiceSlice(...a),
  ...createAppSlice(...a),
}));
