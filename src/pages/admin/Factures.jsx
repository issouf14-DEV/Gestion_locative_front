import { useState, useMemo, useEffect } from 'react';
import { Plus, Calculator, FileText, Download, AlertCircle, Home, Users, Gauge, Trash2, History, ChevronDown, ChevronUp, MessageCircle, Filter, Droplets, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import EmptyState from '@/components/common/EmptyState';
import { useLocataires } from '@/lib/api/queries/users';
import { useLocationsActives } from '@/lib/api/queries/rentals';
import { useFactures, useRepartirFacture, useDeleteFacture, useCompteurs } from '@/lib/api/queries/billing';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { formatCurrency, formatDate, formatMonthYear, MOIS, getCurrentMoisAnnee } from '@/lib/utils/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cleanPhoneForWhatsApp } from '@/lib/utils/whatsapp';

const STATUT_VARIANTS = { IMPAYEE: 'destructive', PAYEE_PARTIELLE: 'warning', PAYEE: 'success', EN_ATTENTE: 'secondary' };
const STATUT_LABELS = { IMPAYEE: 'Impayée', PAYEE_PARTIELLE: 'Part. payée', PAYEE: 'Payée', EN_ATTENTE: 'En attente' };

const MOIS_COURTS = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

// SODECI factures are quarterly — show 3-month range
function formatPeriodeTrimestre(mois, annee) {
  const m = Number(mois);
  const a = Number(annee);
  if (!m || !a) return '-';
  const debut = Math.max(1, m - 2);
  if (debut === m) return `${MOIS_COURTS[m]} ${a}`;
  return `${MOIS_COURTS[debut]} - ${MOIS_COURTS[m]} ${a}`;
}

const STORAGE_KEY = 'facture_meter_groups';
const HISTORY_KEY = 'facture_calc_history';

// Load saved meter groups from localStorage
function loadMeterGroups() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveMeterGroups(groups) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToHistory(entry) {
  const history = loadHistory();
  history.unshift(entry);
  // Keep last 20 entries
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
}

// ---------------------------------------------------------------------------
// PDF Generation for a single facture
// ---------------------------------------------------------------------------

function generateFacturePDF(facture) {
  const doc = new jsPDF();
  const periodeLabel = formatPeriodeTrimestre(facture.mois, facture.annee);
  const effectiveStatut = getEffectiveStatut(facture);

  // Header with blue accent
  doc.setFillColor(26, 54, 93);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('FACTURE SODECI', 105, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(180, 200, 230);
  doc.text('Gestion Locative - Facture trimestrielle de consommation d\'eau', 105, 28, { align: 'center' });
  doc.text(`Periode : ${periodeLabel}`, 105, 35, { align: 'center' });

  // Info block
  doc.setFontSize(11);
  doc.setTextColor(26, 32, 44);
  const startY = 52;
  const col1 = 20;
  const col2 = 85;

  const rows = [
    ['Locataire', facture.locataire_nom || '-'],
    ['Periode', periodeLabel],
    ['Type', 'SODECI (Eau) - Trimestriel'],
    ['Consommation', facture.consommation ? `${Number(facture.consommation).toFixed(2)} m3` : '-'],
    ['Montant', formatCurrency(facture.montant)],
    ['Echeance', formatDate(facture.date_echeance)],
    ['Statut', effectiveStatut === 'PAYEE' ? 'Payee' : effectiveStatut === 'EN_ATTENTE' ? 'En attente' : 'Impayee'],
    ['Date de generation', formatDate(new Date().toISOString())],
  ];

  rows.forEach(([label, value], i) => {
    const y = startY + i * 10;
    if (i % 2 === 0) {
      doc.setFillColor(245, 247, 250);
      doc.rect(15, y - 5, 180, 10, 'F');
    }
    doc.setFont(undefined, 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(`${label} :`, col1, y);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(26, 32, 44);
    doc.text(String(value), col2, y);
  });

  // Statut highlight
  const statutY = startY + 6 * 10;
  if (effectiveStatut === 'PAYEE') {
    doc.setTextColor(22, 163, 74);
    doc.setFont(undefined, 'bold');
    doc.text('PAYEE', col2, statutY);
  } else {
    doc.setTextColor(220, 38, 38);
    doc.setFont(undefined, 'bold');
    doc.text(effectiveStatut === 'EN_ATTENTE' ? 'EN ATTENTE' : 'IMPAYEE', col2, statutY);
  }

  // Footer
  doc.setDrawColor(26, 54, 93);
  doc.setLineWidth(0.5);
  doc.line(20, 268, 190, 268);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Document genere automatiquement par Gestion Locative', 105, 275, { align: 'center' });

  doc.save(`facture_SODECI_${facture.locataire_nom || 'N-A'}_${periodeLabel.replace(/\s/g, '_')}.pdf`);
}

// WhatsApp share — personalized with phone number and all 3 months
function shareViaWhatsApp(facture, locataires) {
  const m = Number(facture.mois);
  const a = Number(facture.annee);
  const debut = Math.max(1, m - 2);
  const moisList = [];
  for (let i = debut; i <= m; i++) moisList.push(MOIS_COURTS[i]);
  const periodeLabel = formatPeriodeTrimestre(facture.mois, facture.annee);
  const moisDetails = moisList.join(', ');

  const effectiveStatut = getEffectiveStatut(facture);
  const statut = effectiveStatut === 'PAYEE' ? 'Payee' : effectiveStatut === 'EN_ATTENTE' ? 'En attente' : 'Impayee';

  // Find locataire for phone
  const locataireId = facture.locataire || facture.locataire_id;
  const locataire = (locataires || []).find(l => l.id === locataireId);
  const phone = locataire?.telephone || locataire?.phone || locataire?.tel || '';
  const prenom = locataire?.prenoms || '';
  const nom = locataire?.nom || facture.locataire_nom || '';

  const message = [
    `Bonjour *${prenom} ${nom}*,`,
    ``,
    `Voici le detail de votre facture *SODECI* (eau) pour le trimestre *${periodeLabel}* :`,
    ``,
    `💧 *FACTURE SODECI*`,
    `📅 Periode : ${periodeLabel} (${moisDetails})`,
    facture.consommation ? `🔢 Consommation : ${Number(facture.consommation).toFixed(2)} m³` : '',
    `💰 Montant : *${formatCurrency(facture.montant)}*`,
    facture.date_echeance ? `📆 Echeance : ${formatDate(facture.date_echeance)}` : '',
    `📌 Statut : ${statut}`,
    ``,
    effectiveStatut !== 'PAYEE' ? `Merci de proceder au reglement dans les meilleurs delais.` : `✅ Cette facture est reglee. Merci !`,
    ``,
    `Cordialement,`,
    `🏠 _Gestion Locative_`,
  ].filter(Boolean).join('\n');

  const cleanPhone = phone ? cleanPhoneForWhatsApp(phone) : '';
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
}

// Get effective status (check admin validation from localStorage)
function getEffectiveStatut(facture) {
  if (facture.statut === 'PAYEE') return 'PAYEE';
  // Check if admin validated SODECI payment for this locataire/month/year
  try {
    const key = `locataire_statut_${facture.locataire}_${facture.mois}_${facture.annee}`;
    const stored = JSON.parse(localStorage.getItem(key) || '{}');
    if (stored.sodeci === true) return 'PAYEE';
  } catch {}
  return facture.statut;
}

// ---------------------------------------------------------------------------
// Generation Dialog
// ---------------------------------------------------------------------------

function GenerationDialog({ open, onOpenChange }) {
  const { data: locatairesData } = useLocataires();
  const { mutate: repartir, isPending } = useRepartirFacture();
  const { mois: currentMois, annee: currentAnnee } = getCurrentMoisAnnee();

  const locataires = locatairesData?.data?.results || locatairesData?.results || locatairesData?.data || [];

  const [type, setType] = useState('SODECI');
  const [periodeDebut, setPeriodeDebut] = useState(String(Math.max(1, currentMois - 2)));
  const [periodeFin, setPeriodeFin] = useState(String(currentMois));
  const [annee, setAnnee] = useState(String(currentAnnee));
  const [montantTotal, setMontantTotal] = useState('');
  const [dateEcheance, setDateEcheance] = useState('');
  const [indexValues, setIndexValues] = useState({});
  const [step, setStep] = useState('form');

  // Meter groups: [{name, locataireIds: []}]
  const [meterGroups, setMeterGroups] = useState(() => loadMeterGroups());
  const [newGroupName, setNewGroupName] = useState('');

  // Save groups when they change
  useEffect(() => { saveMeterGroups(meterGroups); }, [meterGroups]);

  // Locataires already assigned to a group
  const assignedIds = useMemo(() => {
    const ids = new Set();
    meterGroups.forEach(g => g.locataireIds.forEach(id => ids.add(id)));
    return ids;
  }, [meterGroups]);

  // Unassigned locataires
  const unassignedLocataires = locataires.filter(l => !assignedIds.has(l.id));

  const addGroup = () => {
    if (!newGroupName.trim()) return;
    setMeterGroups(prev => [...prev, { name: newGroupName.trim(), locataireIds: [] }]);
    setNewGroupName('');
  };

  const removeGroup = (idx) => {
    setMeterGroups(prev => prev.filter((_, i) => i !== idx));
  };

  const addToGroup = (groupIdx, locataireId) => {
    setMeterGroups(prev => prev.map((g, i) =>
      i === groupIdx ? { ...g, locataireIds: [...g.locataireIds, locataireId] } : g
    ));
  };

  const removeFromGroup = (groupIdx, locataireId) => {
    setMeterGroups(prev => prev.map((g, i) =>
      i === groupIdx ? { ...g, locataireIds: g.locataireIds.filter(id => id !== locataireId) } : g
    ));
  };

  const handleIndexChange = (locataireId, field, value) => {
    setIndexValues(prev => ({
      ...prev,
      [locataireId]: { ...prev[locataireId], [field]: value },
    }));
  };

  // Calculate preview — exactly like the handwritten sheet
  const preview = useMemo(() => {
    const result = [];
    let totalConso = 0;

    // All locataires with filled values
    const allLocs = meterGroups.flatMap(g => g.locataireIds);
    // Also add unassigned
    const allIds = [...allLocs, ...unassignedLocataires.map(l => l.id)];

    allIds.forEach(locId => {
      const vals = indexValues[locId];
      if (vals?.ancien && vals?.nouveau) {
        const conso = Math.max(0, Number(vals.nouveau) - Number(vals.ancien));
        totalConso += conso;
        const loc = locataires.find(l => l.id === locId);
        if (loc) result.push({ locataire: loc, ancien: Number(vals.ancien), nouveau: Number(vals.nouveau), conso });
      }
    });

    const montant = Number(montantTotal) || 0;

    return result.map(r => ({
      ...r,
      pourcentage: totalConso > 0 ? ((r.conso / totalConso) * 100).toFixed(2) : '0',
      montant: totalConso > 0 ? Math.round((r.conso / totalConso) * montant) : 0,
      totalConso,
    }));
  }, [locataires, indexValues, montantTotal, meterGroups, unassignedLocataires]);

  const totalConsommation = preview.reduce((s, p) => s + p.conso, 0);
  const totalMontant = preview.reduce((s, p) => s + p.montant, 0);
  const filledCount = preview.length;

  const periodeLabel = (() => {
    const d = Number(periodeDebut);
    const f = Number(periodeFin);
    const moisNames = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    if (d === f) return moisNames[d];
    const parts = [];
    for (let i = d; i <= f; i++) parts.push(moisNames[i]);
    return parts.join(' - ');
  })();

  const handleValiderEnvoyer = () => {
    // Save to local history
    saveToHistory({
      date: new Date().toISOString(),
      type,
      periode: `${periodeLabel} ${annee}`,
      montantTotal: Number(montantTotal),
      totalConso: totalConsommation,
      locataires: preview.map(p => ({
        nom: `${p.locataire.prenoms} ${p.locataire.nom}`,
        ancien: p.ancien,
        nouveau: p.nouveau,
        conso: p.conso,
        pourcentage: p.pourcentage,
        montant: p.montant,
      })),
    });

    const echeance = dateEcheance || (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().split('T')[0];
    })();

    // Build index data for the backend
    const indexData = preview.map(p => ({
      locataire_id: p.locataire.id,
      index_valeur: p.nouveau,
      ancien_index: p.ancien,
    }));

    const payload = {
      type_facture: type,
      mois: Number(periodeFin),
      annee: Number(annee),
      montant_total: Number(montantTotal),
      date_echeance: echeance,
      index: indexData,
    };
    repartir(payload, {
      onSuccess: () => {
        onOpenChange(false);
        setStep('form');
        setIndexValues({});
        setMontantTotal('');
      },
    });
  };

  const renderLocataireRow = (locId, groupIdx = null) => {
    const loc = locataires.find(l => l.id === locId);
    if (!loc) return null;
    const vals = indexValues[locId];
    const conso = vals?.ancien && vals?.nouveau
      ? Math.max(0, Number(vals.nouveau) - Number(vals.ancien))
      : null;
    const pct = conso !== null && totalConsommation > 0
      ? ((conso / totalConsommation) * 100).toFixed(2) : null;
    const montant = conso !== null && totalConsommation > 0
      ? Math.round((conso / totalConsommation) * (Number(montantTotal) || 0)) : null;

    return (
      <TableRow key={locId}>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-navy-800">{loc.prenoms} {loc.nom}</span>
            {groupIdx !== null && (
              <button
                type="button"
                onClick={() => removeFromGroup(groupIdx, locId)}
                className="text-red-400 hover:text-red-600 text-xs"
                title="Retirer du groupe"
              >
                ×
              </button>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Input
            type="number"
            placeholder="Ancien"
            className="h-9 text-sm w-24"
            value={vals?.ancien || ''}
            onChange={(e) => handleIndexChange(locId, 'ancien', e.target.value)}
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            placeholder="Nouveau"
            className="h-9 text-sm w-24"
            value={vals?.nouveau || ''}
            onChange={(e) => handleIndexChange(locId, 'nouveau', e.target.value)}
          />
        </TableCell>
        <TableCell className="font-medium text-navy-800">
          {conso !== null ? `${conso} $m³` : '-'}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">{pct !== null ? `${pct}%` : '-'}</TableCell>
        <TableCell className="font-semibold text-maroon-600">
          {montant !== null ? formatCurrency(montant) : '-'}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setStep('form'); onOpenChange(v); }}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto lg:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {step === 'form' ? `Générer les factures ${type}` : 'Prévisualisation du calcul'}
          </DialogTitle>
        </DialogHeader>

        {step === 'form' ? (
          <div className="space-y-5 py-2">
            {/* ── Params ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SODECI">SODECI (Eau)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mois début *</Label>
                <Select value={periodeDebut} onValueChange={setPeriodeDebut}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MOIS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mois fin *</Label>
                <Select value={periodeFin} onValueChange={setPeriodeFin}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MOIS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Année *</Label>
                <Input type="number" value={annee} onChange={e => setAnnee(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Facture totale (FCFA) *</Label>
                <Input type="number" placeholder="29206" value={montantTotal} onChange={e => setMontantTotal(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date limite</Label>
                <Input type="date" value={dateEcheance} onChange={e => setDateEcheance(e.target.value)} className="h-9" />
              </div>
            </div>

            {/* Period label */}
            <div className="bg-navy-50 border border-navy-200 rounded-lg px-4 py-2 flex items-center justify-between">
              <span className="text-sm text-navy-800">
                Période : <strong>{periodeLabel} {annee}</strong> — Index {type}
              </span>
              {montantTotal && (
                <span className="text-sm font-semibold text-maroon-600">
                  Facture totale : {formatCurrency(Number(montantTotal))}
                </span>
              )}
            </div>

            {/* ── Info ── */}
            <div className="bg-maroon-50 border border-maroon-200 rounded-lg p-3 text-xs text-maroon-700 flex gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Regroupez les locataires qui partagent le même compteur.</p>
                <p className="mt-0.5">Formule : <strong>% = (Conso individuelle / Conso totale) × 100</strong> puis <strong>Montant = % × Facture / 100</strong></p>
              </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-navy-50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Groupes compteurs</p>
                <p className="text-lg font-bold text-navy-800">{meterGroups.length}</p>
              </div>
              <div className="bg-navy-50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Locataires</p>
                <p className="text-lg font-bold text-navy-800">{locataires.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Index remplis</p>
                <p className="text-lg font-bold text-green-700">{filledCount} / {locataires.length}</p>
              </div>
              <div className="bg-maroon-50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Conso totale</p>
                <p className="text-lg font-bold text-maroon-600">{totalConsommation} m³</p>
              </div>
            </div>

            {/* ── Create group ── */}
            <Card className="border-dashed">
              <CardContent className="p-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Créer un groupe de compteur</Label>
                    <Input
                      placeholder="Ex: Compteur SODECI Bâtiment A, Compteur CIE RDC..."
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addGroup())}
                      className="h-9"
                    />
                  </div>
                  <Button type="button" variant="navy" size="sm" onClick={addGroup} disabled={!newGroupName.trim()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ── Meter Groups ── */}
            {meterGroups.map((group, gIdx) => (
              <Card key={gIdx} className="overflow-hidden">
                <CardHeader className="py-3 px-4 bg-navy-50 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-navy-800 text-white rounded-lg">
                      <Gauge className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-sm text-navy-800">{group.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{group.locataireIds.length} locataire(s)</p>
                    </div>
                    {/* Add locataire to group */}
                    {unassignedLocataires.length > 0 && (
                      <Select value="PLACEHOLDER" onValueChange={(v) => { if (v !== 'PLACEHOLDER') addToGroup(gIdx, v); }}>
                        <SelectTrigger className="w-48 h-8 text-xs">
                          <SelectValue placeholder="+ Ajouter locataire" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PLACEHOLDER" disabled>Choisir...</SelectItem>
                          {unassignedLocataires.map(l => (
                            <SelectItem key={l.id} value={l.id}>{l.prenoms} {l.nom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => removeGroup(gIdx)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {group.locataireIds.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Ajoutez des locataires à ce groupe de compteur
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead>Locataire</TableHead>
                            <TableHead className="w-[100px]">Ancien</TableHead>
                            <TableHead className="w-[100px]">Nouveau</TableHead>
                            <TableHead className="w-[100px]">Conso.</TableHead>
                            <TableHead className="w-[80px]">%</TableHead>
                            <TableHead className="w-[120px]">Montant</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.locataireIds.map(id => renderLocataireRow(id, gIdx))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* ── Unassigned locataires ── */}
            {unassignedLocataires.length > 0 && meterGroups.length > 0 && (
              <Card className="border-orange-200">
                <CardHeader className="py-3 px-4 bg-orange-50 border-b">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <CardTitle className="text-sm text-orange-800">
                      Locataires non assignés ({unassignedLocataires.length})
                    </CardTitle>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">Ces locataires n'appartiennent à aucun groupe de compteur. Assignez-les à un groupe ci-dessus.</p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Locataire</TableHead>
                          <TableHead className="w-[100px]">Ancien</TableHead>
                          <TableHead className="w-[100px]">Nouveau</TableHead>
                          <TableHead className="w-[100px]">Conso.</TableHead>
                          <TableHead className="w-[80px]">%</TableHead>
                          <TableHead className="w-[120px]">Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unassignedLocataires.map(l => renderLocataireRow(l.id))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* If no groups yet, show all locataires flat */}
            {meterGroups.length === 0 && locataires.length > 0 && (
              <Card>
                <CardHeader className="py-3 px-4 bg-navy-50 border-b">
                  <CardTitle className="text-sm text-navy-800">Tous les locataires</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Créez des groupes de compteur ci-dessus pour organiser les locataires, ou saisissez directement les index.</p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Locataire</TableHead>
                          <TableHead className="w-[100px]">Ancien</TableHead>
                          <TableHead className="w-[100px]">Nouveau</TableHead>
                          <TableHead className="w-[100px]">Conso.</TableHead>
                          <TableHead className="w-[80px]">%</TableHead>
                          <TableHead className="w-[120px]">Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {locataires.map(l => renderLocataireRow(l.id))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* ── Preview step ── */
          <div className="space-y-4 py-2">
            <div className="bg-navy-50 border border-navy-200 rounded-lg p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Période :</span>
                  <p className="font-semibold text-navy-800">{periodeLabel} {annee}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type :</span>
                  <p className="font-semibold text-navy-800">{type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Facture globale :</span>
                  <p className="font-semibold text-maroon-600">{formatCurrency(Number(montantTotal))}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Conso totale :</span>
                  <p className="font-semibold text-navy-800">{totalConsommation} m³</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>N°</TableHead>
                    <TableHead>Locataire</TableHead>
                    <TableHead>Nouveau</TableHead>
                    <TableHead>Ancien</TableHead>
                    <TableHead>N-AN</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((p, i) => (
                    <TableRow key={p.locataire.id}>
                      <TableCell className="text-muted-foreground text-xs">{String(i + 1).padStart(2, '0')}</TableCell>
                      <TableCell className="font-medium text-sm">{p.locataire.prenoms} {p.locataire.nom}</TableCell>
                      <TableCell className="text-sm">{p.nouveau}</TableCell>
                      <TableCell className="text-sm">{p.ancien}</TableCell>
                      <TableCell className="font-medium">{p.conso} m³</TableCell>
                      <TableCell className="font-semibold text-navy-800">{formatCurrency(p.montant)}</TableCell>
                      <TableCell className="text-muted-foreground">{p.pourcentage}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={4} className="text-right text-sm">TOTAL</TableCell>
                    <TableCell className="text-navy-800">{totalConsommation} m³</TableCell>
                    <TableCell className="text-maroon-600">{formatCurrency(totalMontant)}</TableCell>
                    <TableCell>100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'form' ? (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button
                type="button"
                variant="navy"
                onClick={() => setStep('preview')}
                disabled={!montantTotal || filledCount === 0}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Prévisualiser ({filledCount} locataire{filledCount > 1 ? 's' : ''})
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setStep('form')}>Modifier</Button>
              <Button type="button" variant="navy" onClick={handleValiderEnvoyer} loading={isPending}>
                Valider et générer les factures
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// History Dialog
// ---------------------------------------------------------------------------

function HistoryDialog({ open, onOpenChange }) {
  const [history, setHistory] = useState(() => loadHistory());
  const [expanded, setExpanded] = useState(null);

  // Refresh history when dialog opens
  useEffect(() => {
    if (open) setHistory(loadHistory());
  }, [open]);

  const handleResetHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
    setExpanded(null);
  };

  const handleDownloadHistoryCSV = () => {
    if (history.length === 0) return;
    const BOM = '\uFEFF';
    const headers = ['Date', 'Type', 'Periode', 'Locataire', 'Ancien index', 'Nouveau index', 'Consommation (m3)', 'Pourcentage', 'Montant (FCFA)'];
    const rows = [];
    history.forEach(entry => {
      (entry.locataires || []).forEach(l => {
        rows.push([
          formatDate(entry.date), entry.type, entry.periode,
          l.nom, l.ancien, l.nouveau, l.conso, l.pourcentage + '%', l.montant,
        ]);
      });
    });
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'historique_factures_sodeci.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Historique des calculs</DialogTitle>
            {history.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadHistoryCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Telecharger CSV
                </Button>
                <Button variant="destructive" size="sm" onClick={handleResetHistory}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reinitialiser
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm">Aucun calcul effectué pour le moment.</p>
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
                    <Badge variant={entry.type === 'SODECI' ? 'secondary' : 'outline'} className="text-xs">
                      {entry.type}
                    </Badge>
                    <span className="text-sm font-medium text-navy-800">{entry.periode}</span>
                    <span className="text-sm text-maroon-600 font-semibold">{formatCurrency(entry.montantTotal)}</span>
                    <span className="text-xs text-muted-foreground">{entry.locataires?.length || 0} locataires</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
                    {expanded === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {expanded === idx && entry.locataires && (
                  <div className="border-t">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>N°</TableHead>
                          <TableHead>Locataire</TableHead>
                          <TableHead>Nouveau</TableHead>
                          <TableHead>Ancien</TableHead>
                          <TableHead>Conso.</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entry.locataires.map((l, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</TableCell>
                            <TableCell className="text-sm font-medium">{l.nom}</TableCell>
                            <TableCell className="text-sm">{l.nouveau}</TableCell>
                            <TableCell className="text-sm">{l.ancien}</TableCell>
                            <TableCell className="font-medium">{l.conso}</TableCell>
                            <TableCell className="font-semibold text-navy-800">{formatCurrency(l.montant)}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{l.pourcentage}%</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/30 font-semibold">
                          <TableCell colSpan={4} className="text-right text-sm">TOTAL</TableCell>
                          <TableCell>{entry.totalConso}</TableCell>
                          <TableCell className="text-maroon-600">{formatCurrency(entry.montantTotal)}</TableCell>
                          <TableCell>100%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
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
// Main Page
// ---------------------------------------------------------------------------

export default function AdminFactures() {
  const [genOpen, setGenOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [filterStatut, setFilterStatut] = useState('');
  const [filterLocataire, setFilterLocataire] = useState('');
  const [filterMois, setFilterMois] = useState('');
  const [filterAnnee, setFilterAnnee] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const { mois: currentMois, annee: currentAnnee } = getCurrentMoisAnnee();
  const { mutate: deleteFacture, isPending: isDeleting } = useDeleteFacture();
  const { data: locatairesData } = useLocataires();
  const locataires = locatairesData?.data?.results || locatairesData?.results || locatairesData?.data || [];

  // Fetch all SODECI factures
  const { data, isLoading } = useFactures({ type_facture: 'SODECI', page_size: 200 });
  const allFactures = (data?.results || data?.data?.results || data?.data || [])
    .filter(f => f.type_facture === 'SODECI');

  // Client-side filtering
  const filteredFactures = useMemo(() => {
    return allFactures.filter(f => {
      if (filterMois && String(f.mois) !== filterMois) return false;
      if (filterAnnee && String(f.annee) !== filterAnnee) return false;
      if (filterStatut) {
        const effectif = getEffectiveStatut(f);
        if (effectif !== filterStatut) return false;
      }
      if (filterLocataire && String(f.locataire) !== filterLocataire && String(f.locataire_id) !== filterLocataire) return false;
      return true;
    });
  }, [allFactures, filterMois, filterAnnee, filterStatut, filterLocataire]);

  // Stats
  const totalFactures = filteredFactures.length;
  const facturesPayees = filteredFactures.filter(f => getEffectiveStatut(f) === 'PAYEE').length;
  const facturesImpayees = filteredFactures.filter(f => getEffectiveStatut(f) === 'IMPAYEE').length;
  const facturesAttente = filteredFactures.filter(f => getEffectiveStatut(f) === 'EN_ATTENTE').length;
  const montantTotal = filteredFactures.reduce((s, f) => s + Number(f.montant || 0), 0);
  const montantEncaisse = filteredFactures.filter(f => getEffectiveStatut(f) === 'PAYEE').reduce((s, f) => s + Number(f.montant || 0), 0);
  const consoTotale = filteredFactures.reduce((s, f) => s + Number(f.consommation || 0), 0);

  // CSV export
  const exportCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['Période', 'Locataire', 'Consommation (m³)', 'Montant (FCFA)', 'Échéance', 'Statut'];
    const rows = filteredFactures.map(f => [
      formatPeriodeTrimestre(f.mois, f.annee),
      f.locataire_nom || '-',
      f.consommation || '-',
      f.montant,
      formatDate(f.date_echeance),
      STATUT_LABELS[getEffectiveStatut(f)] || f.statut,
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `factures_sodeci_${filterAnnee || currentAnnee}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Pagination
  const totalPages = Math.ceil(totalFactures / 20);
  const factures = filteredFactures.slice((page - 1) * 20, page * 20);

  const ANNEES = Array.from({ length: 10 }, (_, i) => String(2026 + i));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Factures SODECI"
        description="Calcul et suivi des charges d'eau (trimestriel)"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
              <History className="h-4 w-4 mr-1" />
              Historique
            </Button>
            <Button variant="navy" size="sm" onClick={() => setGenOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Générer factures
            </Button>
          </div>
        }
      />

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3">
        <Droplets className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">Facturation trimestrielle SODECI</p>
          <p className="mt-0.5 text-blue-600 text-xs">
            Les factures couvrent une période de 3 mois. Répartition : <strong>% = (Conso individuelle / Conso totale) x 100</strong> puis <strong>Montant = % x Facture / 100</strong>
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button onClick={() => { setFilterStatut(''); setPage(1); }} className="text-left">
          <StatCard title="Total factures" value={totalFactures} icon={FileText} color="navy" description={`${formatCurrency(montantTotal)}`} />
        </button>
        <button onClick={() => { setFilterStatut('PAYEE'); setPage(1); }} className="text-left">
          <StatCard title="Payées" value={facturesPayees} icon={CheckCircle} color="green" description={`${formatCurrency(montantEncaisse)}`} />
        </button>
        <button onClick={() => { setFilterStatut('EN_ATTENTE'); setPage(1); }} className="text-left">
          <StatCard title="En attente" value={facturesAttente} icon={Clock} color="steel" description="Cliquer pour filtrer" />
        </button>
        <button onClick={() => { setFilterStatut('IMPAYEE'); setPage(1); }} className="text-left">
          <StatCard title="Impayées" value={facturesImpayees} icon={XCircle} color="maroon" description="Cliquer pour filtrer" />
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterMois || 'ALL'} onValueChange={(v) => { setFilterMois(v === 'ALL' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Mois de facturation" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les mois</SelectItem>
                {MOIS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterAnnee || 'ALL'} onValueChange={(v) => { setFilterAnnee(v === 'ALL' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-24 h-8 text-xs"><SelectValue placeholder="Année" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes</SelectItem>
                {ANNEES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatut || 'ALL'} onValueChange={(v) => { setFilterStatut(v === 'ALL' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous statuts</SelectItem>
                <SelectItem value="PAYEE">Payée</SelectItem>
                <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                <SelectItem value="IMPAYEE">Impayée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterLocataire || 'ALL'} onValueChange={(v) => { setFilterLocataire(v === 'ALL' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Locataire" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous locataires</SelectItem>
                {locataires.map(l => (
                  <SelectItem key={l.id} value={String(l.id)}>{l.prenoms} {l.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterMois || filterAnnee || filterStatut || filterLocataire) && (
              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => { setFilterMois(''); setFilterAnnee(''); setFilterStatut(''); setFilterLocataire(''); setPage(1); }}>
                Réinitialiser
              </Button>
            )}
            {consoTotale > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">Conso. totale : <strong>{consoTotale.toFixed(2)} m³</strong></span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : factures.length === 0 ? (
            <EmptyState
              icon={Droplets}
              title="Aucune facture SODECI"
              description="Générez des factures SODECI pour vos locataires via le bouton ci-dessus."
              action={
                <Button variant="navy" size="sm" onClick={() => setGenOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Générer factures
                </Button>
              }
              className="py-16"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-xs font-semibold">Période</TableHead>
                      <TableHead className="text-xs font-semibold">Locataire</TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">Conso.</TableHead>
                      <TableHead className="text-xs font-semibold">Montant</TableHead>
                      <TableHead className="text-xs font-semibold hidden sm:table-cell">Échéance</TableHead>
                      <TableHead className="text-xs font-semibold">Statut</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factures.map((f) => {
                      const effectiveStatut = getEffectiveStatut(f);
                      return (
                        <TableRow key={f.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <Droplets className="h-4 w-4 text-blue-500" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-navy-800">{formatPeriodeTrimestre(f.mois, f.annee)}</p>
                                <p className="text-xs text-muted-foreground">Trimestre</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium text-navy-800">{f.locataire_nom || '-'}</p>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {f.consommation ? (
                              <span className="text-sm font-medium">{Number(f.consommation).toFixed(2)} <span className="text-xs text-muted-foreground">m³</span></span>
                            ) : <span className="text-xs text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-bold text-navy-800">{formatCurrency(f.montant)}</span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-xs text-muted-foreground">{formatDate(f.date_echeance)}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUT_VARIANTS[effectiveStatut] || 'secondary'} className="text-xs">
                              {STATUT_LABELS[effectiveStatut] || effectiveStatut}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-800" onClick={() => generateFacturePDF(f)}>
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top"><p>Télécharger le PDF</p></TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-800" onClick={() => shareViaWhatsApp(f, locataires)}>
                                      <MessageCircle className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top"><p>Partager via WhatsApp</p></TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleteId(f.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top"><p>Supprimer la facture</p></TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Footer with pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  {totalFactures} facture{totalFactures > 1 ? 's' : ''} — Total : <strong>{formatCurrency(montantTotal)}</strong>
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
                    <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
                    <Button size="sm" variant="outline" className="h-7 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <GenerationDialog open={genOpen} onOpenChange={setGenOpen} />
      <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Supprimer la facture"
        description="Cette action est irréversible. La facture sera définitivement supprimée."
        confirmLabel="Supprimer"
        onConfirm={() => deleteFacture(deleteId, { onSuccess: () => setDeleteId(null) })}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
