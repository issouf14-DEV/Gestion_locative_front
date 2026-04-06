import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, CheckCircle, XCircle, Send, Download, Users, UserCheck, UserX, Trash2, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import PasswordInput from '@/components/common/PasswordInput';
import EmptyState from '@/components/common/EmptyState';
import { useUsers, useUser, useCreateUser, useUpdateUserStatus, useDeleteUser, useUpdateUser } from '@/lib/api/queries/users';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useMaisons } from '@/lib/api/queries/properties';
import { useCreateLocation } from '@/lib/api/queries/rentals';
import { useEnvoyerNotifTousLocataires, useEnvoyerNotification } from '@/lib/api/queries/notifications';
import { cleanPhoneForWhatsApp } from '@/lib/utils/whatsapp';
import { toast } from 'sonner';
import { useFactures } from '@/lib/api/queries/billing';
import { useEncaisserFacture } from '@/lib/api/queries/payments';
import { formatCurrency, formatDate, MOIS, getCurrentMoisAnnee } from '@/lib/utils/formatters';

const locataireSchema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  prenoms: z.string().min(2, 'Prénom(s) requis'),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional().or(z.literal('')),
  adresse: z.string().optional().or(z.literal('')),
  password: z.string().min(8, 'Mot de passe min. 8 caractères'),
  password2: z.string().min(1, 'Confirmation requise'),
}).refine(d => d.password === d.password2, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password2'],
});

const notifSchema = z.object({
  titre: z.string().min(2, 'Titre requis'),
  message: z.string().min(5, 'Message requis'),
  type_notification: z.string().default('INFO'),
});

const editLocataireSchema = z.object({
  nom: z.string().min(2, 'Nom requis'),
  prenoms: z.string().min(2, 'Prénom(s) requis'),
  email: z.string().email('Email invalide'),
  telephone: z.string().min(8, 'Téléphone requis'),
});


// ─── Dialogs ────────────────────────────────────────────────────────────────

