import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge, SourceBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { ArrowLeft, Phone, Calendar, Droplets, AlertTriangle, FileText, Pencil, Plus, CreditCard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToothRecord, Visit, VisitStatus, Payment, PaymentMethod, PaymentStatus, BookingSource } from '@/types';
import { toast } from 'sonner';

const conditionLabels: Record<string, { label: string; color: string }> = {
  healthy: { label: 'Sog\'lom', color: 'bg-success/20 text-success' },
  cavity: { label: 'Kariyes', color: 'bg-destructive/20 text-destructive' },
  filled: { label: 'Plombalangan', color: 'bg-info/20 text-info' },
  crown: { label: 'Toj', color: 'bg-warning/20 text-warning' },
  missing: { label: 'Yo\'q', color: 'bg-muted text-muted-foreground' },
  implant: { label: 'Implant', color: 'bg-primary/20 text-primary' },
  'root-canal': { label: 'Ildiz kanali', color: 'bg-accent text-accent-foreground' },
};

const conditionKeys = Object.keys(conditionLabels) as ToothRecord['condition'][];

const visitStatusLabels: Record<VisitStatus, string> = {
  'not-started': 'Boshlanmagan', 'in-progress': 'Jarayonda', completed: 'Yakunlangan',
};

const methodLabels: Record<PaymentMethod, string> = {
  cash: 'Naqd', card: 'Karta', transfer: 'O\'tkazma', insurance: 'Sug\'urta',
};

const payStatusLabels: Record<PaymentStatus, string> = {
  paid: 'To\'langan', partial: 'Qisman', unpaid: 'To\'lanmagan',
};

const sourceLabels: Record<BookingSource, string> = {
  'walk-in': 'Shaxsan', telegram: 'Telegram', website: 'Veb-sayt', phone: 'Telefon',
};

const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(n);

