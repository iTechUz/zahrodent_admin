import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge, SourceBadge, PaymentStatusBadge } from '@/shared/components/StatusBadge';
import { ArrowLeft, Phone, Calendar, Pencil, Plus, CreditCard, Archive, RotateCcw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, Wallet, Receipt, ArrowRight } from 'lucide-react';
import { ToothChart, CONDITION_KEYS, CONDITION_LABELS } from '../components/ToothChart';
import { usePatientProfile } from '../hooks/usePatientProfile';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageSquare } from 'lucide-react';
import { 
  VISIT_STATUS_LABELS, 
  BOOKING_SOURCE_LABELS, 
} from '@/shared/constants';
import { 
  ToothRecord, 
  VisitStatus, 
  PaymentMethod, 
  BookingSource,
  PatientComment,
} from '@/shared/types';
import { LoadingScreen } from '@/shared/components/LoadingScreen';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Naqd', card: 'Karta', transfer: "O'tkazma", insurance: 'Sug\'urta',
};

const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(n);

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newComment, setNewComment] = useState('');
  
  const {
    patient,
    patientVisits,
    patientBookings,
    patientPayments,
    totalPaid,
    totalDue,
    totalDebt,
    credit,
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
    getVisitBalance,
    openPaymentForVisit,
    canManagePayments,
    canAddVisit,
    canEditPatient,
    isArchived,
    canRestore,
    restore,
    isRestoring,
    isAddingComment,
    handleAddComment,
    isLoading,
    comments,
  } = usePatientProfile(id, { includeDeleted: searchParams.get('includeDeleted') === 'true' });

  const handleRestore = async () => {
    try {
      await restore();
      navigate(`/patients/${id}`, { replace: true });
    } catch {
      /* toast shown by the query client */
    }
  };

  if (!patient && isLoading) return <LoadingScreen />;
  if (!patient) return <div className="p-6 text-center text-muted-foreground">Bemor topilmadi</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/patients')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Bemorlar ro'yxatiga qaytish
        </Button>
        {canEditPatient && (
          <Button variant="outline" size="sm" onClick={openEdit} className="gap-2">
            <Pencil className="w-4 h-4" /> Tahrirlash
          </Button>
        )}
      </div>

      {isArchived && (
        <div
          role="status"
          className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-xl border border-warning/40 bg-warning/10 px-4 py-3"
        >
          <div className="flex items-center gap-2 text-sm">
            <Archive className="w-4 h-4 text-warning" />
            <span>
              Bu bemor arxivlangan
              {patient.deletedAt ? ` (${patient.deletedAt.slice(0, 10)})` : ''}. Tarix saqlangan, lekin bemor
              ro'yxatlarda ko'rinmaydi.
            </span>
          </div>
          {canRestore && (
            <Button size="sm" onClick={handleRestore} disabled={isRestoring} className="gap-2 shrink-0">
              <RotateCcw className="w-4 h-4" /> Arxivdan tiklash
            </Button>
          )}
        </div>
      )}

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
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 p-3 rounded-lg bg-muted/40 border border-border/50">
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Manzil</p>
                <p className="text-xs font-medium">{patient.address || '—'}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Ish joyi</p>
                <p className="text-xs font-medium">{patient.workplace || '—'}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Biriktirilgan shifokor</p>
                <p className="text-xs font-medium">
                  {patient.assignedDoctor 
                    ? `Dr. ${patient.assignedDoctor.firstName} ${patient.assignedDoctor.lastName}` 
                    : 'Biriktirilmagan'}
                </p>
              </div>
            </div>
            {patient.notes && <p className="text-xs text-muted-foreground mt-3 italic">" {patient.notes} "</p>}
          </div>
          <div className="flex gap-3 text-center">
            <div className="px-4 py-2 rounded-lg bg-muted/30">
              <p className="text-lg font-bold">{patientVisits.length}</p>
              <p className="text-[10px] text-muted-foreground">Tashriflar</p>
            </div>
            {canManagePayments ? (
              <>
                <div className="px-4 py-2 rounded-lg bg-primary/10">
                  <p className="text-lg font-bold text-primary">{fmt(totalDue)}</p>
                  <p className="text-[10px] text-muted-foreground">Jami summa</p>
                </div>
                <div className="px-4 py-2 rounded-lg bg-success/10">
                  <p className="text-lg font-bold text-success">{fmt(totalPaid)}</p>
                  <p className="text-[10px] text-muted-foreground">To'langan</p>
                </div>
                {credit > 0 ? (
                  <div className="px-4 py-2 rounded-lg bg-info/10">
                    <p className="text-lg font-bold text-info">{fmt(credit)}</p>
                    <p className="text-[10px] text-muted-foreground">Haqdorlik</p>
                  </div>
                ) : (
                  <div className="px-4 py-2 rounded-lg bg-destructive/10">
                    <p className="text-lg font-bold text-destructive">{fmt(totalDebt)}</p>
                    <p className="text-[10px] text-muted-foreground">Qarz</p>
                  </div>
                )}
              </>
            ) : (
              <div className="px-4 py-2 rounded-lg bg-muted/30">
                <p className="text-[10px] text-muted-foreground text-left max-w-[140px]">
                  To'lovlar faqat administrator ko'radi
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tish xaritasi */}
      <ToothChart toothChart={patient.toothChart || {}} onToothClick={openToothEdit} />

      <Tabs defaultValue="visits" className="w-full">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="visits" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Tashriflar ({patientVisits.length})
          </TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Qabullar ({patientBookings.length})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Xronika
          </TabsTrigger>
          {canManagePayments && (
            <TabsTrigger value="payments">To'lovlar ({patientPayments.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="visits" className="space-y-3 mt-4">
          {canAddVisit && (
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setVisitModal(true)} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Tashrif qo'shish
              </Button>
            </div>
          )}
          {patientVisits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Hali tashriflar yo'q</p>
          ) : patientVisits.map(v => {
            const doctor = doctors.find(d => d.id === v.doctorId);
            return (
              <div key={v.id} className="relative bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-all group overflow-hidden">
                {/* Billing Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 last:mb-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold">{v.date}</span>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{doctor ? `${doctor.firstName} ${doctor.lastName}` : '—'}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="px-3 py-1.5 rounded-lg bg-muted/40 border border-border/50 text-center min-w-[80px]">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Jami</p>
                      <p className="text-sm font-bold">{fmt(v.price)}</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-success/5 border border-success/10 text-center min-w-[80px]">
                      <p className="text-[9px] text-success/70 uppercase font-bold">To'langan</p>
                      <p className="text-sm font-bold text-success">{fmt((Number(v.price) || 0) - getVisitBalance(v.id, Number(v.price) || 0))}</p>
                    </div>
                    {getVisitBalance(v.id, v.price) > 0 && (
                      <div className="px-3 py-1.5 rounded-lg bg-destructive/5 border border-destructive/10 text-center min-w-[80px]">
                        <p className="text-[9px] text-destructive/70 uppercase font-bold">Qarz</p>
                        <p className="text-sm font-bold text-destructive">{fmt(getVisitBalance(v.id, v.price))}</p>
                      </div>
                    )}
                    {getVisitBalance(v.id, v.price) === 0 && (
                      <div className="p-1.5 rounded-full bg-success/10 text-success">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Patient Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-2">
                  <div className="space-y-2">
                    {v.diagnosis && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground text-xs shrink-0 mt-0.5">Tashxis:</span>
                        <p className="font-medium text-xs leading-relaxed">{v.diagnosis}</p>
                      </div>
                    )}
                    {v.treatment && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground text-xs shrink-0 mt-0.5">Davolash:</span>
                        <p className="font-medium text-xs leading-relaxed">{v.treatment}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-end justify-end gap-2">
                    {canManagePayments && getVisitBalance(v.id, v.price) > 0 && (
                      <Button 
                        size="sm" 
                        variant="default" 
                        onClick={() => openPaymentForVisit(v)} 
                        className="h-8 text-[11px] gap-1.5 rounded-lg"
                      >
                        <Wallet className="w-3.5 h-3.5" /> To'lov qilish
                      </Button>
                    )}
                    <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-tighter ${
                      v.status === 'completed' ? 'bg-success/15 text-success' : 
                      v.status === 'in-progress' ? 'bg-warning/15 text-warning' : 
                      'bg-muted text-muted-foreground'
                    }`}>
                      {VISIT_STATUS_LABELS[v.status]}
                    </span>
                  </div>
                </div>
                
                {v.notes && (
                  <div className="mt-3 p-2 rounded-lg bg-orange-50/50 border border-orange-100/50 text-[10px] text-orange-800">
                    <span className="font-bold opacity-70 uppercase tracking-widest mr-2">Izoh:</span> {v.notes}
                  </div>
                )}
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
                  <p className="text-xs text-muted-foreground">{doctor ? `${doctor.firstName} ${doctor.lastName}` : '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <SourceBadge source={b.source} />
                  <StatusBadge status={b.status} />
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="timeline" className="mt-4 space-y-6">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Bemor xronikasi (Izohlar)
              </h3>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 border">
                   <AvatarFallback className="bg-primary/5 text-[10px] font-bold">ME</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea 
                    placeholder="Izoh qoldiring..." 
                    className="min-h-[80px] text-sm resize-none"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        if (newComment.trim()) {
                           handleAddComment(newComment);
                           setNewComment('');
                        }
                      }
                    }}
                  />
                  <div className="flex justify-end">
                    <Button 
                      size="sm" 
                      className="gap-2"
                      onClick={() => {
                        if (newComment.trim()) {
                          handleAddComment(newComment);
                          setNewComment('');
                        }
                      }}
                      disabled={isAddingComment || !newComment.trim()}
                    >
                      <Send className="w-3 h-3" /> {isAddingComment ? 'Yuborilmoqda...' : 'Yuborish'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {!comments || comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4 italic">Hali hech qanday izoh yo'q</p>
                ) : comments.map((c: PatientComment) => (
                  <div key={c.id} className="flex gap-3 group animate-in fade-in slide-in-from-top-2 duration-300">
                    <Avatar className="w-8 h-8 border">
                      <AvatarImage src={c.author.avatar} />
                      <AvatarFallback className="bg-primary/5 text-[10px] font-bold">
                        {c.author.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-foreground">{c.author.name}</span>
                        <span className="text-[10px] text-muted-foreground">{c.createdAt}</span>
                      </div>
                      <div className="p-3 rounded-2xl rounded-tl-none bg-muted/40 border border-border/50">
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{c.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {canManagePayments && (
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
        )}
      </Tabs>

      {/* Modals */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bemor ma'lumotlarini tahrirlash</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ism *</Label>
              <Input value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Familiya *</Label>
              <Input value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Yosh *</Label>
              <Input type="number" value={editForm.age} onChange={e => setEditForm({ ...editForm, age: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefon *</Label>
              <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Manzil *</Label>
              <Input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ish joyi *</Label>
              <Input value={editForm.workplace} onChange={e => setEditForm({ ...editForm, workplace: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Biriktirilgan shifokor</Label>
              <SearchableSelect
                options={doctors.map(d => ({ value: d.id, label: `${d.firstName} ${d.lastName} (${d.specialty})` }))}
                value={editForm.assignedDoctorId}
                onValueChange={v => setEditForm({ ...editForm, assignedDoctorId: v })}
                placeholder="Shifokorni tanlang"
              />
            </div>
            <div className="space-y-2">
              <Label>Manba</Label>
              <Select value={editForm.source} onValueChange={(v: BookingSource) => setEditForm({ ...editForm, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['walk-in','telegram','website','phone'] as BookingSource[]).map(s => <SelectItem key={s} value={s}>{BOOKING_SOURCE_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Izoh</Label>
            <Textarea 
              value={editForm.notes} 
              onChange={e => setEditForm({ ...editForm, notes: e.target.value })} 
              className="min-h-[100px]"
            />
          </div>
          <Button className="w-full h-11 font-bold" onClick={handleEditSave}>Yangilash</Button>
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
                <SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Narxi</Label><MoneyInput placeholder="300 000" value={visitForm.price} onChange={v => setVisitForm({ ...visitForm, price: v })} /></div>
              <div><Label>Holat</Label>
                <Select value={visitForm.status} onValueChange={(v: VisitStatus) => setVisitForm({ ...visitForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['not-started','in-progress','completed'] as VisitStatus[]).map(s => <SelectItem key={s} value={s}>{VISIT_STATUS_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Tashxis</Label><Textarea placeholder="Tashxis..." value={visitForm.diagnosis} onChange={e => setVisitForm({ ...visitForm, diagnosis: e.target.value })} /></div>
            <div><Label>Davolash</Label><Textarea placeholder="Bajarilgan davolash..." value={visitForm.treatment} onChange={e => setVisitForm({ ...visitForm, treatment: e.target.value })} /></div>
            <div><Label>Izoh</Label><Textarea placeholder="Qo'shimcha izoh..." value={visitForm.notes} onChange={e => setVisitForm({ ...visitForm, notes: e.target.value })} /></div>
            
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-semibold">To'lovni hozir qayd etish</Label>
                </div>
                <Switch 
                  checked={visitForm.shouldPayNow} 
                  onCheckedChange={v => setVisitForm({ ...visitForm, shouldPayNow: v, payAmount: v ? visitForm.price : '' })} 
                />
              </div>

              {visitForm.shouldPayNow && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">To'langan summa</Label>
                    <MoneyInput 
                      placeholder="500 000" 
                      value={visitForm.payAmount} 
                      onChange={v => setVisitForm({ ...visitForm, payAmount: v })} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Usuli</Label>
                    <Select value={visitForm.payMethod} onValueChange={(v: PaymentMethod) => setVisitForm({ ...visitForm, payMethod: v })}>
                      <SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(['cash','card','transfer','insurance'] as PaymentMethod[]).map(m => <SelectItem key={m} value={m}>{METHOD_LABELS[m]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <Button className="w-full h-12 gap-2 text-primary-foreground font-bold" onClick={handleVisitSave}>
              Tashrifni saqlash <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {canManagePayments && (
        <Dialog open={paymentModal} onOpenChange={setPaymentModal}>
          <DialogContent>
            <DialogHeader><DialogTitle>To'lov qayd etish</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {(() => {
                const payingAmount = Number(payForm.amount) || 0;
                let currentDebt = totalDebt;
                let contextStr = "Umumiy qarz";
                
                if (payForm.visitId && payForm.visitId !== 'none') {
                  const visit = patientVisits.find(v => v.id === payForm.visitId);
                  if (visit) {
                    currentDebt = getVisitBalance(visit.id, Number(visit.price) || 0);
                    contextStr = "Tashrif qarzi";
                  }
                }

                const newBalance = Math.max(0, currentDebt - payingAmount);
                const progressPercent = currentDebt > 0 
                  ? Math.min(100, Math.max(0, (payingAmount / currentDebt) * 100))
                  : (payingAmount > 0 ? 100 : 0);

                return (
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                       <Wallet className="w-4 h-4 text-primary" />
                       <span className="text-sm font-semibold">{contextStr} tahlili</span>
                    </div>
                    
                    {payForm.visitId && payForm.visitId !== 'none' && (
                      <div className="flex justify-between text-xs pb-3 mb-3 border-b border-border/50">
                        <span className="text-muted-foreground">Xizmat narxi (Jami):</span>
                        <span className="font-medium">{fmt(Number(patientVisits.find(v => v.id === payForm.visitId)?.price) || 0)} so'm</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Hozirgi qarz:</span>
                        <span className="font-medium text-destructive">{fmt(currentDebt)} so'm</span>
                      </div>
                      
                      <div className="space-y-1.5 mt-2">
                        <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider">
                          <span className="text-success">To'lanmoqda: {fmt(payingAmount)} so'm</span>
                          <span className="text-muted-foreground">Qoladi: {fmt(newBalance)} so'm</span>
                        </div>
                        <div className="h-2.5 w-full bg-muted overflow-hidden rounded-full border border-border/50 relative">
                          <div 
                            className="absolute top-0 left-0 h-full bg-success transition-all duration-300 ease-out"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">To'lov summasi</Label>
                <MoneyInput 
                  placeholder="50 000" 
                  className="h-11 text-lg font-semibold"
                  value={payForm.amount} 
                  onChange={v => setPayForm({ ...payForm, amount: v, status: 'paid' })} 
                />
              </div>

              <div>
                <Label className="text-xs block mb-1">To'lov usuli</Label>
                <Select value={payForm.method} onValueChange={(v: PaymentMethod) => setPayForm({ ...payForm, method: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['cash','card','transfer','insurance'] as PaymentMethod[]).map(m => <SelectItem key={m} value={m}>{METHOD_LABELS[m]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Bog'langan tashrif (ixtiyoriy)</Label>
                <Select value={payForm.visitId || 'none'} onValueChange={v => {
                  const val = v === 'none' ? '' : v;
                  const visit = patientVisits.find(vis => vis.id === val);
                  if (visit) {
                    const balance = getVisitBalance(visit.id, visit.price);
                    setPayForm({ 
                      ...payForm, 
                      visitId: val, 
                      amount: String(balance), 
                      description: `${visit.date} - Tashrif uchun to'lov` 
                    });
                  } else {
                    setPayForm({ ...payForm, visitId: val });
                  }
                }}>
                  <SelectTrigger><SelectValue placeholder="Tashrifni tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Hech qaysi (Umumiy to'lov)</SelectItem>
                    {patientVisits.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.date} — {v.treatment?.slice(0, 30) || 'Tashrif'} ({fmt(getVisitBalance(v.id, v.price))} so'm qolgan)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Tavsif / Izoh</Label>
                <Input placeholder="Xizmat nomi yoki qo'shimcha izoh..." value={payForm.description} onChange={e => setPayForm({ ...payForm, description: e.target.value })} />
              </div>

              <div className="pt-2">
                <Button className="w-full h-11" onClick={handlePaymentSave}>
                  To'lovni saqlash
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
