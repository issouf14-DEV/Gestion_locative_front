import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Shield, FileText, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

import PageHeader from '@/components/common/PageHeader';
import PasswordInput from '@/components/common/PasswordInput';
import { useMe, useUpdateUser } from '@/lib/api/queries/users';
import { usePasswordChange } from '@/lib/api/queries/auth';
import { useMaLocation } from '@/lib/api/queries/rentals';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils/formatters';
import useAuthStore from '@/lib/store/authStore';

// ─── Schémas Zod ────────────────────────────────────────────────────────────

const profilSchema = z.object({
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  telephone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^0[5-7]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/.test(val.replace(/\s/g, '').replace(/^0/, '0')),
      { message: 'Format ivoirien requis : 07 XX XX XX XX' }
    ),
});

const passwordSchema = z
  .object({
    ancien_mot_de_passe: z.string().min(1, 'L\'ancien mot de passe est requis'),
    nouveau_mot_de_passe: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .refine((val) => /[A-Z]/.test(val), { message: 'Doit contenir au moins une majuscule' })
      .refine((val) => /[0-9]/.test(val), { message: 'Doit contenir au moins un chiffre' }),
    confirmer_mot_de_passe: z.string(),
  })
  .refine((d) => d.nouveau_mot_de_passe === d.confirmer_mot_de_passe, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmer_mot_de_passe'],
  });

// ─── Onglet Informations personnelles ───────────────────────────────────────

