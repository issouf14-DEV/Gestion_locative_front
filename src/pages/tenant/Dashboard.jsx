import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Home,
  Droplets,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  MapPin,
  Ruler,
  TrendingUp,
  CreditCard,
  FileText,
  ArrowRight,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
import { useDashboardLocataire } from '@/lib/api/queries/dashboard';
import { useMe } from '@/lib/api/queries/users';
import {
  formatCurrency,
  formatDate,
  formatDateLong,
  formatMonthYear,
} from '@/lib/utils/formatters';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatutBadge(statut) {
  if (!statut) return <Badge variant="outline">—</Badge>;
  const s = statut.toLowerCase();
  if (s === 'payé' || s === 'paye' || s === 'valide' || s === 'validé') {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
        <CheckCircle2 className="h-3 w-3" /> Payé
      </Badge>
    );
  }
  if (s === 'en_attente' || s === 'en attente' || s === 'pending') {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 gap-1">
        <Clock className="h-3 w-3" /> En attente
      </Badge>
    );
  }
  if (s === 'en_validation' || s === 'en validation' || s === 'soumis') {
    return (
      <Badge className="bg-maroon-100 text-maroon-600 border-maroon-200 gap-1">
        <Clock className="h-3 w-3" /> En validation
      </Badge>
    );
  }
  if (s === 'rejeté' || s === 'rejete' || s === 'rejected') {
    return (
      <Badge className="bg-gray-100 text-gray-600 border-gray-200 gap-1">
        <XCircle className="h-3 w-3" /> Rejeté
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
      <XCircle className="h-3 w-3" /> Non payé
    </Badge>
  );
}

function getPaiementBadge(statut) {
  if (!statut) return <Badge variant="outline">—</Badge>;
  const s = statut.toLowerCase();
  if (s === 'validé' || s === 'valide' || s === 'validated') {
    return <Badge className="bg-green-100 text-green-700 border-green-200">Validé</Badge>;
  }
  if (s === 'en_validation' || s === 'en validation' || s === 'soumis' || s === 'pending') {
    return <Badge className="bg-maroon-100 text-maroon-600 border-maroon-200">En validation</Badge>;
  }
  if (s === 'rejeté' || s === 'rejete' || s === 'rejected') {
    return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Rejeté</Badge>;
  }
  return <Badge variant="outline">{statut}</Badge>;
}

function getChargeIcon(type) {
  if (!type) return <FileText className="h-4 w-4" />;
  const t = type.toLowerCase();
  if (t === 'loyer') return <Home className="h-4 w-4 text-[var(--primary)]" />;
  if (t === 'sodeci' || t === 'eau') return <Droplets className="h-4 w-4 text-[var(--secondary)]" />;
  if (t === 'cie' || t === 'electricite' || t === 'électricité') return <Zap className="h-4 w-4 text-[var(--accent)]" />;
  return <FileText className="h-4 w-4" />;
}

