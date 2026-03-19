import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../axios';
import { USERS } from '../endpoints';
import { toast } from 'sonner';

export const useMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.get(USERS.ME).then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });
};

export const useUsers = (filters = {}) => {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => api.get(USERS.LIST, { params: filters }).then(r => r.data),
  });
};

export const useLocataires = () => {
  return useQuery({
    queryKey: ['locataires'],
    queryFn: () => api.get(USERS.LOCATAIRES).then(r => r.data),
    staleTime: 1000 * 60 * 2,
  });
};

export const useUser = (id) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => api.get(USERS.BY_ID(id)).then(r => r.data),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(USERS.LIST, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['locataires'] });
      toast.success('Utilisateur créé avec succès');
    },
    onError: (error) => {
      const errors = error.response?.data?.errors;
      if (errors) Object.values(errors).flat().forEach(m => toast.error(m));
      else toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(USERS.BY_ID(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur modifié');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    },
  });
};

export const useUpdateUserStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut }) => api.patch(USERS.STATUS(id), { statut }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['locataires'] });
      qc.invalidateQueries({ queryKey: ['factures'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Statut mis à jour');
    },
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(USERS.BY_ID(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['locataires'] });
      toast.success('Locataire supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
};
