import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { ToothRecord, VisitStatus, PaymentMethod, PaymentStatus, BookingSource, Visit } from '@/shared/types';
import { toast } from 'sonner';
import {
  patientsApi,
  visitsApi,
  bookingsApi,
  paymentsApi,
  doctorsApi,
} from '@/lib/api/endpoints';
import { fetchAllPages } from '@/lib/api/helpers';
import { queryKeys } from '@/lib/api/query-keys';
import { can, canAccessPayments } from '@/shared/config/roles';
import { clinicToday } from '@/shared/lib/date-utils';

export const usePatientProfile = (patientId: string | undefined) => {
  const authed = useStore((s) => s.isAuthenticated);
  const role = useStore((s) => s.currentUser?.role);
  const ownDoctorId = useStore((s) => (s.currentUser?.role === 'doctor' ? s.currentUser.doctorId : undefined));
  const canManagePayments = canAccessPayments(role);
  const canAddVisit = can(role, 'visits.create');
  const canEditPatient = can(role, 'patients.update');
  const queryClient = useQueryClient();

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: patientId ? queryKeys.patient(patientId) : ['patients', 'none'],
    queryFn: () => patientsApi.get(patientId!),
    enabled: !!patientId && authed,
  });

  // full history: every page (backend default limit is 10, max 100) so totals are correct
  const byPatient = { patientId: patientId ?? '' };
  const { data: visitsRes } = useQuery({
    queryKey: queryKeys.visitsLookup(byPatient),
    queryFn: () => fetchAllPages(visitsApi.list, byPatient),
    enabled: !!patientId && authed,
  });
  const patientVisits = visitsRes?.data ?? [];

  const { data: bookingsRes } = useQuery({
    queryKey: queryKeys.bookingsLookup(byPatient),
    queryFn: () => fetchAllPages(bookingsApi.list, byPatient),
    enabled: !!patientId && authed,
  });
  const patientBookings = bookingsRes?.data ?? [];

  const { data: paymentsRes } = useQuery({
    queryKey: queryKeys.paymentsLookup(byPatient),
    queryFn: () => fetchAllPages(paymentsApi.list, byPatient),
    enabled: !!patientId && authed && canManagePayments,
  });
  const patientPayments = paymentsRes?.data ?? [];

  // GET /doctors is allowed for every staff role (doctor included)
  const { data: doctorsRes } = useQuery({
    queryKey: queryKeys.doctorsLookup(),
    queryFn: () => fetchAllPages(doctorsApi.list),
    enabled: authed && !!patientId,
  });
  const doctors = doctorsRes?.data ?? [];

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['patients', patientId, 'comments'],
    queryFn: () => patientsApi.getComments(patientId!),
    enabled: !!patientId && authed,
  });

  const addCommentMut = useMutation({
    mutationFn: (content: string) => patientsApi.addComment(patientId!, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', patientId, 'comments'] });
      toast.success("Izoh qo'shildi");
    },
  });

  const updatePatientMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof patientsApi.update>[1] }) =>
      patientsApi.update(id, body),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      queryClient.invalidateQueries({ queryKey: queryKeys.patient(v.id) });
    },
  });

  // visits/payments change the patient balance (GET /patients/:id) and the dashboard aggregates
  const invalidateBalance = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.patients });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
  };

  const createVisitMut = useMutation({
    mutationFn: visitsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits });
      invalidateBalance();
      toast.success("Yangi tashrif qo'shildi");
    },
  });

  const createPaymentMut = useMutation({
    mutationFn: paymentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      invalidateBalance();
      toast.success("To'lov qayd etildi");
    },
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    phone: '',
    address: '',
    workplace: '',
    assignedDoctorId: '',
    source: 'walk-in' as BookingSource,
    notes: '',
  });

  const [toothModal, setToothModal] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [toothForm, setToothForm] = useState<{ condition: ToothRecord['condition']; notes: string }>({
    condition: 'healthy',
    notes: '',
  });

  const [visitModal, setVisitModal] = useState(false);
  const emptyVisitForm = () => ({
    doctorId: ownDoctorId ?? '',
    diagnosis: '',
    treatment: '',
    notes: '',
    price: '',
    status: 'completed' as VisitStatus,
    shouldPayNow: false,
    payAmount: '',
    payMethod: 'cash' as PaymentMethod,
  });
  const [visitForm, setVisitForm] = useState({
    doctorId: ownDoctorId ?? '',
    diagnosis: '',
    treatment: '',
    notes: '',
    price: '',
    status: 'completed' as VisitStatus,
    shouldPayNow: false,
    payAmount: '',
    payMethod: 'cash' as PaymentMethod,
  });

  const [paymentModal, setPaymentModal] = useState(false);

  const [payForm, setPayForm] = useState({
    amount: '',
    method: 'cash' as PaymentMethod,
    status: 'paid' as PaymentStatus,
    description: '',
    visitId: '' as string,
  });

  const totalPaid = patientPayments.filter((p) => p.status === 'paid' || p.status === 'partial').reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalDue = patientVisits.reduce((s, v) => s + (Number(v.price) || 0), 0);
  // prefer the backend balance (paid − owed over *all* rows; also correct for roles that can't list payments)
  const backendBalance = typeof patient?.balance === 'number' ? patient.balance : null;
  const totalDebt = backendBalance !== null ? Math.max(0, -backendBalance) : Math.max(0, totalDue - totalPaid);

  const handleEditSave = () => {
    if (!patient) return;
    if (!editForm.firstName || !editForm.phone) {
      toast.error("Majburiy maydonlarni to'ldiring");
      return;
    }
    updatePatientMut.mutate(
      {
        id: patient.id,
        // "" = no doctor selected → null unassigns on the backend
        body: { ...editForm, age: Number(editForm.age), assignedDoctorId: editForm.assignedDoctorId || null },
      },
      {
        onSuccess: () => {
          toast.success("Bemor ma'lumotlari yangilandi");
          setEditOpen(false);
        },
      },
    );
  };

  const openToothEdit = (num: number) => {
    if (!patient) return;
    const chart = patient.toothChart as Record<string, ToothRecord> | undefined;
    const record = chart?.[String(num)];
    setSelectedTooth(num);
    setToothForm({ condition: record?.condition || 'healthy', notes: record?.notes || '' });
    setToothModal(true);
  };

  const handleToothSave = () => {
    if (!patient || selectedTooth === null) return;
    const toothChart = { ...(patient.toothChart || {}) };
    toothChart[selectedTooth] = {
      toothNumber: selectedTooth,
      condition: toothForm.condition,
      notes: toothForm.notes,
      date: clinicToday(),
    };
    updatePatientMut.mutate(
      { id: patient.id, body: { toothChart } },
      {
        onSuccess: () => {
          toast.success(`${selectedTooth}-tish ma'lumoti yangilandi`);
          setToothModal(false);
        },
      },
    );
  };

  const handleVisitSave = () => {
    if (!patient) return;
    if (!visitForm.doctorId) {
      toast.error('Shifokorni tanlang');
      return;
    }
    const today = clinicToday();
    createVisitMut.mutate(
      {
        patientId: patient.id,
        doctorId: visitForm.doctorId,
        date: today,
        status: visitForm.status,
        diagnosis: visitForm.diagnosis,
        treatment: visitForm.treatment,
        notes: visitForm.notes,
        price: Number(visitForm.price) || 0,
      },
      {
        onSuccess: (newVisit) => {
          if (visitForm.shouldPayNow && visitForm.payAmount) {
            createPaymentMut.mutate({
              patientId: patient.id,
              amount: Number(visitForm.payAmount),
              method: visitForm.payMethod,
              status: 'paid',
              type: 'INCOME',
              date: today,
              description: `${today} - Tashrif uchun to'lov`,
              visitId: newVisit.id,
            });
          }
          toast.success("Tashrif muvaffaqiyatli saqlandi");
        },
        onSettled: () => {
          setVisitModal(false);
          setVisitForm(emptyVisitForm());
        },
      },
    );
  };

  const handleAddComment = (content: string) => {
    if (!content.trim()) return;
    addCommentMut.mutate(content);
  };

  const handlePaymentSave = () => {
    if (!patient) return;
    if (!payForm.amount || !payForm.description) {
      toast.error("Majburiy maydonlarni to'ldiring");
      return;
    }
    const today = clinicToday();
    createPaymentMut.mutate(
      {
        patientId: patient.id,
        amount: Number(payForm.amount),
        method: payForm.method,
        status: payForm.status,
        type: 'INCOME',
        date: today,
        description: payForm.description,
        visitId: payForm.visitId || undefined,
      },
      {
        onSettled: () => {
          setPaymentModal(false);
          setPayForm({ amount: '', method: 'cash', status: 'paid', description: '', visitId: '' });
        },
      },
    );
  };

  const openEdit = () => {
    if (!patient) return;
    setEditForm({
      firstName: patient.firstName,
      lastName: patient.lastName,
      age: String(patient.age),
      phone: patient.phone,
      address: patient.address || '',
      workplace: patient.workplace || '',
      assignedDoctorId: patient.assignedDoctorId || '',
      source: patient.source,
      notes: patient.notes,
    });
    setEditOpen(true);
  };

  const getVisitBalance = useCallback((visitId: string, visitPrice: number) => {
    const price = Number(visitPrice) || 0;
    const linkedPaid = patientPayments
      .filter(p => p.visitId === visitId && (p.status === 'paid' || p.status === 'partial'))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return Math.max(0, price - linkedPaid);
  }, [patientPayments]);

  const openPaymentForVisit = (visit: Visit) => {
    const balance = getVisitBalance(visit.id, visit.price);
    const doctor = doctors.find(d => d.id === visit.doctorId);
    setPayForm({
      amount: String(balance),
      method: 'cash',
      status: 'paid',
      description: `${visit.date} - ${doctor ? `${doctor.firstName} ${doctor.lastName}` : 'Tashrif'} uchun to'lov`,
      visitId: visit.id
    });
    setPaymentModal(true);
  };

  return {
    patient,
    patientVisits,
    patientBookings,
    patientPayments,
    canManagePayments,
    canAddVisit,
    canEditPatient,
    totalPaid,
    totalDue,
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
    getVisitBalance,
    openPaymentForVisit,
    comments,
    handleAddComment,
    isAddingComment: addCommentMut.isPending,
    isLoading: patientLoading || commentsLoading,
  };
};