// Champs maison partagés entre Create et Edit
function MaisonFields({ maisonId, setMaisonId, dateDebut, setDateDebut, dureeMois, setDureeMois, loyer, setLoyer, caution, setCaution, maisons }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Maison disponible</Label>
        <Select value={maisonId} onValueChange={setMaisonId}>
          <SelectTrigger><SelectValue placeholder="Sélectionner une maison..." /></SelectTrigger>
          <SelectContent>
            {maisons.map(m => (
              <SelectItem key={m.id} value={String(m.id)}>{m.titre} — {formatCurrency(m.prix)}/mois</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {maisonId && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Date de début *</Label>
              <Input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Durée (mois)</Label>
              <Input type="number" value={dureeMois} onChange={e => setDureeMois(e.target.value)} min="1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Loyer mensuel (FCFA) *</Label>
              <Input type="number" placeholder="150000" value={loyer} onChange={e => setLoyer(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Caution (FCFA)</Label>
              <Input type="number" placeholder="0" value={caution} onChange={e => setCaution(e.target.value)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function buildLocationPayload({ locataireId, maisonId, dateDebut, dureeMois, loyer, caution }) {
  return {
    locataire: locataireId,        // UUID — ne pas convertir en Number
    maison: Number(maisonId),
    date_debut: dateDebut,
    duree_mois: Number(dureeMois) || 12,
    loyer_mensuel: Number(loyer),
    caution_versee: Number(caution) || 0,  // nom exact du champ backend
    avance_loyer_mois: 0,
    frais_agence: 0,
    charges_mensuelles: 0,
    force_reassignation: true,
  };
}

function CreateLocataireDialog({ open, onOpenChange }) {
  const { mutate: createUser, isPending } = useCreateUser();
  const { data: maisonsData } = useMaisons({ statut: 'DISPONIBLE' });
  const { mutate: createLocation } = useCreateLocation();
  const maisons = Array.isArray(maisonsData)
    ? maisonsData
    : (maisonsData?.data?.results || maisonsData?.results || maisonsData?.data || []);

  const [maisonId, setMaisonId] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dureeMois, setDureeMois] = useState('12');
  const [loyer, setLoyer] = useState('');
  const [caution, setCaution] = useState('');

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(locataireSchema),
  });
  const watchedPassword = watch('password', '');

  const resetForm = () => {
    reset();
    setMaisonId(''); setDateDebut(''); setDureeMois('12'); setLoyer(''); setCaution('');
  };

  const onSubmit = (data) => {
    const { password2, telephone, adresse, ...rest } = data;
    const payload = {
      ...rest,
      role: 'LOCATAIRE',
      ...(telephone ? { telephone } : {}),
      ...(adresse ? { adresse } : {}),
    };
    createUser(payload, {
      onSuccess: (res) => {
        const userId = res.data?.data?.id || res.data?.id;
        if (maisonId && userId && dateDebut && loyer) {
          createLocation(buildLocationPayload({ locataireId: userId, maisonId, dateDebut, dureeMois, loyer, caution }), {
            onSuccess: () => { resetForm(); onOpenChange(false); },
          });
        } else {
          resetForm(); onOpenChange(false);
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Ajouter un locataire</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nom *</Label>
                <Input placeholder="Dupont" {...register('nom')} />
                {errors.nom && <p className="text-xs text-red-500">{errors.nom.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Prénom(s) *</Label>
                <Input placeholder="Jean" {...register('prenoms')} />
                {errors.prenoms && <p className="text-xs text-red-500">{errors.prenoms.message}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" placeholder="jean@exemple.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Téléphone <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input placeholder="+225 07 00 00 00 00" {...register('telephone')} />
            </div>
            <div className="space-y-1">
              <Label>Adresse <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Input placeholder="Quartier, ville..." {...register('adresse')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PasswordInput
                id="loc-password"
                label="Mot de passe temporaire *"
                placeholder="Ex: Abcd1234!"
                registerProps={register('password')}
                error={errors.password}
                showRules
                watchValue={watchedPassword}
              />
              <PasswordInput
                id="loc-password2"
                label="Confirmer *"
                placeholder="Retaper le même"
                registerProps={register('password2')}
                error={errors.password2}
              />
            </div>
            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2">Affecter à une maison <span className="text-muted-foreground text-xs font-normal">(optionnel)</span></p>
              <MaisonFields maisonId={maisonId} setMaisonId={setMaisonId} dateDebut={dateDebut} setDateDebut={setDateDebut} dureeMois={dureeMois} setDureeMois={setDureeMois} loyer={loyer} setLoyer={setLoyer} caution={caution} setCaution={setCaution} maisons={maisons} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Annuler</Button>
            <Button type="submit" variant="navy" loading={isPending}>Créer le locataire</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NotifDialog({ open, onOpenChange, selectedIds, locataires }) {
  const { mutate: sendAll, isPending: isSendingAll } = useEnvoyerNotifTousLocataires();
  const { mutate: sendSingle, isPending: isSendingSingle } = useEnvoyerNotification();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(notifSchema), defaultValues: { type_notification: 'INFO' },
  });
  const [destinataire, setDestinataire] = useState('tous');
  const [canal, setCanal] = useState('IN_APP');
  const [searchDest, setSearchDest] = useState('');

  // Get phone from locataire object (check all possible field names)
  const getPhone = (l) => l.telephone || l.phone || l.tel || l.numero_telephone || l.phone_number || '';

  // WhatsApp fallback: open wa.me directly
  const openWhatsAppDirect = (locatairesList, titre, message) => {
    const text = `*${titre}*\n\n${message}\n\n_Gestion Locative_`;
    let opened = 0;
    let noPhone = 0;
    locatairesList.forEach(l => {
      const phone = getPhone(l);
      if (phone) {
        const cleanPhone = cleanPhoneForWhatsApp(phone);
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
        opened++;
      } else {
        noPhone++;
      }
    });
    if (opened > 0) {
      toast.success(`WhatsApp ouvert pour ${opened} locataire(s)`);
      if (noPhone > 0) toast.warning(`${noPhone} locataire(s) sans numero de telephone`);
    } else {
      toast.error('Aucun numero de telephone disponible pour les locataires selectionnes');
    }
  };

  const getTargetLocataires = () => {
    if (destinataire === 'tous') return locataires || [];
    if (destinataire === 'selection') return (locataires || []).filter(l => (selectedIds || []).includes(l.id));
    return (locataires || []).filter(l => String(l.id) === destinataire);
  };

  // Filtered locataires for search
  const filteredLocataires = useMemo(() => {
    const list = locataires || [];
    if (!searchDest.trim()) return list;
    const q = searchDest.toLowerCase().trim();
    return list.filter(l => {
      const name = `${l.prenoms || ''} ${l.nom || ''}`.toLowerCase();
      const email = (l.email || '').toLowerCase();
      const phone = getPhone(l).toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [locataires, searchDest]);

  // Selected locataire label
  const selectedLabel = useMemo(() => {
    if (destinataire === 'tous') return 'Tous les locataires';
    if (destinataire === 'selection') return `Selection (${(selectedIds || []).length})`;
    const loc = (locataires || []).find(l => String(l.id) === destinataire);
    return loc ? `${loc.prenoms} ${loc.nom}` : 'Choisir...';
  }, [destinataire, locataires, selectedIds]);

  const onSubmit = (data) => {
    // For WhatsApp: try API first, fallback to direct wa.me
    if (canal === 'WHATSAPP') {
      const targets = getTargetLocataires();
      // If sending to specific locataire(s) and we have phone(s), go direct immediately
      if (destinataire !== 'tous') {
        const hasPhones = targets.some(l => getPhone(l));
        if (hasPhones) {
          openWhatsAppDirect(targets, data.titre, data.message);
          reset(); setDestinataire('tous'); setCanal('IN_APP'); setSearchDest(''); onOpenChange(false);
          return;
        }
      }
      // Try API, fallback to direct
      const payload = { ...data, canal: 'WHATSAPP' };
      if (destinataire === 'tous') {
        sendAll(payload, {
          onSuccess: () => { reset(); setDestinataire('tous'); setCanal('IN_APP'); setSearchDest(''); onOpenChange(false); },
          onError: () => { openWhatsAppDirect(targets, data.titre, data.message); onOpenChange(false); },
        });
      } else {
        openWhatsAppDirect(targets, data.titre, data.message);
        reset(); setDestinataire('tous'); setCanal('IN_APP'); setSearchDest(''); onOpenChange(false);
      }
      return;
    }

    // For IN_APP, EMAIL, TOUS: send via API
    const payload = { ...data, canal };
    if (destinataire === 'tous') {
      sendAll(payload, { onSuccess: () => { reset(); setDestinataire('tous'); setCanal('IN_APP'); setSearchDest(''); onOpenChange(false); } });
    } else if (destinataire === 'selection') {
      const ids = selectedIds || [];
      if (ids.length === 0) return;
      ids.forEach((id, idx) => {
        sendSingle({ ...payload, destinataire: id }, {
          onSuccess: () => { if (idx === ids.length - 1) { reset(); setDestinataire('tous'); setCanal('IN_APP'); setSearchDest(''); onOpenChange(false); } },
        });
      });
    } else {
      sendSingle({ ...payload, destinataire: Number(destinataire) }, {
        onSuccess: () => { reset(); setDestinataire('tous'); setCanal('IN_APP'); setSearchDest(''); onOpenChange(false); },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); setDestinataire('tous'); setCanal('IN_APP'); setSearchDest(''); } onOpenChange(v); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Envoyer une notification</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-2">
            {/* Destinataire with search */}
            <div className="space-y-1">
              <Label>Destinataire</Label>
              <div className="border rounded-md">
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Rechercher un locataire..."
                    value={searchDest}
                    onChange={e => setSearchDest(e.target.value)}
                    className="w-full h-9 pl-8 pr-3 text-sm bg-transparent border-b focus:outline-none placeholder:text-muted-foreground"
                  />
                </div>
                {/* Selected indicator */}
                <div className="px-3 py-1.5 bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Selectionne : <strong className="text-foreground">{selectedLabel}</strong></span>
                  {destinataire !== 'tous' && (
                    <button type="button" onClick={() => setDestinataire('tous')} className="text-muted-foreground hover:text-foreground">
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {/* Scrollable list */}
                <div className="max-h-[160px] overflow-y-auto divide-y">
                  <button
                    type="button"
                    onClick={() => setDestinataire('tous')}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2 ${destinataire === 'tous' ? 'bg-navy-50 text-navy-800 font-medium' : ''}`}
                  >
                    <Users className="h-3.5 w-3.5 flex-shrink-0" />
                    Tous les locataires ({(locataires || []).length})
                  </button>
                  {selectedIds && selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDestinataire('selection')}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2 ${destinataire === 'selection' ? 'bg-navy-50 text-navy-800 font-medium' : ''}`}
                    >
                      <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      Selection ({selectedIds.length})
                    </button>
                  )}
                  {filteredLocataires.map(l => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => { setDestinataire(String(l.id)); setSearchDest(''); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${destinataire === String(l.id) ? 'bg-navy-50 text-navy-800 font-medium' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{l.prenoms} {l.nom}</span>
                        {getPhone(l) && <span className="text-xs text-muted-foreground">{getPhone(l)}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{l.email}</div>
                    </button>
                  ))}
                  {filteredLocataires.length === 0 && searchDest && (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">Aucun locataire trouve</div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Canal</Label>
              <Select value={canal} onValueChange={setCanal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_APP">Application</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="TOUS">Tous les canaux</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Titre *</Label>
              <Input placeholder="Objet de la notification" {...register('titre')} />
              {errors.titre && <p className="text-xs text-red-500">{errors.titre.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Message *</Label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Votre message..." {...register('message')} />
              {errors.message && <p className="text-xs text-red-500">{errors.message.message}</p>}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" variant="navy" loading={isSendingAll || isSendingSingle}>Envoyer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


function EditLocataireDialog({ open, onOpenChange, locataire, rental }) {
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: createLocation, isPending: isCreatingLoc } = useCreateLocation();
  const { data: maisonsData } = useMaisons({ statut: 'DISPONIBLE' });
  // Fetch les données fraîches du locataire pour avoir location_active à jour
  const { data: freshUserData } = useUser(open && locataire?.id ? locataire.id : null);
  const freshUser = freshUserData?.data || freshUserData;
  const maisons = Array.isArray(maisonsData)
    ? maisonsData
    : (maisonsData?.data?.results || maisonsData?.results || maisonsData?.data || []);

  const [maisonId, setMaisonId] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dureeMois, setDureeMois] = useState('12');
  const [loyer, setLoyer] = useState('');
  const [caution, setCaution] = useState('');

  const isPending = isUpdating || isCreatingLoc;

  // Utilise les données fraîches si disponibles, sinon fallback sur le prop rental
  const activeRental = freshUser?.location_active || freshUser?.location || rental || null;
  const hasActiveRental = !!activeRental;
  const currentMaisonNom = activeRental?.maison?.titre || activeRental?.maison?.nom || activeRental?.maison_titre || null;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(editLocataireSchema),
    values: locataire ? { nom: locataire.nom || '', prenoms: locataire.prenoms || '', email: locataire.email || '', telephone: locataire.telephone || '' } : undefined,
  });

  const handleClose = () => { reset(); setMaisonId(''); setDateDebut(''); setDureeMois('12'); setLoyer(''); setCaution(''); onOpenChange(false); };

  const onSubmit = (data) => {
    updateUser({ id: locataire.id, data }, {
      onSuccess: () => {
        if (!hasActiveRental && maisonId && dateDebut && loyer) {
          createLocation(
            buildLocationPayload({ locataireId: locataire.id, maisonId, dateDebut, dureeMois, loyer, caution }),
            { onSuccess: handleClose }
          );
        } else {
          handleClose();
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Modifier le locataire</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Nom *</Label><Input placeholder="Dupont" {...register('nom')} />{errors.nom && <p className="text-xs text-red-500">{errors.nom.message}</p>}</div>
              <div className="space-y-1"><Label>Prénom(s) *</Label><Input placeholder="Jean" {...register('prenoms')} />{errors.prenoms && <p className="text-xs text-red-500">{errors.prenoms.message}</p>}</div>
            </div>
            <div className="space-y-1"><Label>Email *</Label><Input type="email" placeholder="jean@exemple.com" {...register('email')} />{errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}</div>
            <div className="space-y-1"><Label>Téléphone *</Label><Input placeholder="+225 07 00 00 00 00" {...register('telephone')} />{errors.telephone && <p className="text-xs text-red-500">{errors.telephone.message}</p>}</div>

            {/* Section maison */}
            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2">Maison occupée</p>
              {hasActiveRental ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800">
                  <span className="font-medium">{currentMaisonNom || 'Location active'}</span>
                  <span className="text-xs text-green-600 ml-auto">Location active</span>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-2">Aucune maison assignée — affecter une maison disponible :</p>
                  <MaisonFields maisonId={maisonId} setMaisonId={setMaisonId} dateDebut={dateDebut} setDateDebut={setDateDebut} dureeMois={dureeMois} setDureeMois={setDureeMois} loyer={loyer} setLoyer={setLoyer} caution={caution} setCaution={setCaution} maisons={maisons} />
                </>
              )}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={handleClose}>Annuler</Button>
            <Button type="submit" variant="navy" loading={isPending}>Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatutValidationDialog({ open, onOpenChange, locataire, mois, annee }) {
  const queryClient = useQueryClient();
  const [loyer, setLoyer] = useState(false);
  const [sodeci, setSodeci] = useState(false);
  const [datePaiementLoyer, setDatePaiementLoyer] = useState('');
  const [datePaiementSodeci, setDatePaiementSodeci] = useState('');
  const [modePaiement, setModePaiement] = useState('ESPECES');
  const [isPending, setIsPending] = useState(false);

  const { mutateAsync: encaisser } = useEncaisserFacture();

  const { data: facturesData } = useFactures(
    { locataire: locataire?.id, mois: Number(mois), annee: Number(annee), page_size: 10 },
    { enabled: open && !!locataire?.id }
  );

  const factures = facturesData?.results || facturesData?.data?.results || facturesData?.data || [];
  const loyerFacture = factures.find(f => f.type_facture === 'LOYER');
  const sodeciFacture = factures.find(f => f.type_facture === 'SODECI');

  const resetState = () => {
    setLoyer(false); setSodeci(false);
    setDatePaiementLoyer(''); setDatePaiementSodeci('');
    setModePaiement('ESPECES');
  };

  const handleConfirm = async () => {
    const today = new Date().toISOString().split('T')[0];
    setIsPending(true);
    try {
      if (loyer && loyerFacture) {
        await encaisser({ facture_id: loyerFacture.id, montant: Number(loyerFacture.montant), date_paiement: datePaiementLoyer || today, mode_paiement: modePaiement });
      }
      if (sodeci && sodeciFacture) {
        await encaisser({ facture_id: sodeciFacture.id, montant: Number(sodeciFacture.montant), date_paiement: datePaiementSodeci || today, mode_paiement: modePaiement });
      }
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Paiement(s) enregistré(s) avec succès');
      resetState();
      onOpenChange(false);
    } catch {
      // erreurs gerees par useEncaisserFacture
    } finally {
      setIsPending(false);
    }
  };

  const moisLabel = MOIS.find(m => m.value === String(mois))?.label || mois;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Validation des paiements</DialogTitle>
          {locataire && <p className="text-sm text-muted-foreground mt-1">{locataire.prenoms} {locataire.nom}</p>}
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-800">Enregistrement des paiements — {moisLabel} {annee}</p>
            <p className="text-xs text-blue-600 mt-1">Le statut du locataire sera mis à jour automatiquement.</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Mode de paiement</Label>
            <Select value={modePaiement} onValueChange={setModePaiement}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ESPECES">Espèces</SelectItem>
                <SelectItem value="VIREMENT">Virement bancaire</SelectItem>
                <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                <SelectItem value="CHEQUE">Chèque</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <div className="space-y-2 p-3 border rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox checked={loyer} onCheckedChange={setLoyer} disabled={loyerFacture?.statut === 'PAYEE'} />
                <span className="text-sm font-medium">
                  Loyer payé {loyerFacture && <span className="text-xs text-muted-foreground">({formatCurrency(loyerFacture.montant)})</span>}
                  {loyerFacture?.statut === 'PAYEE' && <span className="text-xs text-green-600 ml-1">— Déjà payé</span>}
                  {!loyerFacture && <span className="text-xs text-muted-foreground ml-1">— Aucune facture</span>}
                </span>
              </label>
              {loyer && (
                <div className="ml-7 space-y-1">
                  <Label className="text-xs">Date de paiement</Label>
                  <Input type="date" value={datePaiementLoyer} onChange={e => setDatePaiementLoyer(e.target.value)} className="h-8 text-sm" />
                </div>
              )}
            </div>
            <div className="space-y-2 p-3 border rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox checked={sodeci} onCheckedChange={setSodeci} disabled={sodeciFacture?.statut === 'PAYEE'} />
                <span className="text-sm font-medium">
                  SODECI payée {sodeciFacture && <span className="text-xs text-muted-foreground">({formatCurrency(sodeciFacture.montant)})</span>}
                  {sodeciFacture?.statut === 'PAYEE' && <span className="text-xs text-green-600 ml-1">— Déjà payé</span>}
                  {!sodeciFacture && <span className="text-xs text-muted-foreground ml-1">— Aucune facture</span>}
                </span>
              </label>
              {sodeci && (
                <div className="ml-7 space-y-1">
                  <Label className="text-xs">Date de paiement</Label>
                  <Input type="date" value={datePaiementSodeci} onChange={e => setDatePaiementSodeci(e.target.value)} className="h-8 text-sm" />
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button type="button" variant="navy" onClick={handleConfirm} loading={isPending} disabled={isPending || (!loyer && !sodeci)}>
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AdminLocataires() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('tous');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [selected, setSelected] = useState([]);
const [deleteId, setDeleteId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editLocataire, setEditLocataire] = useState(null);
  const [statutValidOpen, setStatutValidOpen] = useState(false);
  const [statutValidLocataire, setStatutValidLocataire] = useState(null);
  const [filterMois, setFilterMois] = useState('');
  const [filterAnnee, setFilterAnnee] = useState('');

  const { mois: currentMois, annee: currentAnnee } = getCurrentMoisAnnee();
  const activeMois = filterMois || String(currentMois);
  const activeAnnee = filterAnnee || String(currentAnnee);

  const { data, isLoading } = useUsers({ role: 'LOCATAIRE', search: search || undefined, page, page_size: 20 });
  const { mutate: updateStatus } = useUpdateUserStatus();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  // Fetch factures for selected month to determine payment status
  const { data: loyersFacturesData } = useFactures({ type_facture: 'LOYER', mois: Number(activeMois), annee: Number(activeAnnee), page_size: 100 });
  const { data: sodeciFacturesData } = useFactures({ type_facture: 'SODECI', mois: Number(activeMois), annee: Number(activeAnnee), page_size: 100 });

  const loyersFactures = loyersFacturesData?.results || loyersFacturesData?.data?.results || loyersFacturesData?.data || [];
  const sodeciFactures = sodeciFacturesData?.results || sodeciFacturesData?.data?.results || sodeciFacturesData?.data || [];

  const locataires = data?.results || data?.data?.results || data?.data || [];
  const total = data?.count || data?.data?.count || 0;
  const totalPages = data?.total_pages || Math.ceil(total / 20);

  // location_active est maintenant inclus directement dans chaque user (réponse liste)
  const getLocationForLocataire = (loc) => loc?.location_active || null;

  // Build payment status map per locataire from REAL facture data
  const paymentStatusMap = useMemo(() => {
    const map = new Map();

    // Check loyer factures
    loyersFactures.forEach(f => {
      const locId = f.locataire || f.locataire_id;
      if (!locId) return;
      const existing = map.get(locId) || { loyerPaye: false, sodeciPaye: false };
      // Check mois/annee match
      const fMois = f.mois ? Number(f.mois) : null;
      const fAnnee = f.annee ? Number(f.annee) : null;
      if (fMois && fAnnee && (fMois !== Number(activeMois) || fAnnee !== Number(activeAnnee))) return;
      if (f.statut === 'PAYEE') existing.loyerPaye = true;
      map.set(locId, existing);
    });

    // Check SODECI factures
    sodeciFactures.forEach(f => {
      const locId = f.locataire || f.locataire_id;
      if (!locId) return;
      const existing = map.get(locId) || { loyerPaye: false, sodeciPaye: false };
      const fMois = f.mois ? Number(f.mois) : null;
      const fAnnee = f.annee ? Number(f.annee) : null;
      if (fMois && fAnnee && (fMois !== Number(activeMois) || fAnnee !== Number(activeAnnee))) return;
      if (f.statut === 'PAYEE') existing.sodeciPaye = true;
      map.set(locId, existing);
    });

    return map;
  }, [loyersFactures, sodeciFactures, activeMois, activeAnnee]);

  // Compute auto-status: à jour = loyer payé + sodeci payé
  // Si aucune facture n'existe pour ce locataire sur la période → EN_RETARD (pas de paiement confirmé)
  const getAutoStatut = (locId) => {
    const ps = paymentStatusMap.get(locId);
    if (!ps) return 'EN_RETARD';
    return (ps.loyerPaye && ps.sodeciPaye) ? 'A_JOUR' : 'EN_RETARD';
  };

  const locatairesWithStatus = locataires.map(loc => ({
    ...loc,
    computedStatut: getAutoStatut(loc.id),
    paymentInfo: paymentStatusMap.get(loc.id) || { loyerPaye: false, sodeciPaye: false },
  }));

  const aJourCount = locatairesWithStatus.filter(l => l.computedStatut === 'A_JOUR').length;
  const enRetardCount = locatairesWithStatus.filter(l => l.computedStatut === 'EN_RETARD').length;

  const filteredLocataires = tab === 'tous' ? locatairesWithStatus
    : tab === 'a_jour' ? locatairesWithStatus.filter(l => l.computedStatut === 'A_JOUR')
    : locatairesWithStatus.filter(l => l.computedStatut === 'EN_RETARD');

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => {
    if (selected.length === filteredLocataires.length) setSelected([]);
    else setSelected(filteredLocataires.map(l => l.id));
  };


  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'A_JOUR': return <Badge variant="success" className="text-xs whitespace-nowrap">À jour</Badge>;
      case 'EN_RETARD': return <Badge variant="destructive" className="text-xs whitespace-nowrap">En retard</Badge>;
      case 'INACTIF': return <Badge variant="secondary" className="text-xs whitespace-nowrap">Inactif</Badge>;
      default: return <Badge variant="outline" className="text-xs whitespace-nowrap">{statut || '-'}</Badge>;
    }
  };

  const moisLabel = MOIS.find(m => m.value === activeMois)?.label || activeMois;

  // PDF/CSV export
  const exportCSV = () => {
    const mLabel = MOIS.find(m => m.value === activeMois)?.label || activeMois;
    const headers = ['Nom', 'Prenom', 'Email', 'Telephone', 'Maison', 'Statut', 'Mois', 'Annee', 'Loyer', 'Date paiement loyer', 'SODECI', 'Date paiement SODECI'];
    const rows = filteredLocataires.map(loc => {
      const maisonName = loc.location_active?.maison?.titre || loc.location_active?.maison?.nom || '-';
      const loyerF = loyersFactures.find(f => (f.locataire || f.locataire_id) === loc.id);
      const sodeciF = sodeciFactures.find(f => (f.locataire || f.locataire_id) === loc.id);
      return [
        loc.nom, loc.prenoms, loc.email, loc.telephone, maisonName,
        loc.computedStatut === 'A_JOUR' ? 'A jour' : 'En retard',
        mLabel, activeAnnee,
        loc.paymentInfo.loyerPaye ? 'Paye' : 'Impaye',
        loyerF?.date_paiement || '-',
        loc.paymentInfo.sodeciPaye ? 'Paye' : 'Impaye',
        sodeciF?.date_paiement || '-',
      ];
    });
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    // BOM UTF-8 pour que Excel lise correctement les accents
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `locataires_${activeMois}_${activeAnnee}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const ANNEES = Array.from({ length: 10 }, (_, i) => String(2026 + i));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Gestion des locataires"
        description={`${total} locataire(s) au total`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" />Rapport CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => setNotifOpen(true)}>
              <Send className="h-4 w-4 mr-1" />Notification
            </Button>
            <Button variant="navy" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />Ajouter
            </Button>
          </div>
        }
      />

      {/* Period filter */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-navy-800">Période :</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Mois</span>
              <Select value={activeMois} onValueChange={(v) => { setFilterMois(v); setPage(1); }}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MOIS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Année</span>
              <Select value={activeAnnee} onValueChange={(v) => { setFilterAnnee(v); setPage(1); }}>
                <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ANNEES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">Statut calculé automatiquement : Loyer payé + SODECI payée = À jour</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats — cliquables */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button onClick={() => { setTab('tous'); setPage(1); }} className="text-left h-full w-full">
          <StatCard title="Total locataires" value={total} icon={Users} color="navy" />
        </button>
        <button onClick={() => { setTab('a_jour'); setPage(1); }} className="text-left h-full w-full">
          <StatCard title={`À jour — ${moisLabel}`} value={aJourCount} icon={UserCheck} color="green" />
        </button>
        <button onClick={() => { setTab('en_retard'); setPage(1); }} className="text-left h-full w-full">
          <StatCard title={`En retard — ${moisLabel}`} value={enRetardCount} icon={UserX} color="maroon" />
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher par nom, email..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
            <TabsList>
              <TabsTrigger value="tous">Tous ({total})</TabsTrigger>
              <TabsTrigger value="a_jour" className="text-green-600">À jour ({aJourCount})</TabsTrigger>
              <TabsTrigger value="en_retard" className="text-red-500">En retard ({enRetardCount})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Grouped actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-2 bg-navy-50 border border-navy-200 rounded-lg px-4 py-2">
          <span className="text-sm text-navy-800 font-medium">{selected.length} sélectionné(s)</span>
          <Button size="sm" variant="navy" onClick={() => setNotifOpen(true)}><Send className="h-3 w-3 mr-1" />Notifier</Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : filteredLocataires.length === 0 ? (
            <EmptyState icon={Users} title="Aucun locataire" description="Ajoutez votre premier locataire." className="py-12" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10"><Checkbox checked={selected.length === filteredLocataires.length && filteredLocataires.length > 0} onCheckedChange={toggleAll} /></TableHead>
                      <TableHead>Locataire</TableHead>
                      <TableHead className="hidden sm:table-cell">Téléphone</TableHead>
                      <TableHead className="hidden md:table-cell">Maison</TableHead>
                      <TableHead>Loyer</TableHead>
                      <TableHead className="hidden sm:table-cell">SODECI</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLocataires.map((loc) => {
                      const maisonName = loc.location_active?.maison?.titre
                        || loc.location_active?.maison?.nom
                        || '—';
                      return (
                        <TableRow key={loc.id}>
                          <TableCell><Checkbox checked={selected.includes(loc.id)} onCheckedChange={() => toggleSelect(loc.id)} /></TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-navy-800 text-sm">{loc.prenoms} {loc.nom}</p>
                              <p className="text-xs text-muted-foreground">{loc.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{loc.telephone}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{maisonName}</TableCell>
                          <TableCell>
                            {loc.paymentInfo.loyerPaye
                              ? <CheckCircle className="h-4 w-4 text-green-500" />
                              : <XCircle className="h-4 w-4 text-red-500" />}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {loc.paymentInfo.sodeciPaye
                              ? <CheckCircle className="h-4 w-4 text-green-500" />
                              : <XCircle className="h-4 w-4 text-red-500" />}
                          </TableCell>
                          <TableCell>
                            {getStatutBadge(loc.computedStatut)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setStatutValidLocataire(loc); setStatutValidOpen(true); }}>
                                <CheckCircle className="h-4 w-4 text-blue-500 mr-1" />Valider
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 px-2" title="Modifier" onClick={() => { setEditLocataire(loc); setEditOpen(true); }}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 px-2 text-red-500 hover:text-red-700" title="Supprimer" onClick={() => setDeleteId(loc.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" asChild className="h-8 px-2">
                                <Link to={`/admin/locataires/${loc.id}`}><Eye className="h-4 w-4 mr-1" />Voir</Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">{total} locataire(s)</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
                    <span className="text-xs flex items-center px-2">{page} / {totalPages}</span>
                    <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <CreateLocataireDialog open={createOpen} onOpenChange={setCreateOpen} />
      <NotifDialog open={notifOpen} onOpenChange={setNotifOpen} selectedIds={selected} locataires={locataires} />
<EditLocataireDialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEditLocataire(null); }} locataire={editLocataire} rental={editLocataire?.location_active || null} />
      <StatutValidationDialog
        open={statutValidOpen}
        onOpenChange={setStatutValidOpen}
        locataire={statutValidLocataire}
        mois={activeMois}
        annee={activeAnnee}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Supprimer le locataire"
        description="Cette action est irréversible. Le locataire sera définitivement supprimé."
        confirmLabel="Supprimer"
        onConfirm={() => deleteUser(deleteId, { onSuccess: () => setDeleteId(null) })}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
