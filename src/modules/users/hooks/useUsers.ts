import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { usersApi } from '@/lib/api/endpoints';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import { useDialogState } from '@/shared/hooks/useDialogState';
import { SessionUser } from '@/shared/types/auth';
import type { SortOrder } from '@/lib/api/endpoints';
import type { SortField } from '@/lib/api/sort-fields';

export type UsersSort = { sortBy?: SortField<'users'>; order?: SortOrder };

type UserBody = Parameters<typeof usersApi.create>[0];

export const useUsers = () => {
  const authed = useStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // GET /users is a plain array — sorting is server-side, search is local
  const [sort, setSort] = useState<UsersSort>({});

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', 'list', sort],
    queryFn: () => usersApi.list(sort.sortBy ? sort : undefined),
    enabled: authed,
  });

  const saveMut = useMutation({
    mutationFn: (args: { id?: string; body: Partial<UserBody> }) =>
      args.id ? usersApi.update(args.id, args.body) : usersApi.create(args.body as UserBody),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Xodim ma'lumotlari saqlandi");
    },
  });

  const deleteMut = useMutation({
    mutationFn: usersApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Xodim o'chirildi");
    },
  });

  /** Nofaol qilish / Faollashtirish. The server's 409 message (yourself / last admin) is toasted globally. */
  const [toggleTarget, setToggleTarget] = useState<SessionUser | null>(null);
  const activeMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => usersApi.update(id, { isActive }),
    onSuccess: (_u, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(isActive ? 'Xodim faollashtirildi' : 'Xodim nofaol qilindi');
    },
  });

  const handleToggleActive = useCallback(() => {
    if (!toggleTarget) return;
    activeMut.mutate(
      { id: toggleTarget.id, isActive: toggleTarget.isActive === false },
      { onSettled: () => setToggleTarget(null) },
    );
  }, [toggleTarget, activeMut]);

  const dialog = useDialogState<SessionUser, Record<string, unknown>>({ name: '', phone: '', role: 'receptionist', password: '' });

  const handleSave = useCallback(
    (data: Partial<UserBody>) => {
      if (saveMut.isPending) return;
      const id = dialog.editingItem?.id;
      saveMut.mutate(
        { id, body: data },
        { onSuccess: () => dialog.closeDialog() }
      );
    },
    [dialog, saveMut]
  );

  const handleDelete = useCallback(() => {
    if (deleteId) {
      deleteMut.mutate(deleteId, { onSettled: () => setDeleteId(null) });
    }
  }, [deleteId, deleteMut]);

  return {
    isSaving: saveMut.isPending,
    users,
    isLoading,
    sort,
    setSort,
    modalOpen: dialog.isOpen,
    setModalOpen: dialog.setIsOpen,
    editing: dialog.editingItem,
    openCreate: dialog.openCreate,
    openEdit: (u: SessionUser) => dialog.openEdit(u, (item) => ({ 
      name: item.name, 
      phone: item.phone, 
      role: item.role,
      specialty: item.specialty,
      password: '' 
    })),
    handleSave,
    setDeleteId,
    deleteId,
    handleDelete,
    toggleTarget,
    setToggleTarget,
    handleToggleActive,
    isTogglingActive: activeMut.isPending,
  };
};
