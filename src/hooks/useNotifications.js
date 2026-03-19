import { useEffect } from 'react';
import useNotifStore from '@/lib/store/notifStore';
import { useNotificationsNonLues } from '@/lib/api/queries/notifications';
import useAuth from './useAuth';

const useNotifications = () => {
  const { unreadCount, notifications } = useNotifStore();
  const { isAuthenticated } = useAuth();
  const { data } = useNotificationsNonLues({ enabled: isAuthenticated });

  return { unreadCount, notifications };
};

export default useNotifications;
