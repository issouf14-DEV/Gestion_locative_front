import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, User, Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/common/PasswordInput';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useLogin, useRegister, useGoogleAuth } from '@/lib/api/queries/auth';
import logobg from '@/assets/logobg.png';

// ─── Schemas ────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().min(1, 'Email requis').email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

const registerSchema = z.object({
  nom: z.string().min(2, 'Nom requis (min. 2 caracteres)'),
  prenoms: z.string().min(2, 'Prenom(s) requis (min. 2 caracteres)'),
  email: z.string().min(1, 'Email requis').email('Email invalide'),
  telephone: z.string().min(8, 'Telephone requis (min. 8 caracteres)'),
  password: z.string().min(8, 'Min. 8 caracteres'),
  password2: z.string().min(1, 'Confirmation requise'),
}).refine((d) => d.password === d.password2, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password2'],
});

// ─── Google OAuth Button ────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function GoogleButton({ label, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleGoogle = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.error('VITE_GOOGLE_CLIENT_ID non configuré');
      return;
    }
    if (!window.google?.accounts?.oauth2) {
      const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (!script) return;
      script.addEventListener('load', () => handleGoogle(), { once: true });
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'email profile',
      callback: (response) => {
        if (response.access_token) {
          setLoading(true);
          onSuccess(response.access_token);
        }
      },
    });
    client.requestAccessToken();
  }, [onSuccess]);

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full h-11 font-medium border-gray-300 hover:bg-gray-50 text-gray-700"
      onClick={handleGoogle}
      disabled={loading}
    >
      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      {loading ? 'Connexion...' : label}
    </Button>
  );
}

// ─── Login Form ─────────────────────────────────────────────────────────────

