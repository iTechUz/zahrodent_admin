import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { Plus, Shield, Phone, Trash2, Edit2, ShieldCheck, UserCog, Search } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { useUsers } from '../hooks/useUsers';
import { UserForm } from '../components/UserForm';
import { roleConfig } from '@/shared/config/roles';
import { cn } from '@/shared/lib/utils';
import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { SEARCH_DEBOUNCE_MS } from '@/shared/hooks/useServerTable';
import type { UsersSort } from '../hooks/useUsers';

/** "<sortBy>:<order>" options of GET /users (backend USER_SORT_FIELDS) */
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'createdAt:desc', label: 'Avval yangilari' },
  { value: 'createdAt:asc', label: 'Avval eskilari' },
  { value: 'name:asc', label: 'Ism (A–Z)' },
  { value: 'name:desc', label: 'Ism (Z–A)' },
  { value: 'phone:asc', label: "Telefon bo'yicha" },
];

function parseSort(value: string): UsersSort {
  const [sortBy, order] = value.split(':') as [UsersSort['sortBy'], UsersSort['order']];
  return { sortBy, order };
}

export function UsersPageContent() {
  const {
    users,
    isLoading,
    modalOpen,
    setModalOpen,
    editing,
    openCreate,
    openEdit,
    handleSave,
    setDeleteId,
    deleteId,
    handleDelete,
    sort,
    setSort,
  } = useUsers();

  const [search, setSearch] = useState('');
  const term = useDebouncedValue(search.trim().toLowerCase(), SEARCH_DEBOUNCE_MS);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (u.role !== 'receptionist') return false;
      return u.name.toLowerCase().includes(term) || u.phone.toLowerCase().includes(term);
    });
  }, [users, term]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Qabulxona xodimlari"
        description="Qabulxona xodimlarini boshqarish"
        action={
          <Button onClick={openCreate} className="gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Xodim qo'shish
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Xodim ismi yoki telefon raqami bo'yicha qidirish..." 
            className="pl-9 bg-card/50 backdrop-blur-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={sort.sortBy ? `${sort.sortBy}:${sort.order ?? 'asc'}` : 'createdAt:desc'}
          onValueChange={(v) => setSort(parseSort(v))}
        >
          <SelectTrigger className="w-full sm:w-[200px]" aria-label="Saralash">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse h-44 rounded-2xl border-border/50 bg-card/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => (
            <Card key={u.id} className="group overflow-hidden border-border/50 bg-card/50 backdrop-blur-md hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-xl shadow-lg shadow-primary/20">
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-background border border-border flex items-center justify-center shadow-sm">
                        {u.role === 'admin' ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        ) : u.role === 'doctor' ? (
                          <Shield className="w-3.5 h-3.5 text-info" />
                        ) : (
                          <UserCog className="w-3.5 h-3.5 text-warning" />
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base leading-tight group-hover:text-primary transition-colors">{u.name}</h3>
                      <Badge 
                        variant="outline" 
                        className={cn('text-[10px] uppercase tracking-wider mt-2 h-5 px-2 border-none font-bold', roleConfig[u.role as keyof typeof roleConfig]?.color)}
                      >
                        {roleConfig[u.role as keyof typeof roleConfig]?.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(u)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteId(u.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-border/30 space-y-3">
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground/80">
                    <div className="p-1.5 rounded-lg bg-secondary/50">
                      <Phone className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium">{u.phone}</span>
                  </div>
                  {u.specialty && (
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground/80">
                      <div className="p-1.5 rounded-lg bg-secondary/50">
                        <Shield className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium">{u.specialty}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredUsers.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-card/30 rounded-3xl border border-dashed border-border mt-8">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <UserCog className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold">Xodimlar topilmadi</h3>
          <p className="text-sm text-muted-foreground">Qidiruv natijasida hech qanday xodim topilmadi.</p>
          <Button variant="outline" className="mt-4" onClick={() => setSearch('')}>
            Filtrlarni tozalash
          </Button>
        </div>
      )}

      <UserForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        onSave={handleSave}
      />

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <ErrorBoundary name="Xodimlar">
      <UsersPageContent />
    </ErrorBoundary>
  );
}
