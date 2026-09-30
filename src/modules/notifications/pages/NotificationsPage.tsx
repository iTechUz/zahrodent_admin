import React from 'react';
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { useServerTable } from '@/shared/hooks/useServerTable';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Send, MessageSquare, ChevronLeft, ChevronRight, ShieldCheck, 
  Calendar, CheckSquare, Square, RefreshCcw, Loader2, Info
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { patientsApi, doctorsApi, notificationsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import type { Notification, Patient, Doctor, NotificationRecipient } from '@/shared/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useBulkSms, DatePreset } from '../hooks/useBulkSms';

const notifStatusLabels: Record<string, string> = {
  sent: 'Yuborilgan', delivered: 'Yetkazilgan', failed: 'Xatolik',
};

type NotificationsTable = {
  data: Notification[];
  isLoading: boolean;
  totalPages: number;
  totalCount: number;
  page: number;
  setPage: (n: number) => void;
};

function NotificationsHistoryTab({
  table,
  patients,
  doctors,
}: {
  table: NotificationsTable;
  patients: Patient[];
  doctors: Doctor[];
}) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/30">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bemor</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Turi</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Xabar</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Yuborilgan vaqt</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Holat</th>
          </tr></thead>
          <tbody className={cn(table.isLoading && 'opacity-50')}>
            {table.data.map((n: Notification & { doctorId?: string }) => {
              const patient = n.patientId ? patients.find((p) => p.id === n.patientId) : null;
              const doctor = n.doctorId ? doctors.find((d) => d.id === n.doctorId) : null;
              const isDoctor = !!n.doctorId;
              return (
                <tr key={n.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    {isDoctor ? (
                      <>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : '—'} <Badge variant="secondary" className="text-[10px] py-0">Shifokor</Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground">{doctor?.phone}</div>
                      </>
                    ) : (
                      <>
                        <div className="font-medium text-foreground">{patient?.firstName} {patient?.lastName}</div>
                        <div className="text-[10px] text-muted-foreground">{patient?.phone}</div>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3"><Badge variant="outline" className={cn('text-xs', n.type === 'telegram' ? 'bg-info/15 text-info border-info/30' : 'bg-secondary text-secondary-foreground border-none')}>SMS</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate" title={n.message}>{n.message}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(n.sentAt).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className={cn('text-xs', n.status === 'delivered' ? 'bg-success/15 text-success border-success/30' : n.status === 'failed' ? 'bg-destructive/15 text-destructive border-destructive/30' : 'bg-warning/15 text-warning border-warning/30')}>{notifStatusLabels[n.status]}</Badge></td>
                </tr>
              );
            })}
            {table.data.length === 0 && !table.isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Bildirishnomalar topilmadi</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {table.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
          <p className="text-xs text-muted-foreground">Jami: {table.totalCount} ta</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => table.setPage(table.page - 1)} disabled={table.page === 0}><ChevronLeft className="w-4 h-4 mr-1" /> Oldingi</Button>
            <div className="flex items-center px-4 text-sm font-medium">{table.page + 1} / {table.totalPages}</div>
            <Button variant="outline" size="sm" onClick={() => table.setPage(table.page + 1)} disabled={table.page === table.totalPages - 1}>Keyingi <ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

const PATIENT_PRESETS = [
  { 
    id: 'reminder', 
    label: 'Eslatma', 
    text: 'Eslatma: Sizning qabulingiz [sana] kuni soat [vaqt] da kutilmoqda. Zahro Dental.' 
  },
  { 
    id: 'welcome', 
    label: 'Salomlashish', 
    text: 'Assalomu alaykum! Bizni tanlaganingiz uchun rahmat. Qabulingiz [sana] kuni soat [vaqt] da.' 
  },
  { 
    id: 'followup', 
    label: 'Xizmatdan so\'ng', 
    text: 'Sizni ko\'rganimizdan xursandmiz! Savollaringiz bo\'lsa bizga murojaat qiling. Zahro Dental.' 
  },
];

const DOCTOR_PRESETS = [
  { 
    id: 'reminder', 
    label: 'Qabul eslatmasi', 
    text: 'Hurmatli shifokor, ertaga [sana] kuni soat [vaqt] da [bemor] ismli bemor bilan qabulingiz bor.' 
  },
  { 
    id: 'meeting', 
    label: 'Majlis', 
    text: 'Hurmatli shifokor, umumiy majlis rejalashtirildi. Iltimos, o\'z vaqtida qatnashing. Zahro Dental.' 
  },
  { 
    id: 'schedule_update', 
    label: 'Jadval o\'zgardi', 
    text: 'Hurmatli shifokor, sizning ishlash jadvalingizga o\'zgarish kiritildi, iltimos tekshirib oling.' 
  },
  { 
    id: 'alert', 
    label: 'Diqqat', 
    text: 'Diqqat! Klinika operatsion jarayonlarida favqulodda o\'zgarish bor. Boshqaruv bilan bog\'laning.' 
  },
];

function BulkSmsTab() {
  const {
    recipients,
    isLoading,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    datePreset,
    setDatePreset,
    targetType,
    setTargetType,
    message,
    setMessage,
    handleSend,
    isSending,
  } = useBulkSms();

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertTag = (tag: string) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    const newMessage = before + tag + after;
    setMessage(newMessage);

    // Reset cursor after state update
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  const previewMessage = React.useMemo(() => {
    return message
      .replace(/\[sana\]/g, '2024-04-16')
      .replace(/\[vaqt\]/g, '14:30')
      .replace(/\[bemor\]/g, 'Ali Valiyev');
  }, [message]);

  const presets: { id: DatePreset; label: string }[] = [
    { id: 'tomorrow', label: 'Ertaga' },
    { id: 'nextWeek', label: 'Keyingi hafta' },
    { id: 'nextMonth', label: 'Keyingi oy' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        
        {/* Shifokor yoki Bemor tanlash */}
        <div className="flex bg-muted/50 p-1 rounded-xl w-fit">
          <Button 
            variant={targetType === 'patient' ? "default" : "ghost"} 
            size="sm" 
            onClick={() => setTargetType('patient')}
            className="rounded-lg shadow-none"
          >
            Bemorlarga
          </Button>
          <Button 
            variant={targetType === 'doctor' ? "default" : "ghost"} 
            size="sm" 
            onClick={() => setTargetType('doctor')}
            className="rounded-lg shadow-none"
          >
            Shifokorlarga
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <Button 
              key={p.id}
              variant={datePreset === p.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDatePreset(p.id)}
              className="rounded-full px-5 transition-all active:scale-95"
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleSelectAll} className="h-8 w-8 hover:bg-primary/5">
                {selectedIds.length === recipients.length && recipients.length > 0 ? (
                  <CheckSquare className="w-5 h-5 text-primary" />
                ) : (
                  <Square className="w-5 h-5 text-muted-foreground" />
                )}
              </Button>
              <span className="text-sm font-medium">Barchasini tanlash ({recipients.length})</span>
            </div>
            {selectedIds.length > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-semibold">
                {selectedIds.length} ta tanlandi
              </Badge>
            )}
          </div>

          <div className="max-h-[550px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
                Yuklanmoqda...
              </div>
            ) : recipients.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-10" />
                {targetType === 'patient' ? "Bu muddat uchun SMS kutayotgan mijozlar topilmadi" : "Hech qanday shifokor topilmadi"}
              </div>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border/50">
                  {recipients.map((r: NotificationRecipient) => (
                    <tr 
                      key={r.id} 
                      className={cn(
                        "hover:bg-muted/10 transition-colors cursor-pointer group",
                        selectedIds.includes(r.id) && "bg-primary/5"
                      )}
                      onClick={() => toggleSelect(r.id)}
                    >
                      <td className="w-12 px-4 py-4">
                        {selectedIds.includes(r.id) ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5 text-muted-foreground group-hover:text-primary/50 transition-colors" />
                        )}
                      </td>
                      <td className="px-2 py-4">
                        <div className="font-semibold text-foreground">{r.firstName} {r.lastName}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MessageSquare className="w-3 h-3" /> {r.phone}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="text-[11px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full inline-block">
                          {new Date(r.bookingDate).toLocaleDateString('uz-UZ')}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">{r.bookingTime}</div>
                        {targetType === 'doctor' && r.patientName && (
                          <div className="text-[9px] text-primary/80 font-medium">Bemor: {r.patientName}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm shadow-xl sticky top-4">
          <CardContent className="p-5 space-y-5">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>SMS Shablonlari</span>
                <Info className="w-3 h-3" />
              </label>
              <div className="flex flex-wrap gap-2">
                {(targetType === 'patient' ? PATIENT_PRESETS : DOCTOR_PRESETS).map(t => (
                  <Button 
                    key={t.id}
                    variant="outline"
                    size="xs"
                    onClick={() => setMessage(t.text)}
                    className="text-[10px] h-7 bg-background/50"
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold">
                <label className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  SMS Matni
                </label>
                <div className="flex gap-1">
                  <Button variant="ghost" size="xs" onClick={() => insertTag('[sana]')} className="h-6 text-[10px] text-primary hover:bg-primary/10 tracking-tight">+[sana]</Button>
                  <Button variant="ghost" size="xs" onClick={() => insertTag('[vaqt]')} className="h-6 text-[10px] text-primary hover:bg-primary/10 tracking-tight">+[vaqt]</Button>
                  {targetType === 'doctor' && (
                    <Button variant="ghost" size="xs" onClick={() => insertTag('[bemor]')} className="h-6 text-[10px] text-primary hover:bg-primary/10 tracking-tight">+[bemor]</Button>
                  )}
                </div>
              </div>
              <Textarea 
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Xabar matnini kiriting..."
                className="min-h-[120px] bg-background/50 resize-none border-border/50 focus:border-primary/50 text-sm leading-relaxed"
              />
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] text-muted-foreground">Taxminiy: 1 ta SMS</span>
                <p className="text-[10px] text-muted-foreground font-medium italic">
                  {message.length} belgi
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 px-1">
                <ShieldCheck className="w-3 h-3 text-success" />
                SMS Ko'rinishi (Preview)
              </label>
              <div className="relative p-4 rounded-xl bg-muted/30 border border-border/50 min-h-[100px] flex items-start gap-3 overflow-hidden">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0 animate-pulse" />
                <p className="text-[13px] leading-relaxed text-foreground/90 italic">
                  "{previewMessage}"
                </p>
                <div className="absolute top-0 right-0 p-1 opacity-20"><Send className="w-12 h-12 -rotate-12" /></div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 flex flex-col gap-2">
              <div className="flex gap-3">
                <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-orange-600/80 leading-relaxed font-medium">
                  Xabarda <b>[sana]</b>, <b>[vaqt]</b> {targetType === 'doctor' && "va <b>[bemor]</b> "}teglaridan foydalanishingiz mumkin.
                </p>
              </div>
            </div>

            <Button 
              className="w-full gradient-primary py-7 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all" 
              onClick={handleSend}
              disabled={isSending || selectedIds.length === 0}
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : (
                <Send className="w-5 h-5 mr-3" />
              )}
              {selectedIds.length} ta SMS yuborish
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NotificationsPageContent() {
  const authed = useStore((s) => s.isAuthenticated);

  const table = useServerTable<Notification, Record<string, never>>({
    queryKey: queryKeys.notifications,
    fetchFn: (params) => notificationsApi.list(params),
    perPage: 15,
  });

  const patientIds = React.useMemo(() => {
    const ids = table.data.map((n) => n.patientId).filter(Boolean) as string[];
    return Array.from(new Set(ids)).sort();
  }, [table.data]);

  const doctorIds = React.useMemo(() => {
    const ids = table.data.map((n) => n.doctorId).filter(Boolean) as string[];
    return Array.from(new Set(ids)).sort();
  }, [table.data]);

  const { data: patientsData } = useQuery({
    queryKey: ['patients-by-ids', patientIds.join(',')],
    enabled: authed && patientIds.length > 0,
    queryFn: async () => Promise.all(patientIds.map((id) => patientsApi.get(id))),
  });
  const patients = patientsData ?? [];

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-by-ids', doctorIds.join(',')],
    enabled: authed && doctorIds.length > 0,
    queryFn: async () => Promise.all(doctorIds.map((id) => doctorsApi.get(id))),
  });
  const doctors = doctorsData ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bildirishnomalar"
        description="Mijozlar bilan aloqa va SMS eslatmalar markazi"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          title="Yuborilgan xabarlar" 
          value={table.totalCount} 
          icon={<MessageSquare className="w-5 h-5 text-info" />} 
          trend="Jami tarix"
        />
        <StatCard 
          title="Tizim holati" 
          value="SMS Faol" 
          icon={<ShieldCheck className="w-5 h-5 text-success" />} 
          trend="Eskiz.uz ulanmagan"
          trendUp={true}
        />
      </div>

      <Tabs defaultValue="send" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl mb-6">
          <TabsTrigger value="send" className="rounded-lg gap-2">
            <Send className="w-4 h-4" /> SMS Yuborish
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg gap-2">
            <RefreshCcw className="w-4 h-4" /> Tarix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <BulkSmsTab />
        </TabsContent>
        <TabsContent value="history">
          <NotificationsHistoryTab table={table} patients={patients} doctors={doctors} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ErrorBoundary name="Bildirishnomalar">
      <NotificationsPageContent />
    </ErrorBoundary>
  );
}
