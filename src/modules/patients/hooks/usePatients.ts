import { useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Patient } from '@/shared/types';
import { toast } from 'sonner';
import { useDataTable } from '@/shared/hooks/useDataTable';
import { useDialogState } from '@/shared/hooks/useDialogState';
import { PatientService } from '../services/patient.service';
import { PatientSchema } from '@/shared/lib/validation';
import { z } from 'zod';

type PatientFormValues = z.infer<typeof PatientSchema>;

export const usePatients = () => {
  const patients = useStore((state) => state.patients);
  const addPatient = useStore((state) => state.addPatient);
  const updatePatient = useStore((state) => state.updatePatient);
  const deletePatient = useStore((state) => state.deletePatient);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 1. Base Dialog State
  const dialog = useDialogState<Patient>(PatientService.initialState());

  // 2. Base Table State
  const table = useDataTable<Patient>({
    data: patients,
    filterFn: (p, search) => 
      !search || `${p.firstName} ${p.lastName} ${p.phone}`.toLowerCase().includes(search.toLowerCase())
  });

  const handleSave = useCallback((data: PatientFormValues) => {
    if (dialog.editingItem) {
      updatePatient(dialog.editingItem.id, data);
      toast.success("Bemor ma'lumotlari yangilandi");
    } else {
      addPatient({ 
        id: `p${Date.now()}`, 
        ...data, 
        createdAt: new Date().toISOString().split('T')[0] 
      } as Patient);
      toast.success("Yangi bemor qo'shildi");
    }
    dialog.closeDialog();
  }, [dialog, addPatient, updatePatient]);

  const handleDelete = useCallback(() => { 
    if (deleteId) { 
      deletePatient(deleteId); 
      toast.success("Bemor o'chirildi"); 
      setDeleteId(null); 
    } 
  }, [deleteId, deletePatient]);

  return {
    // Table states
    patients: table.data,
    totalPatients: table.totalCount,
    totalPages: table.totalPages,
    page: table.page,
    setPage: table.setPage,
    search: table.search,
    setSearch: table.setSearch,
    
    // Dialog states
    modalOpen: dialog.isOpen,
    setModalOpen: dialog.setIsOpen,
    editing: dialog.editingItem,
    openCreate: dialog.openCreate,
    openEdit: (p: Patient) => dialog.openEdit(p, PatientService.mapToForm),
    
    // Actions
    handleSave,
    deleteId,
    setDeleteId,
    handleDelete,
  };
};
