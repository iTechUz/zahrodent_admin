import { BookingStatus, BookingSource, PaymentStatus, VisitStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles: Record<BookingStatus, string> = {
  pending: 'bg-warning/15 text-warning border-warning/30',
  confirmed: 'bg-info/15 text-info border-info/30',
  arrived: 'bg-primary/15 text-primary border-primary/30',
  'no-show': 'bg-destructive/15 text-destructive border-destructive/30',
  completed: 'bg-success/15 text-success border-success/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

const statusLabels: Record<BookingStatus, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlangan',
  arrived: 'Keldi',
  'no-show': 'Kelmadi',
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
};

const paymentStyles: Record<PaymentStatus, string> = {
  paid: 'bg-success/15 text-success border-success/30',
  partial: 'bg-warning/15 text-warning border-warning/30',
  unpaid: 'bg-destructive/15 text-destructive border-destructive/30',
};

const paymentLabels: Record<PaymentStatus, string> = {
  paid: 'To\'langan',
  partial: 'Qisman',
  unpaid: 'To\'lanmagan',
};

const visitStyles: Record<VisitStatus, string> = {
  'not-started': 'bg-muted text-muted-foreground border-border',
  'in-progress': 'bg-info/15 text-info border-info/30',
  completed: 'bg-success/15 text-success border-success/30',
};

const visitLabels: Record<VisitStatus, string> = {
  'not-started': 'Boshlanmagan',
  'in-progress': 'Jarayonda',
  completed: 'Yakunlangan',
};

const sourceStyles: Record<BookingSource, string> = {
  'walk-in': 'bg-accent text-accent-foreground border-border',
  telegram: 'bg-info/15 text-info border-info/30',
  website: 'bg-primary/15 text-primary border-primary/30',
  phone: 'bg-warning/15 text-warning border-warning/30',
};

const sourceLabels: Record<BookingSource, string> = {
  'walk-in': 'Shaxsan',
  telegram: 'Telegram',
  website: 'Veb-sayt',
  phone: 'Telefon',
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <Badge variant="outline" className={cn('text-xs font-medium', statusStyles[status])}>{statusLabels[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant="outline" className={cn('text-xs font-medium', paymentStyles[status])}>{paymentLabels[status]}</Badge>;
}

export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  return <Badge variant="outline" className={cn('text-xs font-medium', visitStyles[status])}>{visitLabels[status]}</Badge>;
}

export function SourceBadge({ source }: { source: BookingSource }) {
  return <Badge variant="outline" className={cn('text-xs font-medium', sourceStyles[source])}>{sourceLabels[source]}</Badge>;
}
