import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../services/api';
import { CIVIC_CATEGORIES } from '../constants/categories';
import LocationPicker from './LocationPicker';

/**
 * ReportModalDialog Component
 * Connects to the backend REST API (POST /api/complaints)
 */
function ReportModalDialog({ onClose, selectedCategory }) {
  // Form input states
  const [category, setCategory] = useState(
    selectedCategory && CIVIC_CATEGORIES.includes(selectedCategory) ? selectedCategory : ''
  );
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');

  // Map coordinates state (optional — citizen can skip the pin)
  const [pinLat, setPinLat] = useState(null);
  const [pinLng, setPinLng] = useState(null);

  // Multiple photo uploads state (up to 5 photos)
  const [photos, setPhotos] = useState([]);

  // Validation & async submission states
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Submission & confirmation state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  /**
   * Escape key and body scroll lock
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  /**
   * Handle multiple images selection and client-side preview via FileReader
   */
  const MAX_PHOTOS = 5;
  const MAX_FILE_SIZE_MB = 5;

  const handlePhotosChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    if (photos.length + files.length > MAX_PHOTOS) {
      setErrors((prev) => ({
        ...prev,
        photo: `You can upload at most ${MAX_PHOTOS} photos in total. (Currently selected: ${photos.length})`,
      }));
      return;
    }

    const invalidFile = files.find((f) => !f.type.startsWith('image/'));
    if (invalidFile) {
      setErrors((prev) => ({
        ...prev,
        photo: 'Please upload only valid image files (JPG, PNG, WebP).',
      }));
      return;
    }

    const oversizedFile = files.find((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (oversizedFile) {
      setErrors((prev) => ({
        ...prev,
        photo: `Each image must be under ${MAX_FILE_SIZE_MB}MB. '${oversizedFile.name}' is too large.`,
      }));
      return;
    }

    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.photo;
      return updated;
    });

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos((prev) => {
          if (prev.length >= MAX_PHOTOS) return prev;
          return [
            ...prev,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              name: file.name,
              dataUrl: reader.result,
              size: file.size,
            },
          ];
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input so re-selecting same files works
    event.target.value = '';
  };

  const handleRemovePhoto = (idToRemove) => {
    setPhotos((prev) => prev.filter((p) => p.id !== idToRemove));
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.photo;
      return updated;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!category.trim()) newErrors.category = 'Please select a category.';
    if (!location.trim()) newErrors.location = 'Please enter the location or landmark.';
    if (!description.trim()) newErrors.description = 'Please enter a description of the problem.';
    return newErrors;
  };

  /**
   * Handle form submission to Backend API
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError(null);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const photoDataUrls = photos.map((p) => p.dataUrl);

      const response = await complaintsApi.create({
        category,
        location: location.trim(),
        description: description.trim(),
        citizenName: citizenName.trim() || undefined,
        citizenPhone: citizenPhone.trim() || undefined,
        photos: photoDataUrls,
        photoPreview: photoDataUrls[0] || undefined,
        latitude: pinLat !== null ? pinLat : undefined,
        longitude: pinLng !== null ? pinLng : undefined,
      });

      if (response.success) {
        setSubmittedData({
          referenceId: response.referenceId,
          category: response.complaint.category,
          location: response.complaint.location,
          description: response.complaint.description,
          photos: photoDataUrls,
          photoPreview: photoDataUrls[0] || null,
          submittedAt: new Date(response.complaint.reportDate || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setApiError(err.message || 'Failed to submit report. Please ensure the backend server is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {isSubmitted && submittedData ? (
          <>
            <div className="modal-header modal-header-success">
              <div className="modal-icon-bubble success">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 id="modal-title" className="modal-title">
                Report Submitted!
              </h3>
              <span className="modal-phase-badge success-badge">Live System Active</span>
            </div>

            <div className="modal-body">
              <div className="confirmation-container">
                <p className="confirmation-desc">
                  Thank you! Your civic issue has been recorded in the CivicAlert database.
                  Municipal workers and ward authorities can now inspect and assign this task.
                </p>

                <div className="ref-id-card">
                  <span className="ref-id-label">Official Reference ID</span>
                  <div className="ref-id-code">{submittedData.referenceId}</div>
                  <span className="ref-id-subtext">
                    Save this reference code to track resolution progress at any time
                  </span>
                </div>

                <div className="confirmation-summary-card">
                  <div className="summary-row">
                    <span className="summary-label">Category:</span>
                    <strong className="summary-val">{submittedData.category}</strong>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Location:</span>
                    <span className="summary-val">{submittedData.location}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Description:</span>
                    <span className="summary-val desc-preview">{submittedData.description}</span>
                  </div>
                  {submittedData.photos && submittedData.photos.length > 0 && (
                    <div className="summary-row photo-summary-row">
                      <span className="summary-label">
                        Photos ({submittedData.photos.length}):
                      </span>
                      <div className="summary-photos-strip">
                        {submittedData.photos.map((photoUrl, idx) => (
                          <img
                            key={idx}
                            src={photoUrl}
                            alt={`Uploaded proof #${idx + 1}`}
                            className="summary-img-thumb"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="summary-row">
                    <span className="summary-label">Submitted:</span>
                    <span className="summary-val">{submittedData.submittedAt}</span>
                  </div>
                </div>

                <div className="confirmation-demo-notice">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>
                    <strong>Privacy Assured:</strong> Your contact information is never shown publicly. Only the assigned field worker will be able to view it for resolution coordination.
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer action-btn-row">
              <Link
                to={`/track?ref=${submittedData.referenceId}`}
                className="btn btn-primary"
                onClick={onClose}
              >
                Track This Complaint Now &rarr;
              </Link>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-header">
              <div className="modal-icon-bubble">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 id="modal-title" className="modal-title">
                Report a Civic Problem
              </h3>
              <span className="modal-phase-badge">Citizen Report</span>
            </div>

            <form onSubmit={handleSubmit} noValidate className="report-modal-form">
              <div className="modal-body">
                {apiError && (
                  <div className="alert-banner alert-danger">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{apiError}</span>
                  </div>
                )}

                <div className="modal-demo-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="demo-badge-icon">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>
                    Fill out the civic issue details below. Your submission is instantly routed to our backend server.
                  </span>
                </div>

                <div className="report-form">
                  {/* Category */}
                  <div className="form-group">
                    <label htmlFor="report-category" className="form-label">
                      <span>Issue Category <span className="required-star">*</span></span>
                    </label>
                    <select
                      id="report-category"
                      className={`form-control form-select ${errors.category ? 'input-error' : ''}`}
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
                      }}
                      aria-invalid={Boolean(errors.category)}
                    >
                      <option value="">-- Select a Category --</option>
                      {CIVIC_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="form-error-msg" role="alert">
                        <span>{errors.category}</span>
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div className="form-group">
                    <label htmlFor="report-location" className="form-label">
                      <span>Location / Landmark <span className="required-star">*</span></span>
                    </label>
                    <input
                      id="report-location"
                      type="text"
                      className={`form-control ${errors.location ? 'input-error' : ''}`}
                      placeholder="e.g., Near City Library, 5th Cross Road, Ward 14"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        if (errors.location) setErrors((prev) => ({ ...prev, location: undefined }));
                      }}
                      aria-invalid={Boolean(errors.location)}
                    />
                    {errors.location && (
                      <p className="form-error-msg" role="alert">
                        <span>{errors.location}</span>
                      </p>
                    )}
                  </div>

                  {/* Map Location Picker */}
                  <div className="form-group">
                    <label className="form-label">
                      <span>Pin Location on Map</span>
                      <span className="optional-tag">Optional but recommended</span>
                    </label>
                    <LocationPicker
                      onChange={(lat, lng) => {
                        setPinLat(lat);
                        setPinLng(lng);
                      }}
                    />
                  </div>

                  {/* Problem Description */}
                  <div className="form-group">
                    <label htmlFor="report-description" className="form-label">
                      <span>Problem Description <span className="required-star">*</span></span>
                    </label>
                    <textarea
                      id="report-description"
                      rows="3"
                      className={`form-control form-textarea ${errors.description ? 'input-error' : ''}`}
                      placeholder="Describe the issue clearly (depth of pothole, hazard level, traffic impact)..."
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
                      }}
                      aria-invalid={Boolean(errors.description)}
                    ></textarea>
                    {errors.description && (
                      <p className="form-error-msg" role="alert">
                        <span>{errors.description}</span>
                      </p>
                    )}
                  </div>

                  {/* Citizen Contact (Optional) */}
                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="report-name" className="form-label">
                        <span>Your Name</span>
                        <span className="optional-tag">Optional</span>
                      </label>
                      <input
                        id="report-name"
                        type="text"
                        className="form-control"
                        placeholder="e.g., Aarav Verma"
                        value={citizenName}
                        onChange={(e) => setCitizenName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="report-phone" className="form-label">
                        <span>Phone Number</span>
                        <span className="optional-tag">Optional</span>
                      </label>
                      <input
                        id="report-phone"
                        type="tel"
                        className="form-control"
                        placeholder="e.g., +91 98765 11111"
                        value={citizenPhone}
                        onChange={(e) => setCitizenPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Photo Evidence (Multiple photos supported) */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="report-photo-input">
                      <span>Photo Evidence</span>
                      <span className="optional-tag">Optional &bull; Max 5 photos</span>
                    </label>

                    <input
                      id="report-photo-input"
                      type="file"
                      multiple
                      accept="image/*"
                      className="visually-hidden-file-input"
                      onChange={handlePhotosChange}
                      disabled={photos.length >= MAX_PHOTOS}
                    />

                    {errors.photo && (
                      <p className="form-error-msg" role="alert" style={{ marginBottom: '0.75rem' }}>
                        <span>{errors.photo}</span>
                      </p>
                    )}

                    {photos.length > 0 ? (
                      <div className="multi-photos-manager">
                        <div className="multi-photos-grid">
                          {photos.map((p, idx) => (
                            <div key={p.id} className="multi-photo-thumb-card">
                              <img src={p.dataUrl} alt={`Upload preview ${idx + 1}`} className="multi-photo-thumb-img" />
                              <div className="multi-photo-thumb-meta">
                                <span className="multi-photo-thumb-name" title={p.name}>{p.name}</span>
                                <span className="multi-photo-thumb-size">{(p.size / 1024).toFixed(0)} KB</span>
                              </div>
                              <button
                                type="button"
                                className="multi-photo-remove-btn"
                                onClick={() => handleRemovePhoto(p.id)}
                                title={`Remove ${p.name}`}
                                aria-label={`Remove photo ${idx + 1}`}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>

                        {photos.length < MAX_PHOTOS && (
                          <label htmlFor="report-photo-input" className="multi-photos-add-more-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span>Add More Photos ({photos.length}/{MAX_PHOTOS})</span>
                          </label>
                        )}
                      </div>
                    ) : (
                      <label
                        htmlFor="report-photo-input"
                        className="file-upload-dropzone"
                      >
                        <div className="file-upload-icon">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        </div>
                        <span className="file-upload-title">Click to choose photos (up to 5)</span>
                        <span className="file-upload-hint">PNG, JPG, WebP up to 5MB each &bull; Select multiple files</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer form-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="spinner-border spinner-sm"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      <span>Submit Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * ReportModal Component (Public API)
 */
function ReportModal({ isOpen, onClose, selectedCategory }) {
  if (!isOpen) return null;

  return (
    <ReportModalDialog
      key={selectedCategory || 'default-report-modal'}
      onClose={onClose}
      selectedCategory={selectedCategory}
    />
  );
}

export default ReportModal;
