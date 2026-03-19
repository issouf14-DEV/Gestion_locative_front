import { CheckCircle2, Clock, AlertCircle, XCircle, Home, Droplets, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/formatters';

// ---------------------------------------------------------------------------
// Configuration maps
// ---------------------------------------------------------------------------

const STATUT_CONFIG = {
  paye: {
    label: 'Payé',
    Icon: CheckCircle2,
    className: 'bg-green-100 text-green-700 border-green-200',
    iconClassName: 'text-green-600',
  },
  en_validation: {
    label: 'En validation',
    Icon: Clock,
    className: 'bg-orange-100 text-orange-700 border-orange-200',
    iconClassName: 'text-orange-500',
  },
  en_attente: {
    label: 'En attente',
    Icon: AlertCircle,
    className: 'bg-red-100 text-red-700 border-red-200',
    iconClassName: 'text-red-500',
  },
  en_retard: {
    label: 'En retard',
    Icon: XCircle,
    className: 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20',
    iconClassName: 'text-[var(--accent)]',
  },
};

const TYPE_ICON = {
  loyer: Home,
  sodeci: Droplets,
  cie: Zap,
};

// ---------------------------------------------------------------------------
// Size tokens
// ---------------------------------------------------------------------------

const SIZE_TOKENS = {
  sm: {
    badge: 'px-2 py-0.5 text-xs gap-1',
    icon: 'h-3 w-3',
    amount: 'text-xs',
  },
  md: {
    badge: 'px-2.5 py-1 text-sm gap-1.5',
    icon: 'h-3.5 w-3.5',
    amount: 'text-sm',
  },
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function StatutPaiement({
  statut,
  type,
  montant,
  size = 'md',
}) {
  const config = STATUT_CONFIG[statut];
  const tokens = SIZE_TOKENS[size] ?? SIZE_TOKENS.md;

  if (!config) {
    // Unknown statut — render a neutral outline badge
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full border font-medium',
          tokens.badge,
          'bg-gray-100 text-gray-600 border-gray-200'
        )}
      >
        {statut ?? '—'}
      </span>
    );
  }

  const { label, Icon, className, iconClassName } = config;

  // Optional type icon shown beside the status
  const TypeIcon = type ? TYPE_ICON[type] : null;

  return (
    <span className="inline-flex items-center gap-2">
      {/* Status badge */}
      <span
        className={cn(
          'inline-flex items-center rounded-full border font-medium',
          tokens.badge,
          className
        )}
      >
        <Icon className={cn(tokens.icon, iconClassName)} />
        {label}
        {/* Type sub-icon inside badge when type is provided */}
        {TypeIcon && (
          <TypeIcon className={cn(tokens.icon, 'opacity-70 ml-0.5')} />
        )}
      </span>

      {/* Optional amount */}
      {montant != null && (
        <span className={cn('font-semibold text-[var(--primary)]', tokens.amount)}>
          {formatCurrency(montant)}
        </span>
      )}
    </span>
  );
}
