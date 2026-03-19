import { Droplets, Zap, FileDown, Send, Eye, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatMonthYear } from '@/lib/utils/formatters';

// ── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG = {
  generee: {
    label: 'Générée',
    className: 'border-transparent bg-gray-100 text-gray-600',
  },
  envoyee: {
    label: 'Envoyée',
    className: 'border-transparent bg-maroon-100 text-maroon-600',
  },
  payee: {
    label: 'Payée',
    className: 'border-transparent bg-green-100 text-green-700',
  },
};

// ── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  sodeci: {
    label: 'Facture SODECI',
    icon: Droplets,
    borderColor: 'border-l-maroon-500',
    iconColor: 'text-maroon-500',
    iconBg: 'bg-maroon-50',
  },
  cie: {
    label: 'Facture CIE',
    icon: Zap,
    borderColor: 'border-l-yellow-500',
    iconColor: 'text-yellow-500',
    iconBg: 'bg-yellow-50',
  },
};

// ── Component ────────────────────────────────────────────────────────────────

export default function FactureCard({ facture, onDownload, onSendNotif, onView }) {
  const {
    type,
    mois,
    annee,
    montant_total,
    statut,
    date_creation,
    locataires_count,
  } = facture;

  const typeConf = TYPE_CONFIG[type] ?? TYPE_CONFIG.sodeci;
  const statusConf = STATUS_CONFIG[statut] ?? STATUS_CONFIG.generee;
  const TypeIcon = typeConf.icon;

  return (
    <Card
      className={[
        'border-l-4 transition-shadow hover:shadow-md',
        typeConf.borderColor,
      ].join(' ')}
    >
      {/* ── Header ── */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          {/* Icon + Label */}
          <div className="flex items-center gap-3">
            <span
              className={[
                'flex h-9 w-9 items-center justify-center rounded-lg',
                typeConf.iconBg,
              ].join(' ')}
            >
              <TypeIcon className={['h-5 w-5', typeConf.iconColor].join(' ')} />
            </span>
            <span className="text-sm font-semibold text-[var(--primary)]">
              {typeConf.label}
            </span>
          </div>

          {/* Status badge */}
          <Badge className={statusConf.className}>{statusConf.label}</Badge>
        </div>
      </CardHeader>

      {/* ── Body ── */}
      <CardContent className="pb-3">
        {/* Period */}
        <p className="mb-1 text-sm text-muted-foreground">
          {formatMonthYear(mois, annee)}
        </p>

        {/* Total amount */}
        <p className="text-2xl font-bold text-[var(--primary)]">
          {formatCurrency(montant_total)}
        </p>
      </CardContent>

      {/* ── Footer ── */}
      <CardFooter className="flex flex-col items-start gap-3 pt-0">
        {/* Meta info */}
        <div className="flex w-full items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(date_creation)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {locataires_count ?? 0} locataire
            {(locataires_count ?? 0) !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex w-full items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-1.5 text-xs text-[var(--primary)] hover:bg-[var(--primary)]/5"
            onClick={() => onDownload?.(facture)}
          >
            <FileDown className="h-3.5 w-3.5" />
            Télécharger
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-1.5 text-xs text-[var(--accent)] hover:bg-[var(--accent)]/5"
            onClick={() => onSendNotif?.(facture)}
          >
            <Send className="h-3.5 w-3.5" />
            Notifier
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-1.5 text-xs text-[var(--secondary)] hover:bg-[var(--secondary)]/10"
            onClick={() => onView?.(facture)}
          >
            <Eye className="h-3.5 w-3.5" />
            Voir
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
