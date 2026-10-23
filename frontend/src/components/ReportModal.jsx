import { useEffect } from 'react';

/**
 * ReportModal Component
 * 
 * Serves as an interactive, beginner-friendly placeholder for the "Report a Problem" action.
 * Complies with requirement 11: no backend/auth/database yet, but gives instant visual feedback
 * and can be easily explained during a college viva.
 */
function ReportModal({ isOpen, onClose, selectedCategory }) {
  // Listen for the Escape key to close the modal gracefully
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling while modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // If the modal is not open, render nothing
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Modal Dialog Box */}
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation() /* Prevent clicking inside modal from closing it */}
      >
        {/* Modal Close Button */}
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <svg
            width="20"
            height="20"
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
        </button>

        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-icon-bubble">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 id="modal-title" className="modal-title">
            Report a Problem
          </h3>
          <span className="modal-phase-badge">Phase 1 Preview</span>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {selectedCategory ? (
            <div className="modal-category-notice">
              <span className="notice-label">Selected Category:</span>
              <strong className="notice-value">{selectedCategory}</strong>
            </div>
          ) : (
            <div className="modal-category-notice">
              <span className="notice-label">Selected Category:</span>
              <strong className="notice-value">General Civic Report</strong>
            </div>
          )}

          <p className="modal-message">
            Thank you for exploring <strong>CivicAlert</strong>! The full complaint submission
            system (with photo uploads, precise geolocation mapping, and municipal tracking) is currently
            scheduled for <strong>Phase 2</strong> of this college project.
          </p>

          <div className="modal-feature-list">
            <h4 className="modal-feature-heading">Coming up in the next phase:</h4>
            <ul>
              <li>
                <span className="feature-check">✓</span>
                <span>Citizen complaint submission form with image uploads</span>
              </li>
              <li>
                <span className="feature-check">✓</span>
                <span>Automated routing to local municipal ward officers</span>
              </li>
              <li>
                <span className="feature-check">✓</span>
                <span>Live status tracking: Submitted &rarr; In Progress &rarr; Resolved</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={onClose}
          >
            Got It! Back to Homepage
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportModal;
