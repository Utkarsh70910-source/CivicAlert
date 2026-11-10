import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * AdminNavbar Component
 * 
 * Scoped strictly for Municipal Administrator Portal.
 * Contains only admin-relevant navigation:
 * - Brand: CivicAlert Admin Portal
 * - Dashboard (/admin/dashboard)
 * - Complaints (/admin/complaints)
 * - Workers (/admin/workers)
 * - All Portals (/)
 * - Admin identity widget
 * - Sign Out button
 * 
 * STRICT PRIVACY & CONTEXT:
 * Does NOT display citizen navigation (Home, Track Complaint, Citizen Report, + Report Issue).
 */
function AdminNavbar() {
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

  const isDashboardActive = location.pathname === '/admin/dashboard';
  const isComplaintsActive =
    location.pathname === '/admin/complaints' || location.pathname.startsWith('/admin/complaints/');
  const isWorkersActive =
    location.pathname === '/admin/workers' || location.pathname.startsWith('/admin/workers/');

  return (
    <header className="dashboard-top-navbar admin-navbar-theme">
      <div className="container dashboard-navbar-inner">
        {/* Brand */}
        <Link to="/admin/dashboard" className="dashboard-brand" onClick={handleLinkClick}>
          <span className="brand-icon admin-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </span>
          <div>
            <span className="brand-title">CivicAlert Admin Portal</span>
            <span className="portal-badge-pill admin-badge-pill">Municipal Oversight</span>
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

        {/* Admin Navigation Links */}
        <nav className={`admin-header-nav ${mobileMenuOpen ? 'portal-nav-open' : ''}`}>
          <Link
            to="/admin/dashboard"
            className={`admin-header-link ${isDashboardActive ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            Dashboard
          </Link>
          <Link
            to="/admin/complaints"
            className={`admin-header-link ${isComplaintsActive ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            Complaints
          </Link>
          <Link
            to="/admin/workers"
            className={`admin-header-link ${isWorkersActive ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            Workers
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
            <span className="user-name-bold">{user?.name || 'Administrator'}</span>
            <span className="user-role-badge">Department Head</span>
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

export default AdminNavbar;

