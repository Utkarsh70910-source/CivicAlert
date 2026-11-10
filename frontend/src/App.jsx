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
import WorkerComplaintDetailPage from './pages/WorkerComplaintDetailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminComplaintDetailPage from './pages/AdminComplaintDetailPage';

import './App.css';

/**
 * Layout wrapper that conditionally hides standard citizen Navbar/Footer
 * on the dedicated portal gateway landing page and specialized full-page dashboards.
 */
function AppLayout() {
  const location = useLocation();
  const isDedicatedPage =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname.startsWith('/worker/dashboard') ||
    location.pathname.startsWith('/worker/complaints') ||
    location.pathname.startsWith('/admin/dashboard') ||
    location.pathname.startsWith('/admin/complaints') ||
    location.pathname.startsWith('/admin/workers');

  return (
    <div className="app-layout">
      {!isDedicatedPage && <Navbar />}

      <main id="main-content" className="app-main">
        <Routes>
          {/* Multi-Portal Gateway Landing Page (CUIMS-Inspired) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LandingPage />} />

          {/* Citizen Experience Routes */}
          <Route path="/citizen" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/track" element={<TrackPage />} />

          {/* Staff Authentication Entry Points */}
          <Route path="/worker/login" element={<WorkerLoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Field Worker Portal Routes */}
          <Route
            path="/worker/dashboard"
            element={
              <ProtectedRoute allowedRoles={['worker']}>
                <WorkerDashboardPage />
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

          {/* Protected Municipal Admin Portal Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage initialTab="complaints" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage initialTab="complaints" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/workers"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage initialTab="workers" />
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

          {/* 404 Fallback Route */}
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

      {!isDedicatedPage && <Footer />}
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
