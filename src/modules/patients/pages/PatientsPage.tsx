import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { Plus, Search, Filter, Download } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { usePatients } from '../hooks/usePatients';
import { PatientForm } from '../components/PatientForm';
import { DataTable, Column } from '@/shared/components/DataTable';
import { Patient } from '@/shared/types';
import { SourceBadge } from '@/shared/components/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatCurrency } from '@/shared/lib/formatters';
import { StatCard } from '@/shared/components/StatCard';
import { Users, UserPlus, Target } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useCan } from '@/shared/hooks/usePermissions';
import { QueryErrorState } from '@/shared/components/QueryErrorState';
import { fetchAllPages } from '@/lib/api/helpers';
import { clinicToday } from '@/shared/lib/date-utils';
import { BOOKING_SOURCE_LABELS, BOOKING_SOURCES } from '@/shared/constants';
import { exportToExcel } from '@/shared/lib/excel';
import { patientsApi } from '@/lib/api/endpoints';
import { toast } from 'sonner';
import { useState } from "react";

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
    filters,
    setFilters,
    toggleDebtOnly,
    sort,
    setSort,
    modalOpen,
    setModalOpen,
    editing,
    deleteId,
    setDeleteId,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
    isLoading,
    error,
    refetch,
    stats,
  } = usePatients();

  const can = useCan();

  const columns: Column<Patient>[] = [
    { 
      header: 'Ism familiya', 
      sortKey: 'firstName',
      accessor: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground">
            {p.firstName[0]}{p.lastName[0]}
          </div>
          <div>
            <span className="font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(`/patients/${p.id}`)}>
              {p.firstName} {p.lastName}
            </span>
          </div>
        </div>
      )
    },
    { header: 'Yosh', accessor: (p) => `${p.age} yosh`, sortKey: 'age' },
    { header: 'Telefon', accessor: 'phone' },
    { 
      header: 'Shifokor', 
      accessor: (p) => p.assignedDoctor ? `Dr. ${p.assignedDoctor.firstName} ${p.assignedDoctor.lastName}` : '—'
    },
    { 
      header: 'Balans', 
      accessor: (p) => {
        const balance = p.balance || 0;
        const colorClass = balance < 0 ? 'text-destructive' : balance > 0 ? 'text-success' : 'text-muted-foreground';
        return (
          <span className={cn('font-medium', colorClass)}>
            {balance > 0 ? '+' : ''}{formatCurrency(balance)}
          </span>
        );
      }
    },
    { header: 'Manba', accessor: (p) => <SourceBadge source={p.source} /> },
    { 
      header: "Ro'yxatdan o'tgan", 
      accessor: (p) => <span className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</span>,
      className: 'hidden md:table-cell',
      sortKey: 'createdAt',
    },
  ];

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      // every page (the backend caps limit at 100)
      const res = await fetchAllPages(patientsApi.list, { ...filters, search, ...sort });

      const exportData = res.data.map(p => ({
        'Ism': p.firstName,
        'Familiya': p.lastName,
        'Yosh': p.age,
        'Telefon': p.phone,
        'Manba': BOOKING_SOURCE_LABELS[p.source as keyof typeof BOOKING_SOURCE_LABELS] || p.source,
        'Balans': p.balance || 0,
        'Shifokor': p.assignedDoctor ? `Dr. ${p.assignedDoctor.firstName} ${p.assignedDoctor.lastName}` : '—',
        "Ro'yxatdan o'tgan sana": p.createdAt
      }));

      await exportToExcel(exportData, `Bemorlar_Ro'yxati_${clinicToday()}`);
      toast.success("Excel fayl tayyorlandi");
    } catch {
      toast.error("Eksport qilishda xatolik yuz berdi");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Bemorlar" 
        description="Bemorlar ro'yxati va ularning ma'lumotlarini boshqarish" 
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              Excel Export
            </Button>
            {can('patients.create') && (
              <Button onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Bemor qo'shish
              </Button>
            )}
          </div>
        } 
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        <StatCard 
          title="Jami bemorlar" 
          value={stats?.total ?? 0} 
          icon={<Users className="w-5 h-5" />} 
        />
        <StatCard 
          title="Shu oyda yangi" 
          value={stats?.newThisMonth ?? 0} 
          icon={<UserPlus className="w-5 h-5 text-success" />} 
          trend="Yangi qo'shilganlar"
          trendUp={true}
        />
        <StatCard 
          title="Asosiy manba" 
          value={stats?.topSource ?? '—'} 
          icon={<Target className="w-5 h-5 text-primary" />} 
          trend="Eng ko'p kelish"
        />
      </div>

      <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full xl:w-auto items-center">
          <div className="relative w-full md:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Ism, familiya yoki telefon..." 
              className="pl-9 h-10" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>

          <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border">
            <Input 
              type="date" 
              className="w-[140px] h-8 text-xs border-none bg-transparent" 
              value={filters.startDate || ''} 
              onChange={(e) => setFilters('startDate', e.target.value || undefined)}
            />
            <span className="text-muted-foreground text-xs">—</span>
            <Input 
              type="date" 
              className="w-[140px] h-8 text-xs border-none bg-transparent" 
              value={filters.endDate || ''} 
              onChange={(e) => setFilters('endDate', e.target.value || undefined)}
            />
          </div>

          <Select 
            value={filters.source || 'all'} 
            onValueChange={(val) => setFilters('source', val)}
          >
            <SelectTrigger className="w-[160px] h-10">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Manbalar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha manbalar</SelectItem>
              {BOOKING_SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {BOOKING_SOURCE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant={filters.debtOnly === 'true' ? 'destructive' : 'outline'}
            className="h-10"
            onClick={toggleDebtOnly}
          >
            <Users className="w-4 h-4 mr-2" />
            Qarzdorlar
          </Button>
        </div>
      </div>

      {error && !isLoading ? (
        <QueryErrorState error={error} onRetry={() => refetch()} title="Bemorlar ro'yxati yuklanmadi" />
      ) : (
        <DataTable
          data={patients}
          columns={columns}
          onEdit={can('patients.update') ? openEdit : undefined}
          onDelete={can('patients.delete') ? setDeleteId : undefined}
          onView={(p) => navigate(`/patients/${p.id}`)}
          isLoading={isLoading}
          sort={sort}
          onSortChange={setSort}
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card rounded-b-xl border-x">
          <p className="text-xs text-muted-foreground">Jami: {totalPatients} ta bemor</p>
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Oldingi
            </Button>
            <div className="flex items-center px-4 text-sm font-medium">
              {page + 1} / {totalPages}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
            >
              Keyingi
            </Button>
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

