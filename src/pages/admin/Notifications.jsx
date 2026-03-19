import { useState, useMemo, useCallback } from 'react';
import {
  Bell, Send, Trash2, CheckCheck, Info, AlertTriangle, CheckCircle,
  XCircle, Search, Users, Eye, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import {
  useNotifications, useMarquerToutesLues, useMarquerLue,
  useEnvoyerNotifTousLocataires, useEnvoyerNotification,
  useSupprimerNotifLues, useSupprimerNotification,
} from '@/lib/api/queries/notifications';
import { useLocataires } from '@/lib/api/queries/users';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { cleanPhoneForWhatsApp } from '@/lib/utils/whatsapp';
import { toast } from 'sonner';

const notifSchema = z.object({
  titre: z.string().min(2, 'Titre requis'),
  message: z.string().min(5, 'Message requis'),
  type_notification: z.string().default('INFO'),
});

const TYPE_ICONS = {
  INFO: Info,
  ALERTE: AlertTriangle,
  SUCCES: CheckCircle,
  ERREUR: XCircle,
};
const TYPE_COLORS = {
  INFO: 'text-blue-600',
  ALERTE: 'text-amber-600',
  SUCCES: 'text-emerald-600',
  ERREUR: 'text-red-600',
};
const TYPE_BG = {
  INFO: 'bg-blue-50 border-blue-200',
  ALERTE: 'bg-amber-50 border-amber-200',
  SUCCES: 'bg-emerald-50 border-emerald-200',
  ERREUR: 'bg-red-50 border-red-200',
};

// ─── Formulaire d'envoi ──────────────────────────────────────────────────────

function SendNotifForm() {
  const { mutate: sendAll, isPending: isSendingAll } = useEnvoyerNotifTousLocataires();
  const { mutate: sendOne, isPending: isSendingOne } = useEnvoyerNotification();
  const { data: locatairesData } = useLocataires();
  const locatairesRaw = locatairesData?.data?.results || locatairesData?.results || locatairesData?.data;
  const locataires = useMemo(() => locatairesRaw || [], [locatairesRaw]);
  const [destinataireType, setDestinatataireType] = useState('tous');
  const [selectedLocataire, setSelectedLocataire] = useState('');
  const [canal, setCanal] = useState('IN_APP');
  const [searchDest, setSearchDest] = useState('');
  const [showRecipients, setShowRecipients] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(notifSchema),
    defaultValues: { type_notification: 'INFO' },
  });

  const isSending = isSendingAll || isSendingOne;

  const getPhone = (l) => l.telephone || l.phone || l.tel || l.numero_telephone || '';

  const openWhatsAppDirect = (targets, titre, message) => {
    const text = `*${titre}*\n\n${message}\n\n_Gestion Locative_`;
    let opened = 0;
    targets.forEach(l => {
      const phone = getPhone(l);
      if (phone) {
        const cleanPhone = cleanPhoneForWhatsApp(phone);
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
        opened++;
      }
    });
    if (opened > 0) toast.success(`WhatsApp ouvert pour ${opened} locataire(s)`);
    else toast.error('Aucun numero de telephone disponible');
  };

  const getTargetLocataires = () => {
    if (destinataireType === 'tous') return locataires;
    return locataires.filter(l => String(l.id) === String(selectedLocataire));
  };

  const filteredLocataires = useMemo(() => {
    if (!searchDest.trim()) return locataires;
    const q = searchDest.toLowerCase().trim();
    return locataires.filter(l => {
      const name = `${l.prenoms || ''} ${l.nom || ''}`.toLowerCase();
      const email = (l.email || '').toLowerCase();
      const phone = getPhone(l).toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [locataires, searchDest]);

  const selectedLabel = useMemo(() => {
    if (destinataireType === 'tous') return `Tous les locataires (${locataires.length})`;
    const loc = locataires.find(l => String(l.id) === String(selectedLocataire));
    return loc ? `${loc.prenoms} ${loc.nom}` : 'Choisir un destinataire';
  }, [destinataireType, selectedLocataire, locataires]);

  const resetForm = () => {
    reset();
    setSelectedLocataire('');
    setSearchDest('');
    setShowRecipients(false);
  };

  const onSubmit = (data) => {
    const payload = { ...data, canal };

    if (canal === 'WHATSAPP') {
      const targets = getTargetLocataires();
      if (destinataireType === 'tous') {
        sendAll(payload, {
          onSuccess: resetForm,
          onError: () => { openWhatsAppDirect(targets, data.titre, data.message); },
        });
      } else {
        openWhatsAppDirect(targets, data.titre, data.message);
        resetForm();
      }
      return;
    }

    if (destinataireType === 'tous') {
      sendAll(payload, { onSuccess: resetForm });
    } else {
      if (!selectedLocataire) return;
      sendOne(
        { ...payload, destinataire: selectedLocataire },
        { onSuccess: resetForm }
      );
    }
  };

  const buttonLabel = isSending
    ? 'Envoi en cours...'
    : destinataireType === 'tous'
      ? 'Envoyer a tous'
      : selectedLocataire
        ? `Envoyer a ${locataires.find(l => String(l.id) === String(selectedLocataire))?.prenoms || 'ce locataire'}`
        : 'Choisir un destinataire';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Row 1: Type + Canal */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-navy-700 uppercase tracking-wide">Type</Label>
          <Select defaultValue="INFO" onValueChange={(v) => setValue('type_notification', v)}>
            <SelectTrigger className="h-9 border-gray-300 focus:border-navy-500 focus:ring-navy-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INFO">Information</SelectItem>
              <SelectItem value="ALERTE">Alerte</SelectItem>
              <SelectItem value="SUCCES">Succes</SelectItem>
              <SelectItem value="ERREUR">Erreur</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-navy-700 uppercase tracking-wide">Canal</Label>
          <Select value={canal} onValueChange={setCanal}>
            <SelectTrigger className="h-9 border-gray-300 focus:border-navy-500 focus:ring-navy-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IN_APP">In-App</SelectItem>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
              <SelectItem value="TOUS">Tous les canaux</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Destinataires - collapsible */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-navy-700 uppercase tracking-wide">Destinataire</Label>
        <button
          type="button"
          onClick={() => setShowRecipients(!showRecipients)}
          className="w-full flex items-center justify-between px-3 py-2 h-9 rounded-md border border-gray-300 bg-white text-sm hover:border-navy-400 transition-colors"
        >
          <span className="text-navy-800 font-medium truncate">{selectedLabel}</span>
          {showRecipients ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
        </button>
        {showRecipients && (
          <div className="border border-gray-300 rounded-md shadow-sm bg-white overflow-hidden">
            <div className="relative border-b border-gray-200">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou telephone..."
                value={searchDest}
                onChange={e => setSearchDest(e.target.value)}
                className="w-full h-10 pl-9 pr-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-navy-400 placeholder:text-gray-400"
              />
            </div>
            <div className="max-h-[180px] overflow-y-auto">
              <button
                type="button"
                onClick={() => { setDestinatataireType('tous'); setSelectedLocataire(''); setShowRecipients(false); }}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-navy-50 transition-colors flex items-center gap-2 border-b border-gray-100 ${destinataireType === 'tous' ? 'bg-navy-100 text-navy-900 font-semibold' : 'text-gray-700'}`}
              >
                <Users className="h-4 w-4 text-navy-600 flex-shrink-0" />
                Tous les locataires ({locataires.length})
              </button>
              {filteredLocataires.map(l => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => { setDestinatataireType('individuel'); setSelectedLocataire(String(l.id)); setSearchDest(''); setShowRecipients(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-navy-50 transition-colors border-b border-gray-50 ${String(l.id) === selectedLocataire ? 'bg-navy-100 text-navy-900 font-semibold' : 'text-gray-700'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{l.prenoms} {l.nom}</span>
                    {getPhone(l) && <span className="text-xs text-gray-500 font-mono">{getPhone(l)}</span>}
                  </div>
                  {l.email && <div className="text-xs text-gray-400 mt-0.5">{l.email}</div>}
                </button>
              ))}
              {filteredLocataires.length === 0 && searchDest && (
                <div className="px-3 py-4 text-center text-sm text-gray-400">Aucun locataire trouve</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Titre */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-navy-700 uppercase tracking-wide">Titre *</Label>
        <Input
          placeholder="Objet de la notification"
          className="border-gray-300 focus:border-navy-500 focus:ring-navy-500"
          {...register('titre')}
        />
        {errors.titre && <p className="text-xs text-red-500 font-medium">{errors.titre.message}</p>}
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-navy-700 uppercase tracking-wide">Message *</Label>
        <Textarea
          placeholder="Contenu de votre notification..."
          rows={3}
          className="border-gray-300 focus:border-navy-500 focus:ring-navy-500 resize-none"
          {...register('message')}
        />
        {errors.message && <p className="text-xs text-red-500 font-medium">{errors.message.message}</p>}
      </div>

      <Button
        type="submit"
        className="w-full bg-navy-800 hover:bg-navy-700 text-white font-semibold h-10"
        disabled={isSending || (destinataireType !== 'tous' && !selectedLocataire)}
      >
        <Send className="h-4 w-4 mr-2" />
        {buttonLabel}
      </Button>
    </form>
  );
}

// ─── Notification Item ──────────────────────────────────────────────────────

function NotificationItem({ notif, onMarkRead, onDelete, isRead }) {
  const Icon = TYPE_ICONS[notif.type_notification] || Info;
  const color = TYPE_COLORS[notif.type_notification] || 'text-blue-600';
  const bg = TYPE_BG[notif.type_notification] || 'bg-blue-50 border-blue-200';
  const unread = !isRead;

  return (
    <div className={`flex gap-3 p-4 border-b last:border-b-0 transition-colors ${unread ? 'bg-navy-50/60' : 'hover:bg-gray-50'}`}>
      <div className={`mt-0.5 flex-shrink-0 p-1.5 rounded-full ${bg} border`}>
        <Icon className={`h-3.5 w-3.5 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm text-navy-900 ${unread ? 'font-bold' : 'font-medium'}`}>
            {notif.titre}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            {unread && (
              <button
                onClick={() => onMarkRead(notif.id)}
                className="p-1 rounded hover:bg-navy-100 text-navy-400 hover:text-navy-700 transition-colors"
                title="Marquer comme lu"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => onDelete(notif.id)}
              className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <p className="text-[11px] text-gray-400">{formatRelativeTime(notif.created_at || notif.date)}</p>
          {unread && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-maroon-600 bg-maroon-50 px-1.5 py-0.5 rounded-full">
              Nouveau
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ────────────────────────────────────────────────────────

export default function AdminNotifications() {
  const { data, isLoading } = useNotifications();
  const { mutate: marquerToutesLues } = useMarquerToutesLues();
  const { mutate: marquerLue } = useMarquerLue();
  const { mutate: supprimerLues, isPending: isSupprimant } = useSupprimerNotifLues();
  const { mutate: supprimerNotif } = useSupprimerNotification();
  const [filter, setFilter] = useState('toutes');

  // Local state for optimistic updates
  const [localReadIds, setLocalReadIds] = useState(new Set());
  const [localDeletedIds, setLocalDeletedIds] = useState(new Set());

  const rawNotifications = useMemo(() => {
    const raw = data?.data?.results || data?.results || data?.data;
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  // Apply local optimistic updates
  const notifications = useMemo(() => {
    return rawNotifications.filter(n => !localDeletedIds.has(n.id));
  }, [rawNotifications, localDeletedIds]);

  const isNotifRead = useCallback((notif) => {
    return notif.lu || localReadIds.has(notif.id);
  }, [localReadIds]);

  const unread = useMemo(() => notifications.filter(n => !isNotifRead(n)).length, [notifications, isNotifRead]);
  const readCount = useMemo(() => notifications.filter(n => isNotifRead(n)).length, [notifications, isNotifRead]);

  const filtered = useMemo(() => {
    if (filter === 'non_lues') return notifications.filter(n => !isNotifRead(n));
    if (filter === 'lues') return notifications.filter(n => isNotifRead(n));
    return notifications;
  }, [notifications, filter, isNotifRead]);

  const handleMarkRead = useCallback((id) => {
    setLocalReadIds(prev => new Set([...prev, id]));
    marquerLue(id);
  }, [marquerLue]);

  const handleMarkAllRead = useCallback(() => {
    const allIds = notifications.map(n => n.id);
    setLocalReadIds(prev => new Set([...prev, ...allIds]));
    marquerToutesLues();
  }, [notifications, marquerToutesLues]);

  const handleDelete = useCallback((id) => {
    setLocalDeletedIds(prev => new Set([...prev, id]));
    supprimerNotif(id);
  }, [supprimerNotif]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={unread > 0 ? `${unread} notification(s) non lue(s)` : 'Toutes les notifications sont lues'}
        actions={
          <div className="flex gap-2 flex-wrap">
            {readCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => supprimerLues()}
                disabled={isSupprimant}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                {isSupprimant ? 'Suppression...' : 'Supprimer lues'}
              </Button>
            )}
            {unread > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                className="border-navy-200 text-navy-700 hover:bg-navy-50"
              >
                <CheckCheck className="h-4 w-4 mr-1.5" />
                Tout marquer lu
              </Button>
            )}
          </div>
        }
      />

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Send form - compact left panel */}
        <div className="lg:col-span-2">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-navy-100">
                  <Send className="h-4 w-4 text-navy-700" />
                </div>
                <h3 className="font-bold text-navy-900 text-sm">Nouvelle notification</h3>
              </div>
              <SendNotifForm />
            </CardContent>
          </Card>
        </div>

        {/* Notifications list - wider right panel */}
        <div className="lg:col-span-3">
          <Card className="border-gray-200 shadow-sm">
            <div className="px-5 pt-4 pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-maroon-100">
                    <Bell className="h-4 w-4 text-maroon-700" />
                  </div>
                  <h3 className="font-bold text-navy-900 text-sm">Mes notifications</h3>
                  {unread > 0 && (
                    <Badge className="bg-maroon-600 text-white text-[10px] px-1.5 py-0 h-5">
                      {unread}
                    </Badge>
                  )}
                </div>
              </div>
              {/* Filter tabs */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                {[
                  { key: 'toutes', label: 'Toutes', count: notifications.length },
                  { key: 'non_lues', label: 'Non lues', count: unread },
                  { key: 'lues', label: 'Lues', count: readCount },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`flex-1 text-xs font-semibold py-1.5 px-2 rounded-md transition-all ${
                      filter === tab.key
                        ? 'bg-white text-navy-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title={filter === 'non_lues' ? 'Aucune notification non lue' : filter === 'lues' ? 'Aucune notification lue' : 'Aucune notification'}
                  className="py-12"
                />
              ) : (
                <div className="max-h-[550px] overflow-y-auto">
                  {filtered.map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notif={notif}
                      isRead={isNotifRead(notif)}
                      onMarkRead={handleMarkRead}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
