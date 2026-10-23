/**
 * Hero Component
 * 
 * Main showcase section highlighting the mission to improve the local community,
 * providing the primary "Report a Problem" call to action and a visual card preview.
 */
function Hero({ onOpenReportModal }) {
  return (
    <section id="home" className="hero-section">
      <div className="container hero-container">
        {/* Left Column: Text Content & Actions */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-pulse"></span>
            <span>Citizen-Led Civic Action</span>
          </div>

          <h1 className="hero-title">
            Empowering Citizens to Build a{' '}
            <span className="highlight-text">Better, Safer Community</span>
          </h1>

          <p className="hero-description">
            Notice broken streetlights, risky potholes, or garbage piled on the sidewalk?
            CivicAlert connects residents directly with local authorities to report and
            track municipal issues until they are resolved.
          </p>

          <div className="hero-actions">
            {/* Primary CTA Button */}
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => onOpenReportModal()}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Report a Problem</span>
            </button>

            {/* Secondary Button */}
            <a href="#categories" className="btn btn-secondary btn-lg">
              <span>Explore Categories</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>

          {/* Quick Metrics / Trust Indicators */}
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">4</span>
              <span className="stat-label">Civic Categories</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Accessible Online</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">100%</span>
              <span className="stat-label">Community Driven</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Preview Card */}
        <div className="hero-visual">
          <div className="preview-card">
            <div className="preview-card-header">
              <div className="preview-tag-group">
                <span className="preview-status-pill status-open">
                  <span className="status-dot"></span>
                  Active Report
                </span>
                <span className="preview-category-pill">Roads &amp; Potholes</span>
              </div>
              <span className="preview-time">10 mins ago</span>
            </div>

            <div className="preview-card-body">
              <h3 className="preview-title">Deep Pothole Near City Library Junction</h3>
              <p className="preview-text">
                Large crater formed on the northbound lane after recent rain. Causes traffic congestion
                and dangerous swerving for two-wheelers.
              </p>

              <div className="preview-location-meta">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Ward 14, Central Library Road</span>
              </div>
            </div>

            <div className="preview-card-footer">
              <div className="preview-reporter">
                <div className="reporter-avatar">CA</div>
                <div className="reporter-info">
                  <span className="reporter-name">Reported by Resident</span>
                  <span className="reporter-role">Verified Citizen</span>
                </div>
              </div>
              <span className="priority-tag high-priority">High Priority</span>
            </div>
          </div>

          {/* Decorative floating mini card */}
          <div className="floating-badge">
            <div className="floating-badge-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <p className="floating-badge-text">Transparent Progress</p>
              <span className="floating-badge-sub">Tracked by Municipal Authorities</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
