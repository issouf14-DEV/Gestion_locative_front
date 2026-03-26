import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../axios';
import { AUTH } from '../endpoints';
import useAuthStore from '../../store/authStore';
import { toast } from 'sonner';

export const useLogin = () => {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials) => api.post(AUTH.LOGIN, credentials),
    onSuccess: (response) => {
      const { user, tokens, access, refresh } = response.data.data || response.data;
      const accessToken = tokens?.access || access;
      const refreshToken = tokens?.refresh || refresh;
      setAuth(user, accessToken, refreshToken);
      queryClient.invalidateQueries();
      toast.success('Connexion réussie');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Email ou mot de passe incorrect';
      toast.error(message);
    },
  });
};

export const useRegister = () => {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.post(AUTH.REGISTER, data),
    onSuccess: (response) => {
      const payload = response.data?.data || response.data;
      const accessToken = payload?.tokens?.access || payload?.access;
      const refreshToken = payload?.tokens?.refresh || payload?.refresh;
      if (accessToken && payload?.user) {
        setAuth(payload.user, accessToken, refreshToken);
        queryClient.invalidateQueries();
        toast.success('Compte créé avec succès !');
      } else {
        toast.success('Compte créé avec succès. Veuillez vous connecter.');
      }
    },
    onError: (error) => {
      const errors = error.response?.data?.errors;
      if (errors) {
        Object.values(errors).flat().forEach(msg => toast.error(msg));
      } else {
        toast.error(error.response?.data?.message || 'Erreur lors de la création du compte');
      }
    },
  });
};

export const useLogout = () => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post(AUTH.LOGOUT),
    onSettled: () => {
      logout();
      queryClient.clear();
    },
  });
};

export const usePasswordChange = () => {
  return useMutation({
    mutationFn: (data) => api.post(AUTH.PASSWORD_CHANGE, data),
    onSuccess: () => toast.success('Mot de passe modifié avec succès'),
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de mot de passe');
    },
  });
};

export const useGoogleAuth = () => {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.post(AUTH.GOOGLE, data),
    onSuccess: (response) => {
      const { user, tokens, access, refresh } = response.data.data || response.data;
      const accessToken = tokens?.access || access;
      const refreshToken = tokens?.refresh || refresh;
      setAuth(user, accessToken, refreshToken);
      queryClient.invalidateQueries();
      toast.success('Connexion via Google reussie');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erreur lors de la connexion Google';
      toast.error(message);
    },
  });
};

export const usePasswordReset = () => {
  return useMutation({
    mutationFn: (data) => api.post(AUTH.PASSWORD_RESET, data),
    onSuccess: () => toast.success('Email de réinitialisation envoyé'),
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi');
    },
  });
};
