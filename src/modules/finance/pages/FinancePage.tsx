import {
  Plus, Search, DollarSign, TrendingUp, AlertTriangle,
  Filter, CalendarDays, CreditCard, Stethoscope, BarChart3, Download
} from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PAYMENT_STATUSES, PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/shared/constants';
import { useFinance } from '../hooks/useFinance';
import { TransactionForm } from '../components/TransactionForm';
import { DataTable, Column } from '@/shared/components/DataTable';
import { Payment } from '@/shared/types';
import { formatUzS, formatDate } from '@/shared/lib/formatters';
import { PaymentStatusBadge } from '@/shared/components/StatusBadge';
import { exportToExcel } from '@/shared/lib/excel';
import { paymentsApi } from '@/lib/api/endpoints';
import { fetchAllPages } from '@/lib/api/helpers';
import { clinicToday } from '@/shared/lib/date-utils';
import { QueryErrorState } from '@/shared/components/QueryErrorState';
import { toast } from 'sonner';
import { useState } from 'react';

import { ErrorBoundary } from "@/shared/components/ErrorBoundary";

export function FinancePageContent() {
  const {
    payments,
    totalCount,
    totalPages,
    page,
    setPage,
    patients,
    doctorRevenue,
    totalRevenue,
    thisMonth,
    todayRevenue,
    totalDebt,
    unpaidCount,
    search,
    setSearch,
    filters,
    setFilters,
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
  } = useFinance();

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      // every page (the backend caps limit at 100)
      const res = await fetchAllPages(paymentsApi.list, { ...filters, search });

      const exportData = res.data.map(p => {
        const pt = patients.find(patient => patient.id === p.patientId);
        return {
          'Bemor': `${pt?.firstName ?? ''} ${pt?.lastName ?? ''}`.trim() || '—',
          'Summa': p.amount,
          'Turi': p.type === 'EXPENSE' ? 'Chiqim' : 'Kirim',
          'Usul': PAYMENT_METHOD_LABELS[p.method as keyof typeof PAYMENT_METHOD_LABELS] || p.method,
          'Holat': PAYMENT_STATUS_LABELS[p.status as keyof typeof PAYMENT_STATUS_LABELS] || p.status,
          'Sana': p.date,
          'Tavsif': p.description || ''
        };
      });

      await exportToExcel(exportData, `Moliya_Hisoboti_${clinicToday()}`);
      toast.success("Excel fayl tayyorlandi");
    } catch {
      toast.error("Eksport qilishda xatolik yuz berdi");
    } finally {
      setIsExporting(false);
    }
  };

  const columns: Column<Payment>[] = [
    {
      header: 'Bemor',
      accessor: (p) => {
        const pt = patients.find(pt => pt.id === p.patientId);
        return `${pt?.firstName ?? ''} ${pt?.lastName ?? ''}`.trim() || '—';
      }
    },
    { header: 'Tavsif', accessor: 'description' },
    {
      header: 'Summa',
      accessor: (p) => <span className="font-semibold">{formatUzS(p.amount)}</span>
    },
    { 
      header: 'Turi', 
      accessor: (p) => (
        <span className={p.type === 'EXPENSE' ? 'text-destructive' : 'text-success'}>
          {p.type === 'EXPENSE' ? 'Chiqim' : 'Kirim'}
        </span>
      )
    },
    { 
      header: 'Usul', 
      accessor: (p) => PAYMENT_METHOD_LABELS[p.method as keyof typeof PAYMENT_METHOD_LABELS]
    },
    {
      header: 'Holat',
      accessor: (p) => <PaymentStatusBadge status={p.status} />
    },
    {
      header: 'Sana',
      accessor: (p) => <span className="text-xs text-muted-foreground">{formatDate(p.date)}</span>
    },
  ];

  const maxDoctorTotal = doctorRevenue[0]?.total ?? 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Moliya"
        description="Daromad va to'lovlarni boshqarish"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              Excel Export
            </Button>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              To'lov qo'shish
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="all" className="space-y-6" onValueChange={(val) => setFilters('type', val)}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="all">Barchasi</TabsTrigger>
          <TabsTrigger value="INCOME">Kirimlar</TabsTrigger>
          <TabsTrigger value="EXPENSE">Chiqimlar</TabsTrigger>
        </TabsList>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Umumiy daromad"
          value={formatUzS(totalRevenue)}
          icon={<DollarSign className="w-5 h-5" />}
          trend="Barcha vaqt uchun"
          trendUp
        />
        <StatCard
          title="Shu oy daromadi"
          value={formatUzS(thisMonth)}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={`Bugun: ${formatUzS(todayRevenue)}`}
          trendUp
        />
        <StatCard
          title="Qarzdorlik"
          value={formatUzS(totalDebt)}
          icon={<AlertTriangle className="w-5 h-5" />}
          trend={`${unpaidCount} ta to'lanmagan`}
          trendUp={false}
        />
      </div>

      {/* Doctor Revenue Breakdown */}
      {doctorRevenue.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-primary/10">
              <Stethoscope className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Shifokorlar bo'yicha daromad</h2>
              <p className="text-[10px] text-muted-foreground">Faqat tashrifga bog'liq to'lovlar hisobi</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <BarChart3 className="w-3.5 h-3.5" />
              Jami: {formatUzS(totalRevenue)}
            </div>
          </div>

          <div className="space-y-4">
            {doctorRevenue.map((dr) => (
              <div key={dr.doctorId} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {dr.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight">{dr.name}</p>
                      {dr.specialty && (
                        <p className="text-[10px] text-muted-foreground">{dr.specialty}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatUzS(dr.total)}</p>
                    <p className="text-[10px] text-muted-foreground">{dr.percent}% umumiy</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: `${(dr.total / maxDoctorTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Bemor yoki tavsif bo'yicha qidirish..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border h-10">
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
          value={filters.dateRange || 'all'}
          onValueChange={(val) => {
            setFilters('dateRange', val);
            // Clear custom dates if quick range is selected
            if (val !== 'all') {
              setFilters('startDate', undefined);
              setFilters('endDate', undefined);
            }
          }}
        >
          <SelectTrigger className="w-[150px]">
            <CalendarDays className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Vaqt" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="today">Bugun</SelectItem>
            <SelectItem value="week">Shu hafta</SelectItem>
            <SelectItem value="month">Shu oy</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.status || 'all'}
          onValueChange={(val) => setFilters('status', val)}
        >
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Holat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha holatlar</SelectItem>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.method || 'all'}
          onValueChange={(val) => setFilters('method', val)}
        >
          <SelectTrigger className="w-[150px]">
            <CreditCard className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Usul" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha usullar</SelectItem>
            <SelectItem value="cash">Naqd</SelectItem>
            <SelectItem value="card">Terminal</SelectItem>
            <SelectItem value="transfer">O'tkazma</SelectItem>
            <SelectItem value="insurance">Sug'urta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      {error && !isLoading ? (
        <QueryErrorState error={error} onRetry={() => refetch()} title="To'lovlar yuklanmadi" />
      ) : (
        <DataTable
          data={payments}
          columns={columns}
          onEdit={openEdit}
          onDelete={setDeleteId}
          isLoading={isLoading}
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card rounded-b-xl border-x">
          <p className="text-xs text-muted-foreground">Jami: {totalCount} ta to'lov</p>
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

      <TransactionForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        patients={patients}
        onSave={handleSave}
      />

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
      </Tabs>
    </div>
  );
}

const FinancePage = () => (
  <ErrorBoundary name="Moliya">
    <FinancePageContent />
  </ErrorBoundary>
);

export default FinancePage;
