import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Camera, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { UserAvatar } from '@/shared/components/UserAvatar';
import { AVATAR_ACCEPT, avatarFileError } from '@/shared/lib/avatar-file';
import { uploadsApi } from '@/lib/api/endpoints';

/** Logged-in user's avatar; a doctor can click it to upload their own photo. */
export function SidebarAvatar() {
  const { currentUser, setUser } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  if (!currentUser) return null;
  const [firstName, ...rest] = currentUser.name.split(' ');
  const canUpload = currentUser.role === 'doctor' && !!currentUser.doctorId;

  const onFile = async (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;
    const error = avatarFileError(file);
    if (error) {
      toast.error(error);
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadsApi.ownAvatar(file);
      setUser({ ...currentUser, avatar: url });
      toast.success('Rasm yangilandi');
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Rasmni yuklab bo'lmadi");
    } finally {
      setUploading(false);
    }
  };

  const avatar = (
    <UserAvatar
      src={currentUser.avatar}
      firstName={firstName}
      lastName={rest.join(' ')}
      className="h-8 w-8 rounded-full"
      fallbackClassName="rounded-full text-xs"
    />
  );
  if (!canUpload) return <div className="shrink-0">{avatar}</div>;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label="Rasmni o'zgartirish"
        title="Rasmni o'zgartirish"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="group relative block rounded-full"
      >
        {avatar}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        </span>
      </button>
      <input ref={inputRef} type="file" accept={AVATAR_ACCEPT} className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
    </div>
  );
}
