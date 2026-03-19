import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../axios';
import { BILLING } from '../endpoints';
import { toast } from 'sonner';

export const useFactures = (filters = {}) => {
  return useQuery({
    queryKey: ['factures', filters],
    queryFn: () => api.get(BILLING.FACTURES, { params: filters }).then(r => r.data),
  });
};

export const useFacture = (id) => {
  return useQuery({
    queryKey: ['factures', id],
    queryFn: () => api.get(BILLING.FACTURE_BY_ID(id)).then(r => r.data),
    enabled: !!id,
  });
};

export const useRepartirFacture = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(BILLING.REPARTIR, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] });
      toast.success('Factures générées et envoyées avec succès ✅');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la génération des factures');
    },
  });
};

export const useCreateFacture = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(BILLING.FACTURES, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] });
      toast.success('Facture créée avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });
};

export const useCompteurs = (filters = {}) => {
  return useQuery({
    queryKey: ['compteurs', filters],
    queryFn: () => api.get(BILLING.COMPTEURS, { params: filters }).then(r => r.data),
  });
};

export const useCompteursLocataire = (locataireId) => {
  return useQuery({
    queryKey: ['compteurs', 'locataire', locataireId],
    queryFn: () => api.get(BILLING.COMPTEURS_PAR_LOCATAIRE, {
      params: { locataire_id: locataireId }
    }).then(r => r.data),
    enabled: !!locataireId,
  });
};

export const useCreateCompteur = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(BILLING.COMPTEURS, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compteurs'] });
      toast.success('Compteur créé');
    },
  });
};

export const useAssignerCompteur = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(BILLING.COMPTEUR_ASSIGNER, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compteurs'] });
      toast.success('Compteur assigné au locataire');
    },
  });
};

export const useEnvoyerNotifFacture = () => {
  return useMutation({
    mutationFn: ({ id, canaux }) => api.post(BILLING.FACTURE_NOTIF(id), { canaux }),
    onSuccess: () => toast.success('Notification envoyée'),
    onError: () => toast.error('Erreur lors de l\'envoi de la notification'),
  });
};

export const useTelechargerPdfFacture = () => {
  return useMutation({
    mutationFn: async ({ id, reference }) => {
      const response = await api.get(BILLING.FACTURE_PDF(id), { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture_${reference || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success('PDF téléchargé'),
    onError: () => toast.error('Erreur lors du téléchargement'),
  });
};

export const useRapportMensuel = () => {
  return useMutation({
    mutationFn: async ({ mois, annee }) => {
      const response = await api.get(BILLING.RAPPORT_MENSUEL, {
        params: { mois, annee },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport_${mois}_${annee}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success('Rapport téléchargé'),
    onError: () => toast.error('Le rapport mensuel n\'est pas disponible pour cette période. Vérifiez qu\'il y a des données.'),
  });
};

export const useGenererLoyers = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(BILLING.GENERER_LOYERS, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] });
    },
  });
};

export const useIndexCompteurs = (filters = {}) => {
  return useQuery({
    queryKey: ['index-compteurs', filters],
    queryFn: () => api.get(BILLING.INDEX_COMPTEURS, { params: filters }).then(r => r.data),
  });
};

export const useDeleteFacture = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(BILLING.FACTURE_BY_ID(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factures'] });
      toast.success('Facture supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
};

export const useCreateIndexCompteur = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(BILLING.INDEX_COMPTEURS, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['index-compteurs'] });
      toast.success('Index enregistré');
    },
  });
};
