import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../axios';
import { NOTIFICATIONS } from '../endpoints';
import useNotifStore from '../../store/notifStore';
import { toast } from 'sonner';

function extractErrorMessage(error) {
  const data = error?.response?.data;
  if (typeof data === 'string') return data;
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (data?.non_field_errors) return data.non_field_errors.join(', ');
  if (error?.message) return error.message;
  return 'Erreur inconnue';
}

export const useNotifications = (filters = {}) => {
  const { setNotifications } = useNotifStore();
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: async () => {
      const r = await api.get(NOTIFICATIONS.LIST, { params: filters });
      const data = r.data;
      const list = data?.data?.results || data?.data || data?.results || [];
      setNotifications(Array.isArray(list) ? list : []);
      return data;
    },
    refetchInterval: 60000,
  });
};

export const useNotificationsNonLues = (options = {}) => {
  const { setUnreadCount } = useNotifStore();
  const { enabled = true } = options;
  return useQuery({
    queryKey: ['notifications-non-lues'],
    queryFn: async () => {
      const r = await api.get(NOTIFICATIONS.NON_LUES);
      const count = r.data?.data?.count ?? r.data?.count ?? 0;
      setUnreadCount(count);
      return count;
    },
    refetchInterval: 30000,
    enabled,
  });
};

export const useMarquerLue = () => {
  const qc = useQueryClient();
  const { markAsRead } = useNotifStore();
  return useMutation({
    mutationFn: (id) => api.post(NOTIFICATIONS.MARQUER_LUE(id)),
    onMutate: (id) => {
      // Optimistic: mark as read immediately in store
      markAsRead(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-non-lues'] });
    },
    onError: () => {
      // Silently handle - optimistic update already applied
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-non-lues'] });
    },
  });
};

export const useMarquerToutesLues = () => {
  const qc = useQueryClient();
  const { markAllAsRead } = useNotifStore();
  return useMutation({
    mutationFn: () => api.post(NOTIFICATIONS.MARQUER_TOUTES),
    onMutate: () => {
      markAllAsRead();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-non-lues'] });
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-non-lues'] });
    },
  });
};

export const useEnvoyerNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(NOTIFICATIONS.ENVOYER, data),
    onSuccess: () => {
      toast.success('Notification envoyee avec succes');
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-non-lues'] });
    },
    onError: (error) => {
      toast.error(`Echec de l'envoi: ${extractErrorMessage(error)}`);
    },
  });
};

export const useEnvoyerNotifTousLocataires = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(NOTIFICATIONS.ENVOYER_TOUS, data),
    onSuccess: () => {
      toast.success('Notifications envoyees a tous les locataires');
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-non-lues'] });
    },
    onError: (error) => {
      toast.error(`Echec de l'envoi: ${extractErrorMessage(error)}`);
    },
  });
};

export const useSupprimerNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(NOTIFICATIONS.BY_ID(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-non-lues'] });
      toast.success('Notification supprimee');
    },
    onError: () => {
      // Silently handle - refetch to restore correct state
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-non-lues'] });
    },
  });
};

export const useSupprimerNotifLues = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(NOTIFICATIONS.SUPPRIMER_LUES),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-non-lues'] });
      toast.success('Notifications lues supprimees');
    },
    onError: (error) => {
      toast.error(`Echec de la suppression: ${extractErrorMessage(error)}`);
    },
  });
};
