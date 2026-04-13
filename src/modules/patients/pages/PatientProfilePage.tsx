import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge, SourceBadge, PaymentStatusBadge } from '@/shared/components/StatusBadge';
import { ArrowLeft, Phone, Calendar, Droplets, AlertTriangle, FileText, Pencil, Plus, CreditCard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToothRecord, VisitStatus, PaymentMethod, PaymentStatus, BookingSource } from '@/shared/types';
import { BOOKING_SOURCE_LABELS, PAYMENT_STATUS_LABELS, VISIT_STATUS_LABELS } from '@/shared/constants';
import { ToothChart, CONDITION_KEYS, CONDITION_LABELS } from '../components/ToothChart';
import { usePatientProfile } from '../hooks/usePatientProfile';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Naqd', card: 'Karta', transfer: "O'tkazma", insurance: 'Sug\'urta',
};

const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(n);

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const {
    patient,
    patientVisits,
    patientBookings,
    patientPayments,
    totalPaid,
    totalDebt,
    doctors,
    editOpen,
    setEditOpen,
    editForm,
    setEditForm,
    toothModal,
    setToothModal,
    selectedTooth,
    toothForm,
    setToothForm,
    visitModal,
    setVisitModal,
    visitForm,
    setVisitForm,
    paymentModal,
    setPaymentModal,
    payForm,
    setPayForm,
    handleEditSave,
    openEdit,
    openToothEdit,
    handleToothSave,
    handleVisitSave,
    handlePaymentSave,
  } = usePatientProfile(id);

  if (!patient) return <div className="p-6 text-center text-muted-foreground">Bemor topilmadi</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/patients')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Bemorlar ro'yxatiga qaytish
        </Button>
        <Button variant="outline" size="sm" onClick={openEdit} className="gap-2">
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
      <ToothChart toothChart={patient.toothChart || {}} onToothClick={openToothEdit} />

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
                    {VISIT_STATUS_LABELS[v.status]}
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
                <p className="text-xs text-muted-foreground">{p.date} • {METHOD_LABELS[p.method]}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{fmt(p.amount)} so'm</span>
                <PaymentStatusBadge status={p.status} />
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Modals */}
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
                    {(['walk-in','telegram','website','phone'] as BookingSource[]).map(s => <SelectItem key={s} value={s}>{BOOKING_SOURCE_LABELS[s]}</SelectItem>)}
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

      <Dialog open={toothModal} onOpenChange={setToothModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{selectedTooth}-tish ma'lumoti</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Holati</Label>
              <Select value={toothForm.condition} onValueChange={(v: ToothRecord['condition']) => setToothForm({ ...toothForm, condition: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITION_KEYS.map(c => <SelectItem key={c} value={c}>{CONDITION_LABELS[c].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Izoh</Label><Textarea placeholder="Qo'shimcha ma'lumot..." value={toothForm.notes} onChange={e => setToothForm({ ...toothForm, notes: e.target.value })} /></div>
            <Button className="w-full" onClick={handleToothSave}>Saqlash</Button>
          </div>
        </DialogContent>
      </Dialog>

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
                  {(['not-started','in-progress','completed'] as VisitStatus[]).map(s => <SelectItem key={s} value={s}>{VISIT_STATUS_LABELS[s]}</SelectItem>)}
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
                    {(['cash','card','transfer','insurance'] as PaymentMethod[]).map(m => <SelectItem key={m} value={m}>{METHOD_LABELS[m]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Holat</Label>
                <Select value={payForm.status} onValueChange={(v: PaymentStatus) => setPayForm({ ...payForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['paid','partial','unpaid'] as PaymentStatus[]).map(s => <SelectItem key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</SelectItem>)}
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
