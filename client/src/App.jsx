/**
 * App — All routes. Public pages use PublicLayout; /owner/* (pet owners) and /vet/*
 * (veterinarians) are protected (login required) and role-checked, and their pages load on demand.
 */
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import ScrollToTop from './components/ScrollToTop';
import useTheme from './hooks/useTheme';
import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Home from './pages/public/Home';
import LiveQueuePage from './pages/public/LiveQueuePage';
import Login from './pages/public/Login';
import NotFound from './pages/public/NotFound';
import Register from './pages/public/Register';
import Services from './pages/public/Services';
import VetDetail from './pages/public/VetDetail';
import Vets from './pages/public/Vets';
import { ROLES } from './utils/constants';

// Dashboard pages are split into their own chunks and downloaded only when needed.
const OwnerDashboard = lazy(() => import('./pages/owner/Dashboard'));
const MyPets = lazy(() => import('./pages/owner/MyPets'));
const BookAppointment = lazy(() => import('./pages/owner/BookAppointment'));
const MyAppointments = lazy(() => import('./pages/owner/MyAppointments'));
const AppointmentDetail = lazy(() => import('./pages/owner/AppointmentDetail'));
const Profile = lazy(() => import('./pages/account/Profile'));
const VetDashboard = lazy(() => import('./pages/vet/VetDashboard'));
const LiveQueue = lazy(() => import('./pages/vet/LiveQueue'));
const ManageAppointments = lazy(() => import('./pages/vet/ManageAppointments'));
const ManageServices = lazy(() => import('./pages/vet/ManageServices'));
const ManagePatients = lazy(() => import('./pages/vet/ManagePatients'));

export default function App() {
  const { theme } = useTheme();

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LoadingSpinner fullPage label="Loading…" />}>
        <Routes>
          {/* Login and register are full-screen pages without the site navbar and footer;
              the live queue page fits the screen under the navbar (no footer, no scrolling). */}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="queue" element={<LiveQueuePage />} />

          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="vets" element={<Vets />} />
            <Route path="vets/:id" element={<VetDetail />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={[ROLES.OWNER]} />}>
              <Route path="owner" element={<DashboardLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<OwnerDashboard />} />
                <Route path="pets" element={<MyPets />} />
                <Route path="book" element={<BookAppointment />} />
                <Route path="appointments" element={<MyAppointments />} />
                <Route path="appointments/:id" element={<AppointmentDetail />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>

            <Route element={<RoleRoute allowedRoles={[ROLES.VET]} />}>
              <Route path="vet" element={<DashboardLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<VetDashboard />} />
                <Route path="queue" element={<LiveQueue />} />
                <Route path="appointments" element={<ManageAppointments />} />
                <Route path="patients" element={<ManagePatients />} />
                <Route path="services" element={<ManageServices />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>

      <ToastContainer position="top-right" autoClose={3500} newestOnTop pauseOnFocusLoss={false} theme={theme === 'dark' ? 'dark' : 'light'} />
    </>
  );
}
