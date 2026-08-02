import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const RoleRoute = ({ requiredRoles = [] }) => {
  const user = useSelector((state) => state.auth.user);
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const hasRole = user && roles.includes(user.accountType);

  return hasRole ? <Outlet /> : <Navigate to="/home" replace />;
};

export default RoleRoute;
