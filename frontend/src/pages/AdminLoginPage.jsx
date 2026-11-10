import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * AdminLoginPage Component
 * 
 * Secure login portal for Municipal Department Administrators.
 */
function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFillDemo = () => {
    setUsername('admin');
    setPassword('admin123');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Please provide administrative username and password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await login({ username: username.trim(), password: password.trim() });
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'worker') {
        navigate('/worker/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify administrative credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="portal-page-container login-auth-wrapper">
      <div className="login-auth-card admin-auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon-bubble admin-bubble">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <span className="auth-role-badge badge-admin">Municipal Administration</span>
          <h1 className="auth-title">Admin Portal Login</h1>
          <p className="auth-subtitle">
            Sign in to access grievance tracking, worker dispatch, and department metrics.
          </p>
        </div>

        {/* Viva Quick Test Bar */}
        <div className="viva-quick-fill-box admin-fill-box">
          <span className="quick-fill-label">Demo Admin Credentials (Viva):</span>
          <button type="button" className="chip-btn admin-chip" onClick={handleFillDemo}>
            <strong>admin</strong> &bull; password: <code>admin123</code> (Click to Fill)
          </button>
        </div>

        {error && (
          <div className="alert-banner alert-danger">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="admin-username-input">
              Admin Username / Email
            </label>
            <input
              id="admin-username-input"
              type="text"
              className="form-control"
              placeholder="e.g. admin or admin@civicalert.gov.in"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="admin-password-input">
              Password
            </label>
            <input
              id="admin-password-input"
              type="password"
              className="form-control"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={isLoading}>
            {isLoading ? 'Verifying Admin Privileges...' : 'Sign In as Administrator'}
          </button>
        </form>

        <div className="auth-footer-links">
          <Link to="/" className="sub-link">
            &larr; All Portals
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;

