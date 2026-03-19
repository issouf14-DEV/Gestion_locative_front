import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Home,
  Banknote,
  Zap,
  Droplets,
  X,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useSoumettrePayement } from '@/lib/api/queries/payments';
import { useMaLocation } from '@/lib/api/queries/rentals';
import { formatCurrency, formatDate, formatMonthYear, getCurrentMoisAnnee } from '@/lib/utils/formatters';
import { toast } from 'sonner';

// ─── Zod schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  notes: z.string().max(500, 'Maximum 500 caractères').optional(),
  reference: z.string().optional(),
});

// ─── Helpers ───────────────────────────────────────────────────────────────────
const CHARGE_TYPES = {
  loyer: { label: 'Loyer', icon: Home, color: 'text-[var(--primary)]', bg: 'bg-maroon-50' },
  sodeci: { label: 'SODECI (Eau)', icon: Droplets, color: 'text-[var(--accent)]', bg: 'bg-red-50' },
  cie: { label: 'CIE (Électricité)', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
};

const STEP_LABELS = ['Récapitulatif', 'Preuve de paiement', 'Confirmation'];

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8 select-none">
      {STEP_LABELS.map((label, idx) => {
        const step = idx + 1;
        const isActive = step === currentStep;
        const isDone = step < currentStep;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                  isDone ? 'bg-[var(--primary)] text-white' : isActive ? 'bg-[var(--accent)] text-white ring-4 ring-[var(--accent)]/20' : 'bg-gray-200 text-gray-400',
                ].join(' ')}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : step}
              </div>
              <span
                className={[
                  'text-xs font-medium whitespace-nowrap',
                  isActive ? 'text-[var(--accent)]' : isDone ? 'text-[var(--primary)]' : 'text-gray-400',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
            {idx < STEP_LABELS.length - 1 && (
              <div
                className={[
                  'h-0.5 w-14 mx-1 mt-[-20px] transition-all',
                  isDone ? 'bg-[var(--primary)]' : 'bg-gray-200',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 ────────────────────────────────────────────────────────────────────
function StepRecapitulatif({ chargeType, location, onNext }) {
  const { mois: currentMois, annee: currentAnnee } = getCurrentMoisAnnee();
  const typeInfo = CHARGE_TYPES[chargeType] || CHARGE_TYPES.loyer;
  const TypeIcon = typeInfo.icon;
  const montant = location?.loyer_mensuel || 0;

  return (
    <div className="space-y-6">
      {/* Charge summary */}
      <Card className="border-[var(--secondary)]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[var(--primary)] flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Détails de la charge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex items-center gap-3 p-4 rounded-xl ${typeInfo.bg}`}>
            <div className={`p-2 rounded-lg bg-white shadow-sm`}>
              <TypeIcon className={`w-6 h-6 ${typeInfo.color}`} />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{typeInfo.label}</p>
              <p className="text-sm text-gray-500">
                {formatMonthYear(currentMois, currentAnnee)}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xl font-bold text-[var(--primary)]">{formatCurrency(montant)}</p>
              <Badge variant="outline" className="text-xs border-[var(--secondary)] text-[var(--secondary)]">
                À payer
              </Badge>
            </div>
          </div>

          {location && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Propriété</p>
                <p className="font-medium text-gray-700">{location.maison?.titre || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400">Période</p>
                <p className="font-medium text-gray-700">{formatMonthYear(currentMois, currentAnnee)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment instructions */}
      <Card className="border-[var(--secondary)]/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[var(--primary)]">Instructions de paiement :</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Steps */}
          <ol className="space-y-3">
            {[
              'Effectuer le virement ou paiement mobile money',
              'Conserver le reçu de la transaction',
              'Télécharger la preuve ci-dessous à l\'étape suivante',
            ].map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-600">{step}</span>
              </li>
            ))}
          </ol>

          <Separator className="bg-[var(--secondary)]/20" />

          {/* Bank / Mobile money details */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Coordonnées bancaires :</p>
            <div className="bg-[var(--primary)]/5 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Banque</span>
                <span className="font-medium text-gray-800">SGBCI / NSIA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Compte</span>
                <span className="font-medium text-gray-800 font-mono">CI __ XXXX XXXX XXXX XXXX</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bénéficiaire</span>
                <span className="font-medium text-gray-800">Gestion Locative CI</span>
              </div>
            </div>

            <p className="text-sm font-semibold text-gray-700">Mobile Money :</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-50 rounded-lg p-3 text-sm">
                <p className="text-orange-600 font-semibold text-xs mb-1">Orange Money</p>
                <p className="font-mono font-medium text-gray-800">+225 07 XX XX XX XX</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-sm">
                <p className="text-yellow-600 font-semibold text-xs mb-1">MTN Mobile Money</p>
                <p className="font-mono font-medium text-gray-800">+225 05 XX XX XX XX</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white h-12 text-base font-semibold"
        onClick={onNext}
      >
        Suivant
        <ChevronRight className="w-5 h-5 ml-1" />
      </Button>
    </div>
  );
}

// ─── Step 2 ────────────────────────────────────────────────────────────────────
function StepPreuve({ chargeType, location, onPrev, onSuccess }) {
  const { id } = useParams();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const inputRef = useRef(null);
  const mutation = useSoumettrePayement();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const handleFile = useCallback((f) => {
    setFileError('');
    if (!f) return;
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(f.type)) {
      setFileError('Format non accepté. Utilisez JPG, PNG ou PDF.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setFileError('Fichier trop volumineux. Maximum 5 Mo.');
      return;
    }
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const onSubmit = (values) => {
    if (!file) {
      setFileError('Veuillez joindre une preuve de paiement.');
      return;
    }

    mutation.mutate(
      {
        data: {
          type: chargeType,
          reference_id: id,
          montant: location?.loyer_mensuel || 0,
          notes: values.notes || '',
          reference: values.reference || '',
        },
        preuve: file,
      },
      {
        onSuccess: () => {
          onSuccess();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Drop zone */}
      <div>
        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
          Preuve de paiement <span className="text-[var(--accent)]">*</span>
        </Label>

        {!file ? (
          <div
            className={[
              'relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
              dragOver
                ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                : 'border-[var(--secondary)]/50 hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5',
            ].join(' ')}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-[var(--secondary)]/10">
                <Upload className="w-8 h-8 text-[var(--secondary)]" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">Cliquez ou glissez votre fichier ici</p>
                <p className="text-sm text-gray-400 mt-1">JPG, PNG, PDF — max 5 Mo</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 border-[var(--primary)] text-[var(--primary)]"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              >
                Parcourir
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative border-2 border-[var(--primary)]/30 rounded-2xl overflow-hidden bg-[var(--primary)]/5">
            {preview ? (
              <img
                src={preview}
                alt="Aperçu"
                className="w-full max-h-56 object-contain"
              />
            ) : (
              <div className="flex items-center gap-4 p-6">
                <div className="p-3 rounded-xl bg-[var(--accent)]/10">
                  <FileText className="w-8 h-8 text-[var(--accent)]" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(0)} Ko · PDF
                  </p>
                </div>
              </div>
            )}
            <button
              type="button"
              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 shadow text-gray-500 hover:text-[var(--accent)] transition"
              onClick={() => { setFile(null); setPreview(null); }}
            >
              <X className="w-4 h-4" />
            </button>
            <div className="px-4 pb-3 pt-2 bg-white/60">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                Fichier sélectionné : <span className="font-medium">{file.name}</span>
              </p>
            </div>
          </div>
        )}

        {fileError && (
          <p className="text-xs text-[var(--accent)] mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {fileError}
          </p>
        )}
      </div>

      {/* Reference (optional) */}
      <div className="space-y-1.5">
        <Label htmlFor="reference" className="text-sm font-semibold text-gray-700">
          Numéro de référence <span className="text-gray-400 font-normal">(optionnel)</span>
        </Label>
        <Input
          id="reference"
          placeholder="Ex: TXN-20241201-0042"
          className="border-[var(--secondary)]/50 focus:border-[var(--primary)]"
          {...register('reference')}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
          Notes / Commentaire <span className="text-gray-400 font-normal">(optionnel)</span>
        </Label>
        <Textarea
          id="notes"
          placeholder="Informations supplémentaires sur votre paiement..."
          rows={3}
          className="border-[var(--secondary)]/50 focus:border-[var(--primary)] resize-none"
          {...register('notes')}
        />
        {errors.notes && (
          <p className="text-xs text-[var(--accent)]">{errors.notes.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 border-[var(--secondary)]/50 text-gray-600 h-12"
          onClick={onPrev}
          disabled={mutation.isPending}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Précédent
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white h-12 font-semibold"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Envoi en cours...
            </span>
          ) : (
            'Soumettre'
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Step 3 ────────────────────────────────────────────────────────────────────
function StepConfirmation() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center text-center py-6 space-y-6">
      {/* Animated checkmark */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-bounce-once">
          <CheckCircle2 className="w-14 h-14 text-green-500" />
        </div>
        <div className="absolute inset-0 rounded-full bg-green-200 opacity-30 scale-110" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-[var(--primary)]">Paiement soumis avec succès !</h2>
        <p className="text-gray-500 max-w-xs mx-auto leading-relaxed">
          Votre preuve de paiement est en cours de validation par l'administrateur.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 max-w-xs">
        <p className="font-semibold mb-1">Délai de traitement</p>
        <p>La validation prend généralement entre 24 et 48 heures ouvrables.</p>
      </div>

      <Button
        className="w-full max-w-xs bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white h-12 font-semibold"
        onClick={() => navigate('/tenant/dashboard')}
      >
        <Home className="w-4 h-4 mr-2" />
        Retour au tableau de bord
      </Button>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────
export default function TenantPaiement() {
  const { id } = useParams();
  const [step, setStep] = useState(1);

  // Derive charge type from URL search param or id prefix
  const chargeType = new URLSearchParams(window.location.search).get('type') || 'loyer';

  const { data: locationData, isLoading } = useMaLocation();
  const location = locationData?.data || locationData;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Page header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[var(--primary)]">Soumettre un paiement</h1>
          <p className="text-sm text-gray-500 mt-1">
            {CHARGE_TYPES[chargeType]?.label || 'Paiement'} · Réf. #{id}
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={step} />

        {/* Card container */}
        <Card className="shadow-sm border-[var(--secondary)]/20">
          <CardContent className="p-6">
            {step === 1 && (
              <StepRecapitulatif
                chargeType={chargeType}
                location={location}
                onNext={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <StepPreuve
                chargeType={chargeType}
                location={location}
                onPrev={() => setStep(1)}
                onSuccess={() => setStep(3)}
              />
            )}
            {step === 3 && <StepConfirmation />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
