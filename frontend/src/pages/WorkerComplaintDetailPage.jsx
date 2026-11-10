import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintsApi } from '../services/api';

/**
 * WorkerComplaintDetailPage Component
 * 
 * Route: /worker/complaints/:id
 * Dedicated operational view for an assigned municipal field worker to inspect task details,
 * contact the reporting citizen, and submit status updates, notes, and photo proof.
 * 
 * SECURITY:
 * Backend enforces 403 Forbidden if Worker A tries to open Worker B's complaint.
 */
function WorkerComplaintDetailPage() {
  const { id } = useParams();
  const { user, logout } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Status update form states
  const [updateStatus, setUpdateStatus] = useState('In Progress');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState(null);
  const [resolutionPhotoName, setResolutionPhotoName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState(null);

  const loadComplaint = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await complaintsApi.getById(id);
      if (response.success && response.complaint) {
        setComplaint(response.complaint);
        setUpdateStatus(response.complaint.status);
        setResolutionNotes(response.complaint.resolutionNotes || '');
        setResolutionPhoto(response.complaint.resolutionPhoto || null);
      }
    } catch (err) {
      setApiError(
        err.message ||
          'Failed to retrieve complaint details. You may not have permission to view this task.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadComplaint();
  }, [loadComplaint]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setResolutionPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => setResolutionPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setApiError(null);
    setUpdateSuccessMsg(null);

    try {
      const response = await complaintsApi.updateStatus(id, {
        status: updateStatus,
        resolutionNotes: resolutionNotes.trim() || undefined,
        resolutionPhoto: resolutionPhoto || undefined,
      });

      if (response.success) {
        setUpdateSuccessMsg(`Complaint status successfully updated to '${updateStatus}'!`);
        setComplaint(response.complaint);
      }
    } catch (err) {
      setApiError(err.message || 'Failed to update task status.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="portal-dashboard-wrapper worker-portal-bg">
      {/* Top Banner / Worker Header */}
      <header className="dashboard-top-navbar">
        <div className="container dashboard-navbar-inner">
          <div className="dashboard-brand">
            <span className="brand-icon worker-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </span>
            <div>
              <span className="brand-title">CivicAlert Field Portal</span>
              <span className="portal-badge-pill">Task Inspection</span>
            </div>
          </div>

          <div className="user-profile-widget">
            <div className="user-meta-text">
              <span className="user-name-bold">{user?.name}</span>
              <span className="user-role-badge">
                {user?.workerId} &bull; {user?.category}
              </span>
            </div>
            <Link to="/worker/dashboard" className="btn btn-secondary btn-sm">
              &larr; Back to Dashboard
            </Link>
            <button type="button" className="btn btn-secondary btn-sm logout-btn" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="container dashboard-main-content">
        {isLoading ? (
          <div className="dashboard-loading-box">
            <div className="spinner-border"></div>
            <p>Loading task inspection records...</p>
          </div>
        ) : apiError ? (
          <div className="track-not-found-card">
            <div className="not-found-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <h3>Access Denied or Not Found</h3>
            <p>{apiError}</p>
            <div className="btn-group-center" style={{ marginTop: '1.5rem' }}>
              <Link to="/worker/dashboard" className="btn btn-primary">
                Return to My Assigned Tasks
              </Link>
            </div>
          </div>
        ) : (
          <div className="worker-detail-layout">
            {/* Left Card: Complaint Details */}
            <div className="complaint-detail-sheet">
              <div className="sheet-header">
                <div>
                  <span className="sheet-badge">Assigned Task</span>
                  <h2 className="sheet-ref-title">{complaint.referenceId}</h2>
                  <span className="sheet-category-tag">{complaint.category}</span>
                  {complaint.priority && (
                    <span className={`priority-tag priority-${complaint.priority?.toLowerCase()}`}>
                      {complaint.priority} Priority
                    </span>
                  )}
                </div>

                <div className="sheet-status-group">
                  <span className={`status-badge status-${complaint.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                    {complaint.status}
                  </span>
                  {complaint.isOverdue && (
                    <span className="status-badge status-overdue">
                      Overdue ({Math.abs(complaint.daysRemaining)} days)
                    </span>
                  )}
                </div>
              </div>

              <div className="sheet-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="detail-item">
                  <span className="detail-label">Location / Landmark</span>
                  <p className="detail-val location-val">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{complaint.location}</span>
                  </p>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Problem Description</span>
                  <p className="detail-val">{complaint.description}</p>
                </div>

                {/* Citizen Contact details (Authorized inside Worker Portal) */}
                <div className="worker-citizen-contact-box">
                  <span className="contact-box-title">Citizen Contact (Field Coordination):</span>
                  <div className="contact-details-row">
                    <div className="contact-item">
                      <span className="c-label">Reporting Resident:</span>
                      <strong>{complaint.citizenName || 'Resident (Anonymous)'}</strong>
                    </div>
                    {complaint.citizenPhone && (
                      <div className="contact-item">
                        <span className="c-label">Phone Contact:</span>
                        <a href={`tel:${complaint.citizenPhone}`} className="c-phone-link">
                          {complaint.citizenPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Filing Date</span>
                  <p className="detail-val">
                    {new Date(complaint.createdAt || complaint.reportDate).toLocaleString()}
                  </p>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Expected Completion Date</span>
                  <p className="detail-val">
                    <strong>
                      {complaint.expectedCompletionDate
                        ? new Date(complaint.expectedCompletionDate).toLocaleDateString()
                        : 'Unscheduled'}
                    </strong>
                    {complaint.daysRemaining !== null && !complaint.isOverdue && complaint.status !== 'Resolved' && (
                      <span className="text-muted" style={{ marginLeft: '0.5rem' }}>
                        ({complaint.daysRemaining} days remaining)
                      </span>
                    )}
                  </p>
                </div>

                {complaint.photoPreview && (
                  <div className="detail-item">
                    <span className="detail-label">Initial Citizen Photo</span>
                    <img
                      src={complaint.photoPreview}
                      alt="Citizen evidence"
                      className="track-photo-preview"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Card: Worker Action Form */}
            <div className="standalone-form-card" style={{ height: 'fit-content' }}>
              <div className="form-card-header">
                <span className="gateway-role-badge badge-worker">Field Action</span>
                <h2>Update Task Status &amp; Notes</h2>
                <p>Record your repair actions, current phase, and completion proof.</p>
              </div>

              {updateSuccessMsg && (
                <div className="alert-banner alert-success">
                  <span>{updateSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveUpdate} className="portal-form">
                {/* 1. Status Dropdown */}
                <div className="form-group">
                  <label className="form-label" htmlFor="detail-status-select">
                    Current Status <span className="required-star">*</span>
                  </label>
                  <select
                    id="detail-status-select"
                    className="form-control form-select"
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    required
                  >
                    <option value="Under Review">Under Review (Inspecting site)</option>
                    <option value="In Progress">In Progress (Active repairs underway)</option>
                    <option value="Resolved">Resolved (Work completed)</option>
                  </select>
                </div>

                {/* 2. Resolution Notes */}
                <div className="form-group">
                  <label className="form-label" htmlFor="detail-notes">
                    Resolution Notes / Work Performed
                  </label>
                  <textarea
                    id="detail-notes"
                    rows="4"
                    className="form-control form-textarea"
                    placeholder="Document materials used, crew dispatch, repairs completed, or inspection notes..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  ></textarea>
                </div>

                {/* 3. Optional Resolution Photo */}
                <div className="form-group">
                  <label className="form-label">
                    Resolution Photo Evidence <span className="optional-tag">Optional</span>
                  </label>

                  <input
                    id="detail-photo-input"
                    type="file"
                    accept="image/*"
                    className="visually-hidden-file-input"
                    onChange={handlePhotoUpload}
                  />

                  {resolutionPhoto ? (
                    <div className="photo-preview-card">
                      <img src={resolutionPhoto} alt="Resolution proof" className="photo-preview-img" />
                      <div className="photo-preview-meta">
                        <span className="photo-preview-name">{resolutionPhotoName || 'Proof attached'}</span>
                      </div>
                      <button
                        type="button"
                        className="photo-remove-btn"
                        onClick={() => setResolutionPhoto(null)}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="detail-photo-input" className="file-upload-dropzone">
                      <span className="file-upload-title">Attach Completed Repair Photo</span>
                      <span className="file-upload-hint">Upload photo of repaired site</span>
                    </label>
                  )}
                </div>

                <div className="form-actions-right">
                  <Link to="/worker/dashboard" className="btn btn-secondary">
                    Back to Dashboard
                  </Link>
                  <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                    {isUpdating ? 'Saving...' : 'Save Task Progress'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default WorkerComplaintDetailPage;

