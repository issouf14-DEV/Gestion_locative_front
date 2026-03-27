import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Pencil, Receipt, TrendingDown, Download, History, ChevronDown, ChevronUp, Search, Filter, Calendar, Home, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import EmptyState from '@/components/common/EmptyState';

const ANNEES = Array.from({ length: 10 }, (_, i) => String(2026 + i));
import { useDepenses, useCreateDepense, useUpdateDepense, useDeleteDepense } from '@/lib/api/queries/expenses';
import { useMaisons } from '@/lib/api/queries/properties';
import { formatCurrency, formatDate, getCurrentMoisAnnee, MOIS } from '@/lib/utils/formatters';

const CATEGORIES = ['REPARATION', 'ENTRETIEN', 'FOURNITURES', 'TAXES', 'SALAIRES', 'AUTRES'];
const CAT_LABELS = {
  REPARATION: 'Reparation',
  ENTRETIEN: 'Entretien',
  FOURNITURES: 'Fournitures',
  TAXES: 'Taxes',
  SALAIRES: 'Salaires',
  AUTRES: 'Autres',
};
const CAT_VARIANTS = {
  REPARATION: 'destructive',
  ENTRETIEN: 'warning',
  FOURNITURES: 'secondary',
  TAXES: 'navy',
  SALAIRES: 'maroon',
  AUTRES: 'outline',
};

// ---------------------------------------------------------------------------
// localStorage history helpers
// ---------------------------------------------------------------------------
const DEPENSE_HISTORY_KEY = 'depense_history_key';

