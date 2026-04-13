import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { Plus } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { Button } from '@/components/ui/button';
import { useDoctors } from '../hooks/useDoctors';
import { DoctorCard } from '../components/DoctorCard';
import { DoctorForm, DoctorVisitForm } from '../components/DoctorForm';

function DoctorsPageContent() {
  const {
    doctors,
    patients,
    visits,
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
  } = useDoctors();

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Shifokorlar" 
        description="Shifokorlar va tashriflarni boshqarish" 
        action={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Shifokor qo'shish
          </Button>
        } 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {doctors.map((d) => (
          <DoctorCard 
            key={d.id} 
            doctor={d} 
            visits={visits} 
            patients={patients}
            onEdit={openEdit}
            onDelete={setDeleteId}
            onAddVisit={openVisitForm}
            onEditVisit={openVisitForm}
          />
        ))}
      </div>

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
