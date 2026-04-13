import { Pencil, Trash2, MoreHorizontal, ClipboardList, Stethoscope, Plus } from 'lucide-react';
import { Doctor, Patient, Visit } from '@/shared/types';
import { VisitStatusBadge } from '@/shared/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/shared/lib/formatters';

interface DoctorCardProps {
  doctor: Doctor;
  visits: Visit[];
  patients: Patient[];
  onEdit: (doctor: Doctor) => void;
  onDelete: (id: string) => void;
  onAddVisit: (doctor: Doctor) => void;
  onEditVisit: (doctor: Doctor, visit: Visit) => void;
}

const DAYS = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'];

export const DoctorCard = ({ 
  doctor, 
  visits, 
  patients, 
  onEdit, 
  onDelete, 
  onAddVisit, 
  onEditVisit 
}: DoctorCardProps) => {
  const doctorVisits = visits.filter((v) => v.doctorId === doctor.id);
  const doctorPatientIds = [...new Set(doctorVisits.map((v) => v.patientId))];

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
            {doctor.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold">{doctor.name}</p>
            <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(doctor)}>
              <Pencil className="w-4 h-4 mr-2" />
              Tahrirlash
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(doctor.id)}>
              <Trash2 className="w-4 h-4 mr-2" />
              O'chirish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-xs text-muted-foreground space-y-1 mb-3">
        <p>📞 {doctor.phone}</p>
        <p>🕐 {doctor.workingHours}</p>
        <p>{doctorPatientIds.length} ta bemor • {doctorVisits.length} ta tashrif</p>
      </div>

      {doctor.schedule && (
        <div className="flex gap-1 mb-4">
          {DAYS.map((day, i) => {
            const sch = doctor.schedule?.find((s) => s.day === i);
            const isWorking = sch?.isWorking;
            return (
              <div 
                key={i} 
                className={`flex-1 text-center py-1 rounded text-[10px] font-medium ${isWorking ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`} 
                title={isWorking ? `${sch?.startTime} - ${sch?.endTime}` : 'Dam olish'}
              >
                <span>{day}</span>
                {isWorking && <p className="text-[8px] mt-0.5">{sch?.startTime?.slice(0, 5)}</p>}
              </div>
            );
          })}
        </div>
      )}

      <Tabs defaultValue="visits" className="w-full">
        <TabsList className="w-full h-8">
          <TabsTrigger value="visits" className="text-xs flex-1">
            <ClipboardList className="w-3 h-3 mr-1" />
            Tashriflar
          </TabsTrigger>
          <TabsTrigger value="patients" className="text-xs flex-1">
            <Stethoscope className="w-3 h-3 mr-1" />
            Bemorlar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="visits" className="mt-2 space-y-2">
          {doctorVisits.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Tashriflar yo'q</p>
          ) : (
            doctorVisits.slice(0, 3).map((v) => {
              const patient = patients.find((p) => p.id === v.patientId);
              return (
                <div 
                  key={v.id} 
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs cursor-pointer hover:bg-muted/50" 
                  onClick={() => onEditVisit(doctor, v)}
                >
                  <span>{patient?.firstName} {patient?.lastName} — {formatDate(v.date)}</span>
                  <VisitStatusBadge status={v.status} />
                </div>
              );
            })
          )}
          <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={() => onAddVisit(doctor)}>
            <Plus className="w-3 h-3 mr-1" />
            Tashrif qo'shish
          </Button>
        </TabsContent>
        <TabsContent value="patients" className="mt-2 space-y-1">
          {doctorPatientIds.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Bemorlar yo'q</p>
          ) : (
            doctorPatientIds.map((pid) => {
              const patient = patients.find((p) => p.id === pid);
              return patient ? (
                <div key={pid} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs">
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[10px] font-semibold text-accent-foreground">
                    {patient.firstName[0]}
                  </div>
                  {patient.firstName} {patient.lastName}
                </div>
              ) : null;
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
