import { useState } from 'react';
import { useLeads } from '../hooks/useLeads';
import { PageHeader } from '@/shared/components/PageHeader';
import { Lead, LeadStatus } from '@/shared/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  MessageSquare, 
  Trash2, 
  CalendarPlus, 
  Search, 
  LayoutGrid, 
  List, 
  Copy, 
  MessageCircle,
  User,
  Download,
  HeartPulse,
  Plus,
  FileText,
  Save,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Send,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exportToExcel } from '@/shared/lib/excel';
import { leadsApi } from '@/lib/api/endpoints';
import { fetchAllPages } from '@/lib/api/helpers';
import { DataTable, Column } from '@/shared/components/DataTable';
import { formatDate } from '@/shared/lib/formatters';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { sortBy } from '@/lib/api/sort-fields';

const STATUS_COLUMNS: { id: LeadStatus; label: string; color: string; bgColor: string; icon: LucideIcon }[] = [
  { id: 'new', label: 'Yangi', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: MessageSquare },
  { id: 'contacted', label: 'Bog\'lanildi', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: Phone },
  { id: 'consultation', label: 'Konsultatsiya', color: 'text-purple-600', bgColor: 'bg-purple-50', icon: Stethoscope },
  { id: 'proposal', label: 'Taklif berildi', color: 'text-indigo-600', bgColor: 'bg-indigo-50', icon: FileText },
  { id: 'converted', label: 'Bemorga aylandi', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle2 },
  { id: 'cancelled', label: 'Bekor qilindi', color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle },
];

