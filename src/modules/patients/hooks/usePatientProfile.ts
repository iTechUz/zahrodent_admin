import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { ToothRecord, VisitStatus, PaymentMethod, PaymentStatus, BookingSource } from '@/shared/types';
import { toast } from 'sonner';

export const usePatientProfile = (patientId: string | undefined) => {
  const { 
    patients, 
    visits, 
    bookings, 
    payments, 
    doctors, 
    updatePatient, 
    addVisit, 
    addPayment 
  } = useStore();

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ 
    firstName: '', 
    lastName: '', 
    age: '', 
    phone: '', 
    source: 'walk-in' as BookingSource, 
    notes: '', 
    allergies: '', 
    bloodType: '' 
  });
  
  const [toothModal, setToothModal] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [toothForm, setToothForm] = useState<{ condition: ToothRecord['condition']; notes: string }>({ 
    condition: 'healthy', 
    notes: '' 
  });
  
  const [visitModal, setVisitModal] = useState(false);
  const [visitForm, setVisitForm] = useState({ 
    doctorId: '', 
    diagnosis: '', 
    treatment: '', 
    notes: '', 
    status: 'not-started' as VisitStatus 
  });
  
  const [paymentModal, setPaymentModal] = useState(false);
  const [payForm, setPayForm] = useState({ 
    amount: '', 
    method: 'cash' as PaymentMethod, 
    status: 'unpaid' as PaymentStatus, 
    description: '' 
  });

  const patient = patients.find(p => p.id === patientId);
  const patientVisits = visits.filter(v => v.patientId === patientId);
  const patientBookings = bookings.filter(b => b.patientId === patientId);
  const patientPayments = payments.filter(p => p.patientId === patientId);
  const totalPaid = patientPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalDebt = patientPayments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);

  const handleEditSave = () => {
    if (!patient) return;
    if (!editForm.firstName || !editForm.phone) { 
      toast.error("Majburiy maydonlarni to'ldiring"); 
      return; 
    }
    updatePatient(patient.id, { ...editForm, age: Number(editForm.age) });
    toast.success("Bemor ma'lumotlari yangilandi");
    setEditOpen(false);
  };

  const openToothEdit = (num: number) => {
    if (!patient) return;
    const record = (patient.toothChart || {})[num];
    setSelectedTooth(num);
    setToothForm({ condition: record?.condition || 'healthy', notes: record?.notes || '' });
    setToothModal(true);
  };

  const handleToothSave = () => {
    if (!patient || selectedTooth === null) return;
    const toothChart = patient.toothChart || {};
    const newChart = { ...toothChart };
    newChart[selectedTooth] = { 
      toothNumber: selectedTooth, 
      condition: toothForm.condition, 
      notes: toothForm.notes, 
      date: new Date().toISOString().split('T')[0] 
    };
    updatePatient(patient.id, { toothChart: newChart });
    toast.success(`${selectedTooth}-tish ma'lumoti yangilandi`);
    setToothModal(false);
  };

  const handleVisitSave = () => {
    if (!patient) return;
    if (!visitForm.doctorId) { toast.error('Shifokorni tanlang'); return; }
    addVisit({ 
      id: `v${Date.now()}`, 
      patientId: patient.id, 
      date: new Date().toISOString().split('T')[0], 
      ...visitForm 
    });
    toast.success("Yangi tashrif qo'shildi");
    setVisitModal(false);
    setVisitForm({ doctorId: '', diagnosis: '', treatment: '', notes: '', status: 'not-started' });
  };

  const handlePaymentSave = () => {
    if (!patient) return;
    if (!payForm.amount || !payForm.description) { toast.error("Majburiy maydonlarni to'ldiring"); return; }
    addPayment({ 
      id: `pay${Date.now()}`, 
      patientId: patient.id, 
      amount: Number(payForm.amount), 
      method: payForm.method, 
      status: payForm.status, 
      date: new Date().toISOString().split('T')[0], 
      description: payForm.description 
    });
    toast.success("To'lov qayd etildi");
    setPaymentModal(false);
    setPayForm({ amount: '', method: 'cash', status: 'unpaid', description: '' });
  };

  const openEdit = () => {
    if (!patient) return;
    setEditForm({ 
      firstName: patient.firstName, 
      lastName: patient.lastName, 
      age: String(patient.age), 
      phone: patient.phone, 
      source: patient.source, 
      notes: patient.notes, 
      allergies: patient.allergies || '', 
      bloodType: patient.bloodType || '' 
    }); 
    setEditOpen(true);
  };

  return {
    patient,
    patientVisits,
    patientBookings,
    patientPayments,
    totalPaid,
    totalDebt,
    doctors,
    editOpen,
    setEditOpen,
    editForm,
    setEditForm,
    toothModal,
    setToothModal,
    selectedTooth,
    toothForm,
    setToothForm,
    visitModal,
    setVisitModal,
    visitForm,
    setVisitForm,
    paymentModal,
    setPaymentModal,
    payForm,
    setPayForm,
    handleEditSave,
    openEdit,
    openToothEdit,
    handleToothSave,
    handleVisitSave,
    handlePaymentSave,
  };
};
