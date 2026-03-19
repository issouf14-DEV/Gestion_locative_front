import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@/lib/api/queries/users';
import { usePaiements, useValiderPaiement, useRejeterPaiement } from '@/lib/api/queries/payments';
import { useFactures } from '@/lib/api/queries/billing';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import PageHeader from '@/components/common/PageHeader';


function ValiderPaiementDialog({ paiement, open, onOpenChange }) {
  const [commentaire, setCommentaire] = useState('');
  const { mutate: valider, isPending } = useValiderPaiement();
  const { mutate: rejeter, isPending: isRejecting } = useRejeterPaiement();

  const handleValider = () => {
    valider({ id: paiement.id, commentaire }, { onSuccess: () => onOpenChange(false) });
  };

  const handleRejeter = () => {
    if (!commentaire.trim()) return;
    rejeter({ id: paiement.id, commentaire }, { onSuccess: () => onOpenChange(false) });
  };

  if (!paiement) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Valider le paiement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant</span>
              <span className="font-semibold text-navy-800">{formatCurrency(paiement.montant)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mode</span>
              <span>{paiement.mode_paiement}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Référence</span>
              <span>{paiement.reference_paiement || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date soumission</span>
              <span>{formatDate(paiement.created_at || paiement.date_soumission)}</span>
            </div>
          </div>

          {paiement.preuve_paiement && (
            <div className="space-y-1">
              <Label>Preuve de paiement</Label>
              <a
                href={paiement.preuve_paiement}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <img
                  src={paiement.preuve_paiement}
                  alt="Preuve"
                  className="max-h-48 w-full object-contain border rounded-lg bg-gray-50"
                />
              </a>
            </div>
          )}

          <div className="space-y-1">
            <Label>Commentaire</Label>
            <Textarea
              placeholder="Commentaire optionnel (requis si rejet)..."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          <Button
            variant="destructive"
            onClick={handleRejeter}
            disabled={isRejecting || !commentaire.trim()}
          >
            {isRejecting ? 'Rejet...' : '✗ Rejeter'}
          </Button>
          <Button
            variant="navy"
            onClick={handleValider}
            disabled={isPending}
          >
            {isPending ? 'Validation...' : '✓ Valider'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function AdminLocataireDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [validerPaiement, setValiderPaiement] = useState(null);

  const { data: userData, isLoading: userLoading } = useUser(id);
  const { data: paiementsData } = usePaiements({ locataire: id });
  const { data: facturesData } = useFactures({ locataire: id });

  const user = userData?.data || userData;
  const paiements = paiementsData?.data?.results || paiementsData?.results || paiementsData?.data || [];
  const factures = facturesData?.data?.results || facturesData?.results || facturesData?.data || [];

  const paiementsEnAttente = paiements.filter(p => p.statut === 'EN_ATTENTE');
  const facturesImpayees = factures.filter(f => f.statut === 'IMPAYEE');
  const totalDette = facturesImpayees.reduce((s, f) => s + Number(f.montant || 0), 0);

  // Determine payment status from real factures (current month)
  const now = new Date();
  const currentMois = now.getMonth() + 1;
  const currentAnnee = now.getFullYear();
  const currentFactures = factures.filter(f => Number(f.mois) === currentMois && Number(f.annee) === currentAnnee);
  const loyerFacture = currentFactures.find(f => f.type_facture === 'LOYER');
  const sodeciFacture = currentFactures.find(f => f.type_facture === 'SODECI');

  // Also check localStorage for admin-validated payments
  let localValidation = {};
  try { localValidation = JSON.parse(localStorage.getItem(`locataire_statut_${id}_${currentMois}_${currentAnnee}`) || '{}'); } catch {}

  const loyerPaye = loyerFacture?.statut === 'PAYEE' || localValidation.loyer === true;
  const sodeciPaye = sodeciFacture?.statut === 'PAYEE' || localValidation.sodeci === true;

  if (userLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Locataire introuvable</p>
        <Button variant="navy" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
      </div>
    );
  }

  const location = user.location_active || user.location;
  const dureeTotale = location?.duree_mois ? location.duree_mois * 30 : 365;
  const debut = location?.date_debut ? new Date(location.date_debut) : null;
  const fin = debut ? new Date(debut.getTime() + dureeTotale * 24 * 60 * 60 * 1000) : null;
  const joursRestants = fin ? Math.max(0, Math.ceil((fin - new Date()) / (1000 * 60 * 60 * 24))) : null;
  const progressLocation = joursRestants !== null && dureeTotale > 0
    ? Math.round(((dureeTotale - joursRestants) / dureeTotale) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${user.prenoms} ${user.nom}`}
        description="Détails du locataire"
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        }
      />

      {/* Row 1: Infos + Location + Statut */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Infos perso */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-navy-800">Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Email :</span> <span className="ml-1">{user.email}</span></div>
            <div><span className="text-muted-foreground">Téléphone :</span> <span className="ml-1">{user.telephone}</span></div>
            <div>
              <span className="text-muted-foreground">Statut :</span>
              <Badge variant={user.statut === 'ACTIF' ? 'success' : 'secondary'} className="ml-2 text-xs">
                {user.statut}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Inscrit le :</span>
              <span className="ml-1">{formatDate(user.created_at || user.date_joined)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-navy-800">Location actuelle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {location ? (
              <>
                <div><span className="text-muted-foreground">Maison :</span> <span className="ml-1 font-medium">{location.maison?.titre || location.maison_titre || '-'}</span></div>
                <div><span className="text-muted-foreground">Loyer :</span> <span className="ml-1 font-semibold text-navy-800">{formatCurrency(location.loyer_mensuel)}</span></div>
                <div><span className="text-muted-foreground">Début :</span> <span className="ml-1">{formatDate(location.date_debut)}</span></div>
                {fin && <div><span className="text-muted-foreground">Fin :</span> <span className="ml-1">{formatDate(fin)}</span></div>}
                {joursRestants !== null && (
                  <div>
                    <div className="flex justify-between text-xs mb-1 mt-2">
                      <span className="text-muted-foreground">Durée écoulée</span>
                      <span className="font-medium">{joursRestants}j restants</span>
                    </div>
                    <Progress value={progressLocation} className="h-2" />
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-xs">Aucune location active</p>
            )}
          </CardContent>
        </Card>

        {/* Statut charges */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-navy-800">Statut des charges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { label: 'Loyer', paye: loyerPaye },
              { label: 'SODECI', paye: sodeciPaye },
            ].map(({ label, paye }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-muted-foreground">{label}</span>
                {paye ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Payé</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-500">
                    <XCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Impayé</span>
                  </div>
                )}
              </div>
            ))}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total dettes</span>
              <span className={`font-bold text-sm ${totalDette > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(totalDette)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Paiements en attente */}
      {paiementsEnAttente.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-navy-800 flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Paiements en attente de validation ({paiementsEnAttente.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Preuve</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paiementsEnAttente.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{formatDate(p.created_at || p.date_soumission)}</TableCell>
                      <TableCell className="font-semibold text-navy-800">{formatCurrency(p.montant)}</TableCell>
                      <TableCell className="text-sm">{p.mode_paiement}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.reference_paiement || '-'}</TableCell>
                      <TableCell>
                        {p.preuve_paiement ? (
                          <a href={p.preuve_paiement} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                              <Eye className="h-3 w-3 mr-1" /> Voir
                            </Button>
                          </a>
                        ) : <span className="text-xs text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="navy"
                            className="h-7 px-2 text-xs"
                            onClick={() => setValiderPaiement(p)}
                          >
                            Traiter
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}


      {validerPaiement && (
        <ValiderPaiementDialog
          paiement={validerPaiement}
          open={!!validerPaiement}
          onOpenChange={(v) => !v && setValiderPaiement(null)}
        />
      )}

    </div>
  );
}
