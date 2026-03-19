import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Droplets,
  Zap,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  CreditCard,
  AlertCircle,
  Receipt,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import StatCard from '@/components/common/StatCard';
import { useMesPaiements, useFacturesImpayees } from '@/lib/api/queries/payments';
import { formatCurrency, formatDate, formatMonthYear } from '@/lib/utils/formatters';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TAB_VALUES = ['tous', 'loyer', 'sodeci', 'cie', 'en_attente', 'payés'];

const STATUT_LABELS = {
  payé: 'payé',
  paye: 'payé',
  valide: 'validé',
  validé: 'validé',
  validated: 'validé',
  en_attente: 'en_attente',
  'en attente': 'en_attente',
  pending: 'en_attente',
  en_validation: 'en_validation',
  'en validation': 'en_validation',
  soumis: 'en_validation',
  rejeté: 'rejeté',
  rejete: 'rejeté',
  rejected: 'rejeté',
};

function normalizeStatut(raw) {
  if (!raw) return 'en_attente';
  return STATUT_LABELS[raw.toLowerCase()] || raw.toLowerCase();
}

function isPaid(statut) {
  const s = normalizeStatut(statut);
  return s === 'payé' || s === 'validé';
}

function isPending(statut) {
  return !isPaid(statut);
}

function StatutBadge({ statut }) {
  const s = normalizeStatut(statut);

  if (s === 'payé' || s === 'validé') {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 whitespace-nowrap">
        <CheckCircle2 className="h-3 w-3" /> Payé
      </Badge>
    );
  }
  if (s === 'en_validation') {
    return (
      <Badge className="bg-maroon-100 text-maroon-600 border-maroon-200 gap-1 whitespace-nowrap">
        <Clock className="h-3 w-3" /> En validation
      </Badge>
    );
  }
  if (s === 'en_attente') {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 gap-1 whitespace-nowrap">
        <XCircle className="h-3 w-3" /> En attente
      </Badge>
    );
  }
  if (s === 'rejeté') {
    return (
      <Badge className="bg-gray-100 text-gray-600 border-gray-200 gap-1 whitespace-nowrap">
        <XCircle className="h-3 w-3" /> Rejeté
      </Badge>
    );
  }
  return <Badge variant="outline">{statut || '—'}</Badge>;
}

