import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { Plus, Search, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PAYMENT_STATUSES, PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/shared/constants';
import { useFinance } from '../hooks/useFinance';
import { TransactionForm } from '../components/TransactionForm';
import { DataTable, Column } from '@/shared/components/DataTable';
import { Payment } from '@/shared/types';
import { formatUzS, formatDate } from '@/shared/lib/formatters';
import { PaymentStatusBadge } from '@/shared/components/StatusBadge';

export function FinancePageContent() {
  const {
    payments,
    patients,
    totalRevenue,
    thisMonth,
    totalDebt,
    unpaidCount,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    modalOpen,
    setModalOpen,
    editing,
    deleteId,
    setDeleteId,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
  } = useFinance();

  const columns: Column<Payment>[] = [
    { 
      header: 'Bemor', 
      accessor: (p) => {
        const pt = patients.find(pt => pt.id === p.patientId);
        return `${pt?.firstName} ${pt?.lastName}`;
      }
    },
    { header: 'Tavsif', accessor: 'description' },
    { 
      header: 'Summa', 
      accessor: (p) => <span className="font-medium">{formatUzS(p.amount)}</span> 
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

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Moliya" 
        description="Daromad va to'lovlarni boshqarish" 
        action={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            To'lov qayd etish
          </Button>
        } 
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          title="Umumiy daromad" 
          value={formatUzS(totalRevenue)} 
          icon={<DollarSign className="w-5 h-5" />} 
          trend="Barcha vaqt uchun" 
          trendUp 
        />
        <StatCard 
          title="Shu oy" 
          value={formatUzS(thisMonth)} 
          icon={<TrendingUp className="w-5 h-5" />} 
          trend="Mart 2024" 
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

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Qidirish..." 
            className="pl-9" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Holat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable 
        data={payments} 
        columns={columns} 
        onEdit={openEdit} 
        onDelete={setDeleteId} 
      />

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
    </div>
  );
}

const FinancePage = () => (
  <ErrorBoundary name="Moliya">
    <FinancePageContent />
  </ErrorBoundary>
);

export default FinancePage;

