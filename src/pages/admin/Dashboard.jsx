import { useState } from 'react';
import { TrendingUp, Home, Users, Percent, Calendar, FileText, Download, Filter, ChevronDown, ChevronUp, Banknote, Receipt, CalendarDays, Clock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import StatCard from '@/components/common/StatCard';
import PageHeader from '@/components/common/PageHeader';
import { useDashboardAdmin } from '@/lib/api/queries/dashboard';
import { useFactures } from '@/lib/api/queries/billing';
import { useDepenses } from '@/lib/api/queries/expenses';
import { usePaiementsEnAttente } from '@/lib/api/queries/payments';
import { useRapportMensuel } from '@/lib/api/queries/billing';
import { useLocationsActives } from '@/lib/api/queries/rentals';
import { formatCurrency, formatDate, MOIS, getCurrentMoisAnnee } from '@/lib/utils/formatters';

const COLORS = ['var(--primary)', 'var(--accent)', 'var(--secondary)', '#10B981', '#F59E0B', '#EF4444'];
const ANNEES = Array.from({ length: 10 }, (_, i) => String(2026 + i));

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-navy-800 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// Collapsible card wrapper
function CollapsibleCard({ title, icon: Icon, defaultOpen = false, children, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button
        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-navy-800" />}
          <span className="text-sm font-semibold text-navy-800">{title}</span>
          {badge}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <CardContent className="pt-0 pb-4">{children}</CardContent>}
    </Card>
  );
}

