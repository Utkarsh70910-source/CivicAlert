import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component
 * 
 * Enforces role-based route guard:
 * - Redirects unauthenticated users to the corresponding login portal
 * - Displays an explicit Access Denied / 403 page when a user has the wrong role
 *   (e.g. Worker attempting to access Admin Dashboard)
 */
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="spinner-border"></div>
        <p>Verifying CivicAlert security session...</p>
      </div>
    );
  }

  // 1. Not Authenticated: redirect to appropriate login
  if (!isAuthenticated) {
    if (allowedRoles.includes('admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    if (allowedRoles.includes('worker')) {
      return <Navigate to="/worker/login" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // 2. Authenticated but unauthorized role: Show explicit Access Denied page
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="unauthorized-page-container">
        <div className="unauthorized-card">
          <div className="unauthorized-icon-wrapper">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <span className="unauthorized-badge">403 Forbidden</span>
          <h1 className="unauthorized-title">Access Restricted</h1>
          <p className="unauthorized-text">
            You are currently signed in as <strong>{user?.name || user?.username}</strong> with the{' '}
            <span className="user-role-tag">{role}</span> role.
          </p>
          <div className="unauthorized-callout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              This page requires one of the following roles: <strong>{allowedRoles.join(', ')}</strong>.
              Role-based authorization prevents unauthorized administrative or field changes.
            </span>
          </div>

          <div className="unauthorized-actions">
            {role === 'worker' && (
              <Link to="/worker/dashboard" className="btn btn-primary">
                Return to Worker Dashboard
              </Link>
            )}
            {role === 'admin' && (
              <Link to="/admin/dashboard" className="btn btn-primary">
                Return to Admin Dashboard
              </Link>
            )}
            <Link to="/" className="btn btn-secondary">
              Go to CivicAlert Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;

