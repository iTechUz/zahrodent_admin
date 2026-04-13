import { useState, useCallback, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Service } from '@/shared/types';
import { toast } from 'sonner';
import { useDialogState } from '@/shared/hooks/useDialogState';
import { ServiceModuleService } from '../services/service.service';
import { ServiceSchema } from '@/shared/lib/validation';
import { z } from 'zod';

type ServiceFormValues = z.infer<typeof ServiceSchema>;

export const CATEGORIES = ['Davolash', 'Ortodontiya', 'Xirurgiya', 'Gigiyena'];

export const useServices = () => {
  const services = useStore((state) => state.services);
  const addService = useStore((state) => state.addService);
  const updateService = useStore((state) => state.updateService);
  const deleteService = useStore((state) => state.deleteService);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const dialog = useDialogState<Service>(ServiceModuleService.initialState());

  const filtered = useMemo(() => {
    return services.filter((s) => 
      !search || s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [services, search]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(services.map((s) => s.category)));
    return unique.length > 0 ? unique : CATEGORIES;
  }, [services]);

  const [filterCategory, setFilterCategory] = useState<string>('all');

  const finalFiltered = useMemo(() => {
    return filtered.filter(s => filterCategory === 'all' || s.category === filterCategory);
  }, [filtered, filterCategory]);

  const groupedServices = useMemo(() => {
    return finalFiltered.reduce((acc, service) => {
      if (!acc[service.category]) acc[service.category] = [];
      acc[service.category].push(service);
      return acc;
    }, {} as Record<string, Service[]>);
  }, [finalFiltered]);

  const handleSave = useCallback((data: ServiceFormValues) => {
    if (dialog.editingItem) { 
      updateService(dialog.editingItem.id, data); 
      toast.success("Xizmat yangilandi"); 
    } else { 
      addService({ id: `s${Date.now()}`, ...data } as Service); 
      toast.success("Yangi xizmat qo'shildi"); 
    }
    dialog.closeDialog();
  }, [dialog, addService, updateService]);

  const handleDelete = useCallback(() => { 
    if (deleteId) { 
      deleteService(deleteId); 
      toast.success("Xizmat o'chirildi"); 
      setDeleteId(null); 
    } 
  }, [deleteId, deleteService]);

  return {
    services: finalFiltered,
    groupedServices,
    categories,
    search,
    setSearch,
    filterCategory,
    setFilterCategory,
    modalOpen: dialog.isOpen,
    setModalOpen: dialog.setIsOpen,
    editing: dialog.editingItem,
    deleteId,
    setDeleteId,
    openCreate: dialog.openCreate,
    openEdit: (s: Service) => dialog.openEdit(s, ServiceModuleService.mapToForm),
    handleSave,
    handleDelete,
  };
};
