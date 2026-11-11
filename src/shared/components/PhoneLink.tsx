import { cn } from '@/shared/lib/utils';

/** `tel:` href of a phone number ("+998 90 123-45-67" → "tel:+998901234567"). */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

/** Phone number that dials on tap (reception works from a phone/tablet too). */
export function PhoneLink({ phone, className }: { phone?: string | null; className?: string }) {
  if (!phone) return <span className={className}>—</span>;
  return (
    <a href={telHref(phone)} className={cn('hover:underline hover:text-primary', className)}>
      {phone}
    </a>
  );
}
