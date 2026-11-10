import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * LoginPage Component (Portal Gateway)
 * 
 * Central navigation hub allowing users to choose their appropriate portal:
 * 1. Citizen Services (No authentication required to submit or track)
 * 2. Field Worker Portal (/worker/login)
 * 3. Municipal Administration Portal (/admin/login)
 */
function LoginPage() {
  const { user, isAuthenticated, role, logout } = useAuth();

  return (
    <div className="portal-page-container">
      <div className="container gateway-container">
        <div className="page-header text-center">
          <div className="header-badge">CivicAlert Access Portals</div>
          <h1 className="page-title">Select Your CivicAlert Portal</h1>
          <p className="page-subtitle">
            CivicAlert provides role-separated interfaces for citizens, municipal field workers,
            and municipal department administrators.
          </p>
        </div>

        {isAuthenticated && (
          <div className="session-active-card">
            <div className="session-avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="session-details">
              <h4>Currently Logged In</h4>
              <p>
                Signed in as <strong>{user?.name}</strong> with role <span className="user-role-tag">{role}</span>
              </p>
            </div>
            <div className="session-actions">
              {role === 'admin' && (
                <Link to="/admin/dashboard" className="btn btn-primary">
                  Go to Admin Dashboard &rarr;
                </Link>
              )}
              {role === 'worker' && (
                <Link to="/worker/dashboard" className="btn btn-primary">
                  Go to Worker Dashboard &rarr;
                </Link>
              )}
              <button type="button" className="btn btn-secondary" onClick={logout}>
                Log Out
              </button>
            </div>
          </div>
        )}

        <div className="gateway-grid">
          {/* Card 1: Citizen Portal */}
          <div className="gateway-card">
            <div className="gateway-card-icon icon-citizen">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className="gateway-role-badge">Public Access</span>
            <h2 className="gateway-title">Citizen Portal</h2>
            <p className="gateway-desc">
              Report local civic issues, attach photo evidence, and track real-time resolution using your
              official Reference ID without needing an account.
            </p>
            <div className="gateway-links">
              <Link to="/report" className="btn btn-primary btn-block">
                Report an Issue
              </Link>
              <Link to="/track" className="btn btn-secondary btn-block">
                Track Existing Complaint
              </Link>
            </div>
          </div>

          {/* Card 2: Worker Portal */}
          <div className="gateway-card">
            <div className="gateway-card-icon icon-worker">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <span className="gateway-role-badge badge-worker">Municipal Staff</span>
            <h2 className="gateway-title">Field Worker Portal</h2>
            <p className="gateway-desc">
              Dedicated interface for municipal maintenance officers and repair crews to review assigned
              tasks, access citizen locations, and upload resolution notes.
            </p>
            <div className="gateway-links">
              <Link to="/worker/login" className="btn btn-primary btn-block">
                Worker Login &rarr;
              </Link>
            </div>
          </div>

          {/* Card 3: Admin Portal */}
          <div className="gateway-card">
            <div className="gateway-card-icon icon-admin">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <span className="gateway-role-badge badge-admin">Municipal Officers</span>
            <h2 className="gateway-title">Admin Portal</h2>
            <p className="gateway-desc">
              City administration dashboard for grievance overview, department workload statistics,
              worker dispatch, task assignment, and SLA deadline tracking.
            </p>
            <div className="gateway-links">
              <Link to="/admin/login" className="btn btn-primary btn-block">
                Admin Login &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

