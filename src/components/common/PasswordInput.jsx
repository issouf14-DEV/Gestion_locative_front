import { useState } from 'react';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// ─── Calcul de la force du mot de passe ────────────────────────────────────

function getStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let s = 0;
  if (password.length >= 8)  s++;
  if (password.length >= 12) s++;
  if (/[A-Z]/.test(password)) s++;
  if (/[0-9]/.test(password)) s++;
  if (/[^A-Za-z0-9]/.test(password)) s++;
  if (s <= 2) return { score: 33,  label: 'Faible', color: 'bg-red-500' };
  if (s <= 3) return { score: 66,  label: 'Moyen',  color: 'bg-yellow-500' };
  return       { score: 100, label: 'Fort',   color: 'bg-green-500' };
}

const RULES = [
  { test: (v) => v.length >= 8,        label: 'Au moins 8 caractères' },
  { test: (v) => /[A-Z]/.test(v),      label: 'Au moins une majuscule (A–Z)' },
  { test: (v) => /[0-9]/.test(v),      label: 'Au moins un chiffre (0–9)' },
  { test: (v) => /[^A-Za-z0-9]/.test(v), label: 'Un caractère spécial recommandé (!@#…)' },
];

// ─── Composant principal ────────────────────────────────────────────────────

/**
 * Champ mot de passe avec :
 *  - icône cadenas à gauche
 *  - bouton œil/œil-barré à droite
 *  - placeholder informatif
 *  - si showRules=true : barre de force + checklist des règles (live)
 *
 * Props :
 *  id, label, placeholder, registerProps, error   — obligatoires
 *  showRules   — boolean, affiche force + règles (pour création/changement)
 *  watchValue  — string, valeur observée pour les règles (= watch('field'))
 *  className   — classes supplémentaires sur le wrapper
 */
export default function PasswordInput({
  id,
  label,
  placeholder = '••••••••',
  registerProps,
  error,
  showRules = false,
  watchValue = '',
  className,
}) {
  const [visible, setVisible] = useState(false);
  const strength = getStrength(watchValue);

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
      )}

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          className="pl-9 pr-10"
          {...registerProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy-800 transition-colors"
          tabIndex={-1}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {visible
            ? <EyeOff className="h-4 w-4" />
            : <Eye    className="h-4 w-4" />}
        </button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <p className="text-xs text-red-500 font-medium">{error.message}</p>
      )}

      {/* Barre de force + règles (uniquement si showRules et valeur présente) */}
      {showRules && watchValue && (
        <div className="space-y-2 pt-1">
          {/* Barre */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-300', strength.color)}
                style={{ width: `${strength.score}%` }}
              />
            </div>
            <span className={cn(
              'text-xs font-semibold shrink-0',
              strength.score <= 33  ? 'text-red-500'    :
              strength.score <= 66  ? 'text-yellow-600' : 'text-green-600'
            )}>
              {strength.label}
            </span>
          </div>

          {/* Checklist */}
          <ul className="space-y-1">
            {RULES.map(({ test, label: ruleLabel }) => {
              const ok = test(watchValue);
              return (
                <li
                  key={ruleLabel}
                  className={cn(
                    'flex items-center gap-1.5 text-xs',
                    ok ? 'text-green-600' : 'text-muted-foreground'
                  )}
                >
                  <CheckCircle className={cn('h-3 w-3 shrink-0', ok ? 'text-green-500' : 'text-muted-foreground/40')} />
                  {ruleLabel}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Indication statique si showRules mais champ encore vide */}
      {showRules && !watchValue && (
        <p className="text-xs text-muted-foreground">
          8 caractères min. · une majuscule · un chiffre
        </p>
      )}
    </div>
  );
}
