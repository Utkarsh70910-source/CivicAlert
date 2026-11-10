import { useState } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../services/api';
import { CIVIC_CATEGORIES } from '../constants/categories';

/**
 * ReportPage Component
 * 
 * Standalone citizen reporting route (/report) matching the application design system.
 */
function ReportPage() {
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');

  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoName, setPhotoName] = useState('');

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  const handlePhotoChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, photo: 'Please upload a valid image file.' }));
      return;
    }

    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoName('');
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
      const response = await complaintsApi.create({
        category,
        location: location.trim(),
        description: description.trim(),
        citizenName: citizenName.trim() || undefined,
        citizenPhone: citizenPhone.trim() || undefined,
        photoPreview: photoPreview || undefined,
      });

      if (response.success) {
        setSubmittedData({
          referenceId: response.referenceId,
          category: response.complaint.category,
          location: response.complaint.location,
          description: response.complaint.description,
          photoPreview,
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
            </div>

            <div className="btn-group-center">
              <Link to={`/track?ref=${submittedData.referenceId}`} className="btn btn-primary btn-lg">
                Track This Complaint Now &rarr;
              </Link>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSubmittedData(null);
                  setLocation('');
                  setDescription('');
                  setPhotoPreview(null);
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

              <div className="form-group">
                <label className="form-label">
                  Photo Evidence <span className="optional-tag">Optional</span>
                </label>
                {photoPreview ? (
                  <div className="photo-preview-card">
                    <img src={photoPreview} alt="Uploaded problem" className="photo-preview-img" />
                    <div className="photo-preview-meta">
                      <span className="photo-preview-name">{photoName}</span>
                    </div>
                    <button type="button" className="photo-remove-btn" onClick={handleRemovePhoto}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="file-upload-dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      className="visually-hidden-file-input"
                      onChange={handlePhotoChange}
                    />
                    <div className="file-upload-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </div>
                    <span className="file-upload-title">Click to attach photo evidence</span>
                    <span className="file-upload-hint">JPG, PNG, WebP</span>
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

