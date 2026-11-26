import { useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/shared/components/UserAvatar';
import { AVATAR_ACCEPT, avatarFileError } from '@/shared/lib/avatar-file';
import { uploadsApi } from '@/lib/api/endpoints';

interface AvatarUploadProps {
  value?: string;
  onChange: (url: string) => void;
  firstName?: string;
  lastName?: string;
}

/** Photo picker: validates JPG/PNG/WEBP ≤ 3 MB, uploads to the CDN and hands back the URL ('' = removed). */
export const AvatarUpload = ({ value, onChange, firstName, lastName }: AvatarUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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
      const { url } = await uploadsApi.avatar(file);
      onChange(url);
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Rasmni yuklab bo'lmadi");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <UserAvatar src={value} firstName={firstName} lastName={lastName} className="h-16 w-16" fallbackClassName="text-lg" />
      <div className="space-y-1">
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
            {value ? "Rasmni almashtirish" : 'Rasm yuklash'}
          </Button>
          {value && !uploading && (
            <Button type="button" variant="ghost" size="icon" tooltip="Rasmni o'chirish" onClick={() => onChange('')}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG yoki WEBP, 3 MB gacha</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_ACCEPT}
        className="hidden"
        data-testid="avatar-file-input"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
    </div>
  );
};
