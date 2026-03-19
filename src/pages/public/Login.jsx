import { Navigate, useLocation } from 'react-router-dom';

export default function Login() {
  const location = useLocation();
  const from = location.state?.from || '/';
  return <Navigate to={from} replace />;
}
