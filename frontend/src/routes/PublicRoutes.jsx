import { Route } from "react-router-dom";
import Login from "../components/Authorized/login";
import GroupDetailPage from "../components/GroupsComponent/GroupDetails";
import StudentProfilePage from "../components/StudentComponents/Student";
import StudentPayments from "../components/homework/StudentPayments";
import { LandingPage } from "../components/Common/LandingPage";
import SimulationPage from "../components/Simulation/SimulationPage";
import StudentDashboard from "../components/StudentDashboard/StudentDashboard";
import MentorDashboard from "../components/MentorDashboard/MentorDashboard";
import PrivateRoute from "../components/Safety/ProtectedRoute";

export const PublicRoutes = (
  <>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Login initialMode="register" />} />
    <Route path="/filial" element={<Login />} />
    <Route path="/simulation" element={<SimulationPage />} />
    <Route path="/simulations" element={<SimulationPage />} />

    {/* Protected AI Dashboards — student va mentor rollari uchun */}
    <Route element={<PrivateRoute allowed={["student", "mentor", "admin", "super_admin"]} />}>
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/mentor/dashboard" element={<MentorDashboard />} />
    </Route>

    {/* Shared/Stand-alone routes that require ALL_ACCESS usually */}
    <Route path="/group" element={<GroupDetailPage />} />
    <Route path="/student" element={<StudentProfilePage />} />
    <Route path="/studentpayments" element={<StudentPayments />} />
  </>
);

