import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { get_user_info } from '../Authorized/getRole';
import { isAccessTokenExpired } from '../../tokenUpdater/updater';

const isAuthenticated = () => {
  const access = localStorage.getItem('access_token');
  if (!access) return false;
  // Token muddati tugaganini tekshirish
  if (isAccessTokenExpired()) {
    // Refresh token bor bo'lsa, interceptor o'zi yangilaydi
    const refresh = localStorage.getItem('refresh_token');
    return !!refresh;
  }
  return true;
};

// CRM rollari uchun alohida login sahifasiga yo'naltirish
const CRM_ROLES = ['admin', 'mentor', 'super_admin'];
const STUDENT_ROLES = ['student'];

const PrivateRoute = ({ children, allowed = [] }) => {
  const user_info = get_user_info();
  const isAuth = isAuthenticated();
  const location = useLocation();

  // Autentifikatsiya va rol tekshiruvi
  if (isAuth && user_info) {
    if (allowed.length === 0 || allowed.includes(user_info.role)) {
      return children ? children : <Outlet />;
    }
  }

  // Qaysi login sahifasiga yo'naltirish kerakligini aniqlaymiz
  // Agar CRM rollarga mo'ljallangan route bo'lsa — /crm/login ga yo'naltirish
  const isCRMRoute = allowed.some(role => CRM_ROLES.includes(role)) &&
    !allowed.some(role => STUDENT_ROLES.includes(role));

  if (isCRMRoute) {
    return <Navigate to="/crm/login" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default PrivateRoute;