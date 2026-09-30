import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Layers, ListChecks, Coins } from 'lucide-react';
import { formatUzS } from '@/shared/lib/formatters';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useServices } from '../hooks/useServices';
import { ServiceForm } from '../components/ServiceForm';
import { useCan } from '@/shared/hooks/usePermissions';
import { QueryErrorState } from '@/shared/components/QueryErrorState';
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
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';

function ServicesPageContent() {
  const {
    services,
    totalCount,
    totalPages,
    page,
    setPage,
    categories,
    search,
    setSearch,
    filters,
    setFilters,
    modalOpen,
    setModalOpen,
    editing,
    deleteId,
    setDeleteId,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
    isLoading,
    error,
    refetch,
    stats,
  } = useServices();

  // backend: services create/update/delete are admin-only
  const can = useCan();
  const canCreate = can('services.create');
  const canUpdate = can('services.update');
  const canDelete = can('services.delete');
  const hasRowActions = canUpdate || canDelete;

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Xizmatlar katalogi" 
        description="Klinika xizmatlarining narxlari va tafsilotlari" 
        action={
          canCreate && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Xizmat qo'shish
            </Button>
          )
        } 
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        <StatCard 
          title="Jami xizmatlar" 
          value={stats?.totalCount ?? 0} 
          icon={<ListChecks className="w-5 h-5 text-primary" />} 
          trend="Katalog hajmi"
        />
        <StatCard 
          title="Kategoriyalar" 
          value={stats?.categoriesCount ?? 0} 
          icon={<Layers className="w-5 h-5 text-success" />} 
          trend="Guruhlar soni"
          trendUp={true}
        />
        <StatCard 
          title="O'rtacha narx" 
          value={formatUzS(stats?.avgPrice ?? 0)} 
          icon={<Coins className="w-5 h-5 text-warning" />} 
          trend="Xizmatlar bo'yicha"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Xizmat qidirish..." 
            className="pl-9" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Button 
            variant={filters.category === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilters('category', 'all')}
          >
            Barchasi
          </Button>
          {categories.map(c => (
            <Button 
              key={c} 
              variant={filters.category === c ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setFilters('category', c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      {error && !isLoading ? (
        <QueryErrorState error={error} onRetry={() => refetch()} title="Xizmatlar yuklanmadi" />
      ) : isLoading ? (
        <div className="p-8 text-center animate-pulse text-muted-foreground bg-card rounded-xl border">
          Yuklanmoqda...
        </div>
      ) : services.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Xizmat nomi</TableHead>
                <TableHead>Kategoriya</TableHead>
                <TableHead className="text-right">Narxi</TableHead>
                <TableHead className="text-right">Bemorlar</TableHead>
                <TableHead className="text-right">Daromad</TableHead>
                {hasRowActions && <TableHead className="w-[80px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => {
                const detailed = stats?.detailed?.find((d) => d.serviceId === s.id);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border">
                        {s.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatUzS(s.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {detailed?.patients || 0}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-success">
                      {formatUzS(detailed?.revenue || 0)}
                    </TableCell>
                    {hasRowActions && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canUpdate && (
                              <DropdownMenuItem onClick={() => openEdit(s)}>
                                <Edit2 className="w-4 h-4 mr-2" /> Tahrirlash
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteId(s.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> O'chirish
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card rounded-xl border">
              <p className="text-xs text-muted-foreground">Jami: {totalCount} ta xizmat</p>
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


      <ServiceForm 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        editing={editing} 
        onSave={handleSave} 
      />

      <ConfirmDeleteDialog 
        open={!!deleteId} 
        onOpenChange={() => setDeleteId(null)} 
        onConfirm={handleDelete} 
      />
    </div>
  );
}

export default function ServicesPage() {
  return (
    <ErrorBoundary name="Xizmatlar">
      <ServicesPageContent />
    </ErrorBoundary>
  );
}
