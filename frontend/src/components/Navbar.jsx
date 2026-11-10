import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Navbar Component
 *
 * Citizen-facing public navigation.
 * Shows different items depending on auth state:
 *
 * NOT signed in → Sign In | Sign Up
 * Signed in (citizen) → My Complaints | Account | Sign Out
 *
 * Staff portals (/admin, /worker) are NOT linked here.
 * Security is enforced at backend (RBAC middleware) + frontend (ProtectedRoute),
 * not by hiding links alone.
 */
function Navbar({ onOpenReportModal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();

  const closeMenu = () => setMobileMenuOpen(false);

  const handleReportClick = () => {
    closeMenu();
    if (onOpenReportModal) {
      onOpenReportModal();
    } else {
      navigate('/report');
    }
  };

  const handleLogout = async () => {
    closeMenu();
    await logout();
    navigate('/');
  };

  return (
    <header className="navbar-header">
      <div className="container navbar-container">
        {/* Brand */}
        <Link to="/citizen" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </span>
          <div className="brand-text">
            <span className="brand-title">CivicAlert</span>
            <span className="brand-badge">Community</span>
          </div>
        </Link>

        {/* Desktop & Mobile Navigation Links */}
        <nav className={`navbar-nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
          <ul className="nav-list">
            <li className="nav-item">
              <Link to="/citizen" className="nav-link" onClick={closeMenu}>Home</Link>
            </li>
            <li className="nav-item">
              <Link to="/track" className="nav-link nav-highlight" onClick={closeMenu}>Track Complaint</Link>
            </li>
            <li className="nav-item">
              <Link to="/report" className="nav-link" onClick={closeMenu}>Citizen Report</Link>
            </li>
            {/* My Complaints: visible only when signed in as citizen */}
            {isAuthenticated && role === 'citizen' && (
              <li className="nav-item">
                <Link to="/citizen/my-complaints" className="nav-link" onClick={closeMenu}>My Complaints</Link>
              </li>
            )}
            <li className="nav-item">
              <Link to="/" className="nav-link" onClick={closeMenu}>All Portals</Link>
            </li>
          </ul>

          {/* Auth Widget */}
          <div className="nav-cta-wrapper">
            {isAuthenticated && role === 'citizen' ? (
              <div className="nav-auth-user">
                <Link
                  to="/citizen/account"
                  className="nav-user-badge"
                  onClick={closeMenu}
                  style={{ textDecoration: 'none' }}
                >
                  {user?.name?.split(' ')[0]} ▾
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm nav-signout-btn"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </div>
            ) : isAuthenticated ? (
              /* Other role logged in (shouldn't appear on citizen nav but handle gracefully) */
              <div className="nav-auth-user">
                <span className="nav-user-badge">{user?.name?.split(' ')[0]} ({role})</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm nav-signout-btn"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              /* Not authenticated → show Sign In / Sign Up */
              <div className="nav-auth-guest">
                <Link to="/citizen/signin" className="btn btn-secondary btn-sm" onClick={closeMenu}>
                  Sign In
                </Link>
                <Link to="/citizen/signup" className="btn btn-outline btn-sm" onClick={closeMenu} style={{ marginLeft: '0.5rem' }}>
                  Sign Up
                </Link>
              </div>
            )}

            {/* Report Issue CTA — always visible */}
            <button
              type="button"
              className="btn btn-primary nav-cta-btn"
              onClick={handleReportClick}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Report Issue</span>
            </button>
          </div>
        </nav>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className="mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}

export default Navbar;
