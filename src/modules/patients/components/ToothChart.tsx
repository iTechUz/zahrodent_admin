import { ToothRecord } from '@/shared/types';

export const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  healthy: { label: "Sog'lom", color: 'bg-success/20 text-success' },
  cavity: { label: 'Kariyes', color: 'bg-destructive/20 text-destructive' },
  filled: { label: 'Plombalangan', color: 'bg-info/20 text-info' },
  crown: { label: 'Toj', color: 'bg-warning/20 text-warning' },
  missing: { label: "Yo'q", color: 'bg-muted text-muted-foreground' },
  implant: { label: 'Implant', color: 'bg-primary/20 text-primary' },
  'root-canal': { label: 'Ildiz kanali', color: 'bg-accent text-accent-foreground' },
};

export const CONDITION_KEYS = Object.keys(CONDITION_LABELS) as ToothRecord['condition'][];

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

interface ToothChartProps {
  toothChart: Record<number, ToothRecord>;
  onToothClick: (num: number) => void;
}

export const ToothChart = ({ toothChart, onToothClick }: ToothChartProps) => {
  const renderTooth = (num: number) => {
    const record = toothChart[num];
    const condition = record?.condition || 'healthy';
    const info = CONDITION_LABELS[condition];

    return (
      <div
        key={num}
        onClick={() => onToothClick(num)}
        className={`w-7 h-8 md:w-8 md:h-9 rounded text-[10px] font-medium flex flex-col items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all ${info.color} border border-border/50`}
        title={`${num}: ${info.label}${record?.notes ? ` - ${record.notes}` : ''}`}
      >
        <span>{num}</span>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold mb-1">Tish xaritasi</h3>
      <p className="text-xs text-muted-foreground mb-3">Tishni bosib ma'lumot kiritish yoki o'zgartirish mumkin</p>
      <div className="space-y-2">
        <div className="flex justify-center gap-0.5 flex-wrap">{UPPER_TEETH.map(renderTooth)}</div>
        <div className="border-t border-border" />
        <div className="flex justify-center gap-0.5 flex-wrap">{LOWER_TEETH.map(renderTooth)}</div>
      </div>
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {Object.entries(CONDITION_LABELS).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5 text-[10px]">
            <div className={`w-3 h-3 rounded ${val.color}`} />
            {val.label}
          </div>
        ))}
      </div>
    </div>
  );
};
