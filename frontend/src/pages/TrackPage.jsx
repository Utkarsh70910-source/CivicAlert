import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { complaintsApi } from '../services/api';
import ComplaintMap from '../components/ComplaintMap';
import ComplaintPhotoGallery from '../components/ComplaintPhotoGallery';

/**
 * TrackPage Component
 * 
 * Allows citizens to track their complaint by Reference ID (e.g. CA-100201).
 * Displays full progress timeline, assigned worker info, expected completion date,
 * days remaining, and overdue status.
 * 
 * PRIVACY GUARANTEE:
 * Does not expose any citizen's personal phone number or private identity.
 */
function TrackPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';

  const [referenceInput, setReferenceInput] = useState(initialRef);
  const [searchedId, setSearchedId] = useState(initialRef);
  const [complaint, setComplaint] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Quick-test demo IDs for viva demonstration
  const demoIds = [
    { label: 'Sample (CA-12345)', id: 'CA-12345' },
    { label: 'Submitted (New)', id: 'CA-100201' },
    { label: 'In Progress (Active)', id: 'CA-100202' },
    { label: 'Overdue (Delayed)', id: 'CA-100205' },
    { label: 'Resolved (Fixed)', id: 'CA-100206' },
  ];

  // Fetch complaint whenever searchedId changes
  useEffect(() => {
    if (!searchedId.trim()) {
      setComplaint(null);
      setError(null);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    setError(null);

    complaintsApi
      .getById(searchedId.trim())
      .then((res) => {
        if (!isCurrent) return;
        if (res.success && res.complaint) {
          setComplaint(res.complaint);
        } else {
          setError(res.message || 'Complaint not found.');
          setComplaint(null);
        }
      })
      .catch((err) => {
        if (!isCurrent) return;
        setError(
          err.message ||
            `No complaint record found for '${searchedId}'. Please verify the reference ID.`
        );
        setComplaint(null);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [searchedId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmedInput = referenceInput.trim();
    if (!trimmedInput) {
      setError('Please enter a complaint reference ID (e.g. CA-12345 or CA-100201).');
      setComplaint(null);
      setSearchedId('');
      setSearchParams({});
      return;
    }
    setError(null);
    setSearchParams({ ref: trimmedInput });
    setSearchedId(trimmedInput);
  };

  const handleQuickDemoClick = (id) => {
    setError(null);
    setReferenceInput(id);
    setSearchParams({ ref: id });
    setSearchedId(id);
  };

  /**
   * Helper to determine current stage index (0 to 3) for progress stepper
   */
  const getStageIndex = (status) => {
    switch (status) {
      case 'Submitted':
        return 0;
      case 'Under Review':
        return 1;
      case 'In Progress':
        return 2;
      case 'Resolved':
        return 3;
      default:
        return 0;
    }
  };

  const currentStage = complaint ? getStageIndex(complaint.status) : 0;

  return (
    <div className="portal-page-container">
      <div className="container track-page-container">
        {/* Header Section */}
        <div className="page-header text-center">
          <div className="header-badge">Citizen Services</div>
          <h1 className="page-title">Track Complaint Status</h1>
          <p className="page-subtitle">
            Enter your official 8-character Reference ID (e.g., <code>CA-100201</code>) to track
            investigation, field assignment, and resolution.
          </p>

          {/* Quick Demo Test Buttons for College Viva */}
          <div className="demo-pills-bar">
            <span className="demo-pills-label">Quick Test Scenarios:</span>
            {demoIds.map((demo) => (
              <button
                key={demo.id}
                type="button"
                className={`demo-pill-btn ${searchedId === demo.id ? 'active' : ''}`}
                onClick={() => handleQuickDemoClick(demo.id)}
              >
                <span>{demo.label}</span>
                <code>{demo.id}</code>
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar Card */}
        <div className="track-search-card">
          <form onSubmit={handleSearchSubmit} className="track-search-form">
            <div className="search-input-wrapper">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="search-icon"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="track-search-input"
                placeholder="Enter Reference ID (e.g. CA-12345 or CA-100201)..."
                value={referenceInput}
                onChange={(e) => {
                  setReferenceInput(e.target.value.toUpperCase());
                  if (error) setError(null);
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary track-btn" disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Track Complaint'}
            </button>
          </form>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="track-status-loading">
            <div className="spinner-border"></div>
            <p>Fetching official municipal records for {searchedId}...</p>
          </div>
        )}

        {/* Error / Not Found Message */}
        {error && !isLoading && (
          <div className="track-not-found-card">
            <div className="not-found-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3>{referenceInput.trim() ? 'Complaint Record Not Found' : 'Reference ID Required'}</h3>
            <p>{error}</p>
            <span className="search-hint">
              Enter your 8-character reference code (e.g. CA-12345) or click one of the quick scenario buttons above.
            </span>
          </div>
        )}

        {/* Complaint Details Card */}
        {complaint && !isLoading && (
          <div className="complaint-detail-sheet">
            {/* Top Sheet Header */}
            <div className="sheet-header">
              <div className="sheet-ref-group">
                <span className="sheet-badge">Official Record</span>
                <h2 className="sheet-ref-title">{complaint.referenceId}</h2>
                <span className="sheet-category-tag">{complaint.category}</span>
              </div>

              {/* Status & Overdue Badges */}
              <div className="sheet-status-group">
                <span className={`status-badge status-${complaint.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                  <span className="status-dot"></span>
                  {complaint.status}
                </span>

                {complaint.isOverdue && (
                  <span className="status-badge status-overdue">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Overdue ({Math.abs(complaint.daysRemaining)} days past target)
                  </span>
                )}

                {!complaint.isOverdue &&
                  complaint.daysRemaining !== null &&
                  complaint.daysRemaining >= 0 &&
                  complaint.status !== 'Resolved' && (
                    <span className="status-badge status-ontrack">
                      Target: {complaint.daysRemaining === 0 ? 'Due Today' : `${complaint.daysRemaining} days remaining`}
                    </span>
                  )}
              </div>
            </div>

            {/* Visual Workflow Progress Stepper */}
            <div className="workflow-stepper">
              <div className={`step-node ${currentStage >= 0 ? 'completed' : ''}`}>
                <div className="node-circle">1</div>
                <div className="node-info">
                  <span className="node-title">Reported</span>
                  <span className="node-sub">Citizen Filed</span>
                </div>
              </div>
              <div className={`step-connector ${currentStage >= 1 ? 'completed' : ''}`}></div>

              <div className={`step-node ${currentStage >= 1 ? 'completed' : ''}`}>
                <div className="node-circle">2</div>
                <div className="node-info">
                  <span className="node-title">Under Review</span>
                  <span className="node-sub">Ward Office</span>
                </div>
              </div>
              <div className={`step-connector ${currentStage >= 2 ? 'completed' : ''}`}></div>

              <div className={`step-node ${currentStage >= 2 ? 'completed' : ''}`}>
                <div className="node-circle">3</div>
                <div className="node-info">
                  <span className="node-title">In Progress</span>
                  <span className="node-sub">Worker Dispatched</span>
                </div>
              </div>
              <div className={`step-connector ${currentStage >= 3 ? 'completed' : ''}`}></div>

              <div className={`step-node ${currentStage >= 3 ? 'completed' : ''}`}>
                <div className="node-circle">4</div>
                <div className="node-info">
                  <span className="node-title">Resolved</span>
                  <span className="node-sub">Verified Complete</span>
                </div>
              </div>
            </div>

            {/* Grid Information Details */}
            <div className="sheet-grid">
              {/* Left Column: Complaint Details */}
              <div className="sheet-col">
                <h3 className="section-col-title">Issue Information</h3>

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
                  <p className="detail-val description-val">{complaint.description}</p>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Filing Date &amp; Time</span>
                  <p className="detail-val">
                    {new Date(complaint.reportDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Complaint Photo Gallery */}
                <ComplaintPhotoGallery
                  photos={complaint.photos}
                  photoPreview={complaint.photoPreview}
                  title="Attached Photo Evidence"
                />

                {/* Complaint Map */}
                <div className="detail-section-block" style={{ marginTop: '1.25rem' }}>
                  <span className="detail-section-label">Incident Map Location</span>
                  <ComplaintMap
                    latitude={complaint.latitude}
                    longitude={complaint.longitude}
                    locationText={complaint.location}
                  />
                </div>
              </div>

              {/* Right Column: Municipal Action & Worker Details */}
              <div className="sheet-col">
                <h3 className="section-col-title">Municipal Field Action</h3>

                {/* Worker Assignment Card */}
                <div className="worker-assignment-card">
                  <div className="worker-avatar-bubble">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="worker-meta">
                    <span className="worker-role-sub">Assigned Field Officer</span>
                    <h4 className="worker-name-heading">{complaint.assignedWorkerName}</h4>

                    {/* Worker Contact ONLY when appropriate and assigned */}
                    {complaint.assignedWorkerContact ? (
                      <p className="worker-phone-link">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span>Official Contact: {complaint.assignedWorkerContact}</span>
                      </p>
                    ) : (
                      <span className="worker-contact-pending">
                        Contact details available once field work begins
                      </span>
                    )}
                  </div>
                </div>

                {/* Timeline / Target Completion Date */}
                <div className="timeline-schedule-box">
                  <div className="schedule-row">
                    <span className="sched-label">Expected Completion Date:</span>
                    <strong className="sched-val">
                      {complaint.expectedCompletionDate
                        ? new Date(complaint.expectedCompletionDate).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Awaiting scheduling by Admin'}
                    </strong>
                  </div>

                  {complaint.expectedCompletionDate && (
                    <div className="schedule-row">
                      <span className="sched-label">Resolution Status:</span>
                      <span
                        className={`sched-status ${
                          complaint.isOverdue
                            ? 'text-danger'
                            : complaint.status === 'Resolved'
                            ? 'text-success'
                            : 'text-primary'
                        }`}
                      >
                        {complaint.status === 'Resolved'
                          ? 'Completed successfully'
                          : complaint.isOverdue
                          ? `Overdue by ${Math.abs(complaint.daysRemaining)} days`
                          : `${complaint.daysRemaining} days remaining`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Resolution Notes (if resolved) */}
                {complaint.resolutionNotes && (
                  <div className="resolution-notes-callout">
                    <div className="notes-heading">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span>Field Resolution Summary</span>
                    </div>
                    <p className="notes-text">{complaint.resolutionNotes}</p>
                  </div>
                )}

                {/* Citizen Privacy Notice */}
                <div className="privacy-badge-note">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>
                    <strong>Citizen Privacy Protected:</strong> Personal identity and residential phone numbers are never published on this public tracking board.
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sheet-footer">
              <Link to="/report" className="btn btn-secondary">
                Report Another Issue
              </Link>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => window.print()}
              >
                Print / Save Status Card
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackPage;

