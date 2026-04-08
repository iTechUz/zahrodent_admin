import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const notifStatusLabels: Record<string, string> = {
  sent: 'Yuborilgan', delivered: 'Yetkazilgan', failed: 'Xatolik',
};

export default function NotificationsPage() {
  const { notifications, patients, bookings, addNotification } = useStore();

  const sendReminders = () => {
    const upcoming = bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending');
    upcoming.forEach((b) => {
      const patient = patients.find((p) => p.id === b.patientId);
      if (patient) {
        addNotification({
          id: `n${Date.now()}${Math.random()}`,
          patientId: b.patientId,
          type: patient.source === 'telegram' ? 'telegram' : 'sms',
          message: `Eslatma: Sizning qabulingiz ${b.date} kuni soat ${b.time} da`,
          sentAt: new Date().toISOString(),
          status: 'sent',
        });
      }
    });
    toast.success(`${upcoming.length} ta eslatma yuborildi`);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Bildirishnomalar" description="SMS va Telegram orqali xabarnomalar" action={<Button onClick={sendReminders}><Send className="w-4 h-4 mr-2" />Eslatma yuborish</Button>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-info/15 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-info" /></div>
          <div><p className="text-sm font-semibold">SMS xabarnomalar</p><p className="text-xs text-muted-foreground">{notifications.filter(n=>n.type==='sms').length} ta yuborilgan</p></div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-info/15 flex items-center justify-center"><Send className="w-5 h-5 text-info" /></div>
          <div><p className="text-sm font-semibold">Telegram xabarnomalar</p><p className="text-xs text-muted-foreground">{notifications.filter(n=>n.type==='telegram').length} ta yuborilgan</p></div>
        </div>
      </div>

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
            <tbody>
              {notifications.map((n) => {
                const patient = patients.find((p) => p.id === n.patientId);
                return (
                  <tr key={n.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{patient?.firstName} {patient?.lastName}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className={cn('text-xs', n.type === 'telegram' ? 'bg-info/15 text-info border-info/30' : 'bg-accent text-accent-foreground')}>{n.type.toUpperCase()}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{n.message}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(n.sentAt).toLocaleString('uz-UZ')}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className={cn('text-xs', n.status === 'delivered' ? 'bg-success/15 text-success border-success/30' : n.status === 'failed' ? 'bg-destructive/15 text-destructive border-destructive/30' : 'bg-warning/15 text-warning border-warning/30')}>{notifStatusLabels[n.status]}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
