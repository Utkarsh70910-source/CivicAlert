import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * WorkerLoginPage Component
 * 
 * Separate authentication interface for Municipal Field Workers.
 * Authenticates against /api/auth/login and redirects to /worker/dashboard upon success.
 */
function WorkerLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [workerId, setWorkerId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Quick Demo Accounts for College Viva Testing
  const demoWorkers = [
    { label: 'Ramesh Kumar (Roads)', id: 'W-101', pass: 'worker123' },
    { label: 'Priya Sharma (Lighting)', id: 'W-102', pass: 'worker123' },
    { label: 'Suresh Patel (Sanitation)', id: 'W-103', pass: 'worker123' },
    { label: 'Anita Desai (Drainage)', id: 'W-104', pass: 'worker123' },
  ];

  const handleQuickFill = (worker) => {
    setWorkerId(worker.id);
    setPassword(worker.pass);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!workerId.trim() || !password.trim()) {
      setError('Please provide both Worker ID and password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await login({ workerId: workerId.trim(), password: password.trim() });
      if (user.role === 'worker') {
        navigate('/worker/dashboard');
      } else if (user.role === 'admin') {
        // If an admin logged in through worker portal, redirect them to admin dashboard
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your Worker ID and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="portal-page-container login-auth-wrapper">
      <div className="login-auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon-bubble worker-bubble">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <span className="auth-role-badge">Field Personnel</span>
          <h1 className="auth-title">Worker Portal Login</h1>
          <p className="auth-subtitle">
            Sign in to access assigned tasks, inspection locations, and update repair progress.
          </p>
        </div>

        {/* Viva Quick Test Bar */}
        <div className="viva-quick-fill-box">
          <span className="quick-fill-label">Demo Credentials (Viva):</span>
          <div className="quick-fill-chips">
            {demoWorkers.map((w) => (
              <button
                key={w.id}
                type="button"
                className="chip-btn"
                onClick={() => handleQuickFill(w)}
              >
                <strong>{w.id}</strong> - {w.label}
              </button>
            ))}
          </div>
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
            <label className="form-label" htmlFor="worker-id-input">
              Worker ID / Staff Username
            </label>
            <input
              id="worker-id-input"
              type="text"
              className="form-control"
              placeholder="e.g. W-101 or worker101"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="worker-password-input">
              Password
            </label>
            <input
              id="worker-password-input"
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={isLoading}>
            {isLoading ? 'Authenticating...' : 'Sign In to Worker Portal'}
          </button>
        </form>

        <div className="auth-footer-links">
          <Link to="/" className="sub-link">
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default WorkerLoginPage;

