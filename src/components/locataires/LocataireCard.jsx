import { Home, MessageCircle, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils/formatters';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUT_CONFIG = {
  a_jour: {
    label: 'À jour',
    badgeClass: 'bg-green-100 text-green-700 border-green-200',
    borderColor: 'border-l-green-500',
  },
  en_retard: {
    label: 'En retard',
    badgeClass: 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20',
    borderColor: 'border-l-[var(--accent)]',
  },
  sans_location: {
    label: 'Sans location',
    badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
    borderColor: 'border-l-gray-300',
  },
};

function getStatutConfig(statut) {
  return (
    STATUT_CONFIG[statut] ?? {
      label: statut ?? '—',
      badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
      borderColor: 'border-l-gray-300',
    }
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Avatar({ nom, prenom }) {
  const initials = getInitials(nom, prenom);
  return (
    <div className="flex-shrink-0 h-11 w-11 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-semibold text-sm select-none">
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LocataireCard({
  locataire,
  location,
  onView,
  onNotify,
}) {
  const config = getStatutConfig(locataire?.statut_paiement);
  const nomComplet = [locataire?.prenom, locataire?.nom].filter(Boolean).join(' ') || '—';

  const handleView = () => {
    if (onView) onView(locataire);
  };

  const handleNotify = () => {
    if (onNotify) onNotify(locataire);
  };

  return (
    <Card
      className={cn(
        'overflow-hidden border-l-4',
        config.borderColor
      )}
    >
      <CardContent className="p-4">
        {/* ---------------------------------------------------------------- */}
        {/* Header row: avatar + identity + status badge                     */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex items-start gap-3">
          <Avatar nom={locataire?.nom} prenom={locataire?.prenom} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              {/* Name */}
              <h3 className="font-bold text-[var(--primary)] text-sm leading-tight truncate">
                {nomComplet}
              </h3>

              {/* Status badge */}
              <span
                className={cn(
                  'flex-shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
                  config.badgeClass
                )}
              >
                {config.label}
              </span>
            </div>

            {/* Email */}
            {locataire?.email && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {locataire.email}
              </p>
            )}

            {/* Telephone */}
            {locataire?.telephone && (
              <p className="text-xs text-gray-500 mt-0.5">
                {locataire.telephone}
              </p>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Location info                                                     */}
        {/* ---------------------------------------------------------------- */}
        {location && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
            {location.maison?.nom && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Home className="h-3.5 w-3.5 text-[var(--secondary)] shrink-0" />
                <span className="font-medium text-[var(--primary)] truncate">
                  {location.maison.nom}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500">
              {location.date_fin && (
                <span>
                  Fin bail :{' '}
                  <span className="font-medium text-gray-700">
                    {formatDate(location.date_fin)}
                  </span>
                </span>
              )}
              {location.loyer_mensuel != null && (
                <span className="font-semibold text-[var(--primary)]">
                  {formatCurrency(location.loyer_mensuel)}
                  <span className="font-normal text-gray-400">/mois</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Action buttons                                                    */}
        {/* ---------------------------------------------------------------- */}
        <div className="mt-4 flex items-center gap-2">
          <Button
            size="sm"
            className="flex-1 bg-[var(--primary)] hover:bg-[#16234d] text-white text-xs"
            onClick={handleView}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Voir détail
          </Button>

          {onNotify && (
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
              onClick={handleNotify}
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
              WhatsApp
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
