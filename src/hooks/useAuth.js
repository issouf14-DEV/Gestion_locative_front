import useAuthStore from '@/lib/store/authStore';

const useAuth = () => {
  const { user, isAuthenticated, isAdmin, isLocataire, logout, setAuth, updateUser } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isAdmin: isAdmin(),
    isLocataire: isLocataire(),
    logout,
    setAuth,
    updateUser,
    role: user?.role,
  };
};

export default useAuth;
