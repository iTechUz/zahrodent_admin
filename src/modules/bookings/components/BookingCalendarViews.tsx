import { useState } from 'react';
import { DraggableBookingCalendar } from '@/components';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Booking } from '@/shared/types';
import type { BookingPrefill } from './BookingForm';
import { TimeGridCalendar } from './TimeGridCalendar';

type View = 'day' | 'week' | 'month';

interface BookingCalendarViewsProps {
  onSlotClick: (prefill: BookingPrefill) => void;
  onBookingClick: (booking: Booking) => void;
}

/** Calendar tab: day / week time grids (click a free slot to create) and the existing month view. */
export function BookingCalendarViews({ onSlotClick, onBookingClick }: BookingCalendarViewsProps) {
  const [view, setView] = useState<View>('week');
  return (
    <div className="space-y-3">
      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList aria-label="Kalendar ko'rinishi">
          <TabsTrigger value="day">Kun</TabsTrigger>
          <TabsTrigger value="week">Hafta</TabsTrigger>
          <TabsTrigger value="month">Oy</TabsTrigger>
        </TabsList>
      </Tabs>
      {view === 'month' ? (
        <DraggableBookingCalendar />
      ) : (
        <TimeGridCalendar key={view} mode={view} onSlotClick={onSlotClick} onBookingClick={onBookingClick} />
      )}
    </div>
  );
}
