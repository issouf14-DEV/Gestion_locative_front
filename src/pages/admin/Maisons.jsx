import { useState } from 'react';
import { Plus, Pencil, Trash2, Image, Search, Home, Building } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import EmptyState from '@/components/common/EmptyState';
import StatCard from '@/components/common/StatCard';
import {
  useMaisons, useCreateMaison, useUpdateMaison,
  useDeleteMaison, useAjouterImages
} from '@/lib/api/queries/properties';
import { useLocationsActives } from '@/lib/api/queries/rentals';
import api from '@/lib/api/axios';
import { PROPERTIES } from '@/lib/api/endpoints';
import { formatCurrency } from '@/lib/utils/formatters';

const maisonSchema = z.object({
  titre: z.string().min(3, 'Titre requis (min. 3 caractères)'),
  type_logement: z.string().min(1, 'Type requis'),
  prix: z.coerce.number().min(1, 'Prix requis et positif'),
  commune: z.string().min(1, 'Commune requise'),
  quartier: z.string().optional(),
  adresse: z.string().optional(),
  superficie: z.coerce.number().optional(),
  nombre_chambres: z.coerce.number().optional(),
  nombre_salles_bain: z.coerce.number().optional(),
  caution: z.coerce.number().optional(),
  meublee: z.boolean().optional(),
  description: z.string().optional(),
  statut: z.string().default('DISPONIBLE'),
});

const STATUS_LABELS = {
  DISPONIBLE: 'Disponible',
  LOUEE: 'Louée',
  EN_MAINTENANCE: 'En maintenance',
  INDISPONIBLE: 'Indisponible',
};
const STATUS_VARIANTS = {
  DISPONIBLE: 'success',
  LOUEE: 'destructive',
  EN_MAINTENANCE: 'warning',
  INDISPONIBLE: 'secondary',
};

