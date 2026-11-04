import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { bookingsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { BOOKING_STATUS_LABELS } from '@/shared/constants';

const REASON_MAX = 300;

/** Asks for an optional reason before a booking is cancelled (the patient sees it in Telegram). */
export function CancelReasonDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Qabulni bekor qilish</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Sabab bemorga Telegram orqali yuboriladi (agar bot ulangan bo'lsa).
        </p>
        <Textarea
          placeholder="Sabab (ixtiyoriy)"
          maxLength={REASON_MAX}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Ortga
          </Button>
          <Button variant="destructive" onClick={() => onConfirm(reason)}>
            Bekor qilish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tashkent',
  });

/** Who changed the booking status, when and why. */
export function StatusHistoryDialog({
  bookingId,
  onClose,
}: {
  bookingId: string | null;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.bookingStatusLog(bookingId ?? ''),
    queryFn: () => bookingsApi.statusLog(bookingId!),
    enabled: !!bookingId,
  });

  return (
    <Dialog open={!!bookingId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Holat tarixi</DialogTitle>
        </DialogHeader>
        {isLoading && <p className="text-sm text-muted-foreground">Yuklanmoqda…</p>}
        {isError && <p className="text-sm text-destructive">Tarixni yuklab bo'lmadi</p>}
        {data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">Hali o'zgarishlar yo'q</p>
        )}
        <ul className="space-y-3">
          {data?.map((e) => (
            <li key={e.id} className="border-b border-border pb-2 last:border-0 text-sm">
              <div className="font-medium">
                {BOOKING_STATUS_LABELS[e.fromStatus] ?? e.fromStatus} → {BOOKING_STATUS_LABELS[e.toStatus] ?? e.toStatus}
              </div>
              <div className="text-xs text-muted-foreground">
                {e.changedByName} · {fmt(e.createdAt)}
              </div>
              {e.reason && <div className="text-xs mt-1">Sabab: {e.reason}</div>}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
