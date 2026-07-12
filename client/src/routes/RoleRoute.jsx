import { Navigate, Outlet } from 'react-router-dom';

const RoleRoute = ({ requiredRole }) => {
  // TODO: Replace with actual role check from Redux (e.g. user.role === requiredRole)
  // For now, allow all access while building the frontend UI.
  const hasRole = true;

  return hasRole ? <Outlet /> : <Navigate to="/home" replace />;
};

export default RoleRoute;
