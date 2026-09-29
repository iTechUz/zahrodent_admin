import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api/query-client';

interface QueryErrorStateProps {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

/** Inline error state for a failed query — instead of silently rendering zeros / "no data". */
export function QueryErrorState({
  error,
  title = "Ma'lumotlarni yuklab bo'lmadi",
  onRetry,
  className = '',
}: QueryErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center py-12 text-center bg-card rounded-xl border border-destructive/30 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-md">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="w-3.5 h-3.5 mr-2" />
          Qayta urinish
        </Button>
      )}
    </div>
  );
}
