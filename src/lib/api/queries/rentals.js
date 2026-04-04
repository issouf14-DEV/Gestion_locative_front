import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../axios';
import { RENTALS } from '../endpoints';
import { toast } from 'sonner';

export const useLocations = (filters = {}) => {
  return useQuery({
    queryKey: ['locations', filters],
    queryFn: () => api.get(RENTALS.LIST, { params: filters }).then(r => r.data),
  });
};

export const useMaLocation = () => {
  return useQuery({
    queryKey: ['ma-location'],
    queryFn: () => api.get(RENTALS.MA_LOCATION).then(r => r.data),
  });
};

export const useLocation = (id) => {
  return useQuery({
    queryKey: ['locations', id],
    queryFn: () => api.get(RENTALS.BY_ID(id)).then(r => r.data),
    enabled: !!id,
  });
};

export const useLocationsActives = () => {
  return useQuery({
    queryKey: ['locations', 'actives'],
    queryFn: () => api.get(RENTALS.ACTIVES).then(r => r.data),
  });
};

export const useCreateLocation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(RENTALS.LIST, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] });
      qc.invalidateQueries({ queryKey: ['maisons'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['locataires'] });
      toast.success('Location créée avec succès');
    },
    onError: (error) => {
      const data = error.response?.data;
      if (data?.errors) {
        Object.values(data.errors).flat().forEach(m => toast.error(m));
      } else if (data && typeof data === 'object' && !data.message) {
        // DRF renvoie parfois {champ: ["erreur"]} directement
        Object.entries(data).forEach(([k, v]) => {
          const msgs = Array.isArray(v) ? v : [v];
          msgs.forEach(m => toast.error(`${k} : ${m}`));
        });
      } else {
        toast.error(data?.message || data?.detail || 'Erreur lors de la création de la location');
      }
    },
  });
};

export const useRenouvelerLocation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, duree, notes }) => api.post(RENTALS.RENOUVELER(id), {
      duree_supplementaire_mois: duree,
      ...(notes ? { notes } : {}),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] });
      qc.invalidateQueries({ queryKey: ['ma-location'] });
      toast.success('Demande de renouvellement envoyée');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors du renouvellement');
    },
  });
};

export const useResilierLocation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, raison }) => api.post(RENTALS.RESILIER(id), { raison }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations'] });
      qc.invalidateQueries({ queryKey: ['maisons'] });
      toast.success('Location résiliée');
    },
  });
};

export const useStatsLocations = () => {
  return useQuery({
    queryKey: ['locations-stats'],
    queryFn: () => api.get(RENTALS.STATS).then(r => r.data),
  });
};
