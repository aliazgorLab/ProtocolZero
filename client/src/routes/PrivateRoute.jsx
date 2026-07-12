import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  // TODO: Replace with actual auth check from Redux (e.g. useSelector)
  // For now, allow all access while building the frontend UI.
  const isAuthenticated = true;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
