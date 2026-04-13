import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePatients } from '../hooks/usePatients';
import { PatientForm } from '../components/PatientForm';
import { DataTable, Column } from '@/shared/components/DataTable';
import { Patient } from '@/shared/types';
import { SourceBadge } from '@/shared/components/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/shared/lib/formatters';

function PatientsPageContent() {
  const navigate = useNavigate();
  const {
    patients,
    totalPatients,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    modalOpen,
    setModalOpen,
    editing,
    deleteId,
    setDeleteId,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
  } = usePatients();

  const columns: Column<Patient>[] = [
    { 
      header: 'Ism familiya', 
      accessor: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground">
            {p.firstName[0]}{p.lastName[0]}
          </div>
          <div>
            <span className="font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(`/patients/${p.id}`)}>
              {p.firstName} {p.lastName}
            </span>
            {(p.allergies || p.bloodType) && (
              <div className="flex gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                {p.bloodType && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">{p.bloodType}</span>}
                {p.allergies && <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning">⚠ {p.allergies}</span>}
              </div>
            )}
          </div>
        </div>
      )
    },
    { header: 'Yosh', accessor: (p) => `${p.age} yosh` },
    { header: 'Telefon', accessor: 'phone' },
    { header: 'Manba', accessor: (p) => <SourceBadge source={p.source} /> },
    { 
      header: "Ro'yxatdan o'tgan", 
      accessor: (p) => <span className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</span>,
      className: 'hidden md:table-cell'
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Bemorlar" 
        description="Bemorlar ro'yxati va ularning ma'lumotlarini boshqarish" 
        action={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Bemor qo'shish
          </Button>
        } 
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Ism, familiya yoki telefon bo'yicha qidirish..." 
          className="pl-9" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      <DataTable 
        data={patients} 
        columns={columns} 
        onEdit={openEdit} 
        onDelete={setDeleteId}
        onView={(p) => navigate(`/patients/${p.id}`)}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card rounded-b-xl border-x">
          <p className="text-xs text-muted-foreground">Jami: {totalPatients} ta bemor</p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <Button 
                key={i} 
                variant={page === i ? 'default' : 'ghost'} 
                size="sm" 
                className="h-7 w-7 p-0" 
                onClick={() => setPage(i)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        </div>
      )}

      <PatientForm 
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

export default function PatientsPage() {
  return (
    <ErrorBoundary name="Bemorlar">
      <PatientsPageContent />
    </ErrorBoundary>
  );
}