function TypeIcon({ type }) {
  if (!type) return <FileText className="h-4 w-4 text-muted-foreground" />;
  const t = type.toLowerCase();
  if (t === 'loyer') return <Home className="h-4 w-4 text-[var(--primary)]" />;
  if (t === 'sodeci' || t === 'eau') return <Droplets className="h-4 w-4 text-[var(--secondary)]" />;
  if (t === 'cie' || t === 'electricite' || t === 'électricité')
    return <Zap className="h-4 w-4 text-[var(--accent)]" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

// ---------------------------------------------------------------------------
// Normalize raw API items into a unified charge shape
// ---------------------------------------------------------------------------

function normalizePayment(p) {
  return {
    id: p.id,
    type: p.type_paiement || p.type || 'Loyer',
    mois: p.mois,
    annee: p.annee,
    periode: p.periode,
    montant: p.montant,
    statut: p.statut,
    date_echeance: p.date_echeance || p.date_limite,
    date_soumission: p.date_soumission || p.created_at,
    preuve_url: p.preuve_paiement || p.preuve_url || p.justificatif,
    source: 'paiement',
  };
}

function normalizeFacture(f) {
  const type = f.type_facture || f.type || 'Charge';
  const typeLabel =
    type.toLowerCase() === 'eau' ? 'SODECI' :
    type.toLowerCase() === 'electricite' || type.toLowerCase() === 'électricité' ? 'CIE' :
    type;

  return {
    id: f.id,
    type: typeLabel,
    mois: f.mois,
    annee: f.annee,
    periode: f.periode,
    montant: f.montant_locataire || f.montant,
    statut: f.statut_paiement || f.statut || 'en_attente',
    date_echeance: f.date_echeance || f.date_limite,
    date_soumission: f.date_soumission || f.created_at,
    preuve_url: null,
    source: 'facture',
  };
}

// ---------------------------------------------------------------------------
// Charge Row (Table)
// ---------------------------------------------------------------------------

function ChargeTableRow({ charge, navigate }) {
  const hasPaid = isPaid(charge.statut);
  const hasProof =
    charge.preuve_url ||
    normalizeStatut(charge.statut) === 'en_validation';

  const periode =
    charge.mois && charge.annee
      ? formatMonthYear(charge.mois, charge.annee)
      : charge.periode || '—';

  return (
    <TableRow className="hover:bg-muted/20">
      <TableCell>
        <div className="flex items-center gap-2 min-w-[90px]">
          <TypeIcon type={charge.type} />
          <span className="text-sm font-medium">{charge.type}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{periode}</TableCell>
      <TableCell className="text-sm font-semibold text-[var(--primary)]">
        {charge.montant ? formatCurrency(charge.montant) : '—'}
      </TableCell>
      <TableCell>
        <StatutBadge statut={charge.statut} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {charge.date_echeance ? formatDate(charge.date_echeance) : '—'}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {!hasPaid && (
            <Button
              size="sm"
              className="bg-[var(--accent)] hover:bg-[#6a1b38] text-white text-xs h-7 px-3"
              onClick={() => navigate(`/tenant/charges/${charge.id}/paiement`)}
            >
              Payer
            </Button>
          )}
          {hasProof && charge.preuve_url && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 px-3 border-[var(--secondary)] text-[var(--secondary)] hover:bg-[var(--secondary)]/10"
              onClick={() => window.open(charge.preuve_url, '_blank')}
            >
              <Eye className="h-3 w-3 mr-1" /> Preuve
            </Button>
          )}
          {!hasPaid && !charge.preuve_url && normalizeStatut(charge.statut) === 'en_validation' && (
            <Badge className="bg-maroon-50 text-maroon-500 border-maroon-200 text-xs">
              En cours de vérification
            </Badge>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Charge Card (Mobile)
// ---------------------------------------------------------------------------

function ChargeCard({ charge, navigate }) {
  const hasPaid = isPaid(charge.statut);
  const hasProofUrl = !!charge.preuve_url;

  const periode =
    charge.mois && charge.annee
      ? formatMonthYear(charge.mois, charge.annee)
      : charge.periode || '—';

  return (
    <Card className="border-l-4" style={{ borderLeftColor: hasPaid ? '#16a34a' : 'var(--accent)' }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <TypeIcon type={charge.type} />
            <div>
              <p className="font-semibold text-sm text-[var(--primary)]">{charge.type}</p>
              <p className="text-xs text-muted-foreground">{periode}</p>
            </div>
          </div>
          <StatutBadge statut={charge.statut} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-[var(--primary)]">
              {charge.montant ? formatCurrency(charge.montant) : '—'}
            </p>
            {charge.date_echeance && (
              <p className="text-xs text-muted-foreground">
                Échéance : {formatDate(charge.date_echeance)}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {!hasPaid && (
              <Button
                size="sm"
                className="bg-[var(--accent)] hover:bg-[#6a1b38] text-white text-xs h-8 px-3"
                onClick={() => navigate(`/tenant/charges/${charge.id}/paiement`)}
              >
                Payer
              </Button>
            )}
            {hasProofUrl && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 px-3 border-[var(--secondary)] text-[var(--secondary)]"
                onClick={() => window.open(charge.preuve_url, '_blank')}
              >
                <Eye className="h-3.5 w-3.5 mr-1" /> Preuve
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton rows
// ---------------------------------------------------------------------------

function SkeletonRows({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 6 }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function SkeletonCards({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Charges Page
// ---------------------------------------------------------------------------

export default function TenantCharges() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tous');

  const { data: paiementsData, isLoading: loadingPaiements } = useMesPaiements();
  const { data: facturesData, isLoading: loadingFactures } = useFacturesImpayees();

  const isLoading = loadingPaiements || loadingFactures;

  // Merge & deduplicate charges
  const allCharges = useMemo(() => {
    const paiements = Array.isArray(paiementsData)
      ? paiementsData
      : paiementsData?.results || paiementsData?.data || [];

    const factures = Array.isArray(facturesData)
      ? facturesData
      : facturesData?.results || facturesData?.data || [];

    const normalized = [
      ...paiements.map(normalizePayment),
      ...factures.map(normalizeFacture),
    ];

    // Deduplicate by id+source
    const seen = new Set();
    return normalized.filter((c) => {
      const key = `${c.source}-${c.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [paiementsData, facturesData]);

  // Stats
  const stats = useMemo(() => {
    let totalDu = 0;
    let totalPaye = 0;
    let enAttente = 0;

    allCharges.forEach((c) => {
      const montant = Number(c.montant) || 0;
      if (isPaid(c.statut)) {
        totalPaye += montant;
      } else {
        totalDu += montant;
        const s = normalizeStatut(c.statut);
        if (s === 'en_attente' || s === 'rejeté') enAttente += 1;
      }
    });

    return { totalDu, totalPaye, enAttente };
  }, [allCharges]);

  // Filter by tab
  const filteredCharges = useMemo(() => {
    switch (activeTab) {
      case 'loyer':
        return allCharges.filter((c) => c.type?.toLowerCase() === 'loyer');
      case 'sodeci':
        return allCharges.filter(
          (c) => c.type?.toLowerCase() === 'sodeci' || c.type?.toLowerCase() === 'eau'
        );
      case 'cie':
        return allCharges.filter(
          (c) =>
            c.type?.toLowerCase() === 'cie' ||
            c.type?.toLowerCase() === 'electricite' ||
            c.type?.toLowerCase() === 'électricité'
        );
      case 'en_attente':
        return allCharges.filter((c) => {
          const s = normalizeStatut(c.statut);
          return s === 'en_attente' || s === 'rejeté';
        });
      case 'payés':
        return allCharges.filter((c) => isPaid(c.statut));
      default:
        return allCharges;
    }
  }, [allCharges, activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Mes Charges"
        description="Gérez vos loyers, factures SODECI et CIE"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </>
        ) : (
          <>
            <StatCard
              title="Total dû"
              value={formatCurrency(stats.totalDu)}
              icon={AlertCircle}
              color="maroon"
              description="Montant restant à payer"
            />
            <StatCard
              title="Total payé"
              value={formatCurrency(stats.totalPaye)}
              icon={CheckCircle2}
              color="navy"
              description="Montant déjà réglé"
            />
            <StatCard
              title="En attente"
              value={stats.enAttente}
              icon={Clock}
              color="steel"
              description="Charge(s) à soumettre"
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 rounded-lg">
          <TabsTrigger value="tous" className="text-xs px-3 py-1.5">
            Tous
            {!isLoading && (
              <span className="ml-1.5 bg-[var(--primary)] text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">
                {allCharges.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="loyer" className="text-xs px-3 py-1.5 gap-1">
            <Home className="h-3 w-3" /> Loyer
          </TabsTrigger>
          <TabsTrigger value="sodeci" className="text-xs px-3 py-1.5 gap-1">
            <Droplets className="h-3 w-3" /> SODECI
          </TabsTrigger>
          <TabsTrigger value="cie" className="text-xs px-3 py-1.5 gap-1">
            <Zap className="h-3 w-3" /> CIE
          </TabsTrigger>
          <TabsTrigger value="en_attente" className="text-xs px-3 py-1.5 gap-1">
            <Clock className="h-3 w-3" /> En attente
            {!isLoading && stats.enAttente > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none">
                {stats.enAttente}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="payés" className="text-xs px-3 py-1.5 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Payés
          </TabsTrigger>
        </TabsList>

        {/* Desktop Table */}
        <div className="hidden md:block mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                {isLoading
                  ? 'Chargement...'
                  : `${filteredCharges.length} charge${filteredCharges.length !== 1 ? 's' : ''}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-xs font-semibold">Type</TableHead>
                      <TableHead className="text-xs font-semibold">Mois / Période</TableHead>
                      <TableHead className="text-xs font-semibold">Montant</TableHead>
                      <TableHead className="text-xs font-semibold">Statut</TableHead>
                      <TableHead className="text-xs font-semibold">Date d'échéance</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <SkeletonRows count={5} />
                    ) : filteredCharges.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <EmptyState
                            icon={FileText}
                            title="Aucune charge trouvée"
                            description="Aucune charge ne correspond au filtre sélectionné."
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCharges.map((charge) => (
                        <ChargeTableRow
                          key={`${charge.source}-${charge.id}`}
                          charge={charge}
                          navigate={navigate}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden mt-4">
          {isLoading ? (
            <SkeletonCards count={4} />
          ) : filteredCharges.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aucune charge trouvée"
              description="Aucune charge ne correspond au filtre sélectionné."
              className="py-12"
            />
          ) : (
            <div className="space-y-3">
              {filteredCharges.map((charge) => (
                <ChargeCard
                  key={`${charge.source}-${charge.id}`}
                  charge={charge}
                  navigate={navigate}
                />
              ))}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
