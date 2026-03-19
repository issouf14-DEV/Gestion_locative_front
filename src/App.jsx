import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import useAuth from '@/hooks/useAuth';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Public pages
const Home = lazy(() => import('@/pages/public/Home'));
const MaisonDetails = lazy(() => import('@/pages/public/MaisonDetails'));
const Login = lazy(() => import('@/pages/public/Login'));
const Register = lazy(() => import('@/pages/public/Register'));
const ForgotPassword = lazy(() => import('@/pages/public/ForgotPassword'));

// Admin pages
const AdminLayout = lazy(() => import('@/components/layout/AdminLayout'));
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminMaisons = lazy(() => import('@/pages/admin/Maisons'));
const AdminLocataires = lazy(() => import('@/pages/admin/Locataires'));
const AdminLocataireDetail = lazy(() => import('@/pages/admin/LocataireDetail'));
const AdminFactures = lazy(() => import('@/pages/admin/Factures'));
const AdminDepenses = lazy(() => import('@/pages/admin/Depenses'));
const AdminLoyers = lazy(() => import('@/pages/admin/Loyers'));
const AdminNotifications = lazy(() => import('@/pages/admin/Notifications'));
const AdminProfil = lazy(() => import('@/pages/admin/Profil'));

// Tenant pages
const TenantLayout = lazy(() => import('@/components/layout/TenantLayout'));
const TenantDashboard = lazy(() => import('@/pages/tenant/Dashboard'));
const TenantCharges = lazy(() => import('@/pages/tenant/Charges'));
const TenantPaiement = lazy(() => import('@/pages/tenant/Paiement'));
const TenantProlongation = lazy(() => import('@/pages/tenant/Prolongation'));
const TenantProfil = lazy(() => import('@/pages/tenant/Profil'));
const TenantNotifications = lazy(() => import('@/pages/tenant/Notifications'));

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'ADMIN' ? '/admin/dashboard' : '/tenant/dashboard'} replace />;
  }
  return children;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, role } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={role === 'ADMIN' ? '/admin/dashboard' : '/tenant/dashboard'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Suspense fallback={<LoadingSpinner fullPage />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/maisons/:id" element={<MaisonDetails />} />
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
          <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="maisons" element={<AdminMaisons />} />
            <Route path="locataires" element={<AdminLocataires />} />
            <Route path="locataires/:id" element={<AdminLocataireDetail />} />
            <Route path="factures" element={<AdminFactures />} />
            <Route path="depenses" element={<AdminDepenses />} />
            <Route path="loyers" element={<AdminLoyers />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="profil" element={<AdminProfil />} />
          </Route>

          {/* Tenant routes */}
          <Route path="/tenant" element={
            <ProtectedRoute requiredRole="LOCATAIRE">
              <TenantLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/tenant/dashboard" replace />} />
            <Route path="dashboard" element={<TenantDashboard />} />
            <Route path="charges" element={<TenantCharges />} />
            <Route path="charges/:id/paiement" element={<TenantPaiement />} />
            <Route path="prolongation" element={<TenantProlongation />} />
            <Route path="profil" element={<TenantProfil />} />
            <Route path="notifications" element={<TenantNotifications />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