function MaisonForm({ maison, open, onOpenChange }) {
  const isEdit = !!maison;
  const { mutate: create, isPending: isCreating } = useCreateMaison();
  const { mutate: update, isPending: isUpdating } = useUpdateMaison();
  const { mutate: ajouterImages } = useAjouterImages();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(maisonSchema),
    defaultValues: maison ? {
      titre: maison.titre || '',
      type_logement: maison.type_logement || '',
      prix: maison.prix || '',
      commune: maison.commune || '',
      quartier: maison.quartier || '',
      adresse: maison.adresse || '',
      superficie: maison.superficie || '',
      nombre_chambres: maison.nombre_chambres || '',
      nombre_salles_bain: maison.nombre_salles_bain || '',
      caution: maison.caution || '',
      meublee: maison.meublee || false,
      description: maison.description || '',
      statut: maison.statut || 'DISPONIBLE',
    } : { statut: 'DISPONIBLE', meublee: false },
  });

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const existingImages = maison?.images || [];

  const getImageUrl = (img) => {
    const url = typeof img === 'string' ? img : (img?.image || img?.url);
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL || 'https://gestion-locative-fqax.onrender.com';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleFilesChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const maxNew = 10 - existingImages.length - files.length;
    const newFiles = selected.slice(0, Math.max(0, maxNew));

    // Create previews
    const newPreviews = newFiles.map(f => ({
      file: f,
      url: URL.createObjectURL(f),
      name: f.name,
    }));

    setFiles(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeNewFile = (index) => {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data) => {
    // Remove empty optional strings — API rejects "" for fields like description
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== '' && v !== undefined)
    );

    if (isEdit) {
      update({ id: maison.id, data: cleanData }, {
        onSuccess: () => {
          if (files.length > 0) {
            ajouterImages({ id: maison.id, files });
          }
          onOpenChange(false);
        },
      });
    } else {
      create(cleanData, {
        onSuccess: async (res) => {
          let newId = res.data?.data?.id || res.data?.id || res.data?.reference;
          // API create may not return id — fetch latest maison to find it
          if (!newId && files.length > 0) {
            try {
              const listRes = await api.get(PROPERTIES.LIST, { params: { page_size: 1, ordering: '-created_at' } });
              const latest = listRes.data?.results?.[0] || listRes.data?.data?.results?.[0];
              newId = latest?.id;
            } catch { /* ignore */ }
          }
          if (files.length > 0 && newId) {
            ajouterImages({ id: newId, files });
          }
          reset();
          setFiles([]);
          setPreviews([]);
          onOpenChange(false);
        },
      });
    }
  };

  const totalImages = existingImages.length + files.length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); previews.forEach(p => URL.revokeObjectURL(p.url)); setPreviews([]); setFiles([]); } onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier la maison' : 'Ajouter une maison'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-1">
              <Label>Titre *</Label>
              <Input placeholder="Bel appartement F3 - Cocody" {...register('titre')} />
              {errors.titre && <p className="text-xs text-red-500">{errors.titre.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Type *</Label>
              <Select onValueChange={(v) => setValue('type_logement', v)} defaultValue={maison?.type_logement}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {['STUDIO', 'F1', 'F2', 'F3', 'F4', 'F5', 'VILLA', 'DUPLEX', 'APPARTEMENT'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type_logement && <p className="text-xs text-red-500">{errors.type_logement.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Statut</Label>
              <Select onValueChange={(v) => setValue('statut', v)} defaultValue={maison?.statut || 'DISPONIBLE'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Prix mensuel (FCFA) *</Label>
              <Input type="number" placeholder="150000" {...register('prix')} />
              {errors.prix && <p className="text-xs text-red-500">{errors.prix.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Caution (FCFA)</Label>
              <Input type="number" placeholder="300000" {...register('caution')} />
            </div>

            <div className="space-y-1">
              <Label>Commune *</Label>
              <Input placeholder="Cocody" {...register('commune')} />
              {errors.commune && <p className="text-xs text-red-500">{errors.commune.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Quartier</Label>
              <Input placeholder="Angré" {...register('quartier')} />
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Adresse complète</Label>
              <Input placeholder="7ème tranche, lot 123" {...register('adresse')} />
            </div>

            <div className="space-y-1">
              <Label>Superficie (m²)</Label>
              <Input type="number" placeholder="75" {...register('superficie')} />
            </div>

            <div className="space-y-1">
              <Label>Chambres</Label>
              <Input type="number" placeholder="3" {...register('nombre_chambres')} />
            </div>

            <div className="space-y-1">
              <Label>Salles de bain</Label>
              <Input type="number" placeholder="2" {...register('nombre_salles_bain')} />
            </div>

            <div className="space-y-1 flex items-center gap-2 pt-5">
              <input type="checkbox" id="meublee" {...register('meublee')} className="h-4 w-4" />
              <Label htmlFor="meublee">Meublée</Label>
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Description</Label>
              <Textarea placeholder="Décrivez le bien..." rows={3} {...register('description')} />
            </div>

            {/* ── Images Section ── */}
            <div className="col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Images ({totalImages}/10)</Label>
                {totalImages < 10 && (
                  <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-navy-800 bg-navy-50 hover:bg-navy-100 px-3 py-1.5 rounded-lg transition-colors">
                    <Image className="h-3.5 w-3.5" />
                    Ajouter des images
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFilesChange}
                    />
                  </label>
                )}
              </div>

              {/* Existing images (edit mode) */}
              {existingImages.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Images actuelles</p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {existingImages.map((img, i) => (
                      <div key={img.id || i} className="relative aspect-square rounded-lg overflow-hidden bg-muted border">
                        <img
                          src={getImageUrl(img)}
                          alt={img.legende || `Image ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {img.est_principale && (
                          <span className="absolute top-1 left-1 bg-navy-800 text-white text-[10px] px-1.5 py-0.5 rounded">Principale</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New images preview */}
              {previews.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Nouvelles images à uploader</p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {previews.map((p, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed border-navy-300">
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewFile(i)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none"
                        >
                          ×
                        </button>
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                          {p.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalImages === 0 && (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Image className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune image</p>
                  <p className="text-xs text-muted-foreground mt-1">Cliquez sur "Ajouter des images" ci-dessus (max 10, formats JPG/PNG/WEBP)</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="navy" disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminMaisons() {
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editMaison, setEditMaison] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useMaisons({ search: search || undefined, statut: statut || undefined, page, page_size: 10 });
  // Fetch ALL maisons (no filter) to compute accurate stats
  const { data: allMaisonsData } = useMaisons({ page_size: 200 });
  const { mutate: deleteMaison, isPending: isDeleting } = useDeleteMaison();
  const { data: rentalsData } = useLocationsActives();
  const rentals = rentalsData?.results || rentalsData?.data?.results || rentalsData?.data || [];
  const rentalByMaison = new Map();
  rentals.forEach(r => {
    const mid = r.maison;
    if (!rentalByMaison.has(mid)) rentalByMaison.set(mid, []);
    rentalByMaison.get(mid).push(r);
  });
  
  
  const getImageUrl = (url) => {
    if (!url) return null;
    if (typeof url !== 'string') return null;
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL || 'https://gestion-locative-fqax.onrender.com';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

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
  const totalPages = Math.ceil(total / 10);

  // Stats from ALL maisons (unfiltered)
  const toutesLesMaisons = extractMaisons(allMaisonsData);
  const statsTotal = toutesLesMaisons.length || total;
  const statsDisponibles = toutesLesMaisons.filter(m => m.statut === 'DISPONIBLE').length;
  const statsOccupees = toutesLesMaisons.filter(m => m.statut === 'LOUEE').length;
  const statsMaintenance = toutesLesMaisons.filter(m => m.statut === 'EN_MAINTENANCE').length;

  const handleEdit = (maison) => {
    setEditMaison(maison);
    setFormOpen(true);
  };

  const handleDelete = () => {
    deleteMaison(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des maisons"
        description={`${total} bien(s) au total`}
        actions={
          <Button variant="navy" onClick={() => { setEditMaison(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une maison
          </Button>
        }
      />

      {/* Stats — cliquables pour filtrer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button onClick={() => { setStatut(''); setPage(1); }} className="text-left">
          <StatCard title="Total" value={statsTotal} icon={Building} color="navy" />
        </button>
        <button onClick={() => { setStatut('DISPONIBLE'); setPage(1); }} className="text-left">
          <StatCard title="Disponibles" value={statsDisponibles} icon={Home} color="green" />
        </button>
        <button onClick={() => { setStatut('LOUEE'); setPage(1); }} className="text-left">
          <StatCard title="Occupées" value={statsOccupees} icon={Home} color="maroon" />
        </button>
        <button onClick={() => { setStatut('EN_MAINTENANCE'); setPage(1); }} className="text-left">
          <StatCard title="Maintenance" value={statsMaintenance} icon={Home} color="orange" />
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une maison..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={statut || 'ALL'} onValueChange={(v) => { setStatut(v === 'ALL' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : maisons.length === 0 ? (
            <EmptyState
              icon={Home}
              title="Aucune maison"
              description="Ajoutez votre premier bien immobilier."
              action={
                <Button variant="navy" onClick={() => { setEditMaison(null); setFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Ajouter
                </Button>
              }
              className="py-16"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Maison</TableHead>
                      <TableHead className="hidden sm:table-cell">Localisation</TableHead>
                      <TableHead className="hidden sm:table-cell">Locataire</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maisons.map((maison) => {
                      const mainImg = getImageUrl(maison.image_principale);
                      return (
                        <TableRow key={maison.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                {mainImg ? (
                                  <img src={mainImg} alt="" className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Home className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-navy-800 text-sm line-clamp-1">{maison.titre}</p>
                                <p className="text-xs text-muted-foreground">{maison.nombre_chambres} ch. · {maison.superficie} m²</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {maison.commune}{maison.quartier ? `, ${maison.quartier}` : ''}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {rentalByMaison.get(maison.id)?.[0]?.locataire_nom || '-'}
                          </TableCell>
                          <TableCell className="font-semibold text-sm text-navy-800">
                            {formatCurrency(maison.prix)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_VARIANTS[maison.statut] || 'secondary'} className="text-xs">
                              {STATUS_LABELS[maison.statut] || maison.statut}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                            {maison.type_logement}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleEdit(maison)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setDeleteId(maison.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">{total} maison(s)</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                      Précédent
                    </Button>
                    <span className="text-xs text-muted-foreground flex items-center px-2">
                      {page} / {totalPages}
                    </span>
                    <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Form dialog */}
      {formOpen && (
        <MaisonForm
          maison={editMaison}
          open={formOpen}
          onOpenChange={(v) => {
            setFormOpen(v);
            if (!v) setEditMaison(null);
          }}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Supprimer la maison"
        description="Cette action est irréversible. Toutes les données associées seront supprimées."
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