function TabProfil({ user }) {
  const updateUser = useUpdateUser();
  const { updateUser: updateAuthUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profilSchema),
    defaultValues: {
      prenom: user?.prenom || '',
      nom: user?.nom || '',
      email: user?.email || '',
      telephone: user?.telephone || '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        prenom: user.prenom || '',
        nom: user.nom || '',
        email: user.email || '',
        telephone: user.telephone || '',
      });
    }
  }, [user, reset]);

  const onSubmit = (data) => {
    updateUser.mutate(
      { id: user.id, data },
      {
        onSuccess: (response) => {
          const updatedUser = response?.data?.data || response?.data;
          if (updatedUser) updateAuthUser(updatedUser);
          toast.success('Profil mis à jour avec succès');
          reset(data);
        },
      }
    );
  };

  const initials = getInitials(user?.nom, user?.prenom);

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div
          className="h-20 w-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md flex-shrink-0"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          {initials}
        </div>
        <div>
          <p className="text-lg font-semibold text-navy-800">
            {user?.prenom} {user?.nom}
          </p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <Badge
            variant="outline"
            className="mt-1 text-xs border-navy-300 text-navy-700"
          >
            Locataire
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Formulaire */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="prenom">Prénom *</Label>
            <Input id="prenom" placeholder="Jean" {...register('prenom')} />
            {errors.prenom && (
              <p className="text-xs text-red-500">{errors.prenom.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom *</Label>
            <Input id="nom" placeholder="Kouassi" {...register('nom')} />
            {errors.nom && (
              <p className="text-xs text-red-500">{errors.nom.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="jean.kouassi@email.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="telephone">
            Téléphone{' '}
            <span className="text-muted-foreground text-xs">(optionnel)</span>
          </Label>
          <Input
            id="telephone"
            type="tel"
            placeholder="07 XX XX XX XX"
            {...register('telephone')}
          />
          {errors.telephone && (
            <p className="text-xs text-red-500">{errors.telephone.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Format ivoirien : 07 XX XX XX XX
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={updateUser.isPending || !isDirty}
            className="bg-navy-800 hover:bg-navy-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateUser.isPending
              ? 'Enregistrement...'
              : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Onglet Sécurité ─────────────────────────────────────────────────────────

function TabSecurite() {
  const passwordChange = usePasswordChange();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      ancien_mot_de_passe: '',
      nouveau_mot_de_passe: '',
      confirmer_mot_de_passe: '',
    },
  });

  const watchedNew = watch('nouveau_mot_de_passe', '');

  const onSubmit = (data) => {
    passwordChange.mutate(
      {
        ancien_mot_de_passe: data.ancien_mot_de_passe,
        nouveau_mot_de_passe: data.nouveau_mot_de_passe,
      },
      { onSuccess: () => reset() }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-navy-50 border border-navy-100">
        <Shield className="h-5 w-5 text-navy-800 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-navy-800">Sécurité du compte</p>
          <p className="text-xs text-muted-foreground">
            Utilisez un mot de passe fort et unique pour protéger votre compte.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <PasswordInput
          label="Ancien mot de passe *"
          id="ancien_mot_de_passe"
          placeholder="Votre mot de passe actuel"
          registerProps={register('ancien_mot_de_passe')}
          error={errors.ancien_mot_de_passe}
        />

        <PasswordInput
          label="Nouveau mot de passe *"
          id="nouveau_mot_de_passe"
          placeholder="Ex: Abcd1234!"
          registerProps={register('nouveau_mot_de_passe')}
          error={errors.nouveau_mot_de_passe}
          showRules
          watchValue={watchedNew}
        />

        <PasswordInput
          label="Confirmer le nouveau mot de passe *"
          id="confirmer_mot_de_passe"
          placeholder="Retaper le même mot de passe"
          registerProps={register('confirmer_mot_de_passe')}
          error={errors.confirmer_mot_de_passe}
        />

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={passwordChange.isPending}
            style={{ backgroundColor: 'var(--accent)' }}
            className="hover:opacity-90 text-white"
          >
            {passwordChange.isPending ? 'Modification...' : 'Changer le mot de passe'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Onglet Mon Bail ─────────────────────────────────────────────────────────

function TabBail() {
  const { data, isLoading } = useMaLocation();
  const bail = data?.data || data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }

  if (!bail) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-navy-800 font-medium">Aucun bail actif</p>
        <p className="text-sm text-muted-foreground mt-1">
          Vous n'avez pas de bail enregistré pour le moment.
        </p>
      </div>
    );
  }

  const fields = [
    {
      label: 'Logement',
      value:
        bail.maison?.nom ||
        bail.maison?.adresse ||
        bail.logement ||
        '-',
      icon: '🏠',
    },
    {
      label: 'Date de début',
      value: formatDate(bail.date_debut || bail.date_entree),
      icon: '📅',
    },
    {
      label: 'Date de fin',
      value: formatDate(bail.date_fin || bail.date_sortie),
      icon: '📆',
    },
    {
      label: 'Loyer mensuel',
      value: formatCurrency(bail.loyer_mensuel || bail.loyer),
      icon: '💰',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-steel-100 border border-steel-200">
        <FileText className="h-4 w-4 text-steel-600 flex-shrink-0" />
        <p className="text-xs text-steel-600">
          Ces informations sont en lecture seule. Contactez votre gestionnaire pour toute modification.
        </p>
      </div>

      <div className="grid gap-3">
        {fields.map(({ label, value, icon }) => (
          <div
            key={label}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{icon}</span>
              <span className="text-sm font-medium text-navy-800">{label}</span>
            </div>
            <span className="text-sm text-foreground font-semibold">{value}</span>
          </div>
        ))}
      </div>

      {bail.statut && (
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <span className="text-lg">📋</span>
            <span className="text-sm font-medium text-navy-800">Statut du bail</span>
          </div>
          <Badge
            className={
              bail.statut === 'ACTIF'
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-muted text-muted-foreground'
            }
            variant="outline"
          >
            {bail.statut}
          </Badge>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function TenantProfil() {
  const { data: meData, isLoading } = useMe();
  const user = meData?.data || meData;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Mon Profil"
        description="Gérez vos informations personnelles et la sécurité de votre compte"
      />

      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="profil" className="w-full">
            <TabsList className="w-full rounded-none border-b bg-transparent h-auto p-0">
              <TabsTrigger
                value="profil"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-navy-800 data-[state=active]:bg-transparent data-[state=active]:text-navy-800 py-3 gap-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Informations</span>
                <span className="sm:hidden">Profil</span>
              </TabsTrigger>
              <TabsTrigger
                value="securite"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-navy-800 data-[state=active]:bg-transparent data-[state=active]:text-navy-800 py-3 gap-2"
              >
                <Shield className="h-4 w-4" />
                Sécurité
              </TabsTrigger>
              <TabsTrigger
                value="bail"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-navy-800 data-[state=active]:bg-transparent data-[state=active]:text-navy-800 py-3 gap-2"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Mon Bail</span>
                <span className="sm:hidden">Bail</span>
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="profil" className="mt-0 focus-visible:ring-0">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-5">
                      <Skeleton className="h-20 w-20 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-52" />
                      </div>
                    </div>
                    <Separator />
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <TabProfil user={user} />
                )}
              </TabsContent>

              <TabsContent value="securite" className="mt-0 focus-visible:ring-0">
                <TabSecurite />
              </TabsContent>

              <TabsContent value="bail" className="mt-0 focus-visible:ring-0">
                <TabBail />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