const UPPER_TEETH = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const LOWER_TEETH = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, visits, bookings, payments, doctors, services, updatePatient, addVisit, addPayment } = useStore();

  // All hooks MUST be before any early return
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', age: '', phone: '', source: 'walk-in' as BookingSource, notes: '', allergies: '', bloodType: '' });
  const [toothModal, setToothModal] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [toothForm, setToothForm] = useState<{ condition: ToothRecord['condition']; notes: string }>({ condition: 'healthy', notes: '' });
  const [visitModal, setVisitModal] = useState(false);
  const [visitForm, setVisitForm] = useState({ doctorId: '', diagnosis: '', treatment: '', notes: '', status: 'not-started' as VisitStatus });
  const [paymentModal, setPaymentModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', method: 'cash' as PaymentMethod, status: 'unpaid' as PaymentStatus, description: '' });

  const patient = patients.find(p => p.id === id);
  if (!patient) return <div className="p-6 text-center text-muted-foreground">Bemor topilmadi</div>;

  const patientVisits = visits.filter(v => v.patientId === id);
  const patientBookings = bookings.filter(b => b.patientId === id);
  const patientPayments = payments.filter(p => p.patientId === id);
  const totalPaid = patientPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalDebt = patientPayments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);

  const toothChart = patient.toothChart || {};


  const handleEditSave = () => {
    if (!editForm.firstName || !editForm.phone) { toast.error('Majburiy maydonlarni to\'ldiring'); return; }
    updatePatient(patient.id, { ...editForm, age: Number(editForm.age) });
    toast.success('Bemor ma\'lumotlari yangilandi');
    setEditOpen(false);
  };

  const openToothEdit = (num: number) => {
    const record = toothChart[num];
    setSelectedTooth(num);
    setToothForm({ condition: record?.condition || 'healthy', notes: record?.notes || '' });
    setToothModal(true);
  };

  const handleToothSave = () => {
    if (selectedTooth === null) return;
    const newChart = { ...toothChart };
    newChart[selectedTooth] = { toothNumber: selectedTooth, condition: toothForm.condition, notes: toothForm.notes, date: new Date().toISOString().split('T')[0] };
    updatePatient(patient.id, { toothChart: newChart });
    toast.success(`${selectedTooth}-tish ma'lumoti yangilandi`);
    setToothModal(false);
  };

  const handleVisitSave = () => {
    if (!visitForm.doctorId) { toast.error('Shifokorni tanlang'); return; }
    addVisit({ id: `v${Date.now()}`, patientId: patient.id, doctorId: visitForm.doctorId, date: new Date().toISOString().split('T')[0], ...visitForm });
    toast.success('Yangi tashrif qo\'shildi');
    setVisitModal(false);
    setVisitForm({ doctorId: '', diagnosis: '', treatment: '', notes: '', status: 'not-started' });
  };

  const handlePaymentSave = () => {
    if (!payForm.amount || !payForm.description) { toast.error('Majburiy maydonlarni to\'ldiring'); return; }
    addPayment({ id: `pay${Date.now()}`, patientId: patient.id, amount: Number(payForm.amount), method: payForm.method, status: payForm.status, date: new Date().toISOString().split('T')[0], description: payForm.description });
    toast.success('To\'lov qayd etildi');
    setPaymentModal(false);
    setPayForm({ amount: '', method: 'cash', status: 'unpaid', description: '' });
  };

  const renderTooth = (num: number) => {
    const record = toothChart[num];
    const condition = record?.condition || 'healthy';
    const info = conditionLabels[condition];
    return (
      <div
        key={num}
        onClick={() => openToothEdit(num)}
        className={`w-7 h-8 md:w-8 md:h-9 rounded text-[10px] font-medium flex flex-col items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all ${info.color} border border-border/50`}
        title={`${num}: ${info.label}${record?.notes ? ` - ${record.notes}` : ''}`}
      >
        <span>{num}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/patients')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Bemorlar ro'yxatiga qaytish
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setEditForm({ firstName: patient.firstName, lastName: patient.lastName, age: String(patient.age), phone: patient.phone, source: patient.source, notes: patient.notes, allergies: patient.allergies || '', bloodType: patient.bloodType || '' }); setEditOpen(true); }} className="gap-2">
          <Pencil className="w-4 h-4" /> Tahrirlash
        </Button>
      </div>

      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground shrink-0">
            {patient.firstName[0]}{patient.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display font-bold">{patient.firstName} {patient.lastName}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span>{patient.age} yosh</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{patient.phone}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{patient.createdAt}</span>
              <SourceBadge source={patient.source} />
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {patient.bloodType && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                  <Droplets className="w-3 h-3" />{patient.bloodType}
                </span>
              )}
              {patient.allergies && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-warning/10 text-warning">
                  <AlertTriangle className="w-3 h-3" />Allergiya: {patient.allergies}
                </span>
              )}
            </div>
            {patient.notes && <p className="text-xs text-muted-foreground mt-2">📝 {patient.notes}</p>}
          </div>
          <div className="flex gap-3 text-center">
            <div className="px-4 py-2 rounded-lg bg-muted/30">
              <p className="text-lg font-bold">{patientVisits.length}</p>
              <p className="text-[10px] text-muted-foreground">Tashriflar</p>
            </div>
            <div className="px-4 py-2 rounded-lg bg-success/10">
              <p className="text-lg font-bold text-success">{fmt(totalPaid)}</p>
              <p className="text-[10px] text-muted-foreground">To'langan</p>
            </div>
            {totalDebt > 0 && (
              <div className="px-4 py-2 rounded-lg bg-destructive/10">
                <p className="text-lg font-bold text-destructive">{fmt(totalDebt)}</p>
                <p className="text-[10px] text-muted-foreground">Qarz</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tish xaritasi */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold mb-1">Tish xaritasi</h3>
        <p className="text-xs text-muted-foreground mb-3">Tishni bosib ma'lumot kiritish yoki o'zgartirish mumkin</p>
        <div className="space-y-2">
          <div className="flex justify-center gap-0.5 flex-wrap">{UPPER_TEETH.map(renderTooth)}</div>
          <div className="border-t border-border" />
          <div className="flex justify-center gap-0.5 flex-wrap">{LOWER_TEETH.map(renderTooth)}</div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {Object.entries(conditionLabels).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5 text-[10px]">
              <div className={`w-3 h-3 rounded ${val.color}`} />
              {val.label}
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="visits" className="w-full">
        <TabsList>
          <TabsTrigger value="visits">Tashriflar ({patientVisits.length})</TabsTrigger>
          <TabsTrigger value="bookings">Qabullar ({patientBookings.length})</TabsTrigger>
          <TabsTrigger value="payments">To'lovlar ({patientPayments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="visits" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setVisitModal(true)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Tashrif qo'shish
            </Button>
          </div>
          {patientVisits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Hali tashriflar yo'q</p>
          ) : patientVisits.map(v => {
            const doctor = doctors.find(d => d.id === v.doctorId);
            return (
              <div key={v.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{v.date}</span>
                    <span className="text-xs text-muted-foreground">• {doctor?.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${v.status === 'completed' ? 'bg-success/15 text-success' : v.status === 'in-progress' ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground'}`}>
                    {visitStatusLabels[v.status]}
                  </span>
                </div>
                {v.diagnosis && <p className="text-sm"><span className="text-muted-foreground">Tashxis:</span> {v.diagnosis}</p>}
                {v.treatment && <p className="text-sm"><span className="text-muted-foreground">Davolash:</span> {v.treatment}</p>}
                {v.notes && <p className="text-xs text-muted-foreground mt-1">{v.notes}</p>}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="bookings" className="space-y-3 mt-4">
          {patientBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Qabullar yo'q</p>
          ) : patientBookings.map(b => {
            const doctor = doctors.find(d => d.id === b.doctorId);
            return (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                <div>
                  <p className="text-sm font-medium">{b.date} — {b.time}</p>
                  <p className="text-xs text-muted-foreground">{doctor?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <SourceBadge source={b.source} />
                  <StatusBadge status={b.status} />
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="payments" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setPaymentModal(true)} className="gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> To'lov qayd etish
            </Button>
          </div>
          {patientPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">To'lovlar yo'q</p>
          ) : patientPayments.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
              <div>
                <p className="text-sm font-medium">{p.description}</p>
                <p className="text-xs text-muted-foreground">{p.date} • {methodLabels[p.method]}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{fmt(p.amount)} so'm</span>
                <PaymentStatusBadge status={p.status} />
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Edit profile modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bemor ma'lumotlarini tahrirlash</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Ism</Label><Input value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} /></div>
              <div><Label>Familiya</Label><Input value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Yosh</Label><Input type="number" value={editForm.age} onChange={e => setEditForm({ ...editForm, age: e.target.value })} /></div>
              <div><Label>Telefon</Label><Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Qon guruhi</Label>
                <Select value={editForm.bloodType || 'none'} onValueChange={v => setEditForm({ ...editForm, bloodType: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Noma'lum</SelectItem>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Manba</Label>
                <Select value={editForm.source} onValueChange={(v: BookingSource) => setEditForm({ ...editForm, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['walk-in','telegram','website','phone'] as BookingSource[]).map(s => <SelectItem key={s} value={s}>{sourceLabels[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Allergiyalar</Label><Input placeholder="Masalan: Lidokain, Penisilin" value={editForm.allergies} onChange={e => setEditForm({ ...editForm, allergies: e.target.value })} /></div>
            <div><Label>Izoh</Label><Textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} /></div>
            <Button className="w-full" onClick={handleEditSave}>Yangilash</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tooth edit modal */}
      <Dialog open={toothModal} onOpenChange={setToothModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{selectedTooth}-tish ma'lumoti</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Holati</Label>
              <Select value={toothForm.condition} onValueChange={(v: ToothRecord['condition']) => setToothForm({ ...toothForm, condition: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {conditionKeys.map(c => <SelectItem key={c} value={c}>{conditionLabels[c].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Izoh</Label><Textarea placeholder="Qo'shimcha ma'lumot..." value={toothForm.notes} onChange={e => setToothForm({ ...toothForm, notes: e.target.value })} /></div>
            <Button className="w-full" onClick={handleToothSave}>Saqlash</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Visit modal */}
      <Dialog open={visitModal} onOpenChange={setVisitModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yangi tashrif qo'shish</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Shifokor</Label>
              <Select value={visitForm.doctorId} onValueChange={v => setVisitForm({ ...visitForm, doctorId: v })}>
                <SelectTrigger><SelectValue placeholder="Shifokorni tanlang" /></SelectTrigger>
                <SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Holat</Label>
              <Select value={visitForm.status} onValueChange={(v: VisitStatus) => setVisitForm({ ...visitForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['not-started','in-progress','completed'] as VisitStatus[]).map(s => <SelectItem key={s} value={s}>{visitStatusLabels[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Tashxis</Label><Textarea placeholder="Tashxis..." value={visitForm.diagnosis} onChange={e => setVisitForm({ ...visitForm, diagnosis: e.target.value })} /></div>
            <div><Label>Davolash</Label><Textarea placeholder="Bajarilgan davolash..." value={visitForm.treatment} onChange={e => setVisitForm({ ...visitForm, treatment: e.target.value })} /></div>
            <div><Label>Izoh</Label><Textarea placeholder="Qo'shimcha izoh..." value={visitForm.notes} onChange={e => setVisitForm({ ...visitForm, notes: e.target.value })} /></div>
            <Button className="w-full" onClick={handleVisitSave}>Yaratish</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment modal */}
      <Dialog open={paymentModal} onOpenChange={setPaymentModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>To'lov qayd etish</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Summa (so'm)</Label><Input type="number" placeholder="150000" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>To'lov usuli</Label>
                <Select value={payForm.method} onValueChange={(v: PaymentMethod) => setPayForm({ ...payForm, method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['cash','card','transfer','insurance'] as PaymentMethod[]).map(m => <SelectItem key={m} value={m}>{methodLabels[m]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Holat</Label>
                <Select value={payForm.status} onValueChange={(v: PaymentStatus) => setPayForm({ ...payForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['paid','partial','unpaid'] as PaymentStatus[]).map(s => <SelectItem key={s} value={s}>{payStatusLabels[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Tavsif</Label><Input placeholder="Xizmat nomi..." value={payForm.description} onChange={e => setPayForm({ ...payForm, description: e.target.value })} /></div>
            <Button className="w-full" onClick={handlePaymentSave}>Qayd etish</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
