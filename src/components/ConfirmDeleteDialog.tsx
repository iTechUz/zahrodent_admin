import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  /** red confirm button (default); pass false for non-destructive confirmations */
  destructive?: boolean;
}

export function ConfirmDeleteDialog({ open, onOpenChange, onConfirm, title = 'Ishonchingiz komilmi?', description = 'Bu amalni qaytarib bo\'lmaydi. Ma\'lumot butunlay o\'chiriladi.', confirmLabel = "O'chirish", destructive = true }: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
