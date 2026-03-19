import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../axios';
import { PAYMENTS } from '../endpoints';
import { toast } from 'sonner';

export const usePaiements = (filters = {}) => {
  return useQuery({
    queryKey: ['paiements', filters],
    queryFn: () => api.get(PAYMENTS.LIST, { params: filters }).then(r => r.data),
  });
};

export const useMesPaiements = () => {
  return useQuery({
    queryKey: ['mes-paiements'],
    queryFn: () => api.get(PAYMENTS.MES_PAIEMENTS).then(r => r.data),
  });
};

export const usePaiementsEnAttente = () => {
  return useQuery({
    queryKey: ['paiements', 'en-attente'],
    queryFn: () => api.get(PAYMENTS.EN_ATTENTE).then(r => r.data),
    refetchInterval: 30000,
  });
};

export const useSoumettrePayement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, preuve }) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) formData.append(key, val);
      });
      if (preuve) formData.append('preuve_paiement', preuve);
      return api.post(PAYMENTS.LIST, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mes-paiements'] });
      qc.invalidateQueries({ queryKey: ['paiements'] });
      toast.success('Paiement soumis. En attente de validation (24-48h)');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la soumission');
    },
  });
};

export const useValiderPaiement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, commentaire }) => api.post(PAYMENTS.VALIDER(id), { commentaire }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paiements'] });
      toast.success('Paiement validé ✅');
    },
    onError: () => toast.error('Erreur lors de la validation'),
  });
};

export const useRejeterPaiement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, commentaire }) => api.post(PAYMENTS.REJETER(id), { commentaire }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paiements'] });
      toast.success('Paiement rejeté');
    },
    onError: () => toast.error('Erreur lors du rejet'),
  });
};

export const useStatsPaiements = (filters = {}) => {
  return useQuery({
    queryKey: ['paiements-stats', filters],
    queryFn: () => api.get(PAYMENTS.STATS, { params: filters }).then(r => r.data),
  });
};

export const useEncaisserLoyer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(PAYMENTS.ENCAISSER_LOYER, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paiements'] });
      qc.invalidateQueries({ queryKey: ['factures'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Loyer encaissé avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'encaissement');
    },
  });
};

export const useEncaisserFacture = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(PAYMENTS.ENCAISSER_FACTURE, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paiements'] });
      qc.invalidateQueries({ queryKey: ['factures'] });
      toast.success('Facture encaissée avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'encaissement');
    },
  });
};

export const useFacturesImpayees = (locataireId) => {
  return useQuery({
    queryKey: ['factures-impayees', locataireId],
    queryFn: () => api.get(PAYMENTS.FACTURES_IMPAYEES, {
      params: locataireId ? { locataire_id: locataireId } : {}
    }).then(r => r.data),
  });
};
