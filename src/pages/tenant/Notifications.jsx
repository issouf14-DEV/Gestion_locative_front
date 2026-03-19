import { useState, useMemo } from 'react';
import {
  Bell,
  Home,
  FileText,
  AlertTriangle,
  CheckCircle,
  CheckCheck,
  ChevronDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';

import {
  useNotifications,
  useMarquerLue,
  useMarquerToutesLues,
} from '@/lib/api/queries/notifications';
import { formatRelativeTime } from '@/lib/utils/formatters';
import useNotifStore from '@/lib/store/notifStore';

// ─── Mapping types → icône / couleur ────────────────────────────────────────

const TYPE_CONFIG = {
  loyer: {
    icon: Home,
    colorClass: 'text-navy-800',
    bgClass: 'bg-navy-100',
    label: 'Loyer',
  },
  facture: {
    icon: FileText,
    colorClass: 'text-maroon-600',
    bgClass: 'bg-maroon-50',
    label: 'Facture',
  },
  alerte: {
    icon: AlertTriangle,
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-50',
    label: 'Alerte',
  },
  confirmation: {
    icon: CheckCircle,
    colorClass: 'text-green-600',
    bgClass: 'bg-green-50',
    label: 'Confirmation',
  },
};

const DEFAULT_TYPE_CONFIG = {
  icon: Bell,
  colorClass: 'text-steel-500',
  bgClass: 'bg-steel-100',
  label: 'Système',
};

function getTypeConfig(type) {
  if (!type) return DEFAULT_TYPE_CONFIG;
  const key = type.toLowerCase();
  return TYPE_CONFIG[key] || DEFAULT_TYPE_CONFIG;
}

// ─── Onglets de filtre ───────────────────────────────────────────────────────

const FILTER_TABS = [
  { value: 'toutes', label: 'Toutes' },
  { value: 'non_lues', label: 'Non lues' },
  { value: 'loyer', label: 'Loyer' },
  { value: 'facture', label: 'Factures' },
  { value: 'systeme', label: 'Système' },
];

// ─── Carte de notification individuelle ─────────────────────────────────────

const PAGE_SIZE = 15;

function NotificationItem({ notif, onMarkRead }) {
  const config = getTypeConfig(notif.type || notif.type_notification);
  const Icon = config.icon;
  const isUnread = !notif.lu;

  const handleClick = () => {
    if (isUnread) {
      onMarkRead(notif.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className={`
        group flex items-start gap-4 p-4 transition-colors cursor-pointer
        hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-800
        ${isUnread ? 'bg-navy-50/60' : 'bg-transparent'}
      `}
      aria-label={`Notification : ${notif.titre}`}
    >
      {/* Icône */}
      <div
        className={`flex-shrink-0 mt-0.5 h-9 w-9 rounded-full flex items-center justify-center ${config.bgClass}`}
      >
        <Icon className={`h-4 w-4 ${config.colorClass}`} />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm leading-snug ${
              isUnread
                ? 'font-semibold text-navy-800'
                : 'font-medium text-foreground'
            }`}
          >
            {notif.titre}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isUnread && (
              <Badge
                className="text-[10px] px-1.5 py-0 h-4 bg-maroon-500 text-white border-0 leading-none"
              >
                Nouveau
              </Badge>
            )}
            {isUnread && (
              <span className="h-2 w-2 rounded-full bg-maroon-500 mt-1 flex-shrink-0" />
            )}
          </div>
        </div>

        {notif.message && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
            {notif.message}
          </p>
        )}

        <p className="text-xs text-muted-foreground/70 mt-1.5">
          {formatRelativeTime(notif.created_at || notif.date_envoi || notif.date)}
        </p>
      </div>
    </div>
  );
}

// ─── Squelettes de chargement ────────────────────────────────────────────────

function NotificationSkeletons() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-4">
          <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function TenantNotifications() {
  const [activeTab, setActiveTab] = useState('toutes');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data, isLoading } = useNotifications();
  const { mutate: marquerLue, isPending: isMarkingOne } = useMarquerLue();
  const { mutate: marquerToutesSLues, isPending: isMarkingAll } = useMarquerToutesLues();
  const { notifications: storeNotifs, unreadCount } = useNotifStore();

  // Préférer les notifications du store (mises à jour en temps réel par le query)
  const allNotifs = useMemo(() => {
    const fromQuery = data?.data?.results || data?.data || data?.results || [];
    // Si le store est synced (non vide), on l'utilise, sinon on prend les données de la query
    return storeNotifs.length > 0 ? storeNotifs : fromQuery;
  }, [data, storeNotifs]);

  const unread = unreadCount ?? allNotifs.filter((n) => !n.lu).length;

  // Filtrage selon l'onglet actif
  const filteredNotifs = useMemo(() => {
    switch (activeTab) {
      case 'non_lues':
        return allNotifs.filter((n) => !n.lu);
      case 'loyer':
        return allNotifs.filter(
          (n) => (n.type || n.type_notification || '').toLowerCase() === 'loyer'
        );
      case 'facture':
        return allNotifs.filter(
          (n) => (n.type || n.type_notification || '').toLowerCase() === 'facture'
        );
      case 'systeme':
        return allNotifs.filter((n) => {
          const t = (n.type || n.type_notification || '').toLowerCase();
          return !['loyer', 'facture', 'alerte', 'confirmation'].includes(t);
        });
      default:
        return allNotifs;
    }
  }, [allNotifs, activeTab]);

  const visibleNotifs = filteredNotifs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredNotifs.length;

  const handleMarkRead = (id) => {
    marquerLue(id);
  };

  const handleMarkAllRead = () => {
    if (unread > 0) {
      marquerToutesSLues();
    }
  };

  const handleLoadMore = () => {
    setVisibleCount((c) => c + PAGE_SIZE);
  };

  // Réinitialiser le compteur de pagination quand on change d'onglet
  const handleTabChange = (value) => {
    setActiveTab(value);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Mes Notifications"
        description={
          unread > 0
            ? `${unread} notification${unread > 1 ? 's' : ''} non lue${unread > 1 ? 's' : ''}`
            : 'Toutes vos notifications sont lues'
        }
        actions={
          unread > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="border-navy-200 text-navy-700 hover:bg-navy-50"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              {isMarkingAll ? 'En cours...' : 'Tout marquer comme lu'}
            </Button>
          ) : null
        }
      />

      <Card className="overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {/* Barre d'onglets */}
          <div className="border-b bg-muted/30 overflow-x-auto">
            <TabsList className="h-auto bg-transparent p-0 w-max min-w-full rounded-none">
              {FILTER_TABS.map((tab) => {
                const count =
                  tab.value === 'toutes'
                    ? allNotifs.length
                    : tab.value === 'non_lues'
                    ? allNotifs.filter((n) => !n.lu).length
                    : tab.value === 'systeme'
                    ? allNotifs.filter((n) => {
                        const t = (n.type || n.type_notification || '').toLowerCase();
                        return !['loyer', 'facture', 'alerte', 'confirmation'].includes(t);
                      }).length
                    : allNotifs.filter(
                        (n) =>
                          (n.type || n.type_notification || '').toLowerCase() ===
                          tab.value
                      ).length;

                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="
                      relative rounded-none border-b-2 border-transparent px-4 py-3
                      data-[state=active]:border-navy-800 data-[state=active]:bg-transparent
                      data-[state=active]:text-navy-800 data-[state=active]:shadow-none
                      text-sm font-medium text-muted-foreground gap-2 whitespace-nowrap
                    "
                  >
                    {tab.label}
                    {count > 0 && (
                      <span
                        className={`
                          inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full text-[10px] font-semibold
                          ${
                            tab.value === 'non_lues' && count > 0
                              ? 'bg-maroon-500 text-white'
                              : 'bg-muted text-muted-foreground'
                          }
                        `}
                      >
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Contenu commun pour tous les onglets */}
          {FILTER_TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0 focus-visible:ring-0">
              <CardContent className="p-0">
                {isLoading ? (
                  <NotificationSkeletons />
                ) : visibleNotifs.length === 0 ? (
                  <EmptyState
                    icon={Bell}
                    title={
                      activeTab === 'non_lues'
                        ? 'Aucune notification non lue'
                        : 'Aucune notification'
                    }
                    description={
                      activeTab === 'non_lues'
                        ? 'Vous avez lu toutes vos notifications.'
                        : 'Vous n\'avez aucune notification dans cette catégorie.'
                    }
                    className="py-16"
                  />
                ) : (
                  <div className="divide-y divide-border">
                    {visibleNotifs.map((notif) => (
                      <NotificationItem
                        key={notif.id}
                        notif={notif}
                        onMarkRead={handleMarkRead}
                      />
                    ))}
                  </div>
                )}

                {/* Bouton "Voir plus" */}
                {hasMore && !isLoading && (
                  <>
                    <Separator />
                    <div className="p-4 flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLoadMore}
                        className="text-navy-700 hover:bg-navy-50 gap-1.5"
                      >
                        <ChevronDown className="h-4 w-4" />
                        Voir plus ({filteredNotifs.length - visibleCount} restantes)
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
}
