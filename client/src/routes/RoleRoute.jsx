import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROLES } from '../constants/roles';

const RoleRoute = ({ requiredRoles = [] }) => {
  const user = useSelector((state) => state.auth.user);
  const roles = (Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]).filter(Boolean);
  const normalizedRoles = roles.length > 0 ? roles : [ROLES.ADMIN, ROLES.SUPER_ADMIN];
  const hasRole = !!user && normalizedRoles.includes(user.accountType);

  return hasRole ? <Outlet /> : <Navigate to="/home" replace />;
};

export default RoleRoute;
