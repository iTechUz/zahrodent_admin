import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDoctor, useDoctors } from '../hooks/useDoctors';
import { visitsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { useCan } from '@/shared/hooks/usePermissions';
import { VISIT_STATUS_LABELS } from '@/shared/constants';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { 
  User, 
  Phone, 
  Briefcase, 
  Calendar, 
  Clock, 
  ArrowLeft,
  Users,
  TrendingUp,
  CreditCard,
  ClipboardList,
  Edit2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/shared/components/StatCard';
import { formatUzS } from '@/shared/lib/formatters';
import { DOCTOR_WEEKDAY_LABELS, normalizeDoctorSchedule } from '@/shared/lib/doctor-schedule';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DoctorForm, DoctorVisitForm } from '../components/DoctorForm';
import { SortableTableHead } from '@/shared/components/SortableHeader';
import { PatientNameLabel } from '@/shared/components/PatientNameLabel';
import { resolvePatientRef } from '@/shared/lib/patient-ref';
import { sortBy, type SortField } from '@/lib/api/sort-fields';
import type { SortOrder } from '@/lib/api/endpoints';

export const RECENT_VISITS_LIMIT = 10;

function DoctorDetailsContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: doctor, isLoading: doctorLoading } = useDoctor(id!);
  const can = useCan();
  const {
    efficiency,
    openEdit,
    modalOpen,
    setModalOpen,
    editing,
    handleSaveDoctor,
    patients,
    visitModal,
    setVisitModal,
    editingVisit,
    selectedDoctor,
    openVisitForm,
    handleSaveVisit,
  } = useDoctors();

  const doctorEfficiency = efficiency.find(e => e.id === id);
  // backend /doctors/efficiency returns `totalVisits` (there is no `visitCount`)
  const totalVisits = doctorEfficiency?.totalVisits ?? 0;
  const avgCheck =
    doctorEfficiency?.avgCheck ??
    (totalVisits > 0 ? Math.round((doctorEfficiency?.totalRevenue ?? 0) / totalVisits) : 0);

  // server-side sort of the recent visits (default: backend date desc)
  const [visitSort, setVisitSort] = useState<{ sortBy?: SortField<'visits'>; order?: SortOrder }>({});
  const toggleVisitSort = (field: string) =>
    setVisitSort((prev) => ({
      sortBy: field as SortField<'visits'>,
      order: prev.sortBy === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  const visitParams = { doctorId: id, limit: RECENT_VISITS_LIMIT, ...visitSort };
  const { data: visitsRes } = useQuery({
    queryKey: queryKeys.visitsList(visitParams),
    queryFn: () => visitsApi.list(visitParams),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
  const recentVisits = visitsRes?.data ?? [];
  const visitPatient = (v: (typeof recentVisits)[number]) => resolvePatientRef(v, patients);

  if (doctorLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Shifokor topilmadi</h2>
        <Button variant="link" onClick={() => navigate('/doctors')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Orqaga qaytish
        </Button>
      </div>
    );
  }

  const normalizedSchedule = normalizeDoctorSchedule(doctor.schedule);

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border border-primary/10 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-success/5 rounded-full -ml-16 -mb-16 blur-2xl" />
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/doctors')} 
              className="rounded-full bg-background/50 hover:bg-background border border-border/50 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <User className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-extrabold tracking-tight">
                    {doctor.firstName} {doctor.lastName}
                  </h1>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold uppercase tracking-wider text-[10px]">
                    Faol
                  </Badge>
                </div>
                <p className="text-muted-foreground flex items-center gap-2 font-medium">
                  <Briefcase className="w-4 h-4 text-primary/60" /> {doctor.specialty}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {doctor.phone}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {can('doctors.update') && (
              <Button
                onClick={() => openEdit(doctor)}
                variant="outline"
                className="flex-1 md:flex-none h-11 px-6 rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary transition-all font-semibold"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Tahrirlash
              </Button>
            )}
            {can('visits.create') && (
              <Button
                onClick={() => openVisitForm(doctor)}
                className="flex-1 md:flex-none h-11 px-6 rounded-xl shadow-lg shadow-primary/20 font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tashrif qo'shish
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Jami bemorlar"
          value={doctorEfficiency?.uniquePatients || 0}
          icon={<Users className="w-5 h-5 text-primary" />}
          trend="Unique patients"
          className="bg-card/50 backdrop-blur-sm border-none shadow-lg"
        />
        <StatCard 
          title="Umumiy tushum"
          value={formatUzS(doctorEfficiency?.totalRevenue || 0)}
          icon={<CreditCard className="w-5 h-5 text-success" />}
          trend="Total revenue"
          className="bg-card/50 backdrop-blur-sm border-none shadow-lg"
        />
        <StatCard 
          title="Tashriflar"
          value={totalVisits}
          icon={<ClipboardList className="w-5 h-5 text-info" />}
          trend="Total visits"
          className="bg-card/50 backdrop-blur-sm border-none shadow-lg"
        />
        <StatCard 
          title="O'rtacha chek"
          value={formatUzS(avgCheck)}
          icon={<TrendingUp className="w-5 h-5 text-warning" />}
          trend="Avg per visit"
          className="bg-card/50 backdrop-blur-sm border-none shadow-lg"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <Card className="lg:col-span-1 border-none shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Ma'lumotlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="w-4 h-4" /> Telefon
              </span>
              <span className="font-medium">{doctor.phone}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Mutaxassislik
              </span>
              <Badge variant="secondary">{doctor.specialty}</Badge>
            </div>
            {doctor.loginPhone && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Login telefoni
                </span>
                <span className="font-medium">{doctor.loginPhone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="lg:col-span-2 border-none shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Ish vaqti jadvali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {normalizedSchedule.map((s, i) => (
                <div 
                  key={i} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${s.isWorking ? 'border-primary/20 bg-primary/5 shadow-sm shadow-primary/5' : 'border-border/50 bg-muted/10 opacity-60'}`}
                >
                  <span className="font-bold text-sm min-w-[40px]">{DOCTOR_WEEKDAY_LABELS[s.day]}</span>
                  {s.isWorking ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-background font-mono">{s.startTime}</Badge>
                      <span className="text-xs text-muted-foreground opacity-50">—</span>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-background font-mono">{s.endTime}</Badge>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">Dam olish kuni</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Oxirgi faoliyat (Tashriflar)</CardTitle>
        </CardHeader>
        <CardContent>
          {recentVisits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead sortKey={sortBy('visits', 'date')} sort={visitSort} onSort={toggleVisitSort}>
                    Sana
                  </SortableTableHead>
                  <TableHead>Bemor</TableHead>
                  <TableHead>Tashxis</TableHead>
                  <SortableTableHead sortKey={sortBy('visits', 'price')} sort={visitSort} onSort={toggleVisitSort}>
                    Narx
                  </SortableTableHead>
                  <SortableTableHead sortKey={sortBy('visits', 'status')} sort={visitSort} onSort={toggleVisitSort}>
                    Holat
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentVisits.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="text-xs">{v.date}</TableCell>
                    <TableCell className="font-medium text-xs">
                      {visitPatient(v) ? <PatientNameLabel patient={visitPatient(v)} /> : `#${v.patientId.slice(-4)}`}
                    </TableCell>
                    <TableCell className="text-xs truncate max-w-[200px]">{v.diagnosis}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{formatUzS(Number(v.price) || 0)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {VISIT_STATUS_LABELS[v.status] ?? v.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Hozircha tashriflar mavjud emas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Form Modal */}
      <DoctorForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSaveDoctor}
        editing={editing}
      />

      <DoctorVisitForm
        open={visitModal}
        onOpenChange={setVisitModal}
        editingVisit={editingVisit}
        doctor={selectedDoctor}
        patients={patients}
        onSave={handleSaveVisit}
      />
    </div>
  );
}

export default function DoctorDetailsPage() {
  return (
    <ErrorBoundary name="Shifokor Ma'lumotlari">
      <DoctorDetailsContent />
    </ErrorBoundary>
  );
}

