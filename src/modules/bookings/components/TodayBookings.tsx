import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, CheckCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { bookingsApi } from '@/lib/api/endpoints';
import { fetchAllPages } from '@/lib/api/helpers';
import { queryKeys } from '@/lib/api/query-keys';
import { useStore } from '@/store/useStore';
import { clinicToday } from '@/shared/lib/date-utils';
import { formatDate } from '@/shared/lib/formatters';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PatientNameLabel } from '@/shared/components/PatientNameLabel';
import { QueryErrorState } from '@/shared/components/QueryErrorState';
import { EmptyState } from '@/shared/components/EmptyState';
import { resolvePatientRef } from '@/shared/lib/patient-ref';
import { Skeleton } from '@/components/ui/skeleton';
import type { Booking, BookingStatus, Doctor } from '@/shared/types';
import { COMPLETE_NEEDS_SERVICE, canCompleteBooking } from './BookingStatusDialogs';

/** Quick status actions available for a booking in a given status (inline buttons of the "Bugun" view). */
export function todayActions(status: BookingStatus): BookingStatus[] {
  switch (status) {
    case 'pending':
    case 'confirmed':
      return ['arrived', 'completed', 'no-show'];
    case 'arrived':
      return ['completed', 'no-show'];
    default:
      return []; // completed / cancelled / no-show: change through the list menu
  }
}

const ACTION_LABEL: Partial<Record<BookingStatus, string>> = {
  arrived: 'Keldi',
  completed: 'Yakunlandi',
  'no-show': 'Kelmadi',
};
const ACTION_ICON = { arrived: Check, completed: CheckCheck, 'no-show': UserX } as const;

/** "Bugungi jadval": today's bookings by time, with one-click status actions. */
export function TodayBookings({
  doctors,
  canUpdate,
  onRequestStatus,
  onOpen,
}: {
  doctors: Doctor[];
  canUpdate: boolean;
  /** goes through the same confirm / cancel-reason / undo flow as the list */
  onRequestStatus: (booking: Booking, to: BookingStatus) => void;
  onOpen: (booking: Booking) => void;
}) {
  const authed = useStore((s) => s.isAuthenticated);
  const today = clinicToday();
  const [doctorId, setDoctorId] = useState('all');
  const params = { startDate: today, endDate: today, ...(doctorId !== 'all' ? { doctorId } : {}) };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.bookingsLookup({ ...params, view: 'today' }),
    queryFn: () => fetchAllPages(bookingsApi.list, params),
    enabled: authed,
  });
  const rows = useMemo(() => [...(data?.data ?? [])].sort((a, b) => a.time.localeCompare(b.time)), [data]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {formatDate(today)} — {rows.length} ta qabul
        </p>
        <Select value={doctorId} onValueChange={setDoctorId}>
          <SelectTrigger className="w-[190px]" aria-label="Shifokor">
            <SelectValue placeholder="Shifokor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha shifokorlar</SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.firstName} {d.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && !isLoading ? (
        <QueryErrorState error={error} onRetry={() => refetch()} title="Bugungi qabullar yuklanmadi" />
      ) : isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="Bugun qabullar yo'q" />
      ) : (
        <ul className="space-y-2">
          {rows.map((b) => {
            const doctor = doctors.find((d) => d.id === b.doctorId);
            const actions = canUpdate ? todayActions(b.status) : [];
            return (
              <li
                key={b.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => onOpen(b)}
                  className="w-14 shrink-0 text-left text-sm font-semibold tabular-nums hover:text-primary"
                  aria-label={`${b.time} — tafsilotlar`}
                >
                  {b.time}
                </button>
                <div className="min-w-0 flex-1">
                  <Link to={`/patients/${b.patientId}`} className="text-sm font-medium text-primary hover:underline">
                    <PatientNameLabel patient={resolvePatientRef(b)} />
                  </Link>
                  <p className="text-xs text-muted-foreground">{doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : '—'}</p>
                </div>
                <StatusBadge status={b.status} />
                {actions.length > 0 && (
                  <div className="flex gap-1">
                    {actions.map((to) => {
                      const Icon = ACTION_ICON[to as keyof typeof ACTION_ICON];
                      const blocked = to === 'completed' && !canCompleteBooking(b);
                      return (
                        <span key={to} title={blocked ? COMPLETE_NEEDS_SERVICE : undefined}>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-xs"
                            disabled={blocked}
                            onClick={() => onRequestStatus(b, to)}
                          >
                            <Icon className="w-3.5 h-3.5" /> {ACTION_LABEL[to]}
                          </Button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
