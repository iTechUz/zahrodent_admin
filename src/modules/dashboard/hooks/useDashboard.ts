import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDays, 
  UserPlus, 
  Stethoscope, 
  CreditCard 
} from 'lucide-react';

export const useDashboard = () => {
  const { patients, bookings, payments, doctors, visits } = useStore();
  const navigate = useNavigate();

  const today = '2024-03-31'; // In a real app, this would be new Date()
  const todayBookings = bookings.filter((b) => b.date === today);
  const totalRevenue = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const newPatients = patients.filter((p) => p.createdAt >= '2024-03-01').length;
  const completedToday = todayBookings.filter(b => b.status === 'completed').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const unpaidPayments = payments.filter(p => p.status !== 'paid');
  const totalDebt = unpaidPayments.reduce((s, p) => s + p.amount, 0);
  const activeDoctors = doctors.filter(d => visits.some(v => v.doctorId === d.id && v.status === 'in-progress')).length;

  const quickActions = [
    { label: 'Yangi qabul', icon: CalendarDays, path: '/bookings', color: 'bg-primary/10 text-primary' },
    { label: "Bemor qo'shish", icon: UserPlus, path: '/patients', color: 'bg-info/10 text-info' },
    { label: "To'lov qayd etish", icon: CreditCard, path: '/finance', color: 'bg-success/10 text-success' },
    { label: 'Shifokorlar', icon: Stethoscope, path: '/doctors', color: 'bg-warning/10 text-warning' },
  ];

  return {
    patients,
    bookings,
    payments,
    doctors,
    todayBookings,
    totalRevenue,
    newPatients,
    completedToday,
    pendingBookings,
    totalDebt,
    unpaidCount: unpaidPayments.length,
    activeDoctors,
    quickActions,
    navigate,
  };
};
