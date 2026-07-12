import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Onboarding from '../pages/Onboarding';
import OtpVerification from '../pages/OtpVerification';
import SelectRole from '../pages/SelectRole';
import SignUp from '../pages/SignUp';
import ResponseTeamSignUp from '../pages/ResponseTeamSignUp';
import ReporterSignUp from '../pages/ReporterSignUp';
import ReportDetail from '../pages/ReportDetail';
import SosFlow from '../pages/SosFlow';
import CreateReport from '../pages/CreateReport';
import InteractiveMap from '../pages/InteractiveMap';
import ResponseTeamDash from '../pages/ResponseTeamDash';
import UserProfile from '../pages/UserProfile';
import PrivateRoute from './PrivateRoute';
// import RoleRoute from './RoleRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/otp-verification" element={<OtpVerification />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signup/select-role" element={<SelectRole />} />
      <Route path="/signup/reporter" element={<ReporterSignUp />} />
      <Route path="/signup/response-team" element={<ResponseTeamSignUp />} />
      
      {/* Private Routes */}
      <Route element={<PrivateRoute />}>
        {/* Standalone Dashboard for Response Team */}
        <Route path="/response-team/dashboard" element={<ResponseTeamDash />} />
        
        {/* General User Dashboard Layout */}
        <Route element={<DashboardLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/reports/create" element={<CreateReport />} />
          <Route path="/reports/:id" element={<ReportDetail />} />
          <Route path="/sos" element={<SosFlow />} />
          <Route path="/map" element={<InteractiveMap />} />
          <Route path="/profile" element={<UserProfile />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
