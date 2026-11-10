import { useState } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../services/api';
import { CIVIC_CATEGORIES } from '../constants/categories';
import LocationPicker from '../components/LocationPicker';
import { useAuth } from '../context/AuthContext';

/**
 * ReportPage Component
 * 
 * Standalone citizen reporting route (/report) matching the application design system.
 */
function ReportPage() {
  const { user, isAuthenticated } = useAuth();

  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  // Pre-fill name/phone from logged-in citizen; allow override
  const [citizenName, setCitizenName] = useState(user?.name || '');
  const [citizenPhone, setCitizenPhone] = useState(user?.phone || '');

  // Map pin coordinates (optional — citizen may skip the map)
  const [pinLat, setPinLat] = useState(null);
  const [pinLng, setPinLng] = useState(null);

  // Multiple photo uploads state (up to 5 photos)
  const [photos, setPhotos] = useState([]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

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
      setErrors((prev) => ({ ...prev, photo: 'Please upload only valid image files (JPG, PNG, WebP).' }));
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
    const errs = {};
    if (!category.trim()) errs.category = 'Please select a category.';
    if (!location.trim()) errs.location = 'Please specify the exact street or landmark.';
    if (!description.trim()) errs.description = 'Please describe the problem details.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    } catch (err) {
      setApiError(err.message || 'Failed to submit report. Please check if backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="portal-page-container">
      <div className="container form-page-container">
        {submittedData ? (
          <div className="report-success-card">
            <div className="success-icon-badge">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2>Civic Problem Successfully Reported!</h2>
            <p className="success-desc">
              Your issue has been recorded and queued for municipal review and field dispatch.
            </p>

            <div className="ref-id-card highlight-card">
              <span className="ref-id-label">Official Reference Tracking ID</span>
              <div className="ref-id-code">{submittedData.referenceId}</div>
              <span className="ref-id-subtext">Bookmark or copy this ID to track real-time resolution</span>
            </div>

            <div className="summary-details-box">
              <div className="summary-row">
                <span className="summary-label">Category:</span>
                <strong>{submittedData.category}</strong>
              </div>
              <div className="summary-row">
                <span className="summary-label">Location:</span>
                <span>{submittedData.location}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Description:</span>
                <span>{submittedData.description}</span>
              </div>
              {submittedData.photos && submittedData.photos.length > 0 && (
                <div className="summary-row photo-summary-row">
                  <span className="summary-label">Photos ({submittedData.photos.length}):</span>
                  <div className="summary-photos-strip">
                    {submittedData.photos.map((url, idx) => (
                      <img key={idx} src={url} alt={`Evidence #${idx + 1}`} className="summary-img-thumb" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="btn-group-center">
              <Link to={`/track?ref=${submittedData.referenceId}`} className="btn btn-primary btn-lg">
                Track This Complaint Now &rarr;
              </Link>
              {isAuthenticated && (
                <Link to="/citizen/my-complaints" className="btn btn-secondary">
                  View in My Complaints
                </Link>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSubmittedData(null);
                  setLocation('');
                  setDescription('');
                  setPhotos([]);
                  setPinLat(null);
                  setPinLng(null);
                }}
              >
                Submit Another Report
              </button>
            </div>
          </div>
        ) : (
          <div className="standalone-form-card">
            <div className="form-card-header">
              <div className="form-badge">Public Citizen Service</div>
              <h1>Report a Neighborhood Issue</h1>
              <p>
                Help improve our city by reporting potholes, broken streetlights, water leaks, or garbage issues.
              </p>
            </div>

            {apiError && (
              <div className="alert-banner alert-danger">
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="portal-form">
              <div className="form-group">
                <label className="form-label" htmlFor="page-report-category">
                  Issue Category <span className="required-star">*</span>
                </label>
                <select
                  id="page-report-category"
                  className={`form-control form-select ${errors.category ? 'input-error' : ''}`}
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
                  }}
                >
                  <option value="">-- Choose Category --</option>
                  {CIVIC_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="form-error-msg">{errors.category}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="page-report-location">
                  Location / Address / Landmark <span className="required-star">*</span>
                </label>
                <input
                  id="page-report-location"
                  type="text"
                  className={`form-control ${errors.location ? 'input-error' : ''}`}
                  placeholder="e.g., Near City Library, 5th Cross Road, Ward 14"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (errors.location) setErrors((prev) => ({ ...prev, location: undefined }));
                  }}
                />
                {errors.location && <p className="form-error-msg">{errors.location}</p>}
              </div>

              {/* Map Location Picker */}
              <div className="form-group">
                <label className="form-label">
                  Pin Location on Map
                  <span className="optional-tag">Optional but recommended</span>
                </label>
                <LocationPicker
                  onChange={(lat, lng) => {
                    setPinLat(lat);
                    setPinLng(lng);
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="page-report-description">
                  Detailed Description <span className="required-star">*</span>
                </label>
                <textarea
                  id="page-report-description"
                  rows="4"
                  className={`form-control form-textarea ${errors.description ? 'input-error' : ''}`}
                  placeholder="Describe the severity, duration, hazards, or landmarks..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
                  }}
                ></textarea>
                {errors.description && <p className="form-error-msg">{errors.description}</p>}
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="page-citizen-name">
                    Your Name <span className="optional-tag">Optional</span>
                  </label>
                  <input
                    id="page-citizen-name"
                    type="text"
                    className="form-control"
                    placeholder="e.g., Aarav Verma"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="page-citizen-phone">
                    Phone Number <span className="optional-tag">Optional</span>
                  </label>
                  <input
                    id="page-citizen-phone"
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
                <label className="form-label" htmlFor="page-report-photo-input">
                  Photo Evidence <span className="optional-tag">Optional &bull; Max 5 photos</span>
                </label>

                <input
                  id="page-report-photo-input"
                  type="file"
                  multiple
                  accept="image/*"
                  className="visually-hidden-file-input"
                  onChange={handlePhotosChange}
                  disabled={photos.length >= MAX_PHOTOS}
                />

                {errors.photo && (
                  <p className="form-error-msg" role="alert" style={{ marginBottom: '0.75rem' }}>
                    {errors.photo}
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
                      <label htmlFor="page-report-photo-input" className="multi-photos-add-more-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>Add More Photos ({photos.length}/{MAX_PHOTOS})</span>
                      </label>
                    )}
                  </div>
                ) : (
                  <label htmlFor="page-report-photo-input" className="file-upload-dropzone">
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

              <div className="form-actions-right">
                <Link to="/" className="btn btn-secondary">
                  Cancel
                </Link>
                <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting to Municipal Portal...' : 'Submit Civic Report'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportPage;

