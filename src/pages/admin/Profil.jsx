import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Shield, Save, Mail } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

import PageHeader from '@/components/common/PageHeader';
import PasswordInput from '@/components/common/PasswordInput';
import { useMe, useUpdateUser } from '@/lib/api/queries/users';
import { usePasswordChange } from '@/lib/api/queries/auth';
import { getInitials } from '@/lib/utils/formatters';
import useAuthStore from '@/lib/store/authStore';

// ─── Schemas ────────────────────────────────────────────────────────────────

const profilSchema = z.object({
  prenoms: z.string().min(2, 'Le prenom doit contenir au moins 2 caracteres'),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caracteres'),
  email: z.string().email('Adresse email invalide'),
  telephone: z.string().optional(),
});

const passwordSchema = z
  .object({
    ancien_mot_de_passe: z.string().min(1, "L'ancien mot de passe est requis"),
    nouveau_mot_de_passe: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caracteres')
      .refine((val) => /[A-Z]/.test(val), { message: 'Doit contenir au moins une majuscule' })
      .refine((val) => /[0-9]/.test(val), { message: 'Doit contenir au moins un chiffre' }),
    confirmer_mot_de_passe: z.string(),
  })
  .refine((d) => d.nouveau_mot_de_passe === d.confirmer_mot_de_passe, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmer_mot_de_passe'],
  });

// ─── Tab Profil ─────────────────────────────────────────────────────────────

function TabProfil({ user }) {
  const updateUser = useUpdateUser();
  const { updateUser: updateAuthUser } = useAuthStore();

  const prenomField = user?.prenoms || user?.prenom || '';
  const nomField = user?.nom || '';

  const {
    register, handleSubmit, reset, formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profilSchema),
    defaultValues: {
      prenoms: prenomField,
      nom: nomField,
      email: user?.email || '',
      telephone: user?.telephone || '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        prenoms: user.prenoms || user.prenom || '',
        nom: user.nom || '',
        email: user.email || '',
        telephone: user.telephone || '',
      });
    }
  }, [user, reset]);

  const onSubmit = (formData) => {
    if (!user?.id) {
      toast.error('Impossible de mettre a jour: utilisateur non charge');
      return;
    }
    updateUser.mutate(
      { id: user.id, data: formData },
      {
        onSuccess: (response) => {
          const updatedUser = response?.data?.data || response?.data;
          if (updatedUser) updateAuthUser(updatedUser);
          toast.success('Profil mis a jour avec succes');
          reset(formData);
        },
        onError: () => {
          toast.error('Erreur lors de la mise a jour du profil');
        },
      }
    );
  };

  const initials = getInitials(nomField, prenomField);

  return (
    <div className="space-y-6">
      {/* Avatar header */}
      <div className="flex items-center gap-5 p-5 rounded-xl bg-navy-800 text-white">
        <div className="h-16 w-16 rounded-full bg-navy-600 flex items-center justify-center text-xl font-bold flex-shrink-0 border-2 border-navy-500">
          {initials}
        </div>
        <div>
          <p className="text-lg font-bold">{prenomField} {nomField}</p>
          <div className="flex items-center gap-2 mt-1">
            <Mail className="h-3.5 w-3.5 opacity-70" />
            <span className="text-sm opacity-80">{user?.email || ''}</span>
          </div>
          <Badge className="mt-1.5 bg-maroon-500 hover:bg-maroon-500 text-white text-[10px] border-0">
            Administrateur
          </Badge>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="prenoms" className="text-sm font-semibold text-navy-800">Prenom *</Label>
            <Input id="prenoms" placeholder="Votre prenom" className="border-gray-300" {...register('prenoms')} />
            {errors.prenoms && <p className="text-xs text-red-500">{errors.prenoms.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nom" className="text-sm font-semibold text-navy-800">Nom *</Label>
            <Input id="nom" placeholder="Votre nom" className="border-gray-300" {...register('nom')} />
            {errors.nom && <p className="text-xs text-red-500">{errors.nom.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-semibold text-navy-800">Email *</Label>
          <Input id="email" type="email" placeholder="votre@email.com" className="border-gray-300" {...register('email')} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="telephone" className="text-sm font-semibold text-navy-800">
            Telephone <span className="text-gray-400 text-xs font-normal">(optionnel)</span>
          </Label>
          <Input id="telephone" type="tel" placeholder="07 XX XX XX XX" className="border-gray-300" {...register('telephone')} />
          {errors.telephone && <p className="text-xs text-red-500">{errors.telephone.message}</p>}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={updateUser.isPending || !isDirty}
            className="bg-navy-800 hover:bg-navy-700 text-white font-semibold"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateUser.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Tab Securite ───────────────────────────────────────────────────────────

function TabSecurite() {
  const passwordChange = usePasswordChange();

  const {
    register, handleSubmit, reset, watch, formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      ancien_mot_de_passe: '',
      nouveau_mot_de_passe: '',
      confirmer_mot_de_passe: '',
    },
  });

  const watchedNew = watch('nouveau_mot_de_passe', '');

  const onSubmit = (formData) => {
    passwordChange.mutate(
      {
        ancien_mot_de_passe: formData.ancien_mot_de_passe,
        nouveau_mot_de_passe: formData.nouveau_mot_de_passe,
      },
      {
        onSuccess: () => {
          reset();
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-navy-50 border border-navy-200">
        <Shield className="h-5 w-5 text-navy-700 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-navy-800">Securite du compte</p>
          <p className="text-xs text-gray-500">
            Utilisez un mot de passe fort et unique pour proteger votre compte.
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
            className="bg-maroon-600 hover:bg-maroon-700 text-white font-semibold"
          >
            <Lock className="h-4 w-4 mr-2" />
            {passwordChange.isPending ? 'Modification...' : 'Changer le mot de passe'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Page principale ────────────────────────────────────────────────────────

export default function AdminProfil() {
  const { data: meData, isLoading, error } = useMe();
  const user = meData?.data || meData;

  if (error) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <PageHeader title="Mon Profil" description="Gerez vos informations personnelles" />
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-navy-800 font-medium">Impossible de charger le profil</p>
            <p className="text-sm text-gray-500 mt-1">Veuillez rafraichir la page ou vous reconnecter.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Mon Profil"
        description="Gerez vos informations personnelles et la securite de votre compte"
      />

      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-0">
          <Tabs defaultValue="profil" className="w-full">
            <TabsList className="w-full rounded-none border-b border-gray-200 bg-transparent h-auto p-0">
              <TabsTrigger
                value="profil"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-navy-800 data-[state=active]:bg-transparent data-[state=active]:text-navy-800 py-3.5 gap-2 font-semibold"
              >
                <User className="h-4 w-4" />
                Informations
              </TabsTrigger>
              <TabsTrigger
                value="securite"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-navy-800 data-[state=active]:bg-transparent data-[state=active]:text-navy-800 py-3.5 gap-2 font-semibold"
              >
                <Shield className="h-4 w-4" />
                Securite
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="profil" className="mt-0 focus-visible:ring-0">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-5">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-52" />
                      </div>
                    </div>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : user ? (
                  <TabProfil user={user} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Chargement du profil...</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="securite" className="mt-0 focus-visible:ring-0">
                <TabSecurite />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
