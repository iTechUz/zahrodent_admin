import { useStore } from '@/store/useStore';
import { PageHeader } from '@/shared/components/PageHeader';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Moon, Bell, Shield, Lock } from 'lucide-react';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { QueryErrorState } from '@/shared/components/QueryErrorState';
import { useSettings } from '../hooks/useSettings';
import { ClinicInfoForm } from '../components/ClinicInfoForm';
import { ReminderSettingsForm } from '../components/ReminderSettingsForm';
import { ChangePasswordForm } from '../components/ChangePasswordForm';

function ReadOnlyNote() {
  return (
    <div
      role="note"
      className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground"
    >
      <Lock className="w-3.5 h-3.5" />
      Bu sozlamalarni faqat administrator o'zgartira oladi
    </div>
  );
}

function SettingsBody({ tab }: { tab: 'general' | 'notifications' }) {
  const { settings, isLoading, error, refetch, canEdit, save, isSaving } = useSettings();

  if (isLoading) return <Skeleton className="h-80 w-full max-w-3xl rounded-2xl" />;
  if (error || !settings) {
    return <QueryErrorState error={error} onRetry={() => refetch()} title="Sozlamalar yuklanmadi" />;
  }

  return (
    <div className="space-y-4">
      {!canEdit && <ReadOnlyNote />}
      {tab === 'general' ? (
        <div className="max-w-3xl">
          <ClinicInfoForm settings={settings} canEdit={canEdit} isSaving={isSaving} onSave={save} />
        </div>
      ) : (
        <ReminderSettingsForm settings={settings} canEdit={canEdit} isSaving={isSaving} onSave={save} />
      )}
    </div>
  );
}

function SettingsPageContent() {
  const { darkMode, toggleDarkMode } = useStore();

  return (
    <div className="space-y-6 w-full">
      <PageHeader title="Sozlamalar" description="Klinika, eslatmalar va hisob sozlamalari" />

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl mb-6 flex-wrap h-auto">
          <TabsTrigger value="general" className="rounded-lg gap-2 px-4">
            <Building2 className="w-4 h-4" /> Umumiy
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg gap-2 px-4">
            <Bell className="w-4 h-4" /> Eslatmalar
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-lg gap-2 px-4">
            <Moon className="w-4 h-4" /> Ko'rinish
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg gap-2 px-4">
            <Shield className="w-4 h-4" /> Xavfsizlik
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="animate-fade-in">
          <SettingsBody tab="general" />
        </TabsContent>

        <TabsContent value="notifications" className="animate-fade-in">
          <SettingsBody tab="notifications" />
        </TabsContent>

        <TabsContent value="appearance" className="animate-fade-in">
          <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm shadow-xl max-w-3xl">
            <CardHeader>
              <CardTitle className="text-xl">Interfeys ko'rinishi</CardTitle>
              <CardDescription>Interfeys mavzusini almashtirish</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-medium">
                    <Moon className="w-4 h-4 text-primary" />
                    Qorong'u rejim
                  </div>
                  <p className="text-xs text-muted-foreground">Tungi paytda ko'zni toliqtirmaslik uchun xira mavzu</p>
                </div>
                <Switch checked={darkMode} onCheckedChange={toggleDarkMode} aria-label="Qorong'u rejim" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="animate-fade-in">
          <ChangePasswordForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ErrorBoundary name="Sozlamalar">
      <SettingsPageContent />
    </ErrorBoundary>
  );
}
