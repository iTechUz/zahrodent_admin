import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { Doctor, Visit } from '@/shared/types';
import { toast } from 'sonner';
import { useDialogState } from '@/shared/hooks/useDialogState';
import { useServerTable } from '@/shared/hooks/useServerTable';
import { DoctorService } from '../services/doctor.service';
import { DoctorSchema, VisitSchema } from '@/shared/lib/validation';
import { z } from 'zod';
import { doctorsApi, type DoctorCreatePayload, visitsApi, patientsApi } from '@/lib/api/endpoints';
import { fetchAllPages, withoutEmptyPassword } from '@/lib/api/helpers';
import { queryKeys } from '@/lib/api/query-keys';
import { can } from '@/shared/config/roles';
import { clinicToday } from '@/shared/lib/date-utils';

type DoctorFormValues = z.infer<typeof DoctorSchema>;
type VisitFormValues = z.infer<typeof VisitSchema>;

export const useDoctors = () => {
  const authed = useStore((s) => s.isAuthenticated);
  const role = useStore((s) => s.currentUser?.role);
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [visitModal, setVisitModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);

  const table = useServerTable<Doctor, { specialty?: string }>({
    queryKey: queryKeys.doctors,
    fetchFn: (params) => doctorsApi.list(params),
    perPage: 10,
  });

  const { data: stats } = useQuery({
    queryKey: queryKeys.doctorsStats,
    queryFn: () => doctorsApi.stats(),
    enabled: authed && can(role, 'doctors.stats'),
  });

  const { data: efficiencyData } = useQuery({
    queryKey: queryKeys.doctorsEfficiency,
    queryFn: () => doctorsApi.efficiency(),
    enabled: authed && can(role, 'doctors.efficiency'),
  });

  // patient picker for the visit form: every page (the backend caps limit at 100)
  const { data: patientsData } = useQuery({
    queryKey: queryKeys.patientsLookup(),
    queryFn: () => fetchAllPages(patientsApi.list),
    enabled: authed,
  });
  const patients = patientsData?.data ?? [];

  const saveDoctorMut = useMutation({
    // password is optional — an empty field must not be sent (backend MinLength(6) → 400)
    mutationFn: (args: { id?: string; body: DoctorCreatePayload }) =>
      args.id != null
        ? doctorsApi.update(args.id, withoutEmptyPassword(args.body))
        : doctorsApi.create(withoutEmptyPassword(args.body)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
      toast.success("Shifokor saqlandi");
    },
  });

  const deleteDoctorMut = useMutation({
    mutationFn: doctorsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
      toast.success("Shifokor o'chirildi");
    },
  });

  const saveVisitMut = useMutation({
    mutationFn: (args: { id?: string; body: Omit<Visit, 'id'> | Partial<Visit> }) =>
      args.id ? visitsApi.update(args.id, args.body as Partial<Visit>) : visitsApi.create(args.body as Omit<Visit, 'id'>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients }); // balance
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
      toast.success('Tashrif saqlandi');
    },
  });

  const dialog = useDialogState<Doctor>(DoctorService.initialState());

  const handleSaveDoctor = useCallback(
    (data: DoctorFormValues) => {
      const { daysOffText, schedule, ...rest } = data;
      const daysOff = daysOffText
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const body = {
        ...rest,
        schedule: schedule as Doctor['schedule'],
        ...(daysOff != null && daysOff.length > 0 ? { daysOff } : {}),
      } as DoctorCreatePayload;
      const id = dialog.editingItem?.id;
      saveDoctorMut.mutate(id ? { id, body } : { body }, { onSettled: () => dialog.closeDialog() });
    },
    [dialog, saveDoctorMut],
  );

  const handleDeleteDoctor = useCallback(() => {
    if (deleteId) {
      deleteDoctorMut.mutate(deleteId, { onSettled: () => setDeleteId(null) });
    }
  }, [deleteId, deleteDoctorMut]);

  const openVisitForm = useCallback((doctor: Doctor, visit?: Visit) => {
    setSelectedDoctor(doctor);
    setEditingVisit(visit || null);
    setVisitModal(true);
  }, []);

  const handleSaveVisit = useCallback(
    (data: VisitFormValues) => {
      if (!selectedDoctor) {
        toast.error('Iltimos, shifokorni tanlang');
        return;
      }
      const today = clinicToday();
      if (editingVisit) {
        saveVisitMut.mutate(
          { id: editingVisit.id, body: data as Partial<Visit> },
          { onSettled: () => setVisitModal(false) },
        );
      } else {
        saveVisitMut.mutate(
          {
            body: {
              patientId: data.patientId,
              doctorId: selectedDoctor.id,
              date: today,
              status: data.status,
              diagnosis: data.diagnosis ?? '',
              treatment: data.treatment ?? '',
              notes: data.notes ?? '',
            } as Omit<Visit, 'id'>,
          },
          { onSettled: () => setVisitModal(false) },
        );
      }
    },
    [selectedDoctor, editingVisit, saveVisitMut],
  );

  return {
    doctors: table.data,
    totalDoctors: table.totalCount,
    totalPages: table.totalPages,
    page: table.page,
    setPage: table.setPage,
    search: table.search,
    setSearch: table.setSearch,
    sort: table.sort,
    setSort: table.setSort,
    filters: table.filters,
    setFilters: table.setFilters,
    patients,
    modalOpen: dialog.isOpen,
    setModalOpen: dialog.setIsOpen,
    editing: dialog.editingItem,
    deleteId,
    setDeleteId,
    selectedDoctor,
    visitModal,
    setVisitModal,
    editingVisit,
    openCreate: dialog.openCreate,
    openEdit: (d: Doctor) => dialog.openEdit(d, DoctorService.mapToForm),
    handleSaveDoctor,
    handleDeleteDoctor,
    openVisitForm,
    handleSaveVisit,
    isLoading: table.isLoading,
    error: table.error,
    refetch: table.refetch,
    stats,
    efficiency: efficiencyData ?? [],
  };
};

export const useDoctor = (id: string) => {
  const authed = useStore((s) => s.isAuthenticated);
  
  return useQuery({
    queryKey: queryKeys.doctor(id),
    queryFn: () => doctorsApi.get(id),
    enabled: authed && !!id,
  });
};

