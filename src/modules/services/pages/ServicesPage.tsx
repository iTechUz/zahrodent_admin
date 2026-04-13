import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { Plus, Search, Tag } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useServices, CATEGORIES } from '../hooks/useServices';
import { ServiceCard, ServiceForm } from '../components/ServiceForm';

function ServicesPageContent() {
  const {
    services,
    groupedServices,
    search,
    setSearch,
    filterCategory,
    setFilterCategory,
    modalOpen,
    setModalOpen,
    editing,
    deleteId,
    setDeleteId,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
  } = useServices();

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Xizmatlar katalogi" 
        description="Klinika xizmatlarining narxlari va tafsilotlari" 
        action={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Xizmat qo'shish
          </Button>
        } 
      />

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
            variant={filterCategory === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilterCategory('all')}
          >
            Barchasi
          </Button>
          {CATEGORIES.map(c => {
            const count = services.filter(s => s.category === c).length;
            return count > 0 ? (
              <Button 
                key={c} 
                variant={filterCategory === c ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilterCategory(c)}
              >
                {c}
              </Button>
            ) : null;
          })}
        </div>
      </div>

      {Object.keys(groupedServices).length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedServices).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />{category} ({items.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(s => (
                  <ServiceCard 
                    key={s.id} 
                    service={s} 
                    onEdit={openEdit} 
                    onDelete={setDeleteId} 
                  />
                ))}
              </div>
            </div>
          ))}
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
