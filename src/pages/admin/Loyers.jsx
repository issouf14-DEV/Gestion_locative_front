import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Banknote, CheckCircle, XCircle, MessageSquare, History, Download, Trash2, Filter, TrendingUp, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import EmptyState from '@/components/common/EmptyState';
import { useFactures, useGenererLoyers, useDeleteFacture } from '@/lib/api/queries/billing';
import { usePaiements } from '@/lib/api/queries/payments';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useLocataires } from '@/lib/api/queries/users';
import { useLocationsActives } from '@/lib/api/queries/rentals';
import { formatCurrency, formatDate, MOIS, getCurrentMoisAnnee } from '@/lib/utils/formatters';
import { toast } from 'sonner';
import { cleanPhoneForWhatsApp } from '@/lib/utils/whatsapp';

function getEffectiveLoyerInfo(facture) {
  return { statut: facture.statut, datePaiement: facture.date_paiement || null };
}

const ANNEES = Array.from({ length: 10 }, (_, i) => String(2026 + i));

// ---------------------------------------------------------------------------
// localStorage history helpers
// ---------------------------------------------------------------------------
const LOYER_HISTORY_KEY = 'loyer_history_key';

function loadLoyerHistory() {
  try {
    const raw = localStorage.getItem(LOYER_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToLoyerHistory(entry) {
  const history = loadLoyerHistory();
  history.unshift(entry);
  localStorage.setItem(LOYER_HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
}

// ---------------------------------------------------------------------------
// Payment History Dialog
// ---------------------------------------------------------------------------
function PaymentHistoryDialog({ open, onOpenChange, mois, annee }) {
  const { data: paiementsData, isLoading } = usePaiements(
    open ? { type: 'LOYER', mois: Number(mois), annee: Number(annee) } : {}
  );

  const localHistory = useMemo(() => (open ? loadLoyerHistory() : []), [open]);
  const [resetCount, setResetCount] = useState(0); // force re-render after reset

  const paiements = paiementsData?.data?.results || paiementsData?.results || paiementsData?.data || [];
  const currentLocalHistory = resetCount >= 0 ? localHistory : []; // use resetCount to avoid lint warning

  const handleResetLocal = () => {
    localStorage.removeItem(LOYER_HISTORY_KEY);
    setResetCount(c => c + 1);
    toast.success('Historique local reinitialise');
    onOpenChange(false);
  };

  const hasLocalHistory = loadLoyerHistory().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Historique des paiements — {MOIS.find(m => m.value === mois)?.label} {annee}</DialogTitle>
            {hasLocalHistory && (
              <Button variant="destructive" size="sm" onClick={handleResetLocal}>
                <Trash2 className="h-4 w-4 mr-1" />
                Reinitialiser
              </Button>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : paiements.length === 0 && !hasLocalHistory ? (
          <div className="text-center py-8 text-muted-foreground">
            <Banknote className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm">Aucun paiement enregistre pour cette periode.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paiements.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Locataire</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Date paiement</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paiements.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm font-medium text-navy-800">
                          {p.locataire_nom || p.locataire?.nom || '-'}
                        </TableCell>
                        <TableCell className="font-semibold text-navy-800">
                          {formatCurrency(p.montant)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.date_paiement ? formatDate(p.date_paiement) : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {p.mode_paiement || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.statut === 'VALIDE' || p.statut === 'PAYEE' ? 'success' : p.statut === 'EN_ATTENTE' ? 'warning' : 'destructive'} className="text-xs">
                            {p.statut || '-'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {hasLocalHistory && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">Operations locales</p>
                <div className="space-y-2">
                  {currentLocalHistory.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/30 text-sm">
                      <div className="flex items-center gap-3">
                        <Badge variant="navy" className="text-xs">{entry.type || 'Operation'}</Badge>
                        <span className="text-navy-800 font-medium">{entry.locataire_nom}</span>
                        {entry.montant > 0 && <span className="text-maroon-600 font-semibold">{formatCurrency(entry.montant)}</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function AdminLoyers() {
  const queryClient = useQueryClient();
  const { mois: currentMois, annee: currentAnnee } = getCurrentMoisAnnee();
  const [mois, setMois] = useState(String(currentMois));
  const [annee, setAnnee] = useState(String(currentAnnee));
  const [filterStatut, setFilterStatut] = useState('');
  const [dateEcheance, setDateEcheance] = useState('');

  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const genererLoyersMutation = useGenererLoyers();
  const { mutate: deleteFacture, isPending: isDeletingFacture } = useDeleteFacture();

  const facturesQuery = useFactures({
    type_facture: 'LOYER',
    mois: mois || undefined,
    annee: annee || undefined,
    page_size: 50,
  });
  const { data: locatairesData } = useLocataires();
  const { data: locationsData } = useLocationsActives();

  const facturesData = facturesQuery.data;
  const isLoading = facturesQuery.isLoading;

  // Build locataire -> maison map from active locations
  const maisonByLocataire = useMemo(() => {
    const rentals = locationsData?.data?.results || locationsData?.results || locationsData?.data || [];
    const map = new Map();
    if (Array.isArray(rentals)) {
      rentals.forEach(r => {
        const locId = r.locataire?.id || r.locataire_id || r.locataire;
        if (locId) map.set(locId, r.maison?.titre || r.maison_titre || '-');
      });
    }
    return map;
  }, [locationsData]);

  // Memoize raw factures extraction to stabilize useMemo dependency
  const facturesRaw = useMemo(() => {
    const all = facturesData?.data?.results || facturesData?.results || facturesData?.data || [];
    return all.filter(f => f.type_facture === 'LOYER');
  }, [facturesData]);

  const locataires = useMemo(() => {
    return locatairesData?.data?.results || locatairesData?.results || locatairesData?.data || [];
  }, [locatairesData]);

  // Apply effective status + payment date from localStorage + enrich with maison
  const factures = useMemo(() => {
    return facturesRaw.map(f => {
      const info = getEffectiveLoyerInfo(f);
      const locId = f.locataire || f.locataire_id;
      const maisonTitre = f.maison_titre || (locId ? maisonByLocataire.get(locId) : null) || '-';
      return { ...f, effectiveStatut: info.statut, effectiveDatePaiement: info.datePaiement, maison_titre: maisonTitre };
    });
  }, [facturesRaw, maisonByLocataire]);

  // Filter by status
  const filteredFactures = filterStatut
    ? factures.filter(f => f.effectiveStatut === filterStatut)
    : factures;

  const payees = factures.filter(f => f.effectiveStatut === 'PAYEE');
  const impayees = factures.filter(f => f.effectiveStatut !== 'PAYEE');
  const totalAttendu = factures.reduce((s, f) => s + Number(f.montant || 0), 0);
  const totalEncaisse = payees.reduce((s, f) => s + Number(f.montant || 0), 0);
  const tauxRecouvrement = totalAttendu > 0 ? Math.round((totalEncaisse / totalAttendu) * 100) : 0;

  const moisLabel = MOIS.find(m => m.value === mois)?.label || mois;

  // Refresh all data
  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['factures'] });
    queryClient.invalidateQueries({ queryKey: ['paiements'] });
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['locataires'] });
  }, [queryClient]);

  const handleDeleteAllLoyers = () => {
    if (factures.length === 0) return;
    let deleted = 0;
    const total = factures.length;
    factures.forEach((f) => {
      deleteFacture(f.id, {
        onSuccess: () => {
          deleted++;
          if (deleted === total) {
            toast.success(`${deleted} loyer(s) supprime(s) pour ${moisLabel} ${annee}`);
            setDeleteAllConfirm(false);
            refreshAll();
          }
        },
        onError: () => {
          deleted++;
          if (deleted === total) {
            toast.error('Erreur lors de la suppression de certains loyers');
            setDeleteAllConfirm(false);
          }
        },
      });
    });
  };

  const handleGenererLoyers = () => {
    const payload = { mois: Number(mois), annee: Number(annee) };
    if (dateEcheance) payload.date_echeance = dateEcheance;
    genererLoyersMutation.mutate(payload, {
      onSuccess: () => {
        saveToLoyerHistory({
          date: new Date().toISOString(),
          type: 'Generation',
          periode: `${moisLabel} ${annee}`,
          locataire_nom: 'Tous',
          montant: 0,
          mode_paiement: '-',
          date_paiement: '-',
        });
        toast.success('Factures de loyer generees');
        refreshAll();
      },
    });
  };

  const exportCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['Locataire', 'Maison', 'Montant (FCFA)', 'Echeance', 'Statut', 'Date paiement', 'Mois', 'Annee'];
    const rows = filteredFactures.map(f => [
      f.locataire_nom || '-', f.maison_titre || '-', f.montant,
      formatDate(f.date_echeance),
      f.effectiveStatut === 'PAYEE' ? 'Paye' : 'Impaye',
      f.effectiveDatePaiement ? formatDate(f.effectiveDatePaiement) : '-',
      moisLabel, annee,
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `loyers_${mois}_${annee}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const sendWhatsApp = (locataireId, montant, facture) => {
    const locataire = locataires.find(l => l.id === locataireId);
    const phone = locataire?.telephone || locataire?.phone || locataire?.tel;
    if (!phone) {
      toast.error(`Pas de numero de telephone pour ${locataire?.prenoms || ''} ${locataire?.nom || ''}`);
      return;
    }
    const cleanPhone = cleanPhoneForWhatsApp(phone);
    const prenom = locataire?.prenoms || '';
    const nom = locataire?.nom || '';
    const maison = facture?.maison_titre || '';
    const echeance = facture?.date_echeance ? formatDate(facture.date_echeance) : '';

    const message = [
      `Bonjour *${prenom} ${nom}*,`,
      ``,
      `Nous vous informons que votre loyer pour le mois de *${moisLabel} ${annee}* est en attente de paiement.`,
      ``,
      `📋 *Details :*`,
      maison ? `🏠 Maison : ${maison}` : '',
      `💰 Montant : *${formatCurrency(montant)}*`,
      echeance ? `📅 Echeance : ${echeance}` : '',
      ``,
      `Merci de proceder au reglement dans les meilleurs delais.`,
      ``,
      `Cordialement,`,
      `🏠 _Gestion Locative_`,
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    toast.success(`WhatsApp ouvert pour ${prenom} ${nom}`);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Gestion des loyers"
        description={`Suivi des paiements — ${moisLabel} ${annee}`}
        actions={
          <div className="flex gap-2">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { refreshAll(); toast.success('Donnees actualisees'); }}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Actualiser les donnees</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={exportCSV} disabled={factures.length === 0}>
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exporter CSV</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPaymentHistoryOpen(true)}>
                    <History className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Historique des paiements</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => setDeleteAllConfirm(true)} disabled={factures.length === 0}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Supprimer les loyers generes</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        }
      />

      {/* Period selector + generate */}
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
            <Filter className="hidden sm:block h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={mois} onValueChange={setMois}>
              <SelectTrigger className="w-full sm:w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MOIS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={annee} onValueChange={setAnnee}>
              <SelectTrigger className="w-full sm:w-24 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ANNEES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateEcheance}
              onChange={e => setDateEcheance(e.target.value)}
              className="col-span-2 w-full sm:w-40 h-9 text-xs"
              placeholder="Date limite"
            />
            <Button
              variant="navy"
              size="sm"
              className="col-span-2 w-full sm:w-auto h-9 text-xs"
              onClick={handleGenererLoyers}
              disabled={genererLoyersMutation.isPending}
            >
              <Banknote className="h-3.5 w-3.5 mr-1" />
              {genererLoyersMutation.isPending ? 'Generation...' : 'Generer loyers'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats — clickable to filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button onClick={() => setFilterStatut('')} className="text-left">
          <StatCard title="Total loyers" value={factures.length} icon={Banknote} color="navy" description={formatCurrency(totalAttendu)} />
        </button>
        <button onClick={() => setFilterStatut('PAYEE')} className="text-left">
          <StatCard title="Payes" value={payees.length} icon={CheckCircle} color="green" description={formatCurrency(totalEncaisse)} />
        </button>
        <button onClick={() => setFilterStatut(filterStatut === 'IMPAYEE' ? '' : 'IMPAYEE')} className="text-left">
          <StatCard title="Impayes" value={impayees.length} icon={XCircle} color="maroon" description={formatCurrency(totalAttendu - totalEncaisse)} />
        </button>
        <StatCard
          title="Taux recouvrement"
          value={`${tauxRecouvrement}%`}
          icon={TrendingUp}
          color="steel"
          description={<Progress value={tauxRecouvrement} className="h-1.5 mt-1" />}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : filteredFactures.length === 0 ? (
            <EmptyState
              icon={Banknote}
              title={filterStatut ? 'Aucun loyer avec ce statut' : 'Aucun loyer ce mois'}
              description={filterStatut ? 'Essayez un autre filtre.' : 'Generez les factures de loyer pour cette periode.'}
              action={!filterStatut && (
                <Button variant="navy" size="sm" onClick={handleGenererLoyers} disabled={genererLoyersMutation.isPending}>
                  <Banknote className="h-4 w-4 mr-1" />
                  {genererLoyersMutation.isPending ? 'Generation...' : 'Generer les loyers'}
                </Button>
              )}
              className="py-12"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-xs font-semibold">Locataire</TableHead>
                      <TableHead className="text-xs font-semibold hidden sm:table-cell">Maison</TableHead>
                      <TableHead className="text-xs font-semibold">Montant</TableHead>
                      <TableHead className="text-xs font-semibold hidden sm:table-cell">Echeance</TableHead>
                      <TableHead className="text-xs font-semibold">Statut</TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">Date paiement</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFactures.map((f) => {
                      const isPaye = f.effectiveStatut === 'PAYEE';
                      return (
                        <TableRow key={f.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isPaye ? 'bg-green-50' : 'bg-red-50'}`}>
                                <Banknote className={`h-4 w-4 ${isPaye ? 'text-green-500' : 'text-red-500'}`} />
                              </div>
                              <p className="text-sm font-medium text-navy-800">
                                {f.locataire_nom || '-'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-1.5">
                              <Home className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{f.maison_titre || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-bold text-navy-800">{formatCurrency(f.montant)}</span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-xs text-muted-foreground">{formatDate(f.date_echeance)}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isPaye ? 'success' : 'destructive'} className="text-xs">
                              {isPaye ? 'Paye' : 'Impaye'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="text-xs text-muted-foreground">
                              {f.effectiveDatePaiement ? formatDate(f.effectiveDatePaiement) : '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              {!isPaye && (
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-green-600 hover:bg-green-50"
                                        onClick={() => sendWhatsApp(f.locataire || f.locataire_id, f.montant, f)}
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top"><p>Rappel WhatsApp</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {isPaye && (
                                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                  <CheckCircle className="h-3.5 w-3.5" /> OK
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  {filteredFactures.length} loyer{filteredFactures.length > 1 ? 's' : ''} — Encaisse : <strong className="text-green-600">{formatCurrency(totalEncaisse)}</strong> / {formatCurrency(totalAttendu)}
                </p>
                {filterStatut && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setFilterStatut('')}>
                    Voir tous
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <PaymentHistoryDialog open={paymentHistoryOpen} onOpenChange={setPaymentHistoryOpen} mois={mois} annee={annee} />
      <ConfirmDialog
        open={deleteAllConfirm}
        onOpenChange={setDeleteAllConfirm}
        title={`Supprimer tous les loyers — ${moisLabel} ${annee}`}
        description={`Cette action supprimera les ${factures.length} loyer(s) genere(s) pour ${moisLabel} ${annee}. Cette action est irreversible.`}
        confirmLabel="Supprimer tout"
        onConfirm={handleDeleteAllLoyers}
        isLoading={isDeletingFacture}
        variant="destructive"
      />
    </div>
  );
}