export default function AdminDashboard() {
  const { mois: currentMois, annee: currentAnnee } = getCurrentMoisAnnee();
  const [mois, setMois] = useState(String(currentMois));
  const [annee, setAnnee] = useState(String(currentAnnee));

  const { data, isLoading } = useDashboardAdmin({ mois: Number(mois), annee: Number(annee) });
  const { data: paiementsData } = usePaiementsEnAttente();
  const { mutate: downloadRapport, isPending: isDownloading } = useRapportMensuel();
  const { data: rentalsData } = useLocationsActives();

  // Compute date range for selected month
  const m = Number(mois);
  const y = Number(annee);
  const dateDebut = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const dateFin = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Fetch loyers for selected month
  const { data: loyersData, isLoading: loyersLoading } = useFactures({
    type_facture: 'LOYER',
    mois: m,
    annee: y,
    page_size: 50,
  });

  // Fetch ALL factures for selected month (loyer + sodeci)
  const { data: allFacturesData } = useFactures({
    mois: m,
    annee: y,
    page_size: 100,
  });

  // Fetch depenses for selected month using date range
  const { data: depensesData, isLoading: depensesLoading } = useDepenses({
    date_debut: dateDebut,
    date_fin: dateFin,
    page_size: 100,
  });

  const stats = data?.data || {};
  const paiementsEnAttenteRaw = paiementsData?.data?.results || paiementsData?.data || paiementsData?.results || [];

  // Helper: check if a date string falls within selected month/year
  const isInSelectedPeriod = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() + 1 === m && d.getFullYear() === y;
  };

  // Helper: check facture belongs to selected mois/annee
  const factureMatchesPeriod = (f) => {
    // Check mois/annee fields first
    if (f.mois && f.annee) return Number(f.mois) === m && Number(f.annee) === y;
    // Fallback: check date fields
    if (f.date_echeance) return isInSelectedPeriod(f.date_echeance);
    if (f.date_creation) return isInSelectedPeriod(f.date_creation);
    if (f.created_at) return isInSelectedPeriod(f.created_at);
    return false;
  };

  // Helper: get effective statut (check localStorage admin validations)
  const getEffectiveStatut = (facture) => {
    if (facture.statut === 'PAYEE') return 'PAYEE';
    try {
      const key = `locataire_statut_${facture.locataire || facture.locataire_id}_${facture.mois}_${facture.annee}`;
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      const typeKey = facture.type_facture === 'LOYER' ? 'loyer' : 'sodeci';
      if (stored[typeKey] === true) return 'PAYEE';
    } catch {}
    return facture.statut;
  };

  // Loyers — filter client-side to ensure correct period
  const loyersRaw = loyersData?.data?.results || loyersData?.results || loyersData?.data || [];
  const loyersList = loyersRaw.filter(factureMatchesPeriod);
  const loyersPayees = loyersList.filter(f => getEffectiveStatut(f) === 'PAYEE');
  const totalEncaisseLoyersMois = loyersPayees.reduce((s, f) => s + Number(f.montant || 0), 0);

  // Depenses — filter client-side to ensure correct period
  const depensesRaw = depensesData?.data?.results || depensesData?.results || depensesData?.data || [];
  const depensesList = depensesRaw.filter(d => {
    const dateStr = d.date_depense || d.date || d.created_at;
    return isInSelectedPeriod(dateStr);
  });
  const totalDepensesMois = depensesList.reduce((s, d) => s + Number(d.montant || 0), 0);

  // Group depenses by category
  const depensesParCategorie = depensesList.reduce((acc, d) => {
    const cat = d.categorie || d.type_depense || 'Autre';
    acc[cat] = (acc[cat] || 0) + Number(d.montant || 0);
    return acc;
  }, {});
  const repartitionDepensesLocal = Object.entries(depensesParCategorie).map(([categorie, montant]) => ({ categorie, montant }));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-60" />)}
        </div>
      </div>
    );
  }

  const totalMaisons = stats.total_maisons ?? 0;
  const maisonsLouees = stats.maisons_louees ?? 0;
  const tauxOccupation = stats.taux_occupation ?? (totalMaisons > 0 ? Math.round((maisonsLouees / totalMaisons) * 100) : 0);
  const locatairesActifs = stats.locataires_actifs ?? stats.total_locataires ?? 0;

  // Use ONLY direct API data — no fallback to dashboard stats (which don't filter by period)
  const revenusMois = totalEncaisseLoyersMois;
  const depensesMois = totalDepensesMois;
  const solde = revenusMois - depensesMois;

  // All factures for the period — compute unpaid as "paiements en attente"
  const allFacturesRaw = allFacturesData?.data?.results || allFacturesData?.results || allFacturesData?.data || [];
  const allFacturesPeriod = allFacturesRaw.filter(factureMatchesPeriod);
  const facturesImpayees = allFacturesPeriod.filter(f => {
    const eff = getEffectiveStatut(f);
    return eff !== 'PAYEE';
  });

  // Use API paiements en attente if available, otherwise show unpaid factures
  const paiementsEnAttente = Array.isArray(paiementsEnAttenteRaw) && paiementsEnAttenteRaw.length > 0
    ? paiementsEnAttenteRaw
    : facturesImpayees.map(f => ({
        id: f.id,
        locataire_nom: f.locataire_nom,
        montant: f.montant,
        created_at: f.date_echeance || f.created_at,
        type: f.type_facture,
      }));

  // Build reservations / locations data for chart
  const rentals = rentalsData?.data?.results || rentalsData?.results || rentalsData?.data || [];
  const locationsParMois = (() => {
    const apiData = stats.reservations_mois || [];
    if (apiData.length > 0) return apiData;
    // Build from real rental data — group by month of start date
    const moisCounts = {};
    const moisNames = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    if (Array.isArray(rentals)) {
      rentals.forEach(r => {
        const d = new Date(r.date_debut);
        if (d.getFullYear() === y) {
          const mLabel = moisNames[d.getMonth() + 1];
          moisCounts[mLabel] = (moisCounts[mLabel] || 0) + 1;
        }
      });
    }
    return Object.entries(moisCounts).map(([mois, count]) => ({ mois, count }));
  })();

  const evolutionRevenus = stats.evolution_revenus || [];
  const repartitionDepenses = repartitionDepensesLocal;
  const dernierDepenses = depensesList.slice(0, 5);
  const loyers = loyersList;

  const moisLabel = MOIS.find(m => m.value === mois)?.label || mois;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Tableau de bord"
          description="Vue d'ensemble de votre gestion locative"
        />
        <Button variant="outline" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Accueil
          </Link>
        </Button>
      </div>

      {/* Period selector + PDF download */}
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
              <SelectTrigger className="w-full sm:w-20 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ANNEES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="navy"
              className="col-span-2 w-full sm:w-auto h-9 text-xs sm:ml-auto"
              onClick={() => downloadRapport({ mois: Number(mois), annee: Number(annee) })}
              disabled={isDownloading}
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              {isDownloading ? 'Génération...' : 'Télécharger PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total maisons" value={totalMaisons} icon={Home} color="navy" description={`${stats.maisons_disponibles ?? 0} disponibles`} />
        <StatCard title="Locataires actifs" value={locatairesActifs} icon={Users} color="maroon" />
        <StatCard title="Taux d'occupation" value={`${tauxOccupation}%`} icon={Percent} color="steel" description={<Progress value={tauxOccupation} className="h-1.5 mt-1" />} />
        <StatCard title="Réservations" value={stats.reservations_en_cours ?? 0} icon={Calendar} color="green" />
      </div>

      {/* Revenus chart */}
      <CollapsibleCard title={`Évolution des revenus (12 derniers mois)`} icon={TrendingUp} defaultOpen>
        {evolutionRevenus.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={evolutionRevenus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="montant" name="Revenus" stroke="var(--primary)" strokeWidth={2.5} dot={{ fill: 'var(--primary)', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée disponible pour cette période</p>
        )}
      </CollapsibleCard>

      {/* Loyers + État de caisse */}
      <div className="grid md:grid-cols-2 gap-4">
        <CollapsibleCard title={`Loyers — ${moisLabel} ${annee}`} icon={Banknote} defaultOpen badge={loyers.length > 0 && <Badge variant="navy" className="text-xs ml-2">{loyers.length}</Badge>}>
          {loyersLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
          ) : loyers.length > 0 ? (
            <>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {loyers.map((l, i) => (
                  <div key={l.id || i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                    <p className="font-medium text-navy-800 text-xs truncate max-w-[140px]">{l.locataire_nom || l.nom || '-'}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{formatCurrency(l.montant)}</span>
                      <Badge variant={getEffectiveStatut(l) === 'PAYEE' ? 'success' : 'destructive'} className="text-xs px-1.5 py-0">
                        {getEffectiveStatut(l) === 'PAYEE' ? 'Payé' : 'Impayé'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-navy-800">Total encaissé</span>
                <span className="text-green-600">{formatCurrency(revenusMois)}</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">Aucun loyer pour {moisLabel} {annee}</p>
          )}
        </CollapsibleCard>

        <CollapsibleCard title={`État de la caisse — ${moisLabel} ${annee}`} icon={Receipt} defaultOpen>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2.5 bg-green-50 rounded-lg border border-green-100">
              <p className="text-xs text-muted-foreground">Encaissé</p>
              <p className="text-base font-bold text-green-600 mt-0.5">{formatCurrency(revenusMois)}</p>
            </div>
            <div className="text-center p-2.5 bg-red-50 rounded-lg border border-red-100">
              <p className="text-xs text-muted-foreground">Dépensé</p>
              <p className="text-base font-bold text-red-500 mt-0.5">{formatCurrency(depensesMois)}</p>
            </div>
            <div className={`text-center p-2.5 rounded-lg border ${solde >= 0 ? 'bg-navy-50 border-navy-100' : 'bg-red-50 border-red-100'}`}>
              <p className="text-xs text-muted-foreground">Solde</p>
              <p className={`text-base font-bold mt-0.5 ${solde >= 0 ? 'text-navy-800' : 'text-red-600'}`}>{formatCurrency(solde)}</p>
            </div>
          </div>
          {stats.historique_caisse && stats.historique_caisse.length > 0 && (
            <div className="mt-3">
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={stats.historique_caisse}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <defs>
                    <linearGradient id="soldeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="solde" name="Solde" fill="url(#soldeGrad)" stroke="var(--primary)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CollapsibleCard>
      </div>

      {/* Dépenses */}
      <div className="grid md:grid-cols-2 gap-4">
        <CollapsibleCard title={`Répartition des dépenses — ${moisLabel} ${annee}`} icon={Receipt}>
          {depensesLoading ? (
            <Skeleton className="h-40" />
          ) : repartitionDepenses.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={180} className="sm:w-[55%] sm:flex-shrink-0">
                <PieChart>
                  <Pie data={repartitionDepenses} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="montant">
                    {repartitionDepenses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-1.5">
                {repartitionDepenses.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground flex-1 truncate">{d.categorie}</span>
                    <span className="font-medium">{formatCurrency(d.montant)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune dépense pour {moisLabel} {annee}</p>
          )}
        </CollapsibleCard>

        <CollapsibleCard title={`Dernières dépenses — ${moisLabel} ${annee}`} icon={Receipt} badge={dernierDepenses.length > 0 && <Badge variant="secondary" className="text-xs ml-2">{dernierDepenses.length}</Badge>}>
          {depensesLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
          ) : dernierDepenses.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {dernierDepenses.map((d, i) => (
                <div key={d.id || i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <div>
                    <p className="text-xs font-medium text-navy-800 truncate max-w-[140px]">{d.description || d.titre}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">{d.categorie || d.type_depense || '-'}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(d.date_depense || d.date)}</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-red-600">{formatCurrency(d.montant)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">Aucune dépense pour {moisLabel} {annee}</p>
          )}
        </CollapsibleCard>
      </div>

      {/* Réservations + Paiements en attente */}
      <div className="grid md:grid-cols-2 gap-4">
        <CollapsibleCard title={`Locations actives — ${annee}`} icon={CalendarDays}>
          {locationsParMois.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={locationsParMois}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Locations" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune location pour {annee}</p>
          )}
        </CollapsibleCard>

        <CollapsibleCard
          title="Paiements en attente"
          icon={Clock}
          badge={paiementsEnAttente.length > 0 && <Badge variant="destructive" className="ml-2">{paiementsEnAttente.length}</Badge>}
        >
          {paiementsEnAttente.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {paiementsEnAttente.slice(0, 5).map((p, i) => (
                <div key={p.id || i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <div>
                    <p className="text-xs font-medium text-navy-800">{p.locataire_nom || p.user?.nom}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {p.type && <Badge variant="secondary" className="text-xs px-1.5 py-0">{p.type}</Badge>}
                      <span className="text-xs text-muted-foreground">{formatDate(p.created_at || p.date_soumission)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-red-600">{formatCurrency(p.montant)}</span>
                    <Button size="sm" variant="outline" asChild className="text-xs h-6 px-2">
                      <Link to="/admin/locataires">Traiter</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground">
              <div className="p-3 bg-green-50 rounded-full mb-2">
                <FileText className="h-5 w-5 text-green-500" />
              </div>
              Aucun paiement en attente
            </div>
          )}
        </CollapsibleCard>
      </div>
    </div>
  );
}
