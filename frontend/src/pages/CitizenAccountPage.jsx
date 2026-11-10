import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * CitizenAccountPage
 *
 * Shows basic logged-in citizen information.
 * Does NOT display password, password hash, or any sensitive auth data.
 */
function CitizenAccountPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="auth-page-wrapper">
        <div className="auth-page-card" style={{ textAlign: 'center' }}>
          <p>You are not signed in.</p>
          <Link to="/citizen/signin" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="portal-page-container">
      <div className="container cmc-body" style={{ maxWidth: '540px' }}>
        <div className="auth-page-card" style={{ margin: '2rem auto' }}>
          <div className="auth-card-header">
            <div className="account-avatar">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h1 className="auth-title" style={{ marginTop: '0.75rem' }}>{user.name}</h1>
            <div className="auth-portal-badge">Citizen Account</div>
          </div>

          <div className="account-info-list">
            <div className="account-info-row">
              <span className="account-info-label">Full Name</span>
              <span className="account-info-value">{user.name}</span>
            </div>
            <div className="account-info-row">
              <span className="account-info-label">Email</span>
              <span className="account-info-value">{user.email}</span>
            </div>
            {user.phone && (
              <div className="account-info-row">
                <span className="account-info-label">Mobile</span>
                <span className="account-info-value">{user.phone}</span>
              </div>
            )}
            <div className="account-info-row">
              <span className="account-info-label">Account Role</span>
              <span className="account-info-value" style={{ textTransform: 'capitalize' }}>{user.role}</span>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/citizen/my-complaints" className="btn btn-primary btn-full">
              View My Complaints
            </Link>
            <Link to="/report" className="btn btn-secondary btn-full">
              Report a New Issue
            </Link>
            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={handleLogout}
              style={{ color: '#dc2626', borderColor: '#dc2626' }}
            >
              Sign Out
            </button>
          </div>

          <div className="auth-footer-links" style={{ marginTop: '1rem' }}>
            <Link to="/citizen" className="auth-back-link">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CitizenAccountPage;

