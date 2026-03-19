import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../axios';
import { PROPERTIES } from '../endpoints';
import { toast } from 'sonner';

export const useMaisons = (filters = {}) => {
  return useQuery({
    queryKey: ['maisons', filters],
    queryFn: () => api.get(PROPERTIES.LIST, { params: filters }).then(r => r.data),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
  });
};

export const useMaisonsDisponibles = () => {
  return useQuery({
    queryKey: ['maisons', 'disponibles'],
    queryFn: () => api.get(PROPERTIES.DISPONIBLES).then(r => r.data),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
  });
};

export const useMaison = (id) => {
  return useQuery({
    queryKey: ['maisons', id],
    queryFn: () => api.get(PROPERTIES.BY_ID(id)).then(r => r.data),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useCreateMaison = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(PROPERTIES.LIST, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maisons'] });
      toast.success('Maison créée avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });
};

export const useUpdateMaison = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(PROPERTIES.BY_ID(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maisons'] });
      toast.success('Maison modifiée avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    },
  });
};

export const useDeleteMaison = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(PROPERTIES.BY_ID(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maisons'] });
      toast.success('Maison supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
};

export const useAjouterImages = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, files }) => {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      return api.post(PROPERTIES.IMAGES(id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['maisons', id] });
      toast.success('Images ajoutées');
    },
  });
};

export const useChangerStatutMaison = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut }) => api.patch(PROPERTIES.STATUT(id), { statut }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maisons'] });
      toast.success('Statut mis à jour');
    },
  });
};
