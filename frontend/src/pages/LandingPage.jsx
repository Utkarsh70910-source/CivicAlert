import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * LandingPage Component (CUIMS-Inspired Multi-Portal Gateway)
 * 
 * Provides an entry point for CivicAlert:
 * 1. Citizen Portal -> Public issue reporting & complaint tracking (/citizen)
 * 2. Worker Portal  -> Field maintenance officers & crews login (/worker/login)
 * 3. Admin Portal   -> Municipal administration & oversight login (/admin/login)
 * 
 * Security: This is purely an entry UI. Authentication and RBAC route guards
 * remain strictly enforced on protected worker/admin routes.
 */
function LandingPage() {
  const { user, isAuthenticated, role, logout } = useAuth();

  return (
    <div className="landing-gateway-page">
      <div className="container landing-gateway-container">
        {/* Brand Header */}
        <header className="landing-brand-header text-center">
          <div className="landing-brand-badge">
            <span className="badge-pulse"></span>
            <span>Civic Grievance &amp; Operations Infrastructure</span>
          </div>

          <div className="landing-logo-row">
            <span className="landing-logo-icon" aria-hidden="true">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
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

          <p className="landing-brand-tagline">
            Your Civic Issue Reporting &amp; Management Platform
          </p>
          <p className="landing-brand-subtitle">
            Please choose your designated portal below to report issues, manage field tasks, or supervise municipal operations.
          </p>
        </header>

        {/* Active Session Notification (if staff user is already authenticated) */}
        {isAuthenticated && (
          <div className="session-active-card">
            <div className="session-avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="session-details">
              <h4>Active Staff Session Detected</h4>
              <p>
                You are currently signed in as <strong>{user?.name || user?.username}</strong> with role{' '}
                <span className="user-role-tag">{role}</span>.
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
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* 3-Column Portal Selection Grid (CUIMS Reference Style) */}
        <div className="landing-portals-grid">
          {/* ========================================================
              PORTAL 1: CITIZEN PORTAL
              ======================================================== */}
          <div className="portal-entry-card portal-card-citizen">
            <div className="portal-card-top">
              <div className="portal-icon-bubble bubble-citizen">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <span className="portal-badge badge-citizen">Public Access</span>
            </div>

            <h2 className="portal-title">Citizen Portal</h2>
            <p className="portal-description">
              Public access for neighborhood residents to submit civic grievances, inspect resolution progress, and verify official ward actions.
            </p>

            <div className="portal-features-list">
              <div className="portal-feature-item">
                <span className="feature-check citizen-check">&check;</span>
                <span>Report civic issues &amp; upload photo evidence</span>
              </div>
              <div className="portal-feature-item">
                <span className="feature-check citizen-check">&check;</span>
                <span>Track complaints with official Reference ID (e.g. CA-12345)</span>
              </div>
              <div className="portal-feature-item">
                <span className="feature-check citizen-check">&check;</span>
                <span>View complaint status, expected completion, &amp; resolution notes</span>
              </div>
            </div>

            <div className="portal-card-action">
              <Link to="/citizen" className="btn btn-primary btn-block btn-portal-action">
                Enter Citizen Portal &rarr;
              </Link>
            </div>
          </div>

          {/* ========================================================
              PORTAL 2: WORKER PORTAL
              ======================================================== */}
          <div className="portal-entry-card portal-card-worker">
            <div className="portal-card-top">
              <div className="portal-icon-bubble bubble-worker">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <span className="portal-badge badge-worker">Municipal Field Staff</span>
            </div>

            <h2 className="portal-title">Worker Portal</h2>
            <p className="portal-description">
              For registered CivicAlert employees and maintenance crews to review assigned tasks, inspect repair locations, and update work status.
            </p>

            <div className="portal-features-list">
              <div className="portal-feature-item">
                <span className="feature-check worker-check">&check;</span>
                <span>View assigned civic complaints filtered by specialization</span>
              </div>
              <div className="portal-feature-item">
                <span className="feature-check worker-check">&check;</span>
                <span>Access citizen contact &amp; precise location landmarks</span>
              </div>
              <div className="portal-feature-item">
                <span className="feature-check worker-check">&check;</span>
                <span>Update status (In Progress, Resolved) &amp; add resolution notes</span>
              </div>
            </div>

            <div className="portal-card-action">
              <Link to="/worker/login" className="btn btn-worker-portal btn-block btn-portal-action">
                Worker Login &rarr;
              </Link>
            </div>
          </div>

          {/* ========================================================
              PORTAL 3: ADMIN PORTAL
              ======================================================== */}
          <div className="portal-entry-card portal-card-admin">
            <div className="portal-card-top">
              <div className="portal-icon-bubble bubble-admin">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <span className="portal-badge badge-admin">Municipal Administration</span>
            </div>

            <h2 className="portal-title">Admin Portal</h2>
            <p className="portal-description">
              For authorized CivicAlert administrators to supervise department complaints, assign field personnel, and track SLA completion metrics.
            </p>

            <div className="portal-features-list">
              <div className="portal-feature-item">
                <span className="feature-check admin-check">&check;</span>
                <span>Comprehensive grievance overview &amp; category analytics</span>
              </div>
              <div className="portal-feature-item">
                <span className="feature-check admin-check">&check;</span>
                <span>Field worker dispatch based on specialization</span>
              </div>
              <div className="portal-feature-item">
                <span className="feature-check admin-check">&check;</span>
                <span>Set SLA completion deadlines &amp; monitor overdue tasks</span>
              </div>
            </div>

            <div className="portal-card-action">
              <Link to="/admin/login" className="btn btn-admin-portal btn-block btn-portal-action">
                Admin Login &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Security & Access Notice */}
        <div className="landing-security-footer">
          <div className="security-notice-inner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>
              <strong>Security Policy:</strong> Worker and Admin portals require authorized credentials and active municipal sessions.
              Citizen services are openly accessible to all community residents without registration.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;

