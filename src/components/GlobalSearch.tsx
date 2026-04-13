import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Users, Stethoscope, CalendarDays } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'patient' | 'doctor' | 'booking' | 'payment';
  path: string;
  icon: typeof Users;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { patients, doctors, bookings } = useStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setQuery('');
        setSelectedIndex(0);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const patientResults: SearchResult[] = patients
      .filter(p => `${p.firstName} ${p.lastName} ${p.phone}`.toLowerCase().includes(q))
      .slice(0, 4)
      .map(p => ({
        id: p.id, title: `${p.firstName} ${p.lastName}`, subtitle: p.phone,
        type: 'patient', path: '/patients', icon: Users,
      }));

    const doctorResults: SearchResult[] = doctors
      .filter(d => `${d.name} ${d.specialty}`.toLowerCase().includes(q))
      .slice(0, 3)
      .map(d => ({
        id: d.id, title: d.name, subtitle: d.specialty,
        type: 'doctor', path: '/doctors', icon: Stethoscope,
      }));

    const bookingResults: SearchResult[] = bookings
      .filter(b => {
        const patient = patients.find(p => p.id === b.patientId);
        return `${patient?.firstName} ${patient?.lastName} ${b.date}`.toLowerCase().includes(q);
      })
      .slice(0, 3)
      .map(b => {
        const patient = patients.find(p => p.id === b.patientId);
        return {
          id: b.id, title: `${patient?.firstName} ${patient?.lastName}`, subtitle: `${b.date} ${b.time}`,
          type: 'booking' as const, path: '/bookings', icon: CalendarDays,
        };
      });

    return [...patientResults, ...doctorResults, ...bookingResults];
  }, [query, patients, doctors, bookings]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIndex]) { handleSelect(results[selectedIndex]); }
  };

  const typeLabels: Record<string, string> = {
    patient: 'Bemor', doctor: 'Shifokor', booking: 'Qabul', payment: 'To\'lov',
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <div className="flex items-center border-b border-border px-4">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Bemor, shifokor yoki qabul qidirish..."
            className="border-0 focus-visible:ring-0 text-sm h-12"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground font-mono">
            ESC
          </kbd>
        </div>

        {query.trim() && (
          <div className="max-h-[300px] overflow-y-auto p-2">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                "{query}" bo'yicha natija topilmadi
              </p>
            ) : (
              <div className="space-y-1">
                {results.map((r, i) => (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleSelect(r)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                      i === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50',
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <r.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                      {typeLabels[r.type]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!query.trim() && (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Qidirish uchun yozing...</p>
            <p className="text-xs text-muted-foreground mt-1">
              <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">Ctrl</kbd>
              {' + '}
              <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">K</kbd>
              {' bilan tezkor ochish'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
