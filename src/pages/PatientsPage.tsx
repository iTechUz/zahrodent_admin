import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { SourceBadge } from '@/components/StatusBadge';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import { Patient, BookingSource } from '@/types';
import { toast } from 'sonner';

const sources: BookingSource[] = ['walk-in', 'telegram', 'website', 'phone'];
const sourceLabels: Record<BookingSource, string> = {
  'walk-in': 'Shaxsan', telegram: 'Telegram', website: 'Veb-sayt', phone: 'Telefon',
};

export default function PatientsPage() {
  const { patients, addPatient, updatePatient, deletePatient } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const perPage = 8;

  const [form, setForm] = useState({ firstName: '', lastName: '', age: '', phone: '', source: 'walk-in' as BookingSource, notes: '', allergies: '', bloodType: '' });

  const filtered = patients.filter((p) =>
    !search || `${p.firstName} ${p.lastName} ${p.phone}`.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const openCreate = () => { setEditing(null); setForm({ firstName: '', lastName: '', age: '', phone: '', source: 'walk-in', notes: '', allergies: '', bloodType: '' }); setModalOpen(true); };
  const openEdit = (p: Patient) => { setEditing(p); setForm({ firstName: p.firstName, lastName: p.lastName, age: String(p.age), phone: p.phone, source: p.source, notes: p.notes, allergies: p.allergies || '', bloodType: p.bloodType || '' }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.firstName || !form.lastName || !form.phone) { toast.error('Iltimos, majburiy maydonlarni to\'ldiring'); return; }
    const data = { firstName: form.firstName, lastName: form.lastName, age: Number(form.age), phone: form.phone, source: form.source, notes: form.notes, allergies: form.allergies || undefined, bloodType: form.bloodType || undefined };
    if (editing) {
      updatePatient(editing.id, data);
      toast.success('Bemor ma\'lumotlari yangilandi');
    } else {
      addPatient({ id: `p${Date.now()}`, ...data, createdAt: new Date().toISOString().split('T')[0] });
      toast.success('Yangi bemor qo\'shildi');
    }
    setModalOpen(false);
  };

  const handleDelete = () => { if (deleteId) { deletePatient(deleteId); toast.success('Bemor o\'chirildi'); setDeleteId(null); } };

  return (
    <div className="space-y-4">
      <PageHeader title="Bemorlar" description="Bemorlar ro'yxati va ularning ma'lumotlarini boshqarish" action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Bemor qo'shish</Button>} />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Ism, familiya yoki telefon bo'yicha qidirish..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
      </div>

      {paginated.length === 0 ? <EmptyState /> : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ism familiya</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Yosh</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Telefon</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Manba</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Ro'yxatdan o'tgan</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(`/patients/${p.id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground">{p.firstName[0]}{p.lastName[0]}</div>
                        <div>
                          <span className="font-medium">{p.firstName} {p.lastName}</span>
                          {(p.allergies || p.bloodType) && (
                            <div className="flex gap-1 mt-0.5">
                              {p.bloodType && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">{p.bloodType}</span>}
                              {p.allergies && <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning">⚠ {p.allergies}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.age} yosh</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.phone}</td>
                    <td className="px-4 py-3"><SourceBadge source={p.source} /></td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.createdAt}</td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/patients/${p.id}`)}><Eye className="w-4 h-4 mr-2" />Profil</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(p)}><Pencil className="w-4 h-4 mr-2" />Tahrirlash</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="w-4 h-4 mr-2" />O'chirish</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Jami: {filtered.length} ta bemor</p>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button key={i} variant={page === i ? 'default' : 'ghost'} size="sm" className="h-7 w-7 p-0" onClick={() => setPage(i)}>{i + 1}</Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Yaratish/Tahrirlash */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Bemorni tahrirlash' : 'Yangi bemor qo\'shish'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Ism *</Label><Input placeholder="Masalan: Ali" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
              <div><Label>Familiya *</Label><Input placeholder="Masalan: Valiyev" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Yosh</Label><Input type="number" placeholder="25" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
              <div><Label>Telefon *</Label><Input placeholder="+998 90 123 4567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Qon guruhi</Label>
                <Select value={form.bloodType || 'none'} onValueChange={v => setForm({ ...form, bloodType: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Noma'lum</SelectItem>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Manba</Label>
                <Select value={form.source} onValueChange={(v: BookingSource) => setForm({ ...form, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{sources.map((s) => <SelectItem key={s} value={s}>{sourceLabels[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Allergiyalar</Label><Input placeholder="Masalan: Lidokain, Penisilin" value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} /></div>
            <div><Label>Izoh</Label><Textarea placeholder="Bemor haqida qo'shimcha ma'lumot..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button className="w-full" onClick={handleSave}>{editing ? 'Yangilash' : 'Qo\'shish'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
