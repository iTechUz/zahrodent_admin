import { useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Payment } from '@/shared/types';
import { toast } from 'sonner';
import { useDataTable } from '@/shared/hooks/useDataTable';
import { useDialogState } from '@/shared/hooks/useDialogState';
import { FinanceService } from '../services/finance.service';
import { PaymentSchema } from '@/shared/lib/validation';
import { z } from 'zod';

type PaymentFormValues = z.infer<typeof PaymentSchema>;

export const useFinance = () => {
  const payments = useStore((state) => state.payments);
  const patients = useStore((state) => state.patients);
  const addPayment = useStore((state) => state.addPayment);
  const updatePayment = useStore((state) => state.updatePayment);
  const deletePayment = useStore((state) => state.deletePayment);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const dialog = useDialogState<Payment>(FinanceService.initialState());

  const totalRevenue = payments
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + p.amount, 0);
    
  const totalDebt = payments
    .filter((p) => p.status !== 'paid')
    .reduce((s, p) => s + p.amount, 0);
    
  const thisMonth = payments
    .filter((p) => p.date >= '2024-03-01' && p.status === 'paid')
    .reduce((s, p) => s + p.amount, 0);

  const table = useDataTable<Payment>({
    data: payments,
    filterFn: (p, search, filters) => {
      const patient = patients.find((pt) => pt.id === p.patientId);
      const matchSearch = !search || `${patient?.firstName} ${patient?.lastName} ${p.description}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filters.status === 'all' || p.status === filters.status;
      return matchSearch && matchStatus;
    },
    initialFilters: { status: 'all' }
  });

  const handleSave = useCallback((data: PaymentFormValues) => {
    if (dialog.editingItem) {
      updatePayment(dialog.editingItem.id, data);
      toast.success("To'lov yangilandi");
    } else {
      addPayment({ 
        id: `pay${Date.now()}`, 
        ...data, 
        date: new Date().toISOString().split('T')[0] 
      } as Payment);
      toast.success("To'lov qayd etildi");
    }
    dialog.closeDialog();
  }, [dialog, addPayment, updatePayment]);

  const handleDelete = useCallback(() => { 
    if (deleteId) { 
      deletePayment(deleteId); 
      toast.success("To'lov o'chirildi"); 
      setDeleteId(null); 
    } 
  }, [deleteId, deletePayment]);

  return {
    payments: table.data,
    patients,
    totalRevenue,
    thisMonth,
    totalDebt,
    unpaidCount: payments.filter(p => p.status !== 'paid').length,
    search: table.search,
    setSearch: table.setSearch,
    filterStatus: table.filters.status,
    setFilterStatus: (v: string) => table.setFilters('status', v),
    modalOpen: dialog.isOpen,
    setModalOpen: dialog.setIsOpen,
    editing: dialog.editingItem,
    deleteId,
    setDeleteId,
    openCreate: dialog.openCreate,
    openEdit: (p: Payment) => dialog.openEdit(p, FinanceService.mapToForm),
    handleSave,
    handleDelete,
  };
};
