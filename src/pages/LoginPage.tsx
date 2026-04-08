import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { mockUsers, roleConfig } from '@/mock/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Eye, EyeOff, Lock, Mail, Shield, Stethoscope, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const user = mockUsers.find((u) => u.email === email && u.password === password);
      if (user) {
        login(user);
        toast.success(`Xush kelibsiz, ${user.name}!`);
      } else {
        setError('Email yoki parol noto\'g\'ri');
      }
      setLoading(false);
    }, 800);
  };

  const quickLogin = (user: typeof mockUsers[0]) => {
    setEmail(user.email);
    setPassword(user.password);
    setLoading(true);
    setError('');
    setTimeout(() => {
      login(user);
      toast.success(`Xush kelibsiz, ${user.name}!`);
      setLoading(false);
    }, 600);
  };

  const roleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'doctor': return <Stethoscope className="w-4 h-4" />;
      case 'receptionist': return <UserCheck className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Chap: Brending */}
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
              Zamonaviy stomatologiya<br />boshqaruv tizimi
            </h2>
            <p className="text-primary-foreground/70 mt-3 text-sm leading-relaxed max-w-md">
              Bemorlar, qabullar, moliya va xodimlarni bir joydan boshqaring.
              Tez, qulay va ishonchli tizim.
            </p>
          </div>
          <div className="flex gap-6 text-primary-foreground/60 text-xs">
            <div><span className="text-2xl font-bold text-primary-foreground block">500+</span>Bemorlar</div>
            <div><span className="text-2xl font-bold text-primary-foreground block">4</span>Shifokorlar</div>
            <div><span className="text-2xl font-bold text-primary-foreground block">98%</span>Mamnuniyat</div>
          </div>
        </div>
        <p className="relative z-10 text-primary-foreground/40 text-xs">© 2024 Zahro Dental. Barcha huquqlar himoyalangan.</p>
      </div>

      {/* O'ng: Login formasi */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobil logo */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-display font-bold text-lg">Zahro Dental</h1>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-foreground">Tizimga kirish</h2>
            <p className="text-sm text-muted-foreground mt-1">Hisobingizga kirish uchun ma'lumotlarni kiriting</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@zahro.dental"
                  className="pl-10 h-11"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Parol</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
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
              ) : 'Kirish'}
            </Button>
          </form>

          {/* Tezkor kirish kartalari */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground font-medium">Tezkor kirish</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid gap-2">
              {mockUsers.filter((u, i, arr) => arr.findIndex(x => x.role === u.role) === i).map((user) => (
                <button
                  key={user.id}
                  onClick={() => quickLogin(user)}
                  disabled={loading}
                  className="flex items-center gap-3 w-full p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all duration-200 text-left group disabled:opacity-50"
                >
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                    user.role === 'admin' ? 'bg-primary/15 text-primary' :
                    user.role === 'doctor' ? 'bg-info/15 text-info' :
                    'bg-warning/15 text-warning'
                  )}>
                    {roleIcon(user.role)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4 shrink-0', roleConfig[user.role].color)}>
                        {roleConfig[user.role].label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email} / {user.password}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Barcha foydalanuvchilar jadvali */}
            <details className="group">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
                Barcha foydalanuvchilar ro'yxati
              </summary>
              <div className="mt-2 rounded-xl border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Ism</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Email</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Parol</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer transition-colors"
                        onClick={() => quickLogin(u)}
                      >
                        <td className="px-3 py-2 font-medium">{u.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">{u.password}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4', roleConfig[u.role].color)}>
                            {roleConfig[u.role].label}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
