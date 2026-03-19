import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../axios';
import { EXPENSES } from '../endpoints';
import { toast } from 'sonner';

export const useDepenses = (filters = {}) => {
  return useQuery({
    queryKey: ['depenses', filters],
    queryFn: () => api.get(EXPENSES.LIST, { params: filters }).then(r => r.data),
  });
};

export const useDepense = (id) => {
  return useQuery({
    queryKey: ['depenses', id],
    queryFn: () => api.get(EXPENSES.BY_ID(id)).then(r => r.data),
    enabled: !!id,
  });
};

export const useCreateDepense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) formData.append(key, val);
      });
      return api.post(EXPENSES.LIST, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['depenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard-admin'] });
      toast.success('Dépense ajoutée avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout');
    },
  });
};

export const useUpdateDepense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.patch(EXPENSES.BY_ID(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['depenses'] });
      toast.success('Dépense modifiée');
    },
  });
};

export const useDeleteDepense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(EXPENSES.BY_ID(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['depenses'] });
      toast.success('Dépense supprimée');
    },
  });
};