function LoginForm({ onSuccess, onSwitchToRegister }) {
  const { mutate: login, isPending } = useLogin();
  const { mutate: googleAuth } = useGoogleAuth();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data) => {
    login(data, { onSuccess });
  };

  const handleGoogleSuccess = (accessToken) => {
    googleAuth({ access_token: accessToken }, { onSuccess });
  };

  return (
    <div className="space-y-5">
      <GoogleButton label="Continuer avec Google" onSuccess={handleGoogleSuccess} />

      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-400 font-medium">
          ou par email
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="login-email" className="text-sm font-medium text-gray-700">Adresse email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="login-email"
              type="email"
              placeholder="exemple@email.com"
              className="pl-9 h-10 border-gray-300 focus:border-navy-500 focus:ring-navy-500"
              {...register('email')}
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <PasswordInput
          id="login-password"
          label="Mot de passe"
          placeholder="Votre mot de passe"
          registerProps={register('password')}
          error={errors.password}
        />

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 bg-navy-800 hover:bg-navy-700 text-white font-semibold"
        >
          {isPending ? 'Connexion...' : (
            <>
              Se connecter
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Pas encore de compte ?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-navy-700 font-semibold hover:underline"
        >
          Creer un compte
        </button>
      </p>
    </div>
  );
}

// ─── Register Form ──────────────────────────────────────────────────────────

function RegisterForm({ onSuccess, onGoogleSuccess, onSwitchToLogin }) {
  const { mutate: registerUser, isPending } = useRegister();
  const { mutate: googleAuth } = useGoogleAuth();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });
  const watchedPassword = watch('password', '');

  const onSubmit = (data) => {
    registerUser({ ...data, role: 'LOCATAIRE' }, {
      onSuccess: (response) => {
        const payload = response?.data?.data || response?.data;
        const hasTokens = !!(payload?.tokens?.access || payload?.access);
        if (hasTokens) {
          if (onGoogleSuccess) onGoogleSuccess(); // ferme le dialog
        } else {
          if (onSuccess) onSuccess(); // bascule vers login
        }
      },
    });
  };

  const handleGoogleSuccess = (accessToken) => {
    googleAuth({ access_token: accessToken }, {
      onSuccess: () => {
        if (onGoogleSuccess) onGoogleSuccess();
      },
    });
  };

  return (
    <div className="space-y-5">
      <GoogleButton label="S'inscrire avec Google" onSuccess={handleGoogleSuccess} />

      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-400 font-medium">
          ou par email
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reg-nom" className="text-sm font-medium text-gray-700">Nom</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input id="reg-nom" placeholder="Dupont" className="pl-9 h-10 border-gray-300" {...register('nom')} />
            </div>
            {errors.nom && <p className="text-xs text-red-500">{errors.nom.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-prenoms" className="text-sm font-medium text-gray-700">Prenom(s)</Label>
            <Input id="reg-prenoms" placeholder="Jean" className="h-10 border-gray-300" {...register('prenoms')} />
            {errors.prenoms && <p className="text-xs text-red-500">{errors.prenoms.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-email" className="text-sm font-medium text-gray-700">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input id="reg-email" type="email" placeholder="jean@exemple.com" className="pl-9 h-10 border-gray-300" {...register('email')} />
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-telephone" className="text-sm font-medium text-gray-700">Telephone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input id="reg-telephone" placeholder="+225 07 00 00 00 00" className="pl-9 h-10 border-gray-300" {...register('telephone')} />
          </div>
          {errors.telephone && <p className="text-xs text-red-500">{errors.telephone.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PasswordInput
            id="reg-password"
            label="Mot de passe"
            placeholder="Ex: Abcd1234!"
            registerProps={register('password')}
            error={errors.password}
            showRules
            watchValue={watchedPassword}
          />
          <PasswordInput
            id="reg-password2"
            label="Confirmer"
            placeholder="Retaper le même"
            registerProps={register('password2')}
            error={errors.password2}
          />
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 bg-maroon-600 hover:bg-maroon-700 text-white font-semibold mt-1"
        >
          {isPending ? 'Creation...' : (
            <>
              Creer mon compte
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Deja un compte ?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-navy-700 font-semibold hover:underline"
        >
          Se connecter
        </button>
      </p>
    </div>
  );
}

// ─── Auth Dialog (exported) ─────────────────────────────────────────────────

export default function AuthDialog({ open, onOpenChange, defaultTab = 'login', onAuthSuccess }) {
  const [tab, setTab] = useState(defaultTab);

  // Reset tab when dialog opens
  const handleOpenChange = (value) => {
    if (value) setTab(defaultTab);
    onOpenChange(value);
  };

  const handleLoginSuccess = () => {
    onOpenChange(false);
    if (onAuthSuccess) onAuthSuccess();
  };

  const handleRegisterSuccess = () => {
    // After registration, switch to login tab
    setTab('login');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-800 to-navy-900 px-6 py-5 text-center">
          <img src={logobg} alt="Logo" className="h-8 w-auto mx-auto mb-2 brightness-0 invert" />
          <DialogTitle className="text-white text-lg font-bold">
            {tab === 'login' ? 'Bienvenue' : 'Rejoignez-nous'}
          </DialogTitle>
          <DialogDescription className="text-navy-200 text-sm mt-1">
            {tab === 'login'
              ? 'Connectez-vous pour acceder a votre espace'
              : 'Creez votre compte en quelques secondes'}
          </DialogDescription>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === 'login'
                ? 'text-navy-800 border-b-2 border-navy-800 bg-white'
                : 'text-gray-400 hover:text-gray-600 bg-gray-50'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === 'register'
                ? 'text-maroon-600 border-b-2 border-maroon-600 bg-white'
                : 'text-gray-400 hover:text-gray-600 bg-gray-50'
            }`}
          >
            Inscription
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {tab === 'login' ? (
            <LoginForm
              onSuccess={handleLoginSuccess}
              onSwitchToRegister={() => setTab('register')}
            />
          ) : (
            <RegisterForm
              onSuccess={handleRegisterSuccess}
              onGoogleSuccess={handleLoginSuccess}
              onSwitchToLogin={() => setTab('login')}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
