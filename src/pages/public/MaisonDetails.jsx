import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Bed, Bath, Maximize2, Home, ChevronLeft,
  ChevronRight, X, CheckCircle, Calendar, Phone, ArrowLeft, Send
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import PublicHeader from '@/components/layout/PublicHeader';
import AuthDialog from '@/components/auth/AuthDialog';
import { useMaison } from '@/lib/api/queries/properties';
import { useCreateReservation } from '@/lib/api/queries/reservations';
import { formatCurrency } from '@/lib/utils/formatters';
import useAuth from '@/hooks/useAuth';
import logobg from '@/assets/logobg.png';

const reservationSchema = z.object({
  nom: z.string().min(2, 'Le nom est requis (min. 2 caracteres)'),
  telephone: z.string().min(8, 'Numero de telephone invalide'),
  date_debut_souhaitee: z.string().min(1, 'Veuillez choisir une date'),
  duree_mois: z.coerce.number().min(1, 'Duree minimum 1 mois'),
  message: z.string().optional(),
});

const STATUS_COLORS = {
  DISPONIBLE: 'success',
  LOUEE: 'destructive',
  EN_MAINTENANCE: 'warning',
  INDISPONIBLE: 'secondary',
};
const STATUS_LABELS = {
  DISPONIBLE: 'Disponible',
  LOUEE: 'Louee',
  EN_MAINTENANCE: 'En maintenance',
  INDISPONIBLE: 'Indisponible',
};

