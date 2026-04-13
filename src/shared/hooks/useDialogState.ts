import { useState, useCallback } from 'react';

export const useDialogState = <T extends object, F extends object = Record<string, unknown>>(initialFormState: F) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [form, setForm] = useState(initialFormState);

  const openCreate = useCallback(() => {
    setEditingItem(null);
    setForm(initialFormState);
    setIsOpen(true);
  }, [initialFormState]);

  const openEdit = useCallback((item: T, formMapper: (item: T) => F) => {
    setEditingItem(item);
    setForm(formMapper(item));
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    setIsOpen,
    editingItem,
    setEditingItem,
    form,
    setForm,
    openCreate,
    openEdit,
    closeDialog,
  };
};
