import { create } from 'zustand';

const useNotifStore = create((set) => ({
  unreadCount: 0,
  notifications: [],

  setUnreadCount: (count) => set({ unreadCount: count }),

  setNotifications: (notifications) => set({ notifications }),

  addNotification: (notif) =>
    set((state) => ({
      notifications: [notif, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, lu: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, lu: true })),
      unreadCount: 0,
    })),
}));

export default useNotifStore;