function getImageUrl(img) {
  const url = typeof img === 'string' ? img : (img?.image || img?.url);
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL || 'https://gestion-locative-fqax.onrender.com';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

function ImageGallery({ images }) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="h-72 md:h-96 bg-gradient-to-br from-navy-100 to-steel-200 flex items-center justify-center rounded-xl">
        <Home className="h-16 w-16 text-navy-300" />
      </div>
    );
  }

  const prev = () => setCurrent(c => (c - 1 + images.length) % images.length);
  const next = () => setCurrent(c => (c + 1) % images.length);

  return (
    <>
      <div className="relative h-72 md:h-96 rounded-xl overflow-hidden">
        <img
          src={getImageUrl(images[current])}
          alt={`Photo ${current + 1}`}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => setLightbox(true)}
          loading="lazy"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
        <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {current + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                i === current ? 'border-navy-800' : 'border-transparent'
              }`}
            >
              <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setLightbox(false)}
          >
            <X className="h-6 w-6" />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <img
            src={getImageUrl(images[current])}
            alt="Agrandissement"
            className="max-w-full max-h-full object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
      )}
    </>
  );
}

export default function MaisonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data, isLoading, isError } = useMaison(id);

  // ALL hooks MUST be called before any early return
  const [reservationOpen, setReservationOpen] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const createReservation = useCreateReservation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(reservationSchema),
    defaultValues: { nom: '', telephone: '', date_debut_souhaitee: '', duree_mois: 12, message: '' },
  });

  const maison = data?.data || data;

  // Early returns AFTER all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <PublicHeader />
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Skeleton className="h-72 w-full rounded-xl mb-6" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !maison) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <PublicHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-semibold text-navy-800 mb-2">Maison introuvable</h2>
          <p className="text-muted-foreground mb-6">Ce bien n'existe pas ou a ete supprime.</p>
          <Button variant="navy" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour a l'accueil
          </Button>
        </div>
      </div>
    );
  }

  const handleReserver = () => {
    if (!isAuthenticated) {
      setAuthOpen(true);
    } else {
      setReservationSuccess(false);
      reset();
      setReservationOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    // After login, open the reservation dialog
    setReservationSuccess(false);
    reset();
    setReservationOpen(true);
  };

  const onSubmitReservation = (formData) => {
    createReservation.mutate(
      { maison: id, maison_id: id, ...formData },
      {
        onSuccess: () => {
          setReservationSuccess(true);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Back */}
        <Button variant="outline" size="default" className="mb-4 text-navy-700 border-navy-300 hover:bg-navy-50" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux maisons
        </Button>

        {/* Gallery */}
        <ImageGallery images={maison.images || []} />

        {/* Content */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {/* Left */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <h1 className="text-2xl font-bold text-navy-800">{maison.titre}</h1>
                <Badge variant={STATUS_COLORS[maison.statut] || 'secondary'} className="flex-shrink-0">
                  {STATUS_LABELS[maison.statut] || maison.statut}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground mt-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">
                  {[maison.quartier, maison.commune, maison.adresse].filter(Boolean).join(' - ')}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {maison.nombre_chambres && (
                <div className="bg-white rounded-lg p-3 text-center border">
                  <Bed className="h-5 w-5 text-navy-800 mx-auto mb-1" />
                  <p className="text-lg font-bold text-navy-800">{maison.nombre_chambres}</p>
                  <p className="text-xs text-muted-foreground">Chambre(s)</p>
                </div>
              )}
              {maison.nombre_salles_bain && (
                <div className="bg-white rounded-lg p-3 text-center border">
                  <Bath className="h-5 w-5 text-navy-800 mx-auto mb-1" />
                  <p className="text-lg font-bold text-navy-800">{maison.nombre_salles_bain}</p>
                  <p className="text-xs text-muted-foreground">Salle(s) de bain</p>
                </div>
              )}
              {maison.superficie && (
                <div className="bg-white rounded-lg p-3 text-center border">
                  <Maximize2 className="h-5 w-5 text-navy-800 mx-auto mb-1" />
                  <p className="text-lg font-bold text-navy-800">{maison.superficie}</p>
                  <p className="text-xs text-muted-foreground">m2</p>
                </div>
              )}
              {maison.type_logement && (
                <div className="bg-white rounded-lg p-3 text-center border">
                  <Home className="h-5 w-5 text-navy-800 mx-auto mb-1" />
                  <p className="text-sm font-bold text-navy-800 capitalize">{maison.type_logement?.toLowerCase()}</p>
                  <p className="text-xs text-muted-foreground">Type</p>
                </div>
              )}
            </div>

            {/* Description */}
            {maison.description && (
              <div>
                <h2 className="text-lg font-semibold text-navy-800 mb-2">Description</h2>
                <Separator className="mb-3" />
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {maison.description}
                </p>
              </div>
            )}

            {/* Equipements */}
            {maison.equipements && maison.equipements.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-navy-800 mb-2">Equipements</h2>
                <Separator className="mb-3" />
                <div className="grid grid-cols-2 gap-2">
                  {maison.equipements.map((eq, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{eq}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right - Price card */}
          <div className="space-y-4">
            <Card className="sticky top-20 shadow-md border-navy-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-navy-800">
                  <span className="text-3xl font-bold">{formatCurrency(maison.prix)}</span>
                  <span className="text-base font-normal text-muted-foreground">/mois</span>
                </CardTitle>
                {maison.caution && (
                  <p className="text-sm text-muted-foreground">
                    Caution : {formatCurrency(maison.caution)}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {maison.statut === 'DISPONIBLE' ? (
                  <Button
                    variant="maroon"
                    className="w-full"
                    size="lg"
                    onClick={handleReserver}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Reserver une visite
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Non disponible
                  </Button>
                )}
                {maison.meublee && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-xs text-green-800 text-center">
                    Logement meuble
                  </div>
                )}
                {maison.disponible_le && (
                  <div className="text-xs text-muted-foreground text-center">
                    Disponible a partir du {new Date(maison.disponible_le).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reservation Dialog */}
      <Dialog open={reservationOpen} onOpenChange={setReservationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy-800">Reserver une visite</DialogTitle>
            <DialogDescription>
              {maison.titre} — {formatCurrency(maison.prix)}/mois
            </DialogDescription>
          </DialogHeader>

          {reservationSuccess ? (
            <div className="text-center py-6 space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-navy-800">Demande envoyee !</h3>
              <p className="text-sm text-muted-foreground">
                Votre demande de visite a ete enregistree. Nous vous contacterons rapidement.
              </p>
              <Button variant="maroon" className="mt-2" onClick={() => setReservationOpen(false)}>
                Fermer
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmitReservation)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom complet *</Label>
                <Input
                  id="nom"
                  placeholder="Votre nom complet"
                  {...register('nom')}
                />
                {errors.nom && <p className="text-xs text-destructive">{errors.nom.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Telephone *</Label>
                <Input
                  id="telephone"
                  type="tel"
                  placeholder="Ex: 0700000000"
                  {...register('telephone')}
                />
                {errors.telephone && <p className="text-xs text-destructive">{errors.telephone.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="date_debut_souhaitee">Date souhaitee *</Label>
                  <Input
                    id="date_debut_souhaitee"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    {...register('date_debut_souhaitee')}
                  />
                  {errors.date_debut_souhaitee && <p className="text-xs text-destructive">{errors.date_debut_souhaitee.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duree_mois">Duree (mois) *</Label>
                  <Input
                    id="duree_mois"
                    type="number"
                    min={1}
                    max={60}
                    placeholder="12"
                    {...register('duree_mois')}
                  />
                  {errors.duree_mois && <p className="text-xs text-destructive">{errors.duree_mois.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message (optionnel)</Label>
                <Textarea
                  id="message"
                  placeholder="Informations complementaires..."
                  rows={3}
                  {...register('message')}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReservationOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="maroon"
                  disabled={createReservation.isPending}
                >
                  {createReservation.isPending ? (
                    'Envoi en cours...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer la demande
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Auth Dialog — shown when non-authenticated user clicks "Reserver" */}
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        defaultTab="login"
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Footer */}
      <footer className="bg-navy-900 text-white mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1 space-y-6">
              <Link to="/">
                <div className="bg-white rounded-lg px-3 py-1.5">
                  <img src={logobg} alt="Gestion Locative" className="h-8 w-auto" />
                </div>
              </Link>
              <p className="text-navy-200 text-sm leading-relaxed">
                Leader de la gestion immobiliere digitale en Cote d'Ivoire.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-maroon-300">Navigation</h3>
              <ul className="space-y-2 text-sm text-navy-200">
                <li><Link to="/" className="hover:text-white transition-colors">Accueil</Link></li>
                <li><Link to="/#maisons" className="hover:text-white transition-colors">Nos Biens</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Connexion</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-maroon-300">Support</h3>
              <ul className="space-y-2 text-sm text-navy-200">
                <li><a href="#" className="hover:text-white transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Nous contacter</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-maroon-300">Contact</h3>
              <div className="space-y-2 text-sm text-navy-200">
                <p>Abidjan, Cote d'Ivoire</p>
                <p>contact@gestion-locative.ci</p>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-navy-800 text-center md:text-left">
            <p className="text-navy-400 text-xs">
              &copy; {new Date().getFullYear()} Gestion Locative. Tous droits reserves.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
