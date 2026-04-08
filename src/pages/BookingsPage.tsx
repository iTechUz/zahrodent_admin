import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge, SourceBadge } from '@/components/StatusBadge';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { EmptyState } from '@/components/EmptyState';
import { BookingCalendar } from '@/components/BookingCalendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, List, CalendarDays } from 'lucide-react';
import { Booking, BookingStatus, BookingSource } from '@/types';
import { toast } from 'sonner';

const statuses: BookingStatus[] = ['pending', 'confirmed', 'arrived', 'no-show', 'completed', 'cancelled'];
const sources: BookingSource[] = ['walk-in', 'telegram', 'website', 'phone'];

const statusLabels: Record<BookingStatus, string> = {
  pending: 'Kutilmoqda', confirmed: 'Tasdiqlangan', arrived: 'Keldi',
  'no-show': 'Kelmadi', completed: 'Yakunlangan', cancelled: 'Bekor qilingan',
};

const sourceLabels: Record<BookingSource, string> = {
  'walk-in': 'Shaxsan', telegram: 'Telegram', website: 'Veb-sayt', phone: 'Telefon',
};

export default function BookingsPage() {
  const { bookings, patients, doctors, addBooking, updateBooking, deleteBooking } = useStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [page, setPage] = useState(0);
  const perPage = 8;

  const [form, setForm] = useState({ patientId: '', doctorId: '', date: '', time: '', source: 'walk-in' as BookingSource, notes: '' });

  const filtered = bookings.filter((b) => {
    const patient = patients.find((p) => p.id === b.patientId);
    const matchSearch = !search || `${patient?.firstName} ${patient?.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchSource = filterSource === 'all' || b.source === filterSource;
    return matchSearch && matchStatus && matchSource;
  });

  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const openCreate = () => { setEditing(null); setForm({ patientId: '', doctorId: '', date: '', time: '', source: 'walk-in', notes: '' }); setModalOpen(true); };
  const openEdit = (b: Booking) => { setEditing(b); setForm({ patientId: b.patientId, doctorId: b.doctorId, date: b.date, time: b.time, source: b.source, notes: b.notes || '' }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.patientId || !form.doctorId || !form.date || !form.time) {
      toast.error('Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }
    if (editing) {
      updateBooking(editing.id, { ...form });
      toast.success('Qabul muvaffaqiyatli yangilandi');
    } else {
      addBooking({ id: `b${Date.now()}`, ...form, status: 'pending', createdAt: new Date().toISOString().split('T')[0] });
      toast.success('Yangi qabul yaratildi');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) { deleteBooking(deleteId); toast.success('Qabul o\'chirildi'); setDeleteId(null); }
  };

  const handleStatusChange = (id: string, status: BookingStatus) => {
    updateBooking(id, { status });
    toast.success(`Holat "${statusLabels[status]}" ga o'zgartirildi`);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Qabullar" description="Qabullar va uchrashuvlarni boshqarish" action={<Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Yangi qabul</Button>} />

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list" className="gap-2"><List className="w-4 h-4" />Ro'yxat</TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2"><CalendarDays className="w-4 h-4" />Kalendar</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filtrlar */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Bemor qidirish..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
            </div>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(0); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Holat" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                {statuses.map((s) => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSource} onValueChange={(v) => { setFilterSource(v); setPage(0); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Manba" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha manbalar</SelectItem>
                {sources.map((s) => <SelectItem key={s} value={s}>{sourceLabels[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Jadval */}
          {paginated.length === 0 ? <EmptyState /> : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bemor</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Shifokor</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sana/Vaqt</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Manba</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Holat</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((b) => {
                      const patient = patients.find((p) => p.id === b.patientId);
                      const doctor = doctors.find((d) => d.id === b.doctorId);
                      return (
                        <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium">{patient?.firstName} {patient?.lastName}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{doctor?.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{b.date} {b.time}</td>
                          <td className="px-4 py-3 hidden md:table-cell"><SourceBadge source={b.source} /></td>
                          <td className="px-4 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><button><StatusBadge status={b.status} /></button></DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {statuses.map((s) => <DropdownMenuItem key={s} onClick={() => handleStatusChange(b.id, s)}>{statusLabels[s]}</DropdownMenuItem>)}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setViewBooking(b)}><Eye className="w-4 h-4 mr-2" />Ko'rish</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEdit(b)}><Pencil className="w-4 h-4 mr-2" />Tahrirlash</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(b.id)}><Trash2 className="w-4 h-4 mr-2" />O'chirish</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">Jami: {filtered.length} ta qabul</p>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <Button key={i} variant={page === i ? 'default' : 'ghost'} size="sm" className="h-7 w-7 p-0" onClick={() => setPage(i)}>{i + 1}</Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <BookingCalendar />
        </TabsContent>
      </Tabs>

      {/* Yaratish/Tahrirlash modali */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Qabulni tahrirlash' : 'Yangi qabul yaratish'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Bemor</Label>
              <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
                <SelectTrigger><SelectValue placeholder="Bemorni tanlang" /></SelectTrigger>
                <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Shifokor</Label>
              <Select value={form.doctorId} onValueChange={(v) => setForm({ ...form, doctorId: v })}>
                <SelectTrigger><SelectValue placeholder="Shifokorni tanlang" /></SelectTrigger>
                <SelectContent>{doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sana</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Vaqt</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
            </div>
            <div><Label>Manba</Label>
              <Select value={form.source} onValueChange={(v: BookingSource) => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{sources.map((s) => <SelectItem key={s} value={s}>{sourceLabels[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSave}>{editing ? 'Yangilash' : 'Yaratish'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ko'rish modali */}
      <Dialog open={!!viewBooking} onOpenChange={() => setViewBooking(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Qabul tafsilotlari</DialogTitle></DialogHeader>
          {viewBooking && (() => {
            const patient = patients.find((p) => p.id === viewBooking.patientId);
            const doctor = doctors.find((d) => d.id === viewBooking.doctorId);
            return (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Bemor</span><span className="font-medium">{patient?.firstName} {patient?.lastName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shifokor</span><span className="font-medium">{doctor?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sana</span><span>{viewBooking.date} — {viewBooking.time}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Manba</span><SourceBadge source={viewBooking.source} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Holat</span><StatusBadge status={viewBooking.status} /></div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
