import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { notificationLogsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { useStore } from '@/store/useStore';
import { useCan } from '@/shared/hooks/usePermissions';

const KIND_LABELS: Record<string, string> = {
  lead_group: 'Yangi ariza (guruh)',
  patient_lead_received: 'Mijozga tasdiq',
  booking_status_group: 'Holat (guruh)',
  patient_status: 'Holat (mijoz)',
  reminder_24h: 'Eslatma 24 soat',
  reminder_2h: 'Eslatma 2 soat',
  booking_reschedule_request: "Ko'chirish so'rovi",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tashkent',
  });

/**
 * Warns when Telegram messages failed in the last 24h (or are still retrying)
 * and lets an admin look at the delivery log and re-send failed ones.
 */
export function TelegramDeliveryAlert() {
  const authed = useStore((s) => s.isAuthenticated);
  const canRetry = useCan()('notifications.send');
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: summary } = useQuery({
    queryKey: queryKeys.notificationLogsSummary,
    queryFn: () => notificationLogsApi.summary(),
    enabled: authed,
    refetchInterval: 60_000,
  });
  const { data: failed, isLoading } = useQuery({
    queryKey: [...queryKeys.notificationLogs, 'failed'],
    queryFn: () => notificationLogsApi.list({ status: 'failed', limit: 50 }),
    enabled: authed && open,
  });

  const retry = useMutation({
    mutationFn: (id: string) => notificationLogsApi.retry(id),
    onSuccess: (row) => {
      toast[row.status === 'sent' ? 'success' : 'error'](
        row.status === 'sent' ? 'Xabar yuborildi' : 'Yana yuborilmadi',
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationLogs });
    },
  });

  if (!summary || (summary.failed24h === 0 && summary.pending === 0)) return null;

  return (
    <>
      <div
        role="alert"
        className="flex flex-wrap items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm"
      >
        <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
        <span className="flex-1">
          {summary.failed24h > 0 && <b>{summary.failed24h} ta Telegram xabar yuborilmadi (24 soat). </b>}
          {summary.pending > 0 && <span>{summary.pending} ta xabar qayta urinish navbatida.</span>}
        </span>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Ko'rish
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yuborilmagan Telegram xabarlar</DialogTitle>
          </DialogHeader>
          {isLoading && <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>}
          {failed && failed.data.length === 0 && (
            <p className="text-sm text-muted-foreground">Xatolik yo'q</p>
          )}
          <ul className="space-y-3">
            {failed?.data.map((l) => (
              <li key={l.id} className="rounded-lg border border-border p-3 text-sm space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">{KIND_LABELS[l.kind] ?? l.kind}</Badge>
                  <span className="text-xs text-muted-foreground">{fmt(l.createdAt)} · {l.attempts} urinish</span>
                </div>
                <p className="text-muted-foreground whitespace-pre-line line-clamp-3">{l.text}</p>
                {l.lastError && <p className="text-xs text-destructive">{l.lastError}</p>}
                {canRetry && (
                  <Button size="sm" variant="outline" disabled={retry.isPending} onClick={() => retry.mutate(l.id)}>
                    Qayta yuborish
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
