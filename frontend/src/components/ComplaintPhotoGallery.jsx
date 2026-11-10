import { useState, useEffect, useCallback } from 'react';

/**
 * ComplaintPhotoGallery Component
 * 
 * Displays citizen-uploaded photographic evidence for a complaint.
 * Supports:
 * - Empty state when no photo exists
 * - Single photo prominent display
 * - Multi-photo responsive grid gallery
 * - Full-screen lightbox with Prev/Next controls and keyboard shortcuts (ESC, Left, Right)
 */
function ComplaintPhotoGallery({ photos = [], photoPreview = null, title = 'Reported Issue Photos' }) {
  // Normalize photos array
  const photoList = Array.isArray(photos) && photos.length > 0
    ? photos
    : (photoPreview ? [photoPreview] : []);

  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);

  const handleOpenLightbox = (index) => {
    setActiveLightboxIndex(index);
  };

  const handleCloseLightbox = useCallback(() => {
    setActiveLightboxIndex(null);
  }, []);

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    setActiveLightboxIndex((prev) => (prev > 0 ? prev - 1 : photoList.length - 1));
  }, [photoList.length]);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    setActiveLightboxIndex((prev) => (prev < photoList.length - 1 ? prev + 1 : 0));
  }, [photoList.length]);

  // Handle keyboard navigation for Lightbox
  useEffect(() => {
    if (activeLightboxIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseLightbox();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, handleCloseLightbox, handlePrev, handleNext]);

  return (
    <div className="complaint-photo-section">
      <div className="photo-section-header">
        <span className="detail-section-label">
          {title}
          {photoList.length > 0 && (
            <span className="photo-count-badge">
              {photoList.length} {photoList.length === 1 ? 'photo' : 'photos'}
            </span>
          )}
        </span>
      </div>

      {photoList.length === 0 ? (
        <div className="complaint-photo-no-image">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="no-image-text">No complaint photo uploaded</span>
          <small className="no-image-subtext">Citizen did not attach photographic evidence with this report.</small>
        </div>
      ) : photoList.length === 1 ? (
        /* Single prominent photo */
        <div
          className="complaint-single-photo-card"
          onClick={() => handleOpenLightbox(0)}
          title="Click to expand full size"
        >
          <img
            src={photoList[0]}
            alt="Reported problem evidence"
            className="complaint-single-photo-img"
          />
          <span className="complaint-photo-expand-hint">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            Click to view full size
          </span>
        </div>
      ) : (
        /* Multiple photos responsive gallery grid */
        <div className="complaint-photos-grid">
          {photoList.map((photoUrl, idx) => (
            <div
              key={idx}
              className="complaint-grid-photo-item"
              onClick={() => handleOpenLightbox(idx)}
              title={`View Photo #${idx + 1}`}
            >
              <img
                src={photoUrl}
                alt={`Evidence #${idx + 1}`}
                className="complaint-grid-img"
              />
              <span className="photo-item-index-tag">#{idx + 1}</span>
              <span className="photo-item-hover-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
                Expand
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {activeLightboxIndex !== null && (
        <div className="photo-lightbox-overlay" onClick={handleCloseLightbox}>
          <div className="photo-lightbox-modal" onClick={(e) => e.stopPropagation()}>
            <div className="photo-lightbox-topbar">
              <span className="photo-lightbox-counter">
                Photo {activeLightboxIndex + 1} of {photoList.length}
              </span>
              <button
                type="button"
                className="photo-lightbox-close"
                onClick={handleCloseLightbox}
                aria-label="Close photo preview"
              >
                ✕
              </button>
            </div>

            <div className="photo-lightbox-image-stage">
              {photoList.length > 1 && (
                <button
                  type="button"
                  className="photo-lightbox-nav photo-lightbox-prev"
                  onClick={handlePrev}
                  aria-label="Previous photo"
                >
                  &#8249;
                </button>
              )}

              <img
                src={photoList[activeLightboxIndex]}
                alt={`Full size problem evidence #${activeLightboxIndex + 1}`}
                className="photo-lightbox-img"
              />

              {photoList.length > 1 && (
                <button
                  type="button"
                  className="photo-lightbox-nav photo-lightbox-next"
                  onClick={handleNext}
                  aria-label="Next photo"
                >
                  &#8250;
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComplaintPhotoGallery;

