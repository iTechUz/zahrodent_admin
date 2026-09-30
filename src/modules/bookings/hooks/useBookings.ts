import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { Booking, BookingStatus } from '@/shared/types';
import { BOOKING_STATUS_LABELS } from '@/shared/constants';
import { toast } from 'sonner';
import { useDialogState } from '@/shared/hooks/useDialogState';
import { useServerTable } from '@/shared/hooks/useServerTable';
import { BookingService } from '../services/booking.service';
import { BookingSchema } from '@/shared/lib/validation';
import { z } from 'zod';
import { bookingsApi, patientsApi, doctorsApi, servicesApi } from '@/lib/api/endpoints';
import { fetchAllPages } from '@/lib/api/helpers';
import { queryKeys } from '@/lib/api/query-keys';

import { getMonthToDateRange } from '@/shared/lib/date-utils';

type BookingFormValues = z.infer<typeof BookingSchema>;

export const useBookings = () => {
  const authed = useStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);

  const mtd = getMonthToDateRange();

  const table = useServerTable<
    Booking,
    { status?: string; source?: string; dateRange?: string; startDate?: string; endDate?: string }
  >({
    queryKey: queryKeys.bookings,
    fetchFn: (params) => bookingsApi.list(params),
    initialFilters: { 
      status: 'all', 
      source: 'all', 
      dateRange: 'month',
      startDate: mtd.startDate,
      endDate: mtd.endDate
    },
    perPage: 10,
  });

  const { data: stats } = useQuery({
    queryKey: queryKeys.bookingsStats,
    queryFn: () => bookingsApi.stats(),
    enabled: authed,
  });

  // lookups (names in the table, select options): every page — the backend caps limit at 100
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: queryKeys.patientsLookup(),
    queryFn: () => fetchAllPages(patientsApi.list),
    enabled: authed,
  });
  const patients = patientsData?.data ?? [];

  // GET /doctors is allowed for every staff role (doctor included)
  const { data: doctorsData, isLoading: doctorsLoading } = useQuery({
    queryKey: queryKeys.doctorsLookup(),
    queryFn: () => fetchAllPages(doctorsApi.list),
    enabled: authed,
  });
  const doctors = doctorsData?.data ?? [];

  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: queryKeys.servicesLookup(),
    queryFn: () => fetchAllPages(servicesApi.list),
    enabled: authed,
  });
  const services = servicesData?.data ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
  };

  const createMut = useMutation({
    mutationFn: (body: BookingFormValues) => bookingsApi.create(body as Parameters<typeof bookingsApi.create>[0]),
    onSuccess: () => {
      invalidate();
      toast.success('Yangi qabul yaratildi');
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Booking> }) =>
      bookingsApi.update(id, body),
    onSuccess: () => {
      invalidate();
    },
  });

  const deleteMut = useMutation({
    mutationFn: bookingsApi.remove,
    onSuccess: () => {
      invalidate();
      toast.success("Qabul o'chirildi");
    },
  });

  const dialog = useDialogState<Booking>(BookingService.initialState());

  const handleSave = useCallback(
    (data: BookingFormValues) => {
      if (dialog.editingItem) {
        updateMut.mutate(
          { id: dialog.editingItem.id, body: data as Partial<Booking> },
          {
            onSuccess: () => {
              toast.success('Qabul muvaffaqiyatli yangilandi');
              dialog.closeDialog();
            },
          },
        );
      } else {
        // keep the form open on errors (time conflict, past date, outside the doctor's schedule)
        // so the user can fix it; the backend message is shown by the global mutation toast
        createMut.mutate(data, { onSuccess: () => dialog.closeDialog() });
      }
    },
    [dialog, createMut, updateMut],
  );

  const handleStatusChange = useCallback(
    (id: string, status: BookingStatus) => {
      updateMut.mutate(
        { id, body: { status } },
        {
          onSuccess: () =>
            toast.success(`Holat "${BOOKING_STATUS_LABELS[status]}" ga o'zgartirildi`),
        },
      );
    },
    [updateMut],
  );

  return {
    bookings: table.data,
    totalBookings: table.totalCount,
    totalPages: table.totalPages,
    page: table.page,
    setPage: table.setPage,
    search: table.search,
    setSearch: table.setSearch,
    filters: table.filters,
    setFilters: table.setFilters,
    modalOpen: dialog.isOpen,
    setModalOpen: dialog.setIsOpen,
    editing: dialog.editingItem,
    openCreate: dialog.openCreate,
    openEdit: (b: Booking) => dialog.openEdit(b, BookingService.mapToForm),
    patients,
    doctors,
    deleteId,
    setDeleteId,
    viewBooking,
    setViewBooking,
    handleSave,
    handleStatusChange,
    handleDelete: () => {
      if (deleteId) {
        deleteMut.mutate(deleteId, { onSettled: () => setDeleteId(null) });
      }
    },
    services,
    isLoading: table.isLoading || patientsLoading || doctorsLoading || servicesLoading,
    error: table.error,
    refetch: table.refetch,
    sort: table.sort,
    setSort: table.setSort,
    stats,
  };
};

