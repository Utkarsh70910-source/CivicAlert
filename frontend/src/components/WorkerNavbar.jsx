import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * WorkerNavbar Component
 * 
 * Scoped strictly for Municipal Field Worker Portal.
 * Contains only worker-relevant navigation:
 * - Brand: CivicAlert Field Portal
 * - Dashboard (/worker/dashboard)
 * - Complaints (/worker/complaints)
 * - All Portals (/)
 * - Worker identity widget
 * - Sign Out button
 * 
 * STRICT PRIVACY & CONTEXT:
 * Does NOT display citizen navigation (Home, Track Complaint, Citizen Report, + Report Issue).
 */
function WorkerNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/');
  };

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const isDashboardActive = location.pathname === '/worker/dashboard';
  const isComplaintsActive =
    location.pathname === '/worker/complaints' || location.pathname.startsWith('/worker/complaints/');

  return (
    <header className="dashboard-top-navbar worker-navbar-theme">
      <div className="container dashboard-navbar-inner">
        {/* Brand */}
        <Link to="/worker/dashboard" className="dashboard-brand" onClick={handleLinkClick}>
          <span className="brand-icon worker-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </span>
          <div>
            <span className="brand-title">CivicAlert Field Portal</span>
            <span className="portal-badge-pill">Worker Workspace</span>
          </div>
        </Link>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="portal-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>

        {/* Worker Navigation Links */}
        <nav className={`admin-header-nav ${mobileMenuOpen ? 'portal-nav-open' : ''}`}>
          <Link
            to="/worker/dashboard"
            className={`admin-header-link ${isDashboardActive ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            Dashboard
          </Link>
          <Link
            to="/worker/complaints"
            className={`admin-header-link ${isComplaintsActive ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            Complaints
          </Link>
          <Link
            to="/"
            className="admin-header-link portal-switch-link"
            onClick={handleLinkClick}
            title="Switch to another portal"
          >
            All Portals
          </Link>
        </nav>

        {/* User Identity & Logout */}
        <div className="user-profile-widget">
          <div className="user-meta-text">
            <span className="user-name-bold">{user?.name}</span>
            <span className="user-role-badge">
              {user?.workerId} &bull; {user?.category || 'Field Officer'}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm logout-btn"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

export default WorkerNavbar;

