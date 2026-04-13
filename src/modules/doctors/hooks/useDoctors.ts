// refactor using new hooks
import { useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Doctor, Visit } from '@/shared/types';
import { toast } from 'sonner';
import { useDialogState } from '@/shared/hooks/useDialogState';
import { DoctorService } from '../services/doctor.service';
import { DoctorSchema, VisitSchema } from '@/shared/lib/validation';
import { z } from 'zod';

type DoctorFormValues = z.infer<typeof DoctorSchema>;
type VisitFormValues = z.infer<typeof VisitSchema>;

export const useDoctors = () => {
  const doctors = useStore((state) => state.doctors);
  const patients = useStore((state) => state.patients);
  const visits = useStore((state) => state.visits);
  const addDoctor = useStore((state) => state.addDoctor);
  const updateDoctor = useStore((state) => state.updateDoctor);
  const deleteDoctor = useStore((state) => state.deleteDoctor);
  const addVisit = useStore((state) => state.addVisit);
  const updateVisit = useStore((state) => state.updateVisit);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [visitModal, setVisitModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);

  const dialog = useDialogState<Doctor>(DoctorService.initialState());

  const handleSaveDoctor = useCallback((data: DoctorFormValues) => {
    if (dialog.editingItem) { 
      updateDoctor(dialog.editingItem.id, data); 
      toast.success("Shifokor ma'lumotlari yangilandi"); 
    } else { 
      addDoctor({ id: `d${Date.now()}`, ...data } as Doctor); 
      toast.success("Yangi shifokor qo'shildi"); 
    }
    dialog.closeDialog();
  }, [dialog, addDoctor, updateDoctor]);

  const handleDeleteDoctor = useCallback(() => { 
    if (deleteId) { 
      deleteDoctor(deleteId); 
      toast.success("Shifokor o'chirildi"); 
      setDeleteId(null); 
    } 
  }, [deleteId, deleteDoctor]);

  const openVisitForm = useCallback((doctor: Doctor, visit?: Visit) => {
    setSelectedDoctor(doctor);
    setEditingVisit(visit || null);
    setVisitModal(true);
  }, []);

  const handleSaveVisit = useCallback((data: VisitFormValues) => {
    if (!selectedDoctor) { 
      toast.error('Iltimos, shifokorni tanlang'); 
      return; 
    }
    if (editingVisit) { 
      updateVisit(editingVisit.id, data); 
      toast.success('Tashrif yangilandi'); 
    } else { 
      addVisit({ 
        id: `v${Date.now()}`, 
        doctorId: selectedDoctor.id, 
        date: new Date().toISOString().split('T')[0], 
        ...data 
      } as Visit); 
      toast.success('Yangi tashrif yaratildi'); 
    }
    setVisitModal(false);
  }, [selectedDoctor, editingVisit, addVisit, updateVisit]);

  return {
    doctors,
    patients,
    visits,
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
  };
};
