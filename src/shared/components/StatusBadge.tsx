import { BookingStatus, BookingSource, PaymentStatus, VisitStatus } from '@/shared/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { 
  BOOKING_STATUS_LABELS, 
  BOOKING_SOURCE_LABELS, 
  PAYMENT_STATUS_LABELS, 
  VISIT_STATUS_LABELS 
} from '@/shared/constants';

const statusStyles: Record<BookingStatus, string> = {
  pending: 'bg-warning/15 text-warning border-warning/30',
  confirmed: 'bg-info/15 text-info border-info/30',
  arrived: 'bg-primary/15 text-primary border-primary/30',
  'no-show': 'bg-destructive/15 text-destructive border-destructive/30',
  completed: 'bg-success/15 text-success border-success/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

const paymentStyles: Record<PaymentStatus, string> = {
  paid: 'bg-success/15 text-success border-success/30',
  partial: 'bg-warning/15 text-warning border-warning/30',
  unpaid: 'bg-destructive/15 text-destructive border-destructive/30',
};

const visitStyles: Record<VisitStatus, string> = {
  'not-started': 'bg-muted text-muted-foreground border-border',
  'in-progress': 'bg-info/15 text-info border-info/30',
  completed: 'bg-success/15 text-success border-success/30',
};

const sourceStyles: Record<BookingSource, string> = {
  'walk-in': 'bg-accent text-accent-foreground border-border',
  telegram: 'bg-info/15 text-info border-info/30',
  website: 'bg-primary/15 text-primary border-primary/30',
  phone: 'bg-warning/15 text-warning border-warning/30',
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <Badge variant="outline" className={cn('text-xs font-medium', statusStyles[status])}>{BOOKING_STATUS_LABELS[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant="outline" className={cn('text-xs font-medium', paymentStyles[status])}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}

export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  return <Badge variant="outline" className={cn('text-xs font-medium', visitStyles[status])}>{VISIT_STATUS_LABELS[status]}</Badge>;
}

export function SourceBadge({ source }: { source: BookingSource }) {
  return <Badge variant="outline" className={cn('text-xs font-medium', sourceStyles[source])}>{BOOKING_SOURCE_LABELS[source]}</Badge>;
}
