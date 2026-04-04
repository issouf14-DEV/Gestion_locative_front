import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { usePasswordResetConfirm } from '@/lib/api/queries/auth';

const schema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .refine((v) => /[A-Z]/.test(v), { message: 'Au moins une majuscule' })
      .refine((v) => /[0-9]/.test(v), { message: 'Au moins un chiffre' }),
    confirm_password: z.string().min(1, 'Confirmation requise'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  });

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { score: 33, label: 'Faible', color: 'bg-red-500' };
  if (score <= 3) return { score: 66, label: 'Moyen', color: 'bg-yellow-500' };
  return { score: 100, label: 'Fort', color: 'bg-green-500' };
}

export default function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const { mutate: confirmReset, isPending } = usePasswordResetConfirm();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const watchedNew = watch('new_password', '');
  const strength = getPasswordStrength(watchedNew);

  const onSubmit = (data) => {
    confirmReset(
      { uid, token, new_password: data.new_password },
      {
        onSuccess: () => {
          setDone(true);
          setTimeout(() => navigate('/login'), 3000);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-800 to-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 mb-2">
            <svg viewBox="0 0 40 40" className="w-full h-full">
              <polygon points="20,2 38,32 2,32" fill="var(--accent)" opacity="0.9" />
              <polygon points="20,8 30,26 14,26" fill="var(--secondary)" opacity="0.7" />
              <polygon points="20,13 26,22 17,22" fill="#fff" opacity="0.9" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white italic">Gestion Locative</h1>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader>
            <CardTitle className="text-xl text-navy-800">Nouveau mot de passe</CardTitle>
            <CardDescription>
              {done
                ? 'Votre mot de passe a été réinitialisé.'
                : 'Choisissez un nouveau mot de passe sécurisé.'}
            </CardDescription>
          </CardHeader>

          {done ? (
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800 flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
                <span>
                  Mot de passe réinitialisé avec succès. Vous allez être redirigé vers la
                  page de connexion…
                </span>
              </div>
              <Link
                to="/login"
                className="flex items-center gap-1 text-sm text-navy-700 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Se connecter maintenant
              </Link>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                {/* Nouveau mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="new_password">Nouveau mot de passe *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new_password"
                      type={showNew ? 'text' : 'password'}
                      placeholder="Min. 8 caractères"
                      className="pl-9 pr-10"
                      {...register('new_password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Indicateur de force */}
                  {watchedNew && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${strength.color}`}
                          style={{ width: `${strength.score}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Force : <span className="font-medium">{strength.label}</span>
                      </p>
                    </div>
                  )}
                  {errors.new_password && (
                    <p className="text-xs text-red-500">{errors.new_password.message}</p>
                  )}
                </div>

                {/* Confirmation */}
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirmer le mot de passe *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm_password"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Retaper le mot de passe"
                      className="pl-9 pr-10"
                      {...register('confirm_password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="text-xs text-red-500">{errors.confirm_password.message}</p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" variant="navy" className="w-full" disabled={isPending}>
                  {isPending ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}
                </Button>
                <Link
                  to="/login"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-navy-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour à la connexion
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
