import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/endpoints';
import { toast } from 'sonner';
import { addDaysToDate, addMonthsToDate, clinicToday } from '@/shared/lib/date-utils';

export type DatePreset = 'tomorrow' | 'nextWeek' | 'nextMonth' | 'custom';

export const useBulkSms = () => {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [datePreset, setDatePreset] = useState<DatePreset>('tomorrow');
  const [targetType, setTargetType] = useState<'patient' | 'doctor'>('patient');
  // date-only strings (YYYY-MM-DD, clinic time zone): the backend treats them as whole days.
  // Local-midnight ISO instants were 19:00Z of the *previous* day in Tashkent.
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>(() => {
    const today = clinicToday();
    return { start: today, end: addDaysToDate(today, 1) };
  });

  const [message, setMessage] = useState('Eslatman: Qabulingiz [sana] kuni soat [vaqt] da kutilmoqda. Zahro Dental.');

  const today = clinicToday();
  const dateRange = useMemo(() => {
    if (datePreset === 'tomorrow') {
      const tomorrow = addDaysToDate(today, 1);
      return { start: tomorrow, end: tomorrow };
    }
    if (datePreset === 'nextWeek') {
      return { start: today, end: addDaysToDate(today, 7) };
    }
    if (datePreset === 'nextMonth') {
      return { start: today, end: addMonthsToDate(today, 1) };
    }
    return customRange;
  }, [datePreset, customRange, today]);

  const { data: recipients = [], isLoading } = useQuery({
    queryKey: ['sms-recipients', dateRange, targetType],
    queryFn: () => notificationsApi.getRecipients({
      startDate: targetType === 'patient' ? dateRange.start : undefined,
      endDate: targetType === 'patient' ? dateRange.end : undefined,
      targetType,
    }),
  });

  const bulkSendMut = useMutation({
    mutationFn: (body: { targetIds: string[]; targetType: 'patient'|'doctor'; message: string }) => 
      notificationsApi.bulkSend(body),
    onSuccess: (res) => {
      toast.success(`${res.sent} ta SMS muvaffaqiyatli yuborildi. ${res.failed} ta xato.`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['notifications'] }); // Invalidate history
      queryClient.invalidateQueries({ queryKey: ['sms-recipients'] }); // Refresh list (should remove sent ones)
    },
    onError: () => {
      toast.error('SMS yuborishda xatolik yuz berdi');
    }
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === recipients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(recipients.map(r => r.id));
    }
  };

  const handleSend = () => {
    if (selectedIds.length === 0) {
      toast.error('Kamida bitta qabul qiluvchini tanlang');
      return;
    }
    if (message.length < 5) {
      toast.error('SMS xabari juda qisqa');
      return;
    }
    bulkSendMut.mutate({ targetIds: selectedIds, targetType, message });
  };

  return {
    recipients,
    isLoading,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    datePreset,
    setDatePreset,
    dateRange,
    customRange,
    setCustomRange,
    targetType,
    setTargetType: (t: 'patient' | 'doctor') => {
      setTargetType(t);
      setSelectedIds([]);
    },
    message,
    setMessage,
    handleSend,
    isSending: bulkSendMut.isPending,
  };
};
