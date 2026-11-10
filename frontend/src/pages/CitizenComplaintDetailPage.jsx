import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { complaintsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ComplaintMap from '../components/ComplaintMap';
import ComplaintPhotoGallery from '../components/ComplaintPhotoGallery';

/**
 * CitizenComplaintDetailPage
 *
 * Full complaint detail view for the authenticated complaint owner.
 * Route: /citizen/complaints/:id
 *
 * Security: Backend enforces ownership. If the citizen tries to access
 * another citizen's complaint directly via the URL, the backend returns 403.
 */

const STAGES = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];

function getStageIndex(status) {
  const idx = STAGES.indexOf(status);
  return idx >= 0 ? idx : 0;
}

function formatDate(isoString, withTime = false) {
  if (!isoString) return '—';
  const opts = { year: 'numeric', month: 'long', day: 'numeric' };
  if (withTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
  return new Date(isoString).toLocaleDateString(undefined, opts);
}

function CitizenComplaintDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/citizen/signin');
      return;
    }
    setIsLoading(true);
    setError(null);
    complaintsApi
      .getById(id)
      .then((res) => {
        if (res.success && res.complaint) {
          // Verify backend gave us an owner-level view
          if (res.accessLevel === 'public-sanitized') {
            // This complaint isn't ours or backend didn't recognise us as owner
            setError('You are not authorized to view this complaint.');
            setComplaint(null);
          } else {
            setComplaint(res.complaint);
          }
        } else {
          setError(res.message || 'Complaint not found.');
        }
      })
      .catch((err) => {
        if (err.status === 403) {
          setError('Access denied. You can only view your own complaints.');
        } else if (err.status === 404) {
          setError('Complaint not found. Please check the ID.');
        } else {
          setError(err.message || 'Failed to load complaint details.');
        }
      })
      .finally(() => setIsLoading(false));
  }, [id, isAuthenticated, navigate]);

  const currentStage = complaint ? getStageIndex(complaint.status) : 0;

  return (
    <div className="portal-page-container">
      <div className="container cmc-body" style={{ maxWidth: '900px' }}>
        {/* Back Link */}
        <div style={{ marginBottom: '1.25rem' }}>
          <Link to="/citizen/my-complaints" className="cmc-back-link">
            ← Back to My Complaints
          </Link>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="cmc-loading">
            <div className="spinner-border"></div>
            <p>Loading complaint details...</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="alert-banner alert-danger" style={{ marginBottom: '2rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Complaint Detail */}
        {complaint && !isLoading && (
          <div className="complaint-detail-sheet">
            {/* Sheet Header */}
            <div className="sheet-header">
              <div className="sheet-ref-group">
                <span className="sheet-badge">My Complaint</span>
                <h2 className="sheet-ref-title">{complaint.referenceId}</h2>
                <span className="sheet-category-tag">{complaint.category}</span>
              </div>

              <div className="sheet-status-group">
                <span className={`status-badge status-${complaint.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                  <span className="status-dot"></span>
                  {complaint.status}
                </span>
                {complaint.isOverdue && (
                  <span className="status-badge status-overdue">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Overdue ({Math.abs(complaint.daysRemaining)} days past target)
                  </span>
                )}
                {!complaint.isOverdue && complaint.daysRemaining !== null && complaint.daysRemaining >= 0 && complaint.status !== 'Resolved' && (
                  <span className="status-badge status-ontrack">
                    {complaint.daysRemaining === 0 ? 'Due Today' : `${complaint.daysRemaining} days remaining`}
                  </span>
                )}
              </div>
            </div>

            {/* Progress Stepper */}
            <div className="workflow-stepper">
              {STAGES.map((stage, idx) => (
                <div key={stage} style={{ display: 'contents' }}>
                  <div className={`step-node ${currentStage >= idx ? 'completed' : ''}`}>
                    <div className="node-circle">{idx + 1}</div>
                    <div className="node-info">
                      <span className="node-title">{stage}</span>
                      <span className="node-sub">
                        {['Citizen Filed', 'Ward Office', 'Worker Dispatched', 'Verified Complete'][idx]}
                      </span>
                    </div>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div className={`step-connector ${currentStage > idx ? 'completed' : ''}`}></div>
                  )}
                </div>
              ))}
            </div>

            {/* Detail Grid */}
            <div className="sheet-grid">
              {/* Left column */}
              <div className="sheet-col">
                <h3 className="section-col-title">Issue Information</h3>

                <div className="detail-item">
                  <span className="detail-label">Location / Landmark</span>
                  <p className="detail-val location-val">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{complaint.location}</span>
                  </p>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Problem Description</span>
                  <p className="detail-val description-val">{complaint.description}</p>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Filed On</span>
                  <p className="detail-val">{formatDate(complaint.createdAt, true)}</p>
                </div>

                {/* Photos submitted by citizen */}
                <ComplaintPhotoGallery
                  photos={complaint.photos}
                  photoPreview={complaint.photoPreview}
                  title="Your Submitted Photos"
                />

                {/* Map */}
                {(complaint.latitude || complaint.longitude) && (
                  <div className="detail-section-block" style={{ marginTop: '1.25rem' }}>
                    <span className="detail-section-label">Incident Location on Map</span>
                    <ComplaintMap
                      latitude={complaint.latitude}
                      longitude={complaint.longitude}
                      locationText={complaint.location}
                    />
                  </div>
                )}
              </div>

              {/* Right column */}
              <div className="sheet-col">
                <h3 className="section-col-title">Municipal Action</h3>

                {/* Worker Assignment */}
                <div className="worker-assignment-card">
                  <div className="worker-avatar-bubble">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="worker-meta">
                    <span className="worker-role-sub">Assigned Field Officer</span>
                    <h4 className="worker-name-heading">
                      {complaint.assignedWorkerName || 'Not Assigned Yet'}
                    </h4>
                    {complaint.assignedWorkerPhone && (
                      <p className="worker-phone-link">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.19 11.9 19.79 19.79 0 0 1 1.12 3.23 2 2 0 0 1 3.1 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span>{complaint.assignedWorkerPhone}</span>
                      </p>
                    )}
                    {!complaint.assignedWorkerPhone && (
                      <span className="worker-contact-pending">Will be assigned by Admin</span>
                    )}
                  </div>
                </div>

                {/* Target Completion */}
                <div className="timeline-schedule-box">
                  <div className="schedule-row">
                    <span className="sched-label">Expected Completion:</span>
                    <strong className="sched-val">
                      {complaint.expectedCompletionDate
                        ? formatDate(complaint.expectedCompletionDate)
                        : 'Awaiting scheduling'}
                    </strong>
                  </div>
                  {complaint.expectedCompletionDate && (
                    <div className="schedule-row">
                      <span className="sched-label">Status:</span>
                      <span className={`sched-status ${complaint.isOverdue ? 'text-danger' : complaint.status === 'Resolved' ? 'text-success' : 'text-primary'}`}>
                        {complaint.status === 'Resolved'
                          ? '✓ Resolved successfully'
                          : complaint.isOverdue
                          ? `⚠ Overdue by ${Math.abs(complaint.daysRemaining)} days`
                          : `${complaint.daysRemaining} days remaining`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Resolution Notes */}
                {complaint.resolutionNotes && (
                  <div className="resolution-notes-callout">
                    <div className="notes-heading">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span>Field Resolution Summary</span>
                    </div>
                    <p className="notes-text">{complaint.resolutionNotes}</p>
                  </div>
                )}

                {/* Resolution Photo */}
                {complaint.resolutionPhoto && (
                  <div className="detail-section-block" style={{ marginTop: '1rem' }}>
                    <span className="detail-section-label">Resolution Photo</span>
                    <img
                      src={complaint.resolutionPhoto}
                      alt="Work completion evidence"
                      className="resolution-photo-img"
                      style={{ width: '100%', borderRadius: '10px', marginTop: '0.5rem', objectFit: 'cover', maxHeight: '220px' }}
                    />
                  </div>
                )}

                {/* Resolved at */}
                {complaint.resolvedAt && (
                  <div className="timeline-schedule-box" style={{ marginTop: '1rem' }}>
                    <div className="schedule-row">
                      <span className="sched-label">Resolved On:</span>
                      <strong className="sched-val text-success">{formatDate(complaint.resolvedAt, true)}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sheet-footer">
              <Link to="/citizen/my-complaints" className="btn btn-secondary">
                ← My Complaints
              </Link>
              <Link to="/report" className="btn btn-primary">
                Report Another Issue
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CitizenComplaintDetailPage;

