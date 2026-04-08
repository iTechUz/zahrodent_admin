import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Clock, Tag } from 'lucide-react';
import { Service } from '@/types';
import { toast } from 'sonner';

const categories = ['Diagnostika', 'Profilaktika', 'Davolash', 'Endodontiya', 'Jarrohlik', 'Ortopediya', 'Estetika', 'Ortodontiya', 'Implantologiya'];

const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(n);

export default function ServicesPage() {
  const { services, addService, updateService, deleteService } = useStore();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', category: 'Davolash', price: '', duration: '', description: '' });

  const filtered = services.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'all' || s.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const grouped = categories.reduce((acc, cat) => {
    const items = filtered.filter(s => s.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, Service[]>);

  const openCreate = () => { setEditing(null); setForm({ name: '', category: 'Davolash', price: '', duration: '', description: '' }); setModalOpen(true); };
  const openEdit = (s: Service) => { setEditing(s); setForm({ name: s.name, category: s.category, price: String(s.price), duration: String(s.duration), description: s.description || '' }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.price) { toast.error('Iltimos, majburiy maydonlarni to\'ldiring'); return; }
    if (editing) { updateService(editing.id, { ...form, price: Number(form.price), duration: Number(form.duration) }); toast.success('Xizmat yangilandi'); }
    else { addService({ id: `s${Date.now()}`, ...form, price: Number(form.price), duration: Number(form.duration) }); toast.success('Yangi xizmat qo\'shildi'); }
    setModalOpen(false);
  };

  const handleDelete = () => { if (deleteId) { deleteService(deleteId); toast.success('Xizmat o\'chirildi'); setDeleteId(null); } };

  return (
    <div className="space-y-4">
      <PageHeader title="Xizmatlar katalogi" description="Klinika xizmatlarining narxlari va tafsilotlari" action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Xizmat qo'shish</Button>} />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Xizmat qidirish..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Button variant={filterCategory === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilterCategory('all')}>Barchasi</Button>
          {categories.map(c => {
            const count = services.filter(s => s.category === c).length;
            return count > 0 ? (
              <Button key={c} variant={filterCategory === c ? 'default' : 'outline'} size="sm" onClick={() => setFilterCategory(c)}>{c}</Button>
            ) : null;
          })}
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? <EmptyState /> : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />{category} ({items.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(s => (
                  <div key={s.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate">{s.name}</h4>
                        {s.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.description}</p>}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(s)}><Pencil className="w-4 h-4 mr-2" />Tahrirlash</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="w-4 h-4 mr-2" />O'chirish</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="text-base font-bold text-primary">{fmt(s.price)} so'm</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />{s.duration} daq
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Xizmatni tahrirlash' : 'Yangi xizmat qo\'shish'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Xizmat nomi</Label><Input placeholder="Masalan: Kompozit plomba" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Kategoriya</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Narxi (so'm)</Label><Input type="number" placeholder="150000" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Davomiyligi (daq)</Label><Input type="number" placeholder="30" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} /></div>
            </div>
            <div><Label>Tavsif</Label><Textarea placeholder="Xizmat haqida qo'shimcha ma'lumot..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <Button className="w-full" onClick={handleSave}>{editing ? 'Yangilash' : 'Qo\'shish'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
