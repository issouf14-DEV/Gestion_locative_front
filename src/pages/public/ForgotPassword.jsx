import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { usePasswordReset } from '@/lib/api/queries/auth';

const schema = z.object({
  email: z.string().min(1, 'Email requis').email('Email invalide'),
});

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const { mutate: resetPassword, isPending } = usePasswordReset();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    resetPassword(data, { onSuccess: () => setSent(true) });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-800 to-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 mb-2">
            <svg viewBox="0 0 40 40" className="w-full h-full">
              <polygon points="20,2 38,32 2,32" fill="var(--accent)" opacity="0.9"/>
              <polygon points="20,8 30,26 14,26" fill="var(--secondary)" opacity="0.7"/>
              <polygon points="20,13 26,22 17,22" fill="#fff" opacity="0.9"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white italic">Gestion Locative</h1>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader>
            <CardTitle className="text-xl text-navy-800">Mot de passe oublié</CardTitle>
            <CardDescription>
              {sent
                ? 'Un email de réinitialisation a été envoyé.'
                : 'Entrez votre email pour recevoir un lien de réinitialisation.'}
            </CardDescription>
          </CardHeader>

          {!sent ? (
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="exemple@email.com"
                      className="pl-9"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" variant="navy" className="w-full" disabled={isPending}>
                  {isPending ? 'Envoi...' : 'Envoyer le lien'}
                </Button>
                <Link to="/login" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-navy-700">
                  <ArrowLeft className="h-4 w-4" />
                  Retour à la connexion
                </Link>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                ✅ Un email a été envoyé. Vérifiez votre boîte de réception et suivez les instructions.
              </div>
              <Link
                to="/login"
                className="flex items-center gap-1 text-sm text-navy-700 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </Link>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
