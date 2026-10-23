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
            <div className="footer-brand">
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
            </div>
            <p className="footer-tagline">
              A student-built prototype designed to explore how citizens can report,
              track, and solve everyday neighborhood civic issues.
            </p>
            <div className="footer-status-indicator">
              <span className="status-ping"></span>
              <span>Student Project Prototype</span>
            </div>
          </div>

          {/* Navigation Links Column */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Navigation</h4>
            <ul className="footer-links-list">
              <li>
                <a href="#home">Home</a>
              </li>
              <li>
                <a href="#categories">Issue Categories</a>
              </li>
              <li>
                <a href="#about">About CivicAlert</a>
              </li>
            </ul>
          </div>

          {/* Categories Column */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Issue Categories</h4>
            <ul className="footer-links-list">
              <li>
                <a href="#categories">Roads &amp; Potholes</a>
              </li>
              <li>
                <a href="#categories">Streetlights</a>
              </li>
              <li>
                <a href="#categories">Garbage &amp; Sanitation</a>
              </li>
              <li>
                <a href="#categories">Water &amp; Drainage</a>
              </li>
            </ul>
          </div>

          {/* College Project Info Column */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Project Info</h4>
            <p className="footer-project-info">
              Full-Stack College Project showcasing React, modular components, responsive CSS, and citizen engagement.
            </p>
            <div className="tech-stack-pills">
              <span className="tech-pill">React 19</span>
              <span className="tech-pill">Vite</span>
              <span className="tech-pill">Plain CSS</span>
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
