import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { VisitStatusBadge } from '@/components/StatusBadge';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2, Stethoscope, ClipboardList } from 'lucide-react';
import { Doctor, Visit, VisitStatus } from '@/types';
import { toast } from 'sonner';

const visitStatuses: VisitStatus[] = ['not-started', 'in-progress', 'completed'];
const visitStatusLabels: Record<VisitStatus, string> = {
  'not-started': 'Boshlanmagan', 'in-progress': 'Jarayonda', completed: 'Yakunlangan',
};

export default function DoctorsPage() {
  const { doctors, patients, visits, addDoctor, updateDoctor, deleteDoctor, addVisit, updateVisit } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [visitModal, setVisitModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);

  const [form, setForm] = useState({ name: '', specialty: '', phone: '', workingHours: '' });
  const [visitForm, setVisitForm] = useState({ patientId: '', diagnosis: '', treatment: '', notes: '', status: 'not-started' as VisitStatus });

  const openCreateDoctor = () => { setEditing(null); setForm({ name: '', specialty: '', phone: '', workingHours: '' }); setModalOpen(true); };
  const openEditDoctor = (d: Doctor) => { setEditing(d); setForm({ name: d.name, specialty: d.specialty, phone: d.phone, workingHours: d.workingHours }); setModalOpen(true); };

  const handleSaveDoctor = () => {
    if (!form.name || !form.specialty) { toast.error('Iltimos, majburiy maydonlarni to\'ldiring'); return; }
    if (editing) { updateDoctor(editing.id, form); toast.success('Shifokor ma\'lumotlari yangilandi'); }
    else { addDoctor({ id: `d${Date.now()}`, ...form }); toast.success('Yangi shifokor qo\'shildi'); }
    setModalOpen(false);
  };

  const handleDeleteDoctor = () => { if (deleteId) { deleteDoctor(deleteId); toast.success('Shifokor o\'chirildi'); setDeleteId(null); } };

  const openVisitForm = (doctor: Doctor, visit?: Visit) => {
    setSelectedDoctor(doctor);
    setEditingVisit(visit || null);
    setVisitForm(visit ? { patientId: visit.patientId, diagnosis: visit.diagnosis, treatment: visit.treatment, notes: visit.notes, status: visit.status } : { patientId: '', diagnosis: '', treatment: '', notes: '', status: 'not-started' });
    setVisitModal(true);
  };

  const handleSaveVisit = () => {
    if (!visitForm.patientId || !selectedDoctor) { toast.error('Iltimos, bemorni tanlang'); return; }
    if (editingVisit) { updateVisit(editingVisit.id, visitForm); toast.success('Tashrif yangilandi'); }
    else { addVisit({ id: `v${Date.now()}`, doctorId: selectedDoctor.id, date: new Date().toISOString().split('T')[0], ...visitForm }); toast.success('Yangi tashrif yaratildi'); }
    setVisitModal(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Shifokorlar" description="Shifokorlar va tashriflarni boshqarish" action={<Button onClick={openCreateDoctor}><Plus className="w-4 h-4 mr-2" />Shifokor qo'shish</Button>} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {doctors.map((d) => {
          const doctorVisits = visits.filter((v) => v.doctorId === d.id);
          const doctorPatientIds = [...new Set(doctorVisits.map((v) => v.patientId))];
          return (
            <div key={d.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">{d.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
                  <div>
                    <p className="font-semibold">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.specialty}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDoctor(d)}><Pencil className="w-4 h-4 mr-2" />Tahrirlash</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(d.id)}><Trash2 className="w-4 h-4 mr-2" />O'chirish</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 mb-3">
                <p>📞 {d.phone}</p>
                <p>🕐 {d.workingHours}</p>
                <p>{doctorPatientIds.length} ta bemor • {doctorVisits.length} ta tashrif</p>
              </div>
              {/* Haftalik jadval */}
              {d.schedule && (
                <div className="flex gap-1 mb-4">
                  {['Du','Se','Cho','Pa','Ju','Sha','Ya'].map((day, i) => {
                    const sch = d.schedule?.find(s => s.day === i);
                    const isWorking = sch?.isWorking;
                    return (
                      <div key={i} className={`flex-1 text-center py-1 rounded text-[10px] font-medium ${isWorking ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`} title={isWorking ? `${sch?.startTime} - ${sch?.endTime}` : 'Dam olish'}>
                        <span>{day}</span>
                        {isWorking && <p className="text-[8px] mt-0.5">{sch?.startTime?.slice(0,5)}</p>}
                      </div>
                    );
                  })}
                </div>
              )}

              <Tabs defaultValue="visits" className="w-full">
                <TabsList className="w-full h-8">
                  <TabsTrigger value="visits" className="text-xs flex-1"><ClipboardList className="w-3 h-3 mr-1" />Tashriflar</TabsTrigger>
                  <TabsTrigger value="patients" className="text-xs flex-1"><Stethoscope className="w-3 h-3 mr-1" />Bemorlar</TabsTrigger>
                </TabsList>
                <TabsContent value="visits" className="mt-2 space-y-2">
                  {doctorVisits.length === 0 ? <p className="text-xs text-muted-foreground py-2">Tashriflar yo'q</p> : doctorVisits.slice(0, 3).map((v) => {
                    const patient = patients.find((p) => p.id === v.patientId);
                    return (
                      <div key={v.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs cursor-pointer hover:bg-muted/50" onClick={() => openVisitForm(d, v)}>
                        <span>{patient?.firstName} {patient?.lastName} — {v.date}</span>
                        <VisitStatusBadge status={v.status} />
                      </div>
                    );
                  })}
                  <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={() => openVisitForm(d)}>
                    <Plus className="w-3 h-3 mr-1" />Tashrif qo'shish
                  </Button>
                </TabsContent>
                <TabsContent value="patients" className="mt-2 space-y-1">
                  {doctorPatientIds.length === 0 ? <p className="text-xs text-muted-foreground py-2">Bemorlar yo'q</p> : doctorPatientIds.map((pid) => {
                    const patient = patients.find((p) => p.id === pid);
                    return patient ? (
                      <div key={pid} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs">
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[10px] font-semibold text-accent-foreground">{patient.firstName[0]}</div>
                        {patient.firstName} {patient.lastName}
                      </div>
                    ) : null;
                  })}
                </TabsContent>
              </Tabs>
            </div>
          );
        })}
      </div>

      {/* Shifokor modali */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Shifokorni tahrirlash' : 'Yangi shifokor qo\'shish'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Ism familiya</Label><Input placeholder="Dr. Ism Familiya" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Mutaxassislik</Label><Input placeholder="Masalan: Umumiy stomatologiya" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
            <div><Label>Telefon</Label><Input placeholder="+998 90 123 4567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Ish vaqti</Label><Input value={form.workingHours} onChange={(e) => setForm({ ...form, workingHours: e.target.value })} placeholder="Du-Ju 9:00-17:00" /></div>
            <Button className="w-full" onClick={handleSaveDoctor}>{editing ? 'Yangilash' : 'Qo\'shish'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tashrif modali */}
      <Dialog open={visitModal} onOpenChange={setVisitModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingVisit ? 'Tashrifni tahrirlash' : 'Yangi tashrif'} — {selectedDoctor?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Bemor</Label>
              <Select value={visitForm.patientId} onValueChange={(v) => setVisitForm({ ...visitForm, patientId: v })}>
                <SelectTrigger><SelectValue placeholder="Bemorni tanlang" /></SelectTrigger>
                <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Holat</Label>
              <Select value={visitForm.status} onValueChange={(v: VisitStatus) => setVisitForm({ ...visitForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{visitStatuses.map((s) => <SelectItem key={s} value={s}>{visitStatusLabels[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Tashxis</Label><Textarea placeholder="Bemorning tashxisi..." value={visitForm.diagnosis} onChange={(e) => setVisitForm({ ...visitForm, diagnosis: e.target.value })} /></div>
            <div><Label>Davolash</Label><Textarea placeholder="Bajarilgan davolash usuli..." value={visitForm.treatment} onChange={(e) => setVisitForm({ ...visitForm, treatment: e.target.value })} /></div>
            <div><Label>Izoh</Label><Textarea placeholder="Qo'shimcha izoh..." value={visitForm.notes} onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })} /></div>
            <Button className="w-full" onClick={handleSaveVisit}>{editingVisit ? 'Yangilash' : 'Yaratish'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDeleteDoctor} />
    </div>
  );
}
