import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/shared/lib/utils';
import { initials } from '@/shared/lib/avatar-file';

interface UserAvatarProps {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  className?: string;
  fallbackClassName?: string;
}

/** Photo when there is one (and it loads), otherwise the person's initials on the brand gradient. */
export const UserAvatar = ({ src, firstName, lastName, className, fallbackClassName }: UserAvatarProps) => (
  <Avatar className={cn('rounded-xl', className)}>
    {src ? <AvatarImage src={src} alt={`${firstName ?? ''} ${lastName ?? ''}`.trim()} className="object-cover" /> : null}
    <AvatarFallback
      className={cn('rounded-xl gradient-primary text-primary-foreground font-bold', fallbackClassName)}
    >
      {initials(firstName, lastName) || '?'}
    </AvatarFallback>
  </Avatar>
);
