import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * LandingPage Component (Simplified Portal Gateway)
 * 
 * Clean, modern portal-selection screen providing direct entry to:
 * 1. Citizen Portal -> Public issue reporting & complaint tracking (/citizen)
 * 2. Worker Portal  -> Field maintenance officers & crews login (/worker/login)
 * 3. Admin Portal   -> Municipal administration & oversight login (/admin/login)
 */
function LandingPage() {
  const { user, isAuthenticated, role, logout } = useAuth();

  return (
    <div className="landing-gateway-page">
      <div className="container landing-gateway-container">
        {/* Brand Header */}
        <header className="landing-brand-header text-center">
          <div className="landing-logo-row">
            <span className="landing-logo-icon" aria-hidden="true">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </span>
            <h1 className="landing-brand-title">CivicAlert</h1>
          </div>
        </header>

        {/* Active Staff Session Alert (Only if staff user is logged in) */}
        {isAuthenticated && (
          <div className="session-active-card">
            <div className="session-avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="session-details">
              <h4>Active Session Detected</h4>
              <p>
                Signed in as <strong>{user?.name || user?.username}</strong> ({role})
              </p>
            </div>
            <div className="session-actions">
              {role === 'admin' && (
                <Link to="/admin/dashboard" className="btn btn-primary">
                  Go to Dashboard &rarr;
                </Link>
              )}
              {role === 'worker' && (
                <Link to="/worker/dashboard" className="btn btn-primary">
                  Go to Dashboard &rarr;
                </Link>
              )}
              {role === 'citizen' && (
                <Link to="/citizen" className="btn btn-primary">
                  Go to Citizen Home &rarr;
                </Link>
              )}
              <button type="button" className="btn btn-secondary" onClick={logout}>
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Three Portal Cards (Main Focus) */}
        <div className="landing-portals-grid">
          {/* PORTAL 1: CITIZEN PORTAL */}
          <div className="portal-entry-card portal-card-citizen">
            <div className="portal-icon-bubble bubble-citizen">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>

            <h2 className="portal-title">Citizen Portal</h2>
            <p className="portal-description">
              Report civic issues, track complaints, and view live resolution status.
            </p>

            <div className="portal-card-action">
              {isAuthenticated && role === 'citizen' ? (
                <Link to="/citizen" className="btn btn-primary btn-block btn-portal-action">
                  Enter Citizen Portal
                </Link>
              ) : (
                <Link to="/citizen/signin" className="btn btn-primary btn-block btn-portal-action">
                  Enter Citizen Portal
                </Link>
              )}
            </div>
          </div>

          {/* PORTAL 2: WORKER PORTAL */}
          <div className="portal-entry-card portal-card-worker">
            <div className="portal-icon-bubble bubble-worker">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>

            <h2 className="portal-title">Worker Portal</h2>
            <p className="portal-description">
              Access assigned civic complaints and update maintenance work.
            </p>

            <div className="portal-card-action">
              <Link to="/worker/login" className="btn btn-worker-portal btn-block btn-portal-action">
                Worker Login
              </Link>
            </div>
          </div>

          {/* PORTAL 3: ADMIN PORTAL */}
          <div className="portal-entry-card portal-card-admin">
            <div className="portal-icon-bubble bubble-admin">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>

            <h2 className="portal-title">Admin Portal</h2>
            <p className="portal-description">
              Manage complaints, workers, assignments, and operations monitoring.
            </p>

            <div className="portal-card-action">
              <Link to="/admin/login" className="btn btn-admin-portal btn-block btn-portal-action">
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
