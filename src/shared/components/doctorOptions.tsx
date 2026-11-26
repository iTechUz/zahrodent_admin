import type { Doctor } from '@/shared/types';
import { UserAvatar } from '@/shared/components/UserAvatar';

/** Options for SearchableSelect doctor pickers: avatar (initials when no photo) + "Name Surname (specialty)". */
export const doctorSelectOptions = (doctors: Doctor[]) =>
  doctors.map((d) => ({
    value: d.id,
    label: `${d.firstName} ${d.lastName} (${d.specialty})`,
    icon: <UserAvatar src={d.avatar} firstName={d.firstName} lastName={d.lastName} className="h-6 w-6" fallbackClassName="text-[10px]" />,
  }));
