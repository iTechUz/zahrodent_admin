import { FileX } from 'lucide-react';

export function EmptyState({ title = 'Ma\'lumot topilmadi', description = 'Qidiruv yoki filtrlarni o\'zgartirib ko\'ring.' }: { title?: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <FileX className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
