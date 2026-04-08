import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { PaymentStatusBadge } from '@/components/StatusBadge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { Payment, PaymentMethod, PaymentStatus } from '@/types';
import { toast } from 'sonner';

const methods: PaymentMethod[] = ['cash', 'card', 'transfer', 'insurance'];
const methodLabels: Record<PaymentMethod, string> = {
  cash: 'Naqd', card: 'Karta', transfer: 'O\'tkazma', insurance: 'Sug\'urta',
};
const payStatuses: PaymentStatus[] = ['paid', 'partial', 'unpaid'];
const payStatusLabels: Record<PaymentStatus, string> = {
  paid: 'To\'langan', partial: 'Qisman', unpaid: 'To\'lanmagan',
};

export default function FinancePage() {
  const { payments, patients, addPayment, updatePayment, deletePayment } = useStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({ patientId: '', amount: '', method: 'cash' as PaymentMethod, status: 'unpaid' as PaymentStatus, description: '' });

  const totalRevenue = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalDebt = payments.filter((p) => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);
  const thisMonth = payments.filter((p) => p.date >= '2024-03-01' && p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  const filtered = payments.filter((p) => {
    const patient = patients.find((pt) => pt.id === p.patientId);
    const matchSearch = !search || `${patient?.firstName} ${patient?.lastName} ${p.description}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openCreate = () => { setEditing(null); setForm({ patientId: '', amount: '', method: 'cash', status: 'unpaid', description: '' }); setModalOpen(true); };
  const openEdit = (p: Payment) => { setEditing(p); setForm({ patientId: p.patientId, amount: String(p.amount), method: p.method, status: p.status, description: p.description }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.patientId || !form.amount) { toast.error('Iltimos, majburiy maydonlarni to\'ldiring'); return; }
    if (editing) { updatePayment(editing.id, { ...form, amount: Number(form.amount) }); toast.success('To\'lov yangilandi'); }
    else { addPayment({ id: `pay${Date.now()}`, ...form, amount: Number(form.amount), date: new Date().toISOString().split('T')[0] }); toast.success('To\'lov qayd etildi'); }
    setModalOpen(false);
  };

  const handleDelete = () => { if (deleteId) { deletePayment(deleteId); toast.success('To\'lov o\'chirildi'); setDeleteId(null); } };

  const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(n);

  return (
    <div className="space-y-4">
      <PageHeader title="Moliya" description="Daromad va to'lovlarni boshqarish" action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />To'lov qayd etish</Button>} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Umumiy daromad" value={`${fmt(totalRevenue)} so'm`} icon={<DollarSign className="w-5 h-5" />} trend="Barcha vaqt uchun" trendUp />
        <StatCard title="Shu oy" value={`${fmt(thisMonth)} so'm`} icon={<TrendingUp className="w-5 h-5" />} trend="Mart 2024" trendUp />
        <StatCard title="Qarzdorlik" value={`${fmt(totalDebt)} so'm`} icon={<AlertTriangle className="w-5 h-5" />} trend={`${payments.filter(p=>p.status!=='paid').length} ta to'lanmagan`} trendUp={false} />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Qidirish..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Holat" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {payStatuses.map((s) => <SelectItem key={s} value={s}>{payStatusLabels[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? <EmptyState /> : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bemor</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tavsif</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Summa</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usul</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Holat</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sana</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amallar</th>
              </tr></thead>
              <tbody>
                {filtered.map((p) => {
                  const patient = patients.find((pt) => pt.id === p.patientId);
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{patient?.firstName} {patient?.lastName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.description}</td>
                      <td className="px-4 py-3 font-medium">{fmt(p.amount)} so'm</td>
                      <td className="px-4 py-3 text-muted-foreground">{methodLabels[p.method]}</td>
                      <td className="px-4 py-3"><PaymentStatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{p.date}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(p)}><Pencil className="w-4 h-4 mr-2" />Tahrirlash</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="w-4 h-4 mr-2" />O'chirish</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'To\'lovni tahrirlash' : 'Yangi to\'lov qayd etish'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Bemor</Label>
              <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
                <SelectTrigger><SelectValue placeholder="Bemorni tanlang" /></SelectTrigger>
                <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Summa (so'm)</Label><Input type="number" placeholder="150000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>To'lov usuli</Label>
                <Select value={form.method} onValueChange={(v: PaymentMethod) => setForm({ ...form, method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{methods.map((m) => <SelectItem key={m} value={m}>{methodLabels[m]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Holat</Label>
                <Select value={form.status} onValueChange={(v: PaymentStatus) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{payStatuses.map((s) => <SelectItem key={s} value={s}>{payStatusLabels[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Tavsif</Label><Input placeholder="Xizmat tavsifi..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <Button className="w-full" onClick={handleSave}>{editing ? 'Yangilash' : 'Qayd etish'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
