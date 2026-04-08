import { useStore } from '@/store/useStore';
import { PageHeader } from '@/components/PageHeader';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const { darkMode, toggleDarkMode } = useStore();

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Sozlamalar" description="Tizim sozlamalarini boshqarish" />

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-4">Ko'rinish</h3>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Qorong'u rejim</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Tungi rejimni yoqish/o'chirish</p>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold mb-4">Klinika ma'lumotlari</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Klinika nomi</span><span className="font-medium">Zahro Dental Klinika</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Manzil</span><span className="font-medium">Toshkent, O'zbekiston</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Telefon</span><span className="font-medium">+998 71 123 4567</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">info@zahro.dental</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Ish vaqti</span><span className="font-medium">Du-Sha 9:00 — 18:00</span></div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold mb-4">Xabarnomalar</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div><Label className="text-sm">SMS xabarnomalar</Label><p className="text-xs text-muted-foreground mt-0.5">Bemorlarga SMS eslatmalar yuborish</p></div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div><Label className="text-sm">Telegram bot</Label><p className="text-xs text-muted-foreground mt-0.5">Telegram orqali bildirishnomalar yuborish</p></div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
