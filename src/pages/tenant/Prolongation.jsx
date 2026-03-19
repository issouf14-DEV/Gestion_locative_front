import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Home,
  LayoutDashboard,
  RefreshCcw,
  XCircle,
  Hourglass,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import EmptyState from '@/components/common/EmptyState';
import PageHeader from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useMaLocation, useRenouvelerLocation } from '@/lib/api/queries/rentals';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import { toast } from 'sonner';

// ─── Zod schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  duree_mois: z.string({ required_error: 'Veuillez sélectionner une durée.' }).min(1, 'Veuillez sélectionner une durée.'),
  notes: z.string().max(500, 'Maximum 500 caractères.').optional(),
  confirmation: z.boolean().refine((v) => v === true, {
    message: 'Veuillez confirmer votre demande.',
  }),
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
const DUREES = [
  { value: '6', label: '6 mois' },
  { value: '12', label: '12 mois (1 an)' },
  { value: '24', label: '24 mois (2 ans)' },
];

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function getDaysRemaining(endDate) {
  if (!endDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end - now) / 86400000);
}

// ─── Renewal status badge/card ─────────────────────────────────────────────────
const STATUS_CONFIG = {
  EN_ATTENTE: {
    label: 'En attente',
    icon: Hourglass,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-300',
  },
  APPROUVEE: {
    label: 'Approuvée',
    icon: CheckCircle2,
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badgeClass: 'bg-green-100 text-green-700 border-green-300',
  },
  REFUSEE: {
    label: 'Refusée',
    icon: XCircle,
    color: 'text-[var(--accent)]',
    bg: 'bg-red-50',
    border: 'border-[var(--accent)]/20',
    badgeClass: 'bg-red-100 text-[var(--accent)] border-[var(--accent)]/30',
  },
};

