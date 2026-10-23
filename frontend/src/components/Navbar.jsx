import { useState } from 'react';

/**
 * Navbar Component
 * 
 * Provides top navigation with brand logo, section links,
 * and a mobile-friendly hamburger menu.
 */
function Navbar({ onOpenReportModal }) {
  // State to track if the mobile navigation menu is open or closed
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when a navigation link is clicked
  const handleNavLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-header">
      <div className="container navbar-container">
        {/* Brand Logo & Name */}
        <a href="#home" className="navbar-brand">
          <span className="brand-icon" aria-hidden="true">
            {/* Civic megaphone/alert SVG icon */}
            <svg
              width="24"
              height="24"
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
          <div className="brand-text">
            <span className="brand-title">CivicAlert</span>
            <span className="brand-badge">Community</span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className={`navbar-nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
          <ul className="nav-list">
            <li className="nav-item">
              <a href="#home" className="nav-link" onClick={handleNavLinkClick}>
                Home
              </a>
            </li>
            <li className="nav-item">
              <a href="#categories" className="nav-link" onClick={handleNavLinkClick}>
                Categories
              </a>
            </li>
            <li className="nav-item">
              <a href="#about" className="nav-link" onClick={handleNavLinkClick}>
                About
              </a>
            </li>
          </ul>

          {/* Quick Action Button */}
          <div className="nav-cta-wrapper">
            <button
              type="button"
              className="btn btn-primary nav-cta-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenReportModal();
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Report Issue</span>
            </button>
          </div>
        </nav>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            /* Close 'X' icon */
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            /* Hamburger bars icon */
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
