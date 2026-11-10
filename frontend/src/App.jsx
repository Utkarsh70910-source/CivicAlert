import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import CategoriesPage from './pages/CategoriesPage';
import ReportPage from './pages/ReportPage';
import TrackPage from './pages/TrackPage';
import WorkerLoginPage from './pages/WorkerLoginPage';
import WorkerDashboardPage from './pages/WorkerDashboardPage';
import WorkerComplaintsPage from './pages/WorkerComplaintsPage';
import WorkerComplaintDetailPage from './pages/WorkerComplaintDetailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminComplaintsPage from './pages/AdminComplaintsPage';
import AdminWorkersPage from './pages/AdminWorkersPage';
import AdminComplaintDetailPage from './pages/AdminComplaintDetailPage';

import './App.css';

/**
 * Citizen route prefixes — ONLY these paths get the citizen Navbar + Footer.
 * Worker and Admin portals bring their own navigation components.
 */
const CITIZEN_PATHS = ['/citizen', '/home', '/categories', '/report', '/track'];

function isCitizenPath(pathname) {
  return CITIZEN_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

/**
 * Layout wrapper.
 * - Citizen routes → citizen <Navbar /> + <Footer />
 * - Worker/Admin routes → no citizen nav (pages embed their own portal navbars)
 * - Landing / login gateway → no nav
 */
function AppLayout() {
  const location = useLocation();
  const showCitizenNav = isCitizenPath(location.pathname);

  return (
    <div className="app-layout">
      {showCitizenNav && <Navbar />}

      <main id="main-content" className="app-main">
        <Routes>
          {/* ── Multi-Portal Gateway Landing Page ── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LandingPage />} />

          {/* ── Citizen Experience Routes ── */}
          <Route path="/citizen" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/citizen/report" element={<ReportPage />} />
          <Route path="/citizen/track" element={<TrackPage />} />

          {/* ── Staff Authentication Entry Points (private, not linked publicly) ── */}
          <Route path="/worker/login" element={<WorkerLoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* ── Protected Field Worker Portal ── */}
          <Route
            path="/worker/dashboard"
            element={
              <ProtectedRoute allowedRoles={['worker']}>
                <WorkerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker/complaints"
            element={
              <ProtectedRoute allowedRoles={['worker']}>
                <WorkerComplaintsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker/complaints/:id"
            element={
              <ProtectedRoute allowedRoles={['worker']}>
                <WorkerComplaintDetailPage />
              </ProtectedRoute>
            }
          />

          {/* ── Protected Municipal Admin Portal ── */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminComplaintsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/workers"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminWorkersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminComplaintDetailPage />
              </ProtectedRoute>
            }
          />

          {/* ── 404 Fallback ── */}
          <Route
            path="*"
            element={
              <div className="container portal-page-container text-center">
                <div className="not-found-box">
                  <h1 className="not-found-code">404</h1>
                  <h2>Page Not Found</h2>
                  <p>The requested page does not exist on CivicAlert.</p>
                  <a href="/" className="btn btn-primary">
                    Return to Homepage
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </main>

      {showCitizenNav && <Footer />}
    </div>
  );
}

/**
 * CivicAlert Main Application Root
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