function loadDepenseHistory() {
  try {
    const raw = localStorage.getItem(DEPENSE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToDepenseHistory(entry) {
  const history = loadDepenseHistory();
  history.unshift(entry);
  localStorage.setItem(DEPENSE_HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
}

// ---------------------------------------------------------------------------
// Depense History Dialog
// ---------------------------------------------------------------------------
function DepenseHistoryDialog({ open, onOpenChange }) {
  const [history, setHistory] = useState(() => loadDepenseHistory());
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (open) setHistory(loadDepenseHistory());
  }, [open]);

  const handleReset = () => {
    localStorage.removeItem(DEPENSE_HISTORY_KEY);
    setHistory([]);
    setExpanded(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Historique des operations</DialogTitle>
            {history.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleReset}>
                <Trash2 className="h-4 w-4 mr-2" />
                Reinitialiser
              </Button>
            )}
          </div>
        </DialogHeader>

        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm">Aucune operation enregistree pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((entry, idx) => (
              <Card key={idx} className="overflow-hidden">
                <button
                  className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  onClick={() => setExpanded(expanded === idx ? null : idx)}
                >
                  <div className="flex items-center gap-4">
                    <Badge variant={entry.action === 'creation' ? 'navy' : 'warning'} className="text-xs">
                      {entry.action === 'creation' ? 'Creation' : 'Modification'}
                    </Badge>
                    <span className="text-sm font-medium text-navy-800">{entry.titre}</span>
                    <span className="text-sm text-maroon-600 font-semibold">{formatCurrency(entry.montant)}</span>
                    {entry.categorie && (
                      <Badge variant={CAT_VARIANTS[entry.categorie] || 'outline'} className="text-xs">
                        {CAT_LABELS[entry.categorie] || entry.categorie}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
                    {expanded === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {expanded === idx && (
                  <div className="border-t px-4 py-3 text-sm space-y-1 bg-muted/20">
                    <p><span className="text-muted-foreground">Titre:</span> {entry.titre}</p>
                    <p><span className="text-muted-foreground">Montant:</span> {formatCurrency(entry.montant)}</p>
                    <p><span className="text-muted-foreground">Categorie:</span> {CAT_LABELS[entry.categorie] || entry.categorie}</p>
                    <p><span className="text-muted-foreground">Date depense:</span> {entry.date_depense || '-'}</p>
                    {entry.description && (
                      <p><span className="text-muted-foreground">Description:</span> {entry.description}</p>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Depense Form
// ---------------------------------------------------------------------------
const depenseSchema = z.object({
  titre: z.string().min(2, 'Titre requis'),
  categorie: z.string().min(1, 'Categorie requise'),
  montant: z.coerce.number().min(1, 'Montant positif requis'),
  date_depense: z.string().min(1, 'Date requise'),
  description: z.string().optional(),
  maison: z.string().optional(),
});

function DepenseForm({ depense, open, onOpenChange }) {
  const isEdit = !!depense;
  const { mutate: create, isPending: isCreating } = useCreateDepense();
  const { mutate: update, isPending: isUpdating } = useUpdateDepense();
  const { data: maisonsData } = useMaisons();
  const maisons = maisonsData?.data?.results || maisonsData?.results || maisonsData?.data || [];

  const [recu, setRecu] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const prevPreviewRef = useRef(null);

  useEffect(() => {
    if (depense?.recu_url || depense?.recu) {
      setPreviewUrl(depense.recu_url || depense.recu);
    } else {
      setPreviewUrl(null);
    }
  }, [depense]);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(depenseSchema),
    defaultValues: depense ? {
      titre: depense.titre || depense.description || '',
      categorie: depense.categorie || '',
      montant: depense.montant || '',
      date_depense: depense.date_depense?.substring(0, 10) || '',
      description: depense.description || '',
      maison: depense.maison ? String(depense.maison) : '',
    } : {
      date_depense: new Date().toISOString().substring(0, 10),
    },
  });

  const onSubmit = (data) => {
    const payload = { ...data, recu: recu || undefined };
    if (isEdit) {
      update({ id: depense.id, data: payload }, {
        onSuccess: () => {
          saveToDepenseHistory({
            date: new Date().toISOString(),
            action: 'modification',
            titre: data.titre,
            montant: data.montant,
            categorie: data.categorie,
            date_depense: data.date_depense,
            description: data.description || '',
          });
          onOpenChange(false);
        },
      });
    } else {
      create(payload, {
        onSuccess: () => {
          saveToDepenseHistory({
            date: new Date().toISOString(),
            action: 'creation',
            titre: data.titre,
            montant: data.montant,
            categorie: data.categorie,
            date_depense: data.date_depense,
            description: data.description || '',
          });
          if (prevPreviewRef.current?.startsWith('blob:')) URL.revokeObjectURL(prevPreviewRef.current);
          reset(); setRecu(null); setPreviewUrl(null); onOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); if (prevPreviewRef.current?.startsWith('blob:')) URL.revokeObjectURL(prevPreviewRef.current); setPreviewUrl(null); setRecu(null); } onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier la depense' : 'Ajouter une depense'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Titre / Description courte *</Label>
              <Input placeholder="Ex: Reparation toiture" {...register('titre')} />
              {errors.titre && <p className="text-xs text-red-500">{errors.titre.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Categorie *</Label>
                <Select defaultValue={depense?.categorie} onValueChange={(v) => setValue('categorie', v)}>
                  <SelectTrigger><SelectValue placeholder="Selectionner..." /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{CAT_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categorie && <p className="text-xs text-red-500">{errors.categorie.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Montant (FCFA) *</Label>
                <Input type="number" placeholder="0" {...register('montant')} />
                {errors.montant && <p className="text-xs text-red-500">{errors.montant.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date *</Label>
                <Input type="date" {...register('date_depense')} />
                {errors.date_depense && <p className="text-xs text-red-500">{errors.date_depense.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Maison concernee</Label>
                <Select defaultValue={depense?.maison ? String(depense.maison) : 'NONE'} onValueChange={(v) => setValue('maison', v === 'NONE' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="(Optionnel)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Toutes / General</SelectItem>
                    {maisons.map(m => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.titre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description detaillee</Label>
              <Textarea placeholder="Details supplementaires..." rows={2} {...register('description')} />
            </div>
            <div className="space-y-1">
              <Label>Recu / Justificatif</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setRecu(file);
                  if (prevPreviewRef.current?.startsWith('blob:')) URL.revokeObjectURL(prevPreviewRef.current);
                  if (file?.type.startsWith('image/')) {
                    const url = URL.createObjectURL(file);
                    prevPreviewRef.current = url;
                    setPreviewUrl(url);
                  } else {
                    prevPreviewRef.current = null;
                    setPreviewUrl(null);
                  }
                }}
              />
              {previewUrl && (
                <div className="mt-2 relative">
                  <img
                    src={previewUrl}
                    alt="Aperçu du justificatif"
                    className="max-h-40 rounded-md border object-contain w-full bg-muted/20"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
                      prevPreviewRef.current = null;
                      setPreviewUrl(null);
                      setRecu(null);
                    }}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {recu?.type === 'application/pdf' && (
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  <Receipt className="h-3.5 w-3.5" />
                  {recu.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" variant="navy" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function AdminDepenses() {
  const [formOpen, setFormOpen] = useState(false);
  const [editDepense, setEditDepense] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [filterDateDebut, setFilterDateDebut] = useState('');
  const [filterDateFin, setFilterDateFin] = useState('');
  const [filterMaison, setFilterMaison] = useState('');
  const [filterMois, setFilterMois] = useState('');
  const [filterAnnee, setFilterAnnee] = useState('');
  const [statFilter, setStatFilter] = useState('');
  const [page, setPage] = useState(1);

  const { mois: currentMois, annee: currentAnnee } = getCurrentMoisAnnee();

  // When month/year selectors change, compute date_debut and date_fin
  const computedDateDebut = filterMois && filterAnnee
    ? `${filterAnnee}-${String(filterMois).padStart(2, '0')}-01`
    : filterDateDebut || undefined;

  const computedDateFin = filterMois && filterAnnee
    ? (() => {
        const m = Number(filterMois);
        const y = Number(filterAnnee);
        const lastDay = new Date(y, m, 0).getDate();
        return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      })()
    : filterDateFin || undefined;

  const filters = {
    categorie: filterCategorie || undefined,
    date_debut: computedDateDebut,
    date_fin: computedDateFin,
    maison: filterMaison || undefined,
    page,
    page_size: 20,
  };

  const { data, isLoading } = useDepenses(filters);
  const { mutate: deleteDepense, isPending: isDeleting } = useDeleteDepense();
  const { data: maisonsData } = useMaisons();

  const depensesRaw = data?.data?.results || data?.results || data?.data || (Array.isArray(data) ? data : []);
  const total = data?.pagination?.count || data?.data?.pagination?.count || data?.data?.count || data?.count || 0;
  const totalPages = Math.ceil(total / 20);
  const maisons = maisonsData?.data?.results || maisonsData?.results || maisonsData?.data || [];

  // Client-side text search filter
  const depenses = useMemo(() => {
    if (!searchText.trim()) return depensesRaw;
    const q = searchText.toLowerCase().trim();
    return depensesRaw.filter(d => {
      const titre = (d.titre || '').toLowerCase();
      const desc = (d.description || '').toLowerCase();
      const cat = (CAT_LABELS[d.categorie] || d.categorie || '').toLowerCase();
      const maison = (d.maison_titre || d.maison?.titre || '').toLowerCase();
      return titre.includes(q) || desc.includes(q) || cat.includes(q) || maison.includes(q);
    });
  }, [depensesRaw, searchText]);

  const totalMontant = depenses.reduce((s, d) => s + Number(d.montant || 0), 0);

  // Category stats for stat cards
  const catStats = useMemo(() => {
    const map = {};
    depenses.forEach(d => {
      const cat = d.categorie || 'AUTRES';
      map[cat] = (map[cat] || 0) + Number(d.montant || 0);
    });
    return Object.entries(map)
      .map(([cat, montant]) => ({ cat, montant }))
      .sort((a, b) => b.montant - a.montant);
  }, [depenses]);

  const topCat = catStats[0] || null;
  const secondCat = catStats[1] || null;

  // Has any filter active?
  const hasFilters = searchText || filterCategorie || filterDateDebut || filterDateFin || filterMaison || filterMois || filterAnnee || statFilter;

  const resetAllFilters = () => {
    setSearchText('');
    setFilterCategorie('');
    setFilterDateDebut('');
    setFilterDateFin('');
    setFilterMaison('');
    setFilterMois('');
    setFilterAnnee('');
    setStatFilter('');
    setPage(1);
  };

  const exportCSV = () => {
    const headers = ['Date', 'Titre', 'Description', 'Categorie', 'Maison', 'Montant'];
    const rows = depenses.map(d => [
      d.date_depense,
      d.titre || '',
      d.description || '',
      CAT_LABELS[d.categorie] || d.categorie,
      d.maison_titre || d.maison?.titre || '',
      d.montant,
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const suffix = filterMois && filterAnnee ? `_${filterMois}_${filterAnnee}` : '';
    a.download = `depenses${suffix}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper to clear month/year when manual dates are used
  const handleDateDebutChange = (val) => {
    setFilterDateDebut(val);
    setFilterMois('');
    setFilterAnnee('');
    setPage(1);
  };

  const handleDateFinChange = (val) => {
    setFilterDateFin(val);
    setFilterMois('');
    setFilterAnnee('');
    setPage(1);
  };

  const handleMoisChange = (val) => {
    setFilterMois(val === 'ALL' ? '' : val);
    setFilterDateDebut('');
    setFilterDateFin('');
    setPage(1);
  };

  const handleAnneeChange = (val) => {
    setFilterAnnee(val === 'ALL' ? '' : val);
    setFilterDateDebut('');
    setFilterDateFin('');
    setPage(1);
  };

  const handleCatQuickFilter = (cat) => {
    if (filterCategorie === cat) {
      setFilterCategorie('');
    } else {
      setFilterCategorie(cat);
    }
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gestion des depenses"
        description="Suivi des sorties d'argent"
        actions={
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setHistoryOpen(true)}>
                    <History className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Historique des operations</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={exportCSV}>
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exporter en CSV</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="navy" onClick={() => { setEditDepense(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        }
      />

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par titre, description, categorie, maison..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="pl-10 pr-10 h-10"
        />
        {searchText && (
          <button
            onClick={() => setSearchText('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total depenses"
          value={formatCurrency(totalMontant)}
          icon={TrendingDown}
          color="maroon"
        />
        <StatCard
          title="Nombre"
          value={depenses.length}
          icon={Receipt}
          color="navy"
        />
        {topCat && (
          <StatCard
            title={`Top: ${CAT_LABELS[topCat.cat] || topCat.cat}`}
            value={formatCurrency(topCat.montant)}
            icon={TrendingDown}
            color="navy"
            onClick={() => handleCatQuickFilter(topCat.cat)}
            active={filterCategorie === topCat.cat}
          />
        )}
        {secondCat && (
          <StatCard
            title={`2e: ${CAT_LABELS[secondCat.cat] || secondCat.cat}`}
            value={formatCurrency(secondCat.montant)}
            icon={TrendingDown}
            color="navy"
            onClick={() => handleCatQuickFilter(secondCat.cat)}
            active={filterCategorie === secondCat.cat}
          />
        )}
      </div>

      {/* Compact filters */}
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
            <div className="col-span-2 sm:hidden flex items-center gap-1 text-xs text-muted-foreground font-medium">
              <Filter className="h-3.5 w-3.5 shrink-0" />Filtres
            </div>
            <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />

            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Mois</p>
              <Select value={filterMois || 'ALL'} onValueChange={handleMoisChange}>
                <SelectTrigger className="w-full sm:w-[130px] h-8 text-xs">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les mois</SelectItem>
                  {MOIS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Année</p>
              <Select value={filterAnnee || 'ALL'} onValueChange={handleAnneeChange}>
                <SelectTrigger className="w-full sm:w-[100px] h-8 text-xs">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes</SelectItem>
                  {ANNEES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Catégorie</p>
              <Select value={filterCategorie || 'ALL'} onValueChange={(v) => { setFilterCategorie(v === 'ALL' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[130px] h-8 text-xs">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes cat.</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CAT_LABELS[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Maison</p>
              <Select value={filterMaison || 'ALL'} onValueChange={(v) => { setFilterMaison(v === 'ALL' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[130px] h-8 text-xs">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes maisons</SelectItem>
                  {maisons.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.titre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-0.5">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Période</p>
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={filterDateDebut}
                  onChange={e => handleDateDebutChange(e.target.value)}
                  className="flex-1 sm:w-[130px] h-8 text-xs"
                />
                <span className="text-xs text-muted-foreground">—</span>
                <Input
                  type="date"
                  value={filterDateFin}
                  onChange={e => handleDateFinChange(e.target.value)}
                  className="flex-1 sm:w-[130px] h-8 text-xs"
                />
              </div>
            </div>

            {hasFilters && (
              <div className="col-span-2 sm:col-span-1 flex items-end">
                <Button variant="ghost" size="sm" onClick={resetAllFilters} className="h-8 text-xs text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5 mr-1" />
                  Réinitialiser
                </Button>
              </div>
            )}
          </div>

          {/* Category quick-filter tags */}
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
            {CATEGORIES.map(cat => (
              <Badge
                key={cat}
                variant={filterCategorie === cat ? CAT_VARIANTS[cat] : 'outline'}
                className={`text-xs cursor-pointer transition-all ${filterCategorie === cat ? 'ring-2 ring-offset-1 ring-current' : 'opacity-70 hover:opacity-100'}`}
                onClick={() => handleCatQuickFilter(cat)}
              >
                {CAT_LABELS[cat]}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : depenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Aucune depense trouvee"
              description={searchText ? `Aucun resultat pour "${searchText}"` : "Ajoutez votre premiere depense."}
              action={!searchText && <Button variant="navy" onClick={() => setFormOpen(true)}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>}
              className="py-12"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[580px]">
                  <TableHeader>
                    <TableRow className="bg-navy-50/50">
                      <TableHead className="text-xs font-semibold">Date</TableHead>
                      <TableHead className="text-xs font-semibold">Description</TableHead>
                      <TableHead className="text-xs font-semibold">Categorie</TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">Maison</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Montant</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {depenses.map((d, idx) => (
                      <TableRow key={d.id} className={idx % 2 === 0 ? '' : 'bg-muted/20'}>
                        <TableCell className="text-sm whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(d.date_depense)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-navy-800 line-clamp-1">{d.titre || d.description}</p>
                          {d.description && d.titre && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{d.description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={CAT_VARIANTS[d.categorie] || 'outline'} className="text-xs">
                            {CAT_LABELS[d.categorie] || d.categorie}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {(d.maison_titre || d.maison?.titre) ? (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Home className="h-3.5 w-3.5" />
                              {d.maison_titre || d.maison?.titre}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600">{formatCurrency(d.montant)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => { setEditDepense(d); setFormOpen(true); }}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Modifier</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => setDeleteId(d.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Supprimer</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{depenses.length} depense{depenses.length > 1 ? 's' : ''}</span>
                  <span className="text-sm font-medium text-navy-800">Total: <span className="font-bold text-red-600">{formatCurrency(totalMontant)}</span></span>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Precedent</Button>
                    <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
                    <Button size="sm" variant="outline" className="h-7 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {formOpen && (
        <DepenseForm
          depense={editDepense}
          open={formOpen}
          onOpenChange={(v) => { setFormOpen(v); if (!v) setEditDepense(null); }}
        />
      )}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Supprimer la depense"
        description="Cette action est irreversible."
        confirmLabel="Supprimer"
        onConfirm={() => deleteDepense(deleteId, { onSuccess: () => setDeleteId(null) })}
        isLoading={isDeleting}
        variant="destructive"
      />
      <DepenseHistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  );
}
