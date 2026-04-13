// refactor using new hooks
import { useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Booking, BookingStatus } from '@/shared/types';
import { BOOKING_STATUS_LABELS } from '@/shared/constants';
import { toast } from 'sonner';
import { useDataTable } from '@/shared/hooks/useDataTable';
import { useDialogState } from '@/shared/hooks/useDialogState';
import { BookingService } from '../services/booking.service';
import { BookingSchema } from '@/shared/lib/validation';
import { z } from 'zod';

type BookingFormValues = z.infer<typeof BookingSchema>;

export const useBookings = () => {
  const bookings = useStore((state) => state.bookings);
  const patients = useStore((state) => state.patients);
  const doctors = useStore((state) => state.doctors);
  const addBooking = useStore((state) => state.addBooking);
  const updateBooking = useStore((state) => state.updateBooking);
  const deleteBooking = useStore((state) => state.deleteBooking);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);

  const dialog = useDialogState<Booking>(BookingService.initialState());
  
  const table = useDataTable<Booking>({
    data: bookings,
    filterFn: (b, search, filters) => {
      const patient = patients.find((p) => p.id === b.patientId);
      const matchSearch = !search || `${patient?.firstName} ${patient?.lastName}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filters.status === 'all' || b.status === filters.status;
      const matchSource = filters.source === 'all' || b.source === filters.source;
      return matchSearch && matchStatus && matchSource;
    },
    initialFilters: { status: 'all', source: 'all' }
  });

  const handleSave = useCallback((data: BookingFormValues) => {
    if (dialog.editingItem) {
      updateBooking(dialog.editingItem.id, { ...data });
      toast.success('Qabul muvaffaqiyatli yangilandi');
    } else {
      addBooking({ 
        id: `b${Date.now()}`, 
        ...data, 
        createdAt: new Date().toISOString().split('T')[0] 
      } as Booking);
      toast.success('Yangi qabul yaratildi');
    }
    dialog.closeDialog();
  }, [dialog, addBooking, updateBooking]);

  const handleStatusChange = useCallback((id: string, status: BookingStatus) => {
    updateBooking(id, { status });
    toast.success(`Holat "${BOOKING_STATUS_LABELS[status]}" ga o'zgartirildi`);
  }, [updateBooking]);

  return {
    bookings: table.data,
    totalBookings: table.totalCount,
    totalPages: table.totalPages,
    page: table.page,
    setPage: table.setPage,
    search: table.search,
    setSearch: table.setSearch,
    filterStatus: table.filters.status,
    setFilterStatus: (v: string) => table.setFilters('status', v),
    filterSource: table.filters.source,
    setFilterSource: (v: string) => table.setFilters('source', v),
    
    // Dialog
    modalOpen: dialog.isOpen,
    setModalOpen: dialog.setIsOpen,
    editing: dialog.editingItem,
    openCreate: dialog.openCreate,
    openEdit: (b: Booking) => dialog.openEdit(b, BookingService.mapToForm),
    
    // Others
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
        deleteBooking(deleteId);
        toast.success("Qabul o'chirildi");
        setDeleteId(null);
      }
    }
  };
};
