import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../axios';
import { RESERVATIONS } from '../endpoints';
import { toast } from 'sonner';

export const useReservations = (filters = {}) => {
  return useQuery({
    queryKey: ['reservations', filters],
    queryFn: () => api.get(RESERVATIONS.LIST, { params: filters }).then(r => r.data),
  });
};

export const useCreateReservation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(RESERVATIONS.LIST, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-non-lues'] });
      toast.success('Demande de visite envoyee avec succes !');
    },
    onError: (error) => {
      const data = error.response?.data;
      console.error('Reservation error full response:', JSON.stringify(data, null, 2));

      if (data && typeof data === 'object') {
        // Try details, errors, detail (different backend formats)
        const errors = data.details || data.errors || data.detail;
        if (errors && typeof errors === 'object') {
          const messages = Object.entries(errors)
            .map(([key, val]) => {
              const v = Array.isArray(val) ? val.join(', ') : typeof val === 'object' ? JSON.stringify(val) : val;
              return `${key}: ${v}`;
            })
            .join(' | ');
          if (messages) {
            toast.error(messages);
            return;
          }
        }
        if (typeof errors === 'string') {
          toast.error(errors);
          return;
        }
      }
      toast.error(data?.message || 'Erreur lors de la reservation');
    },
  });
};
