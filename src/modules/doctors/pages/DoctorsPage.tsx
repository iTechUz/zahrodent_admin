import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { Plus, Search, Filter, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useDoctors } from '../hooks/useDoctors';
import { DoctorForm, DoctorVisitForm } from '../components/DoctorForm';
import { Users, HeartPulse, ClipboardCheck, BarChart3, List, MoreVertical, Edit2, Trash2, Calendar } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { formatUzS } from '@/shared/lib/formatters';
import { DOCTOR_WEEKDAY_LABELS } from '@/shared/lib/doctor-schedule';
import { Badge } from '@/components/ui/badge';
import { DoctorEfficiencyStats } from '../components/DoctorEfficiencyStats';
import { useState } from 'react';
import { useCan } from '@/shared/hooks/usePermissions';
import { QueryErrorState } from '@/shared/components/QueryErrorState';
import { cn } from '@/shared/lib/utils';
import { StatCard } from '@/shared/components/StatCard';
import { SortableTableHead } from '@/shared/components/SortableHeader';
import { sortBy } from '@/lib/api/sort-fields';

function DoctorsPageContent() {
  const {
    doctors,
    totalDoctors,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    sort,
    setSort,
    filters,
    setFilters,
    patients,
    modalOpen,
    setModalOpen,
    editing,
    deleteId,
    setDeleteId,
    selectedDoctor,
    visitModal,
    setVisitModal,
    editingVisit,
    openCreate,
    openEdit,
    handleSaveDoctor,
    handleDeleteDoctor,
    openVisitForm,
    handleSaveVisit,
    stats,
    efficiency,
    isLoading,
    error,
    refetch,
  } = useDoctors();

  const [activeTab, setActiveTab] = useState<'list' | 'efficiency'>('list');
  const can = useCan();
  const isAdmin = can('doctors.efficiency');

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Shifokorlar" 
        description="Shifokorlar va tashriflarni boshqarish" 
        action={
          can('doctors.create') && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Shifokor qo'shish
            </Button>
          )
        } 
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        <StatCard 
          title="Jami shifokorlar" 
          value={stats?.total ?? 0} 
          icon={<Users className="w-5 h-5 text-primary" />} 
          trend="Bizning jamoa"
        />
        <StatCard 
          title="Bugun faol" 
          value={stats?.activeToday ?? 0} 
          icon={<HeartPulse className="w-5 h-5 text-success" />} 
          trend="Xizmat ko'rsatmoqda"
          trendUp={true}
        />
        <StatCard 
          title="Jami tashriflar" 
          value={stats?.totalVisits ?? 0} 
          icon={<ClipboardCheck className="w-5 h-5 text-info" />} 
          trend="Tizimdagi jami"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex p-1 bg-muted rounded-lg w-full md:w-auto">
          <button
            onClick={() => setActiveTab('list')}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all flex-1 md:flex-none",
              activeTab === 'list' 
                ? "bg-card text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="w-4 h-4" /> Ro'yxat
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('efficiency')}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all flex-1 md:flex-none",
                activeTab === 'efficiency' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BarChart3 className="w-4 h-4" /> Samaradorlik
            </button>
          )}
        </div>

        {activeTab === 'list' && (
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1 justify-end">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Shifokor ismi yoki telefon bo'yicha..." 
                className="pl-9" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>

            <Select 
              value={filters.specialty || 'all'} 
              onValueChange={(val) => setFilters('specialty', val)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Mutaxassislik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="Stomatolog-terapevt">Terapevt</SelectItem>
                <SelectItem value="Stomatolog-ortoped">Ortoped</SelectItem>
                <SelectItem value="Stomatolog-ximurg">Xirurg</SelectItem>
                <SelectItem value="Ortodont">Ortodont</SelectItem>
                <SelectItem value="Bolalar stomatologi">Bolalar stomatologi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {activeTab === 'efficiency' ? (
        <DoctorEfficiencyStats />
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {error && !isLoading ? (
            <QueryErrorState error={error} onRetry={() => refetch()} title="Shifokorlar yuklanmadi" className="border-0" />
          ) : isLoading ? (
            <div className="p-8 text-center animate-pulse text-muted-foreground">Yuklanmoqda...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead sortKey={sortBy('doctors', 'firstName')} sort={sort} onSort={setSort}>
                    Ism
                  </SortableTableHead>
                  <SortableTableHead sortKey={sortBy('doctors', 'specialty')} sort={sort} onSort={setSort}>
                    Mutaxassislik
                  </SortableTableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Ish kunlari</TableHead>
                  <TableHead className="text-right">Bemorlar</TableHead>
                  <TableHead className="text-right">Daromad</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((d) => {
                  const eff = efficiency.find(e => e.id === d.id);
                  const workingDays = d.schedule?.filter(s => s.isWorking).map(s => {
                    return DOCTOR_WEEKDAY_LABELS[s.day];
                  }) || [];

                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">
                        <Link 
                          to={`/doctors/${d.id}`}
                          className="hover:text-primary transition-colors hover:underline"
                        >
                          {d.firstName} {d.lastName}
                        </Link>
                      </TableCell>
                      <TableCell>{d.specialty}</TableCell>
                      <TableCell>{d.phone}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {workingDays.map(day => (
                            <Badge key={day} variant="outline" className="text-[10px] px-1 py-0 h-4">
                              {day}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {eff?.uniquePatients || 0}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-success">
                        {formatUzS(eff?.totalRevenue || 0)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/doctors/${d.id}`} className="flex items-center">
                                <Eye className="w-4 h-4 mr-2" /> Ko'rish
                              </Link>
                            </DropdownMenuItem>
                            {can('doctors.update') && (
                              <DropdownMenuItem onClick={() => openEdit(d)}>
                                <Edit2 className="w-4 h-4 mr-2" /> Tahrirlash
                              </DropdownMenuItem>
                            )}
                            {can('visits.create') && (
                              <DropdownMenuItem onClick={() => openVisitForm(d)}>
                                <Calendar className="w-4 h-4 mr-2" /> Tashrif qo'shish
                              </DropdownMenuItem>
                            )}
                            {can('doctors.delete') && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteId(d.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> O'chirish
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card rounded-xl border">
              <p className="text-xs text-muted-foreground">Jami: {totalDoctors} ta shifokor</p>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  Oldingi
                </Button>
                <div className="flex items-center px-4 text-sm font-medium">
                  {page + 1} / {totalPages}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1}
                >
                  Keyingi
                </Button>
              </div>
            </div>
          )}

      <DoctorForm 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        editing={editing} 
        onSave={handleSaveDoctor} 
      />

      <DoctorVisitForm 
        open={visitModal} 
        onOpenChange={setVisitModal} 
        editingVisit={editingVisit} 
        doctor={selectedDoctor} 
        patients={patients} 
        onSave={handleSaveVisit} 
      />

      <ConfirmDeleteDialog 
        open={!!deleteId} 
        onOpenChange={() => setDeleteId(null)} 
        onConfirm={handleDeleteDoctor} 
      />
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <ErrorBoundary name="Shifokorlar">
      <DoctorsPageContent />
    </ErrorBoundary>
  );
}