function RenewalStatusCard({ demande }) {
  const config = STATUS_CONFIG[demande?.statut] || STATUS_CONFIG.EN_ATTENTE;
  const StatusIcon = config.icon;

  return (
    <Card className={`border ${config.border} ${config.bg}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`p-2.5 rounded-xl bg-white shadow-sm`}>
            <StatusIcon className={`w-6 h-6 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-800">Demande de prolongation</p>
              <Badge variant="outline" className={`text-xs ${config.badgeClass}`}>
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Soumise le {formatDate(demande?.created_at || demande?.date_soumission)}
            </p>
            {demande?.duree_mois && (
              <p className="text-sm text-gray-600 mt-0.5">
                Durée demandée :{' '}
                <span className="font-medium">
                  {DUREES.find((d) => d.value === String(demande.duree_mois))?.label || `${demande.duree_mois} mois`}
                </span>
              </p>
            )}
            {demande?.notes && (
              <p className="text-sm text-gray-500 mt-2 italic">"{demande.notes}"</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────
function ProlongationSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────
export default function TenantProlongation() {
  const navigate = useNavigate();
  const { data: locationData, isLoading } = useMaLocation();
  const mutation = useRenouvelerLocation();
  const [submitted, setSubmitted] = useState(false);

  const location = locationData?.data || locationData;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      duree_mois: '',
      notes: '',
      confirmation: false,
    },
  });

  const dureeValue = useWatch({ control, name: 'duree_mois' });
  const daysRemaining = getDaysRemaining(location?.date_fin);
  const newEndDate = dureeValue && location?.date_fin
    ? addMonths(location.date_fin, parseInt(dureeValue, 10))
    : null;

  const onSubmit = (values) => {
    if (!location?.id) return;

    mutation.mutate(
      {
        id: location.id,
        duree: parseInt(values.duree_mois, 10),
        notes: values.notes || '',
      },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || 'Erreur lors de la soumission de la demande.');
        },
      }
    );
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ProlongationSkeleton />
      </div>
    );
  }

  // ── No active rental ──
  if (!location) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <PageHeader
          title="Demande de Prolongation"
          description="Prolongez la durée de votre bail"
        />
        <EmptyState
          icon={Home}
          title="Aucune location active"
          description="Vous n'avez pas de location en cours. Contactez l'administrateur pour plus d'informations."
          action={
            <Button
              variant="outline"
              className="border-[var(--primary)] text-[var(--primary)]"
              onClick={() => navigate('/tenant/dashboard')}
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Tableau de bord
            </Button>
          }
        />
      </div>
    );
  }

  // ── Success state ──
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center text-center py-10 space-y-6">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[var(--primary)]">Demande soumise !</h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              Votre demande de prolongation a été transmise à l'administrateur. Vous serez
              notifié dès qu'elle sera traitée.
            </p>
          </div>
          <Button
            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white h-12 px-8 font-semibold"
            onClick={() => navigate('/tenant/dashboard')}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  // ── Existing renewal request ──
  const existingDemande = location?.demande_prolongation || location?.derniere_demande_prolongation;
  const hasExistingRequest = !!existingDemande;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <PageHeader
        title="Demande de Prolongation"
        description="Soumettez une demande de renouvellement de votre bail"
      />

      {/* Expiry warning banner */}
      {daysRemaining !== null && daysRemaining <= 60 && (
        <div
          className={[
            'flex items-start gap-3 p-4 rounded-xl border text-sm',
            daysRemaining <= 30
              ? 'bg-red-50 border-[var(--accent)]/30 text-[var(--accent)]'
              : 'bg-amber-50 border-amber-300 text-amber-800',
          ].join(' ')}
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              Votre bail expire dans{' '}
              <span className={daysRemaining <= 30 ? 'text-[var(--accent)]' : 'text-amber-900'}>
                {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
              </span>
            </p>
            <p className="mt-0.5 opacity-80">
              {daysRemaining <= 30
                ? 'Action urgente requise. Soumettez votre demande dès que possible.'
                : 'Nous vous recommandons de soumettre votre demande rapidement.'}
            </p>
          </div>
        </div>
      )}

      {/* Current lease summary */}
      <Card className="border-[var(--secondary)]/30 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[var(--primary)] flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Bail en cours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Property */}
          <div className="flex items-center gap-3 p-3 bg-[var(--primary)]/5 rounded-xl">
            <div className="p-2 rounded-lg bg-[var(--primary)]/10">
              <Home className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                {location?.maison?.titre || location?.maison?.adresse || 'Propriété'}
              </p>
              <p className="text-sm text-gray-500">
                {location?.maison?.quartier || ''} {location?.maison?.ville || ''}
              </p>
            </div>
            {location?.loyer_mensuel && (
              <div className="ml-auto text-right">
                <p className="font-bold text-[var(--primary)]">{formatCurrency(location.loyer_mensuel)}</p>
                <p className="text-xs text-gray-400">/mois</p>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-gray-400 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                Début du bail
              </p>
              <p className="font-semibold text-gray-800">{formatDate(location?.date_debut)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-400 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                Fin du bail
              </p>
              <p className="font-semibold text-gray-800">{formatDate(location?.date_fin)}</p>
            </div>
          </div>

          {/* Days remaining */}
          {daysRemaining !== null && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Jours restants :</span>
              <Badge
                variant="outline"
                className={[
                  'font-bold',
                  daysRemaining <= 30
                    ? 'border-[var(--accent)] text-[var(--accent)] bg-red-50'
                    : daysRemaining <= 60
                    ? 'border-amber-400 text-amber-700 bg-amber-50'
                    : 'border-[var(--secondary)] text-[var(--primary)] bg-[var(--primary)]/5',
                ].join(' ')}
              >
                {daysRemaining > 0 ? `${daysRemaining} j` : 'Expiré'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing request status */}
      {hasExistingRequest && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide px-1">
            Demande en cours
          </h2>
          <RenewalStatusCard demande={existingDemande} />
          {existingDemande?.statut === 'EN_ATTENTE' && (
            <p className="text-xs text-gray-400 px-1">
              Vous avez déjà une demande en attente de traitement. Vous ne pouvez pas en soumettre une nouvelle.
            </p>
          )}
        </div>
      )}

      {/* Form — only show if no pending request */}
      {(!hasExistingRequest || existingDemande?.statut === 'REFUSEE') && (
        <Card className="border-[var(--secondary)]/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[var(--primary)] flex items-center gap-2">
              <RefreshCcw className="w-5 h-5" />
              Nouvelle demande de prolongation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Duration select */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">
                  Durée souhaitée <span className="text-[var(--accent)]">*</span>
                </Label>
                <Controller
                  name="duree_mois"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="border-[var(--secondary)]/50 focus:border-[var(--primary)] h-11">
                        <SelectValue placeholder="Sélectionnez une durée" />
                      </SelectTrigger>
                      <SelectContent>
                        {DUREES.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.duree_mois && (
                  <p className="text-xs text-[var(--accent)]">{errors.duree_mois.message}</p>
                )}
              </div>

              {/* New end date preview */}
              {newEndDate && (
                <div className="flex items-center gap-3 p-4 bg-[var(--primary)]/5 rounded-xl border border-[var(--primary)]/20">
                  <CalendarDays className="w-5 h-5 text-[var(--primary)] shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                      Nouvelle date de fin estimée
                    </p>
                    <p className="text-lg font-bold text-[var(--primary)] mt-0.5">
                      {formatDate(newEndDate)}
                    </p>
                  </div>
                </div>
              )}

              <Separator className="bg-[var(--secondary)]/20" />

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                  Message / Commentaire <span className="text-gray-400 font-normal">(optionnel)</span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Précisez la raison de votre demande ou toute information utile..."
                  rows={3}
                  className="border-[var(--secondary)]/50 focus:border-[var(--primary)] resize-none"
                  {...register('notes')}
                />
                {errors.notes && (
                  <p className="text-xs text-[var(--accent)]">{errors.notes.message}</p>
                )}
              </div>

              {/* Confirmation checkbox */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <Controller
                  name="confirmation"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="confirmation"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5 border-[var(--primary)] data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]"
                      />
                      <Label
                        htmlFor="confirmation"
                        className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                      >
                        Je confirme ma demande de prolongation et comprends qu'elle sera soumise à
                        l'approbation de l'administrateur.
                      </Label>
                    </div>
                  )}
                />
                {errors.confirmation && (
                  <p className="text-xs text-[var(--accent)] mt-2 pl-7">{errors.confirmation.message}</p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white h-12 text-base font-semibold"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi en cours...
                  </span>
                ) : (
                  <>
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Soumettre la demande
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
