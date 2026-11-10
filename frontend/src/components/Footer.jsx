import { Link } from 'react-router-dom';

/**
 * Footer Component
 * 
 * Provides brand summary, quick links, category shortcuts,
 * and academic project credits.
 */
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-wrapper">
      <div className="container footer-container">
        {/* Top Section */}
        <div className="footer-top-grid">
          {/* Brand & Mission column */}
          <div className="footer-brand-col">
            <Link to="/citizen" className="footer-brand">
              <span className="brand-icon footer-icon" aria-hidden="true">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
              </span>
              <span className="footer-brand-name">CivicAlert</span>
            </Link>
            <p className="footer-tagline">
              A student-built prototype designed to empower citizens to report,
              track, and solve everyday neighborhood civic issues.
            </p>
            <div className="footer-status-indicator">
              <span className="status-ping"></span>
              <span>Local Milestone Active</span>
            </div>
          </div>

          {/* Citizen Navigation Links Column */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Citizen Services</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/citizen">Home</Link>
              </li>
              <li>
                <Link to="/report">Report an Issue</Link>
              </li>
              <li>
                <Link to="/track">Track Complaint</Link>
              </li>
              <li>
                <Link to="/">Portal Selection</Link>
              </li>
              <li>
                <Link to="/track?ref=CA-100201">Sample Tracking Demo</Link>
              </li>
            </ul>
          </div>

          {/* College Project Info Column */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Project Info</h4>
            <p className="footer-project-info">
              Full-Stack College Capstone Project showcasing React 19, Express REST APIs,
              Role-Based Access Control, and municipal civic operations.
            </p>
            <div className="tech-stack-pills">
              <span className="tech-pill">React 19</span>
              <span className="tech-pill">Express 5</span>
              <span className="tech-pill">RBAC</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p className="footer-copy">
            &copy; {currentYear} CivicAlert. Developed for Community Improvement &amp; College Capstone.
          </p>
          <p className="footer-note">
            Designed for desktop &amp; mobile accessibility.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
