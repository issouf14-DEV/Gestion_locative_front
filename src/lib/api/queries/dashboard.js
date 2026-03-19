import { useQuery } from '@tanstack/react-query';
import api from '../axios';
import { DASHBOARD } from '../endpoints';

export const useDashboardAdmin = (params = {}) => {
  return useQuery({
    queryKey: ['dashboard-admin', params],
    queryFn: () => api.get(DASHBOARD.ADMIN, { params }).then(r => r.data),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });
};

export const useDashboardLocataire = () => {
  return useQuery({
    queryKey: ['dashboard-locataire'],
    queryFn: () => api.get(DASHBOARD.LOCATAIRE).then(r => r.data),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    refetchOnWindowFocus: true,
  });
};