export default function LeadsPage() {
  const { 
    leads, 
    isLoading, 
    updateStatus, 
    createLead,
    updateLead,
    deleteLead,
    search,
    setSearch,
    filters,
    setStatusFilter,
    page,
    setPage,
    totalPages,
    totalCount,
    sort,
    setSort,
  } = useLeads();
  
  const navigate = useNavigate();
  const [view, setView] = useState<'board' | 'table'>('board');
  
  // Lead Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formValues, setFormValues] = useState({
    name: '',
    phone: '',
    service: '',
    message: '',
    notes: '',
    status: 'new' as LeadStatus
  });

  // Lead Details State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState('');

  // every page with the current filters (the table/board only holds one page)
  const handleExport = async () => {
    try {
      const res = await fetchAllPages(leadsApi.list, { ...filters, search, ...sort });
      await exportToExcel(res.data as unknown as Record<string, unknown>[], 'murojaatlar');
    } catch {
      toast.error('Eksport qilishda xatolik yuz berdi');
    }
  };

  const handleOpenForm = (lead?: Lead) => {
    if (lead) {
      setEditingLead(lead);
      setFormValues({
        name: lead.name,
        phone: lead.phone,
        service: lead.service || '',
        message: lead.message || '',
        notes: lead.notes || '',
        status: lead.status
      });
    } else {
      setEditingLead(null);
      setFormValues({
        name: '',
        phone: '',
        service: '',
        message: '',
        notes: '',
        status: 'new'
      });
    }
    setIsFormOpen(true);
  };

  const handleSaveLead = () => {
    if (!formValues.name || !formValues.phone) {
      toast.error("Ism va telefon raqami majburiy");
      return;
    }

    if (editingLead) {
      updateLead({ id: editingLead.id, ...formValues });
    } else {
      createLead({ ...formValues, source: 'crm' });
    }
    setIsFormOpen(false);
  };

  const handleOpenDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setNotes(lead.notes || '');
  };

  const handleSaveNotes = () => {
    if (selectedLead) {
      updateLead({ id: selectedLead.id, notes });
      setSelectedLead(null);
    }
  };

  const handleConvertToPatient = (lead: Lead) => {
    navigate('/patients', { state: { createFromLead: lead } });
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as LeadStatus;
    updateStatus({ id: draggableId, status: newStatus });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Nusxalandi: " + text);
  };

  const columns: Column<Lead>[] = [
    { 
      header: 'Ism', 
      sortKey: sortBy('leads', 'name'),
      accessor: (l) => (
        <div className="flex flex-col cursor-pointer hover:text-primary transition-colors" onClick={() => handleOpenDetails(l)}>
          <span className="font-medium">{l.name}</span>
        </div>
      )
    },
    { 
      header: 'Telefon', 
      accessor: (l) => (
        <div className="flex items-center gap-2">
          <span>{l.phone}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(l.phone)}>
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      )
    },
    { 
      header: 'Xizmat', 
      accessor: 'service' 
    },
    { 
      header: 'Holat', 
      sortKey: sortBy('leads', 'status'),
      accessor: (l) => {
        const col = STATUS_COLUMNS.find(c => c.id === l.status);
        return (
          <Badge className={cn("font-medium", col?.color.replace('text', 'bg'), "bg-opacity-10 shadow-none border-none", col?.color)}>
            {col?.label}
          </Badge>
        );
      }
    },
    {
      header: 'Manba',
      sortKey: sortBy('leads', 'source'),
      accessor: (l) => (
        <Badge variant="outline" className="text-[10px] font-normal opacity-70">
          {l.source === 'telegram_bot' ? 'Bot' : l.source === 'crm' ? 'Qo\'lda' : l.source}
        </Badge>
      )
    },
    {
      header: 'Sana',
      sortKey: sortBy('leads', 'createdAt'),
      accessor: (l) => <span className="text-xs text-muted-foreground">{formatDate(l.createdAt)}</span>,
    },
    {
      header: 'Amallar',
      accessor: (l) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleOpenForm(l)}>
            <Plus className="w-4 h-4 rotate-45" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleConvertToPatient(l)}>
            <CalendarPlus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteLead(l.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-6 max-w-full overflow-hidden space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <PageHeader
          title="Murojaatlar (Sotuv Varonkasi)"
          description="Dental klinika sotuv bosqichlari va mijozlar oqimi"
        />
        <div className="flex items-center gap-3">
          <Button 
            className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:shadow-primary/40 transition-all gap-2"
            onClick={() => handleOpenForm()}
          >
            <Plus className="w-4 h-4" />
            Yangi murojaat
          </Button>
          <Button variant="outline" className="rounded-xl gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Excel
          </Button>
        </div>
      </div>

      <div className="bg-card/40 backdrop-blur-sm border rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Ism yoki telefon orqali qidirish..."
            className="pl-10 rounded-xl border-none bg-background/50 focus-visible:ring-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-48">
            <Select value={filters.status || 'all'} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-xl border-none bg-background/50">
                <SelectValue placeholder="Barcha holatlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                {STATUS_COLUMNS.map(col => (
                  <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={view} onValueChange={(v) => setView(v as 'board' | 'table')} className="w-full sm:w-[200px]">
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-background/50 p-1">
              <TabsTrigger value="board" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <LayoutGrid className="w-4 h-4 mr-2"/> Doska
              </TabsTrigger>
              <TabsTrigger value="table" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <List className="w-4 h-4 mr-2"/> Jadval
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className={cn(view === 'board' ? "block" : "hidden")}>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 w-full min-w-0 overflow-hidden">
            <div className="overflow-x-auto pb-8 custom-scrollbar">
              <div className="flex gap-6 w-max min-w-full px-1">
                {STATUS_COLUMNS.map(column => {
                  const columnLeads = leads.filter(l => l.status === column.id);
                  
                  return (
                    <div 
                      key={column.id} 
                      className="w-[280px] md:w-[320px] flex flex-col h-[calc(100vh-320px)] min-h-[450px]"
                    >
                      <div className={cn(
                        "flex items-center justify-between p-4 mb-4 rounded-2xl border backdrop-blur-md shadow-sm transition-all",
                        column.bgColor,
                        "bg-opacity-40"
                      )}>
                        <div className="flex items-center gap-2.5">
                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-sm", column.color)}>
                            <column.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm tracking-tight">{column.label}</h3>
                            <p className="text-[10px] opacity-70 font-medium">{columnLeads.length} ta</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-white/80 font-bold border-none shadow-sm">
                          {columnLeads.length}
                        </Badge>
                      </div>
                      
                      <Droppable droppableId={column.id}>
                        {(provided, snapshot) => (
                          <div 
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={cn(
                              "flex-1 space-y-4 rounded-2xl p-2 transition-all duration-200",
                              snapshot.isDraggingOver ? "bg-muted/50 ring-2 ring-primary/10 ring-inset" : "bg-transparent"
                            )}
                          >
                            {isLoading ? (
                              <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-40">
                                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                <span className="text-[10px] font-medium uppercase tracking-widest">Yuklanmoqda...</span>
                              </div>
                            ) : columnLeads.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl opacity-20 bg-muted/20">
                                <LayoutGrid className="w-8 h-8 mb-2" />
                                <span className="text-[10px] font-medium uppercase tracking-widest text-center px-4">Murojaatlar mavjud emas</span>
                              </div>
                            ) : (
                              columnLeads.map((lead, index) => (
                                <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div 
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      onClick={() => handleOpenDetails(lead)}
                                      className={cn(
                                        "group relative bg-card/60 backdrop-blur-sm p-4 rounded-2xl border border-border/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 cursor-pointer",
                                        snapshot.isDragging ? "shadow-2xl rotate-[2deg] ring-4 ring-primary/10 border-primary z-50 bg-card" : ""
                                      )}
                                    >
                                      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Badge variant="outline" className="text-[9px] h-4 bg-background/80 backdrop-blur-xs font-bold uppercase tracking-tighter">
                                          {lead.source === 'telegram_bot' ? 'Bot' : 'Qo\'lda'}
                                        </Badge>
                                      </div>

                                      <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/5">
                                            <User className="w-4 h-4 text-primary" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-sm truncate pr-6">{lead.name}</h4>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                              <Phone className="w-3 h-3" />
                                              {lead.phone}
                                            </p>
                                          </div>
                                        </div>

                                        {lead.service && (
                                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 text-primary border border-primary/10">
                                            <HeartPulse className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">{lead.service}</span>
                                          </div>
                                        )}

                                        {lead.notes && (
                                          <div className="relative p-3 rounded-xl bg-primary/5 border border-primary/10 text-[11px] text-primary line-clamp-2">
                                            <FileText className="w-3 h-3 absolute -top-1.5 -right-1 text-primary/40" />
                                            {lead.notes}
                                          </div>
                                        )}

                                        <div className="flex items-center justify-between pt-3 border-t border-dashed">
                                          <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-green-500/10 hover:text-green-600 transition-colors" asChild onClick={(e) => e.stopPropagation()}>
                                              <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">
                                                <MessageCircle className="w-4 h-4" />
                                              </a>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-sky-500/10 hover:text-sky-600 transition-colors" asChild title="Telegramda yozish" onClick={(e) => e.stopPropagation()}>
                                              <a href={`https://t.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">
                                                <Send className="w-4 h-4" />
                                              </a>
                                            </Button>
                                          </div>
                                          
                                          <div className="flex items-center gap-1">
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-8 w-8 rounded-lg text-blue-600 hover:bg-blue-600/10 transition-colors" 
                                              onClick={(e) => { e.stopPropagation(); handleOpenForm(lead); }} 
                                              title="Tahrirlash"
                                            >
                                              <Plus className="w-4 h-4 rotate-45" />
                                            </Button>
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 transition-colors" 
                                              onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }} 
                                              title="O'chirish"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DragDropContext>
      </div>

      <div className={cn("space-y-4", view === 'table' ? "block" : "hidden")}>
        <DataTable 
          data={leads} 
          columns={columns} 
          isLoading={isLoading}
          sort={sort}
          onSortChange={setSort}
        />
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card rounded-b-xl border-x">
            <p className="text-xs text-muted-foreground">Jami: {totalCount} ta murojaat</p>
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
      </div>

      {/* Manual Entry Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              {editingLead ? 'Murojaatni tahrirlash' : 'Yangi murojaat qo\'shish'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Mijoz ismi</Label>
              <Input 
                id="name" 
                placeholder="Masalan: Abbos Asqarov" 
                value={formValues.name}
                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon raqami</Label>
              <Input 
                id="phone" 
                placeholder="+998" 
                value={formValues.phone}
                onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Qiziqayotgan xizmati</Label>
              <Input 
                id="service" 
                placeholder="Masalan: Implantatsiya" 
                value={formValues.service}
                onChange={(e) => setFormValues({ ...formValues, service: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Xabar (ixtiyoriy)</Label>
              <Textarea 
                id="message" 
                placeholder="Mijoz qoldirgan xabar..." 
                value={formValues.message}
                onChange={(e) => setFormValues({ ...formValues, message: e.target.value })}
                className="rounded-xl min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Varonka bosqichi</Label>
              <Select value={formValues.status} onValueChange={(v) => setFormValues({ ...formValues, status: v as LeadStatus })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Bosqichni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_COLUMNS.map(col => (
                    <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsFormOpen(false)}>Bekor qilish</Button>
            <Button className="rounded-xl gap-2" onClick={handleSaveLead}>
              <Save className="w-4 h-4" />
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Details & Notes Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Murojaat tafsilotlari
            </DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border">
                <div>
                  <h4 className="font-bold text-lg">{selectedLead.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedLead.phone}</p>
                </div>
                <Badge className={cn("font-medium", STATUS_COLUMNS.find(c => c.id === selectedLead.status)?.color.replace('text', 'bg'), "bg-opacity-10 shadow-none border-none", STATUS_COLUMNS.find(c => c.id === selectedLead.status)?.color)}>
                  {STATUS_COLUMNS.find(c => c.id === selectedLead.status)?.label}
                </Badge>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Sotuv bo'yicha izohlar
                </Label>
                <Textarea 
                  placeholder="Mijoz bilan muloqot tafsilotlarini yozing..." 
                  className="rounded-xl min-h-[120px] bg-background focus:ring-primary/20"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground italic">
                  * Ushbu izohlar faqat klinika xodimlari uchun ko'rinadi
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/20 rounded-xl border border-dashed text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Manba</p>
                  <p className="text-xs font-medium">{selectedLead.source === 'telegram_bot' ? 'Telegram Bot' : 'CRM (Qo\'lda)'}</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-xl border border-dashed text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Xizmat</p>
                  <p className="text-xs font-medium">{selectedLead.service || 'Belgilanmagan'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setSelectedLead(null)}>Yopish</Button>
            <Button className="rounded-xl gap-2 px-6" onClick={handleSaveNotes}>
              <Save className="w-4 h-4" />
              Izohni saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
