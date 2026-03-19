import { Home, MapPin, Maximize2, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/formatters';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatutBadge({ statut }) {
  if (!statut) return null;

  const configs = {
    disponible: {
      label: 'Disponible',
      className: 'bg-green-100 text-green-700 border-green-200',
    },
    occupee: {
      label: 'Occupée',
      className: 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20',
    },
    maintenance: {
      label: 'Maintenance',
      className: 'bg-orange-100 text-orange-700 border-orange-200',
    },
  };

  const config = configs[statut] ?? {
    label: statut,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

function TypeBadge({ type }) {
  if (!type) return null;
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-[var(--primary)]/8 text-[var(--primary)] border-[var(--primary)]/20 capitalize">
      {type}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MaisonCard({
  maison,
  onClick,
  showActions = false,
  onEdit,
  onDelete,
}) {
  const firstImage = (() => {
    if (maison?.image_principale) return maison.image_principale;
    const img = maison?.images?.[0];
    if (!img) return null;
    const url = typeof img === 'string' ? img : (img?.image || img?.url);
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL || 'https://gestion-locative-fqax.onrender.com';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  })();

  const handleCardClick = () => {
    if (onClick) onClick(maison);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(maison);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(maison);
  };

  return (
    <Card
      className={cn(
        'overflow-hidden transition-shadow duration-200',
        onClick && 'cursor-pointer hover:shadow-lg'
      )}
      onClick={handleCardClick}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Image area                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative h-40 bg-gray-100">
        {firstImage ? (
          <img
            src={firstImage}
            alt={maison?.nom ?? 'Propriété'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* Status badge — top right */}
        <div className="absolute top-2 right-2">
          <StatutBadge statut={maison?.statut} />
        </div>

        {/* Admin action buttons — top left */}
        {showActions && (
          <div className="absolute top-2 left-2 flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-white/80 hover:bg-white text-[var(--primary)] hover:text-[var(--primary)] shadow-sm"
              onClick={handleEdit}
              title="Modifier"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-white/80 hover:bg-white text-destructive hover:text-destructive shadow-sm"
              onClick={handleDelete}
              title="Supprimer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Body                                                                */}
      {/* ------------------------------------------------------------------ */}
      <CardContent className="p-4">
        {/* Nom */}
        <h3 className="font-semibold text-[var(--primary)] text-base leading-tight mb-1 truncate">
          {maison?.nom ?? 'Propriété sans nom'}
        </h3>

        {/* Adresse */}
        {maison?.adresse && (
          <div className="flex items-start gap-1.5 text-sm text-gray-500 mb-3">
            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--secondary)]" />
            <span className="line-clamp-2">{maison.adresse}</span>
          </div>
        )}

        {/* Type + Surface */}
        <div className="flex items-center gap-3 mb-4">
          {maison?.type && <TypeBadge type={maison.type} />}
          {maison?.surface != null && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Maximize2 className="h-3 w-3 text-[var(--secondary)]" />
              <span>{maison.surface} m²</span>
            </div>
          )}
        </div>

        {/* Footer: price + CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="font-bold text-[var(--primary)] text-base">
            {maison?.loyer_mensuel != null
              ? formatCurrency(maison.loyer_mensuel)
              : '—'}
          </span>
          {onClick && (
            <Button
              size="sm"
              className="bg-[var(--primary)] hover:bg-[#16234d] text-white text-xs"
              onClick={handleCardClick}
            >
              Voir détails
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