function daysRemaining(endDate) {
  if (!endDate) return null;
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function leaseProgress(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  const total = end - start;
  const elapsed = now - start;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ChargeStatusCard({ title, icon: Icon, iconColor, data, isLoading, navigate }) {
  if (isLoading) {
    return (
      <Card className="flex-1 min-w-0">
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-6 w-20" />
        </CardContent>
      </Card>
    );
  }

  const isPaid =
    data?.statut?.toLowerCase() === 'payé' ||
    data?.statut?.toLowerCase() === 'paye' ||
    data?.statut?.toLowerCase() === 'valide' ||
    data?.statut?.toLowerCase() === 'validé';

  const periode =
    data?.mois && data?.annee
      ? formatMonthYear(data.mois, data.annee)
      : data?.periode || '—';

  return (
    <Card className="flex-1 min-w-0 border-l-4" style={{ borderLeftColor: iconColor }}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${iconColor}18` }}
          >
            <Icon className="h-4 w-4" style={{ color: iconColor }} />
          </div>
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>

        <p className="text-xs text-muted-foreground mb-1">{periode}</p>
        <p className="text-xl font-bold text-[var(--primary)] mb-2">
          {data?.montant ? formatCurrency(data.montant) : '—'}
        </p>

        <div className="flex items-center justify-between gap-2">
          {getStatutBadge(data?.statut || (data ? 'non_payé' : null))}
          {!isPaid && data?.id && (
            <Button
              size="sm"
              className="bg-[var(--accent)] hover:bg-[#6a1b38] text-white text-xs h-7 px-3"
              onClick={() => navigate(`/tenant/charges/${data.id}/paiement`)}
            >
              Payer maintenant
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MaMaisonCard({ location, maison, isLoading }) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (!maison && !location) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-[var(--primary)]">Ma Maison</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Building2}
            title="Aucune location active"
            description="Vous n'avez pas de location en cours."
          />
        </CardContent>
      </Card>
    );
  }

  const photo = (() => {
    const url = maison?.image_principale || maison?.images?.[0]?.image || maison?.images?.[0]?.url;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL || 'https://gestion-locative-fqax.onrender.com';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  })();
  const days = daysRemaining(location?.date_fin);
  const progress = leaseProgress(location?.date_debut, location?.date_fin);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-[var(--primary)] flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Ma Maison
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Photo */}
        <div className="relative h-44 bg-muted mx-6 rounded-lg overflow-hidden mb-4">
          {photo ? (
            <img
              src={photo}
              alt={maison?.nom || 'Propriété'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Name + type */}
          <div>
            <h3 className="font-semibold text-[var(--primary)] text-base">
              {maison?.nom || 'Propriété'}
            </h3>
            {maison?.type_logement && (
              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                {maison.type_logement}
              </p>
            )}
          </div>

          {/* Address + surface */}
          <div className="space-y-1.5 text-sm text-muted-foreground">
            {(maison?.adresse || maison?.quartier || maison?.commune) && (
              <div className="flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--secondary)]" />
                <span>
                  {[maison?.adresse, maison?.quartier, maison?.commune]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}
            {maison?.superficie && (
              <div className="flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5 shrink-0 text-[var(--secondary)]" />
                <span>{maison.superficie} m²</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Rental dates */}
          {(location?.date_debut || location?.date_fin) && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[var(--secondary)]" />
              <span>
                Du{' '}
                <span className="font-medium text-foreground">
                  {formatDate(location.date_debut)}
                </span>{' '}
                au{' '}
                <span className="font-medium text-foreground">
                  {formatDate(location.date_fin)}
                </span>
              </span>
            </div>
          )}

          {/* Rent */}
          {location?.loyer_mensuel && (
            <div className="flex items-center gap-1.5 text-sm">
              <CreditCard className="h-3.5 w-3.5 shrink-0 text-[var(--secondary)]" />
              <span className="text-muted-foreground">Loyer mensuel :</span>
              <span className="font-semibold text-[var(--primary)]">
                {formatCurrency(location.loyer_mensuel)}
              </span>
            </div>
          )}

          {/* Days remaining */}
          {days !== null && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Durée du bail
                </span>
                <span
                  className={`font-medium ${
                    days < 30
                      ? 'text-red-600'
                      : days < 90
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                >
                  {days} jour{days !== 1 ? 's' : ''} restant{days !== 1 ? 's' : ''}
                </span>
              </div>
              <Progress
                value={progress}
                className="h-2"
                indicatorClassName={
                  progress > 80 ? 'bg-red-500' : progress > 60 ? 'bg-yellow-500' : 'bg-[var(--primary)]'
                }
              />
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors"
            onClick={() => navigate('/tenant/ma-maison')}
          >
            Voir les détails
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

export default function TenantDashboard() {
  const navigate = useNavigate();
  const { data: dashData, isLoading } = useDashboardLocataire();
  const { data: me } = useMe();

  const user = me?.data || me;
  const prenom = user?.prenoms || user?.first_name || user?.prenom || user?.nom || '';

  const chargesEnAttente = useMemo(
    () => dashData?.charges_en_attente || [],
    [dashData]
  );

  const paiementsRecents = useMemo(
    () => dashData?.paiements_recents || [],
    [dashData]
  );

  const chargesRecentes = useMemo(() => {
    const charges = [];

    const addCharge = (item, type) => {
      if (item) {
        charges.push({
          id: item.id,
          type,
          mois: item.mois,
          annee: item.annee,
          periode: item.periode,
          montant: item.montant,
          statut: item.statut,
          date_soumission: item.date_soumission || item.created_at,
          is_pending: !['payé', 'paye', 'valide', 'validé'].includes(
            (item.statut || '').toLowerCase()
          ),
        });
      }
    };

    addCharge(dashData?.loyer_actuel, 'Loyer');
    addCharge(dashData?.sodeci_actuel, 'SODECI');

    chargesEnAttente.forEach((c) => {
      const alreadyAdded = charges.find((ch) => ch.id === c.id);
      if (!alreadyAdded) {
        charges.push({
          id: c.id,
          type: c.type || c.type_charge || 'Charge',
          mois: c.mois,
          annee: c.annee,
          periode: c.periode,
          montant: c.montant,
          statut: c.statut || 'en_attente',
          date_soumission: c.date_soumission || c.created_at,
          is_pending: true,
        });
      }
    });

    return charges;
  }, [dashData, chargesEnAttente]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Mon Tableau de Bord"
          description={
            isLoading ? (
              <Skeleton className="h-4 w-48 mt-1" />
            ) : prenom ? (
              `Bienvenue, ${prenom} !`
            ) : (
              'Bienvenue sur votre espace locataire'
            )
          }
        />
        <Button
          variant="outline"
          size="sm"
          className="border-navy-300 text-navy-700 hover:bg-navy-50"
          asChild
        >
          <Link to="/">
            <Home className="h-4 w-4 mr-2" />
            Accueil
          </Link>
        </Button>
      </div>

      {/* Statut Global */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Statut du mois en cours
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <ChargeStatusCard
            title="Loyer"
            icon={Home}
            iconColor="var(--primary)"
            data={dashData?.loyer_actuel}
            isLoading={isLoading}
            navigate={navigate}
          />
          <ChargeStatusCard
            title="SODECI (Eau)"
            icon={Droplets}
            iconColor="var(--secondary)"
            data={dashData?.sodeci_actuel}
            isLoading={isLoading}
            navigate={navigate}
          />
        </div>
      </section>

      {/* Ma Maison + Charges récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ma Maison */}
        <div className="lg:col-span-1">
          <MaMaisonCard
            location={dashData?.location}
            maison={dashData?.maison}
            isLoading={isLoading}
          />
        </div>

        {/* Mes Charges récentes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-[var(--primary)]">
                  Mes Charges récentes
                </CardTitle>
                <Link
                  to="/tenant/charges"
                  className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 font-medium"
                >
                  Voir toutes <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : chargesRecentes.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Aucune charge"
                  description="Vos charges apparaîtront ici."
                  className="py-8"
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Mois</TableHead>
                        <TableHead className="text-xs">Montant</TableHead>
                        <TableHead className="text-xs">Statut</TableHead>
                        <TableHead className="text-xs">Soumis le</TableHead>
                        <TableHead className="text-xs text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chargesRecentes.map((charge) => (
                        <TableRow key={`${charge.type}-${charge.id}`} className="hover:bg-muted/20">
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm font-medium">
                              {getChargeIcon(charge.type)}
                              {charge.type}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {charge.mois && charge.annee
                              ? formatMonthYear(charge.mois, charge.annee)
                              : charge.periode || '—'}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-[var(--primary)]">
                            {charge.montant ? formatCurrency(charge.montant) : '—'}
                          </TableCell>
                          <TableCell>{getStatutBadge(charge.statut)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {charge.date_soumission
                              ? formatDate(charge.date_soumission)
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {charge.is_pending && charge.id ? (
                              <Button
                                size="sm"
                                className="bg-[var(--accent)] hover:bg-[#6a1b38] text-white text-xs h-7 px-3"
                                onClick={() =>
                                  navigate(`/tenant/charges/${charge.id}/paiement`)
                                }
                              >
                                Payer
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Paiements récents */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[var(--primary)] flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Paiements récents
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : paiementsRecents.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Aucun paiement"
              description="Vos soumissions de paiement apparaîtront ici."
              className="py-8"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">Référence</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Montant</TableHead>
                    <TableHead className="text-xs">Date soumission</TableHead>
                    <TableHead className="text-xs">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paiementsRecents.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/20">
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {p.reference || p.id || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          {getChargeIcon(p.type || p.type_paiement)}
                          <span>{p.type || p.type_paiement || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-[var(--primary)]">
                        {p.montant ? formatCurrency(p.montant) : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.date_soumission || p.created_at
                          ? formatDateLong(p.date_soumission || p.created_at)
                          : '—'}
                      </TableCell>
                      <TableCell>{getPaiementBadge(p.statut)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
