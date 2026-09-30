import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { loginRequest } from '@/lib/api/endpoints';
import { ApiError, NETWORK_ERROR_MESSAGE } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Sparkles, Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { takeAuthNotice } from '@/lib/api/auth-token';

export default function LoginPage() {
  const setSession = useStore((s) => s.setSession);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // "Sessiya muddati tugagan…" etc. — set by the API client before redirecting here (read once)
  const [notice] = useState(() => takeAuthNotice());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim() || !password.trim()) {
      setError("Iltimos, barcha maydonlarni to'ldiring");
      return;
    }

    if (!/^\+998\d{9}$/.test(phone.trim())) {
      setError("Telefon raqami noto'g'ri formatda (+998XXXXXXXXX)");
      return;
    }

    setLoading(true);
    try {
      const res = await loginRequest({ phone: phone.trim(), password });
      const { user, ...tokens } = res;
      setSession(tokens, user, rememberMe);
      toast.success(`Xush kelibsiz, ${res.user.name}!`);
    } catch (err) {
      // ApiError: backend message (wrong phone / password, 429 …) or the network message (status 0).
      // Anything else never reached the server — don't claim the password is wrong.
      const msg =
        err instanceof ApiError
          ? err.isNetworkError
            ? NETWORK_ERROR_MESSAGE
            : err.message
          : err instanceof TypeError
            ? NETWORK_ERROR_MESSAGE
            : "Kutilmagan xatolik yuz berdi. Qayta urinib ko'ring";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-2 border-primary-foreground/20" />
          <div className="absolute bottom-32 right-16 w-48 h-48 rounded-full border-2 border-primary-foreground/20" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full border-2 border-primary-foreground/20" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-display font-bold text-2xl text-primary-foreground">Zahro Dental</h1>
          </div>
          <p className="text-primary-foreground/70 text-sm">Boshqaruv tizimi</p>
        </div>
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="font-display font-bold text-3xl text-primary-foreground leading-tight">
              Zamonaviy stomatologiya
              <br />
              boshqaruv tizimi
            </h2>
            <p className="text-primary-foreground/70 mt-3 text-sm leading-relaxed max-w-md">
              Tizimga kirish uchun administrator tomonidan berilgan telefon raqami va paroldan foydalaning.
            </p>
          </div>
        </div>
        <p className="relative z-10 text-primary-foreground/40 text-xs">© Zahro Dental</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-display font-bold text-lg">Zahro Dental</h1>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-foreground">Tizimga kirish</h2>
            <p className="text-sm text-muted-foreground mt-1">Hisobingizga kirish uchun ma&apos;lumotlarni kiriting</p>
          </div>

          {notice && !error && (
            <div
              role="status"
              className="bg-warning/10 border border-warning/30 rounded-lg px-4 py-2.5 text-sm text-foreground"
            >
              {notice}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Telefon raqami
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground flex items-center justify-center font-bold text-[10px]">
                  UZ
                </div>
                <PhoneInput
                  id="phone"
                  name="username"
                  type="tel"
                  className="pl-10 h-11"
                  value={phone}
                  onChange={(val: string) => {
                    setPhone(val);
                    setError('');
                  }}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Parol
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe} 
                  onCheckedChange={(checked) => setRememberMe(!!checked)} 
                />
                <Label 
                  htmlFor="remember" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Eslab qolish
                </Label>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Kirish...
                </span>
              ) : (
                'Kirish'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
