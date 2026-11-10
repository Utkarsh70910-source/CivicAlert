import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * CitizenSignUpPage
 *
 * Citizen self-registration form.
 * Fields: Full Name, Email, Mobile Number, Password, Confirm Password.
 *
 * On success → auto-logs in and redirects to /citizen.
 * Uses the same mock session architecture as Admin/Worker login.
 */
function CitizenSignUpPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => { const u = { ...prev }; delete u[field]; return u; });
    }
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required.';
    if (!form.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!form.mobile.trim()) {
      errs.mobile = 'Mobile number is required.';
    } else if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) {
      errs.mobile = 'Enter a valid 10-digit Indian mobile number.';
    }
    if (!form.password) {
      errs.password = 'Password is required.';
    } else if (form.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    if (!form.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
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
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      navigate('/citizen');
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
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
          <h1 className="auth-title">Create Your Account</h1>
          <p className="auth-subtitle">
            Join CivicAlert to report issues and track them easily.
          </p>
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

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} noValidate className="auth-form">
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">
              Full Name <span className="required-star">*</span>
            </label>
            <input
              id="signup-name"
              type="text"
              className={`form-control ${errors.name ? 'input-error' : ''}`}
              placeholder="e.g., Aarav Verma"
              value={form.name}
              onChange={handleChange('name')}
              autoComplete="name"
            />
            {errors.name && <p className="form-error-msg">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">
              Email Address <span className="required-star">*</span>
            </label>
            <input
              id="signup-email"
              type="email"
              className={`form-control ${errors.email ? 'input-error' : ''}`}
              placeholder="e.g., aarav@example.com"
              value={form.email}
              onChange={handleChange('email')}
              autoComplete="email"
            />
            {errors.email && <p className="form-error-msg">{errors.email}</p>}
          </div>

          {/* Mobile */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-mobile">
              Mobile Number <span className="required-star">*</span>
            </label>
            <input
              id="signup-mobile"
              type="tel"
              className={`form-control ${errors.mobile ? 'input-error' : ''}`}
              placeholder="e.g., 98765 43210"
              value={form.mobile}
              onChange={handleChange('mobile')}
              autoComplete="tel"
            />
            {errors.mobile && <p className="form-error-msg">{errors.mobile}</p>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">
              Password <span className="required-star">*</span>
            </label>
            <input
              id="signup-password"
              type="password"
              className={`form-control ${errors.password ? 'input-error' : ''}`}
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange('password')}
              autoComplete="new-password"
            />
            {errors.password && <p className="form-error-msg">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm">
              Confirm Password <span className="required-star">*</span>
            </label>
            <input
              id="signup-confirm"
              type="password"
              className={`form-control ${errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <p className="form-error-msg">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Footer Links */}
        <div className="auth-footer-links">
          <span>Already have an account?</span>
          <Link to="/citizen/signin" className="auth-switch-link">Sign In</Link>
        </div>
        <div className="auth-footer-links" style={{ marginTop: '0.5rem' }}>
          <Link to="/" className="auth-back-link">← Back to All Portals</Link>
        </div>
      </div>
    </div>
  );
}

export default CitizenSignUpPage;
