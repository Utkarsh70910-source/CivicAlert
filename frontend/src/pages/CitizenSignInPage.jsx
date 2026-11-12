import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * CitizenSignInPage
 *
 * Citizen login with email + password.
 * Uses the same AuthContext.login() flow as Admin/Worker portals.
 * On success → redirects to /citizen (the citizen home).
 */
function CitizenSignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  // Where to send the citizen after a successful sign-in.
  // Falls back to /citizen (home) if no ?next= param is present.
  const nextPath = searchParams.get('next') || '/citizen';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email address is required.';
    if (!password) errs.password = 'Password is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // The backend login route accepts email as username for citizens
      const user = await login({ username: email.trim().toLowerCase(), password });
      if (user && user.role === 'citizen') {
        navigate(nextPath);
      } else if (user && user.role !== 'citizen') {
        setApiError(
          `This is the Citizen Portal. You are signed in as [${user.role}]. ` +
          `Please use the appropriate portal.`
        );
      } else {
        navigate(nextPath);
      }
    } catch (err) {
      setApiError(err.message || 'Sign in failed. Please check your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-page-card">
        {/* Header */}
        <div className="auth-card-header">
          <Link to="/" className="auth-brand-link">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            <span className="auth-brand-name">CivicAlert</span>
          </Link>
          <div className="auth-portal-badge">Citizen Portal</div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">
            Sign in to view your complaint history and track progress.
          </p>
        </div>

        {/* Demo hint */}
        <div className="auth-demo-hint">
          <strong>Demo account:</strong> email: <code>aarav.verma@example.com</code> / password: <code>citizen123</code>
        </div>

        {/* Error Banner */}
        {apiError && (
          <div className="alert-banner alert-danger" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{apiError}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="signin-email">
              Email Address <span className="required-star">*</span>
            </label>
            <input
              id="signin-email"
              type="email"
              className={`form-control ${errors.email ? 'input-error' : ''}`}
              placeholder="e.g., aarav@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => { const u = { ...p }; delete u.email; return u; });
                setApiError('');
              }}
              autoComplete="email"
            />
            {errors.email && <p className="form-error-msg">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signin-password">
              Password <span className="required-star">*</span>
            </label>
            <input
              id="signin-password"
              type="password"
              className={`form-control ${errors.password ? 'input-error' : ''}`}
              placeholder="Your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((p) => { const u = { ...p }; delete u.password; return u; });
                setApiError('');
              }}
              autoComplete="current-password"
            />
            {errors.password && <p className="form-error-msg">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Footer Links */}
        <div className="auth-footer-links">
          <span>Don&apos;t have an account?</span>
          <Link to="/citizen/signup" className="auth-switch-link">Create Account</Link>
        </div>
        <div className="auth-footer-links" style={{ marginTop: '0.5rem' }}>
          <Link to="/" className="auth-back-link">← Back to All Portals</Link>
        </div>
      </div>
    </div>
  );
}

export default CitizenSignInPage;

