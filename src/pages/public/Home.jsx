import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Bed, Maximize2, Filter, X, Home as HomeIcon, ArrowRight, Phone, Calendar, LayoutGrid, List } from 'lucide-react';
import logobg from '@/assets/logobg.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import PublicHeader from '@/components/layout/PublicHeader';
import { useMaisons } from '@/lib/api/queries/properties';
import { formatCurrency } from '@/lib/utils/formatters';

// ─── Card verticale (grille) ────────────────────────────────────────────────

function MaisonCard({ maison }) {
  const mainImage = getImageUrl(maison.image_principale);
  const statusColors = STATUS_COLORS;
  const statusLabels = STATUS_LABELS;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link to={`/maisons/${maison.id}`} className="block relative overflow-hidden h-48 cursor-pointer">
        {mainImage ? (
          <img
            src={mainImage}
            alt={maison.titre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-navy-100 to-steel-200 flex items-center justify-center">
            <HomeIcon className="h-12 w-12 text-navy-300" />
          </div>
        )}
        <Badge
          variant={statusColors[maison.statut] || 'secondary'}
          className="absolute top-3 left-3"
        >
          {statusLabels[maison.statut] || maison.statut}
        </Badge>
        {maison.meublee && (
          <Badge variant="navy" className="absolute top-3 right-3">
            Meuble
          </Badge>
        )}
      </Link>
      <CardContent className="p-4">
        <Link to={`/maisons/${maison.id}`} className="hover:underline">
          <h3 className="font-semibold text-navy-800 line-clamp-1 text-sm">{maison.titre}</h3>
        </Link>
        <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="line-clamp-1">{maison.commune}{maison.quartier ? `, ${maison.quartier}` : ''}</span>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {maison.nombre_chambres && (
            <span className="flex items-center gap-1">
              <Bed className="h-3 w-3" />
              {maison.nombre_chambres} ch.
            </span>
          )}
          {maison.superficie && (
            <span className="flex items-center gap-1">
              <Maximize2 className="h-3 w-3" />
              {maison.superficie} m²
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="font-bold text-navy-800">{formatCurrency(maison.prix)}</p>
            <p className="text-xs text-muted-foreground">/mois</p>
          </div>
          <Button size="sm" variant="maroon" asChild>
            <Link to={`/maisons/${maison.id}`}>
              {maison.statut === 'DISPONIBLE' ? (
                <>Reserver <Calendar className="h-3 w-3 ml-1" /></>
              ) : (
                <>Voir <ArrowRight className="h-3 w-3 ml-1" /></>
              )}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Card horizontale (liste) ───────────────────────────────────────────────

function MaisonCardHorizontal({ maison }) {
  const mainImage = getImageUrl(maison.image_principale);
  const statusLabels = STATUS_LABELS;
  const statusColors = STATUS_COLORS;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <Link to={`/maisons/${maison.id}`} className="relative overflow-hidden h-48 sm:h-auto sm:w-56 flex-shrink-0 cursor-pointer block">
          {mainImage ? (
            <img
              src={mainImage}
              alt={maison.titre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full min-h-[140px] bg-gradient-to-br from-navy-100 to-steel-200 flex items-center justify-center">
              <HomeIcon className="h-10 w-10 text-navy-300" />
            </div>
          )}
          <Badge
            variant={statusColors[maison.statut] || 'secondary'}
            className="absolute top-3 left-3"
          >
            {statusLabels[maison.statut] || maison.statut}
          </Badge>
          {maison.meublee && (
            <Badge variant="navy" className="absolute top-3 right-3 sm:bottom-3 sm:top-auto">
              Meuble
            </Badge>
          )}
        </Link>
        {/* Content */}
        <CardContent className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <Link to={`/maisons/${maison.id}`} className="hover:underline">
              <h3 className="font-semibold text-navy-800 text-base">{maison.titre}</h3>
            </Link>
            <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{maison.commune}{maison.quartier ? `, ${maison.quartier}` : ''}</span>
            </div>
            {maison.description && (
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">{maison.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {maison.nombre_chambres && (
                <span className="flex items-center gap-1">
                  <Bed className="h-3.5 w-3.5" />
                  {maison.nombre_chambres} chambre(s)
                </span>
              )}
              {maison.superficie && (
                <span className="flex items-center gap-1">
                  <Maximize2 className="h-3.5 w-3.5" />
                  {maison.superficie} m²
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div>
              <p className="font-bold text-navy-800 text-lg">{formatCurrency(maison.prix)}</p>
              <p className="text-xs text-muted-foreground">/mois</p>
            </div>
            <Button size="sm" variant="maroon" asChild>
              <Link to={`/maisons/${maison.id}`}>
                {maison.statut === 'DISPONIBLE' ? (
                  <>Reserver <Calendar className="h-3 w-3 ml-1" /></>
                ) : (
                  <>Voir <ArrowRight className="h-3 w-3 ml-1" /></>
                )}
              </Link>
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function MaisonCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex justify-between mt-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function MaisonCardHorizontalSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <Skeleton className="h-48 sm:h-auto sm:w-56 rounded-none" />
        <CardContent className="p-4 flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-full" />
          <div className="flex justify-between mt-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function getImageUrl(url) {
  if (!url) return null;
  if (typeof url !== 'string') return null;
  if (url.startsWith('http')) return url;
  const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL || 'https://gestion-locative-fqax.onrender.com';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Home() {
  const [search, setSearch] = useState('');
  const [commune, setCommune] = useState('');
  const [maxPrix, setMaxPrix] = useState('');
  const [chambres, setChambres] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const filters = {
    statut: 'DISPONIBLE',
    search: search || undefined,
    commune: commune || undefined,
    prix_max: maxPrix || undefined,
    nombre_chambres_min: chambres || undefined,
    page,
    page_size: 12,
  };

  const { data, isLoading } = useMaisons(filters);
  const extractMaisons = (d) => {
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (d.results && Array.isArray(d.results)) return d.results;
    if (d.data) return extractMaisons(d.data);
    return [];
  };

  const extractTotal = (d) => {
    if (!d) return 0;
    if (d.pagination && typeof d.pagination.count === 'number') return d.pagination.count;
    if (typeof d.count === 'number') return d.count;
    const items = extractMaisons(d);
    return items.length;
  };

  const maisons = extractMaisons(data);
  const total = extractTotal(data);
  const totalPages = Math.ceil(total / 12);

  const resetFilters = () => {
    setSearch('');
    setCommune('');
    setMaxPrix('');
    setChambres('');
    setPage(1);
  };

  const hasFilters = search || commune || maxPrix || chambres;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <PublicHeader />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-navy-800 via-navy-900 to-navy-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 80px)'
          }} />
        </div>
        <div className="relative container mx-auto px-4 py-10 md:py-14 text-center">
          <div className="flex items-center justify-center mb-4">
            <img src={logobg} alt="Gestion Locative" className="h-16 w-auto brightness-0 invert drop-shadow-lg" />
          </div>
          <h1 className="text-xl md:text-3xl font-extrabold mb-4 tracking-tight">
            Trouvez votre logement ideal <span className="text-maroon-400">en Cote d'Ivoire</span>
          </h1>
          <p className="text-navy-100 text-sm md:text-base mb-6 max-w-2xl mx-auto opacity-90">
            Des appartements, studios et villas a louer. Gerez vos charges en toute transparence.
          </p>
        </div>
      </section>

      {/* Sticky search bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur shadow-md border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Rechercher (titre, quartier, commune...)"
                className="pl-10 h-11 text-gray-900 placeholder:text-gray-400"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Button variant="maroon" className="px-8 h-11">
              Rechercher
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <section className="container mx-auto px-4 py-8" id="maisons">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-navy-800">Maisons disponibles</h2>
            {!isLoading && (
              <p className="text-sm text-muted-foreground mt-0.5">{total} bien(s) trouve(s)</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-navy-800 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                title="Affichage grille"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-navy-800 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                title="Affichage liste"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'border-navy-800 text-navy-800' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
              {hasFilters && <Badge variant="navy" className="ml-2 px-1.5 py-0 h-4 text-xs">!</Badge>}
            </Button>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white border rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Commune</label>
              <Input
                placeholder="Ex: Cocody, Yopougon..."
                value={commune}
                onChange={(e) => { setCommune(e.target.value); setPage(1); }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Prix max (FCFA)</label>
              <Input
                type="number"
                placeholder="Ex: 150000"
                value={maxPrix}
                onChange={(e) => { setMaxPrix(e.target.value); setPage(1); }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Chambres min.</label>
              <Select value={chambres || 'ALL'} onValueChange={(v) => { setChambres(v === 'ALL' ? '' : v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes</SelectItem>
                  <SelectItem value="1">1 chambre</SelectItem>
                  <SelectItem value="2">2 chambres</SelectItem>
                  <SelectItem value="3">3 chambres</SelectItem>
                  <SelectItem value="4">4+ chambres</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasFilters && (
              <div className="sm:col-span-3 flex justify-end">
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Reinitialiser
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Grid / List */}
        {isLoading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => <MaisonCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, i) => <MaisonCardHorizontalSkeleton key={i} />)}
            </div>
          )
        ) : maisons.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 bg-muted rounded-full inline-block mb-4">
              <HomeIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-navy-800">Aucune maison disponible</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {hasFilters ? 'Essayez de modifier vos filtres.' : 'Revenez bientot pour de nouvelles offres.'}
            </p>
            {hasFilters && (
              <Button variant="outline" className="mt-4" onClick={resetFilters}>
                Reinitialiser les filtres
              </Button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {maisons.map((maison) => (
                  <MaisonCard key={maison.id} maison={maison} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {maisons.map((maison) => (
                  <MaisonCardHorizontal key={maison.id} maison={maison} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Precedent
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-navy-900 text-white mt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1 space-y-6">
              <Link to="/" className="inline-block">
                <img src={logobg} alt="Gestion Locative" className="h-10 w-auto brightness-0 invert" />
              </Link>
              <p className="text-navy-200 text-sm leading-relaxed max-w-xs">
                La solution leader pour la gestion immobiliere en Cote d'Ivoire.
                Modernite, transparence et efficacite au service des proprietaires et locataires.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="font-bold text-sm uppercase tracking-wider text-maroon-300">Navigation</h3>
              <ul className="space-y-3">
                <li><Link to="/" className="text-navy-200 hover:text-white transition-colors text-sm font-medium">Accueil</Link></li>
                <li><Link to="/#maisons" className="text-navy-200 hover:text-white transition-colors text-sm font-medium">Maisons disponibles</Link></li>
                <li><Link to="/login" className="text-navy-200 hover:text-white transition-colors text-sm font-medium">Se connecter</Link></li>
                <li><Link to="/register" className="text-navy-200 hover:text-white transition-colors text-sm font-medium">Creer un compte</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="font-bold text-sm uppercase tracking-wider text-maroon-300">Support</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-navy-200 hover:text-white transition-colors text-sm font-medium">Centre d'aide</a></li>
                <li><a href="#" className="text-navy-200 hover:text-white transition-colors text-sm font-medium">Comment ca marche ?</a></li>
                <li><a href="#" className="text-navy-200 hover:text-white transition-colors text-sm font-medium">Contactez-nous</a></li>
                <li><a href="#" className="text-navy-200 hover:text-white transition-colors text-sm font-medium">Tarifs</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="font-bold text-sm uppercase tracking-wider text-maroon-300">Contact</h3>
              <div className="space-y-4 text-sm text-navy-200 font-medium">
                <p className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-maroon-400 shrink-0" />
                  <span>Abidjan, Cocody Riviera 3,<br />Cote d'Ivoire</span>
                </p>
                <p className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-maroon-400 shrink-0 text-lg">@</span>
                  <span>fofanaissouf179@gmail.com</span>
                </p>
                <p className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-maroon-400 shrink-0" />
                  <span>+225 0503713115</span>
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-navy-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <p className="text-navy-400 text-xs">
                  &copy; {new Date().getFullYear()} Gestion Locative. Realise avec excellence.
                </p>
                <span className="hidden md:inline text-navy-800">|</span>
                <div className="flex gap-6 text-xs text-navy-400">
                  <a href="#" className="hover:text-white transition-colors">Politique de confidentialite</a>
                  <a href="#" className="hover:text-white transition-colors">Conditions generales d'utilisation</a>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center hover:bg-maroon-500 transition-colors cursor-pointer">
                  <span className="text-xs font-bold">in</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center hover:bg-maroon-500 transition-colors cursor-pointer">
                  <span className="text-xs font-bold">fb</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center hover:bg-maroon-500 transition-colors cursor-pointer">
                  <span className="text-xs font-bold">ig</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
