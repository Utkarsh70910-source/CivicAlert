import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintsApi, workersApi } from '../services/api';
import { CATEGORY_SPECIALIZATION_MAP } from '../constants/categories';

/**
 * AdminComplaintDetailPage Component
 * 
 * Route: /admin/complaints/:id
 * Dedicated administrative oversight page to view citizen contact,
 * dispatch appropriate field workers based on specialization, and set SLA deadlines.
 */
function AdminComplaintDetailPage() {
  const { id } = useParams();
  const { logout } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Assignment states
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [compRes, workersRes] = await Promise.all([
        complaintsApi.getById(id),
        workersApi.getAll().catch(() => ({ workers: [] })),
      ]);

      if (compRes.success && compRes.complaint) {
        setComplaint(compRes.complaint);
        setSelectedWorkerId(compRes.complaint.assignedWorkerId || '');

        if (compRes.complaint.expectedCompletionDate) {
          setExpectedDate(compRes.complaint.expectedCompletionDate);
        } else {
          const target = new Date();
          target.setDate(target.getDate() + 3);
          setExpectedDate(target.toISOString().split('T')[0]);
        }
      }
      if (workersRes.workers) {
        setWorkers(workersRes.workers);
      }
    } catch (err) {
      setApiError(err.message || 'Failed to load complaint record.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Execute Worker Assignment & SLA setting
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWorkerId) return;

    setIsSaving(true);
    setApiError(null);
    setSuccessMsg(null);

    try {
      const response = await complaintsApi.assign(id, {
        workerId: selectedWorkerId,
        expectedCompletionDate: expectedDate || undefined,
      });

      if (response.success) {
        setSuccessMsg(`Assigned to ${response.complaint.assignedWorkerName} successfully!`);
        setComplaint(response.complaint);
      }
    } catch (err) {
      setApiError(err.message || 'Failed to assign worker.');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Status Override
  const handleStatusChange = async (newStatus) => {
    try {
      const res = await complaintsApi.updateStatus(id, { status: newStatus });
      if (res.success) {
        setComplaint(res.complaint);
        setSuccessMsg(`Status updated to '${newStatus}'`);
      }
    } catch (err) {
      setApiError(err.message || 'Failed to update status.');
    }
  };

  // Determine recommended specialization for this complaint
  const recommendedSpecialization = complaint
    ? CATEGORY_SPECIALIZATION_MAP[complaint.category] || 'General Maintenance'
    : '';

  return (
    <div className="portal-dashboard-wrapper admin-portal-bg">
      {/* Top Navbar */}
      <header className="dashboard-top-navbar admin-navbar-theme">
        <div className="container dashboard-navbar-inner">
          <div className="dashboard-brand">
            <span className="brand-icon admin-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </span>
            <div>
              <span className="brand-title">CivicAlert Admin Oversight</span>
              <span className="portal-badge-pill admin-badge-pill">Grievance Dispatch</span>
            </div>
          </div>

          <div className="user-profile-widget">
            <Link to="/admin/dashboard" className="btn btn-secondary btn-sm">
              &larr; Back to Admin Dashboard
            </Link>
            <button type="button" className="btn btn-secondary btn-sm logout-btn" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container dashboard-main-content">
        {isLoading ? (
          <div className="dashboard-loading-box">
            <div className="spinner-border"></div>
            <p>Loading administrative grievance dossier...</p>
          </div>
        ) : apiError && !complaint ? (
          <div className="track-not-found-card">
            <h3>Complaint Record Not Found</h3>
            <p>{apiError}</p>
            <Link to="/admin/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Return to Admin Dashboard
            </Link>
          </div>
        ) : (
          <div className="admin-detail-layout">
            {/* Left Column: Complaint Details & Citizen Info */}
            <div className="complaint-detail-sheet">
              <div className="sheet-header">
                <div>
                  <span className="sheet-badge">Official Municipal Record</span>
                  <h2 className="sheet-ref-title">{complaint.referenceId}</h2>
                  <span className="sheet-category-tag">{complaint.category}</span>
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
                  <span className="detail-label">Location / Address</span>
                  <p className="detail-val location-val">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{complaint.location}</span>
                  </p>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Detailed Description</span>
                  <p className="detail-val">{complaint.description}</p>
                </div>

                {/* Citizen Information (Permitted inside protected Admin Portal) */}
                <div className="worker-citizen-contact-box" style={{ borderColor: '#cbd5e1' }}>
                  <span className="contact-box-title" style={{ color: '#4338ca' }}>
                    Citizen Reporter Details (Administrative Record):
                  </span>
                  <div className="contact-details-row">
                    <div className="contact-item">
                      <span className="c-label">Citizen Name:</span>
                      <strong>{complaint.citizenName || 'Resident (Anonymous)'}</strong>
                    </div>
                    <div className="contact-item">
                      <span className="c-label">Phone Contact:</span>
                      <span>{complaint.citizenPhone || 'No contact provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Reported Timestamp</span>
                  <p className="detail-val">{new Date(complaint.createdAt).toLocaleString()}</p>
                </div>

                {/* Current Assigned Worker Info */}
                <div className="worker-assignment-card">
                  <div className="worker-avatar-bubble">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="worker-meta">
                    <span className="worker-role-sub">Current Assigned Officer</span>
                    <h4 className="worker-name-heading">{complaint.assignedWorkerName || 'Unassigned'}</h4>
                    {complaint.assignedWorkerPhone && (
                      <span className="worker-phone-link">Phone: {complaint.assignedWorkerPhone}</span>
                    )}
                  </div>
                </div>

                {/* Status Override Buttons */}
                <div className="detail-item">
                  <span className="detail-label">Change Complaint Status:</span>
                  <div className="btn-group-sm" style={{ marginTop: '0.5rem' }}>
                    {['Submitted', 'Under Review', 'In Progress', 'Resolved'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        className={`btn btn-xs ${complaint.status === st ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleStatusChange(st)}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {complaint.resolutionNotes && (
                  <div className="resolution-notes-callout">
                    <div className="notes-heading">Field Resolution Notes:</div>
                    <p className="notes-text">{complaint.resolutionNotes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Worker Dispatch & SLA Scheduler Form */}
            <div className="standalone-form-card" style={{ height: 'fit-content' }}>
              <div className="form-card-header">
                <span className="gateway-role-badge badge-admin">Municipal Dispatch</span>
                <h2>Dispatch Field Officer</h2>
                <p>Assign this complaint to an appropriate technician based on specialization.</p>
              </div>

              {/* Recommended Specialization Notice */}
              <div className="specialization-recommend-pill">
                <span>Recommended Specialization: </span>
                <strong>{recommendedSpecialization}</strong>
              </div>

              {successMsg && (
                <div className="alert-banner alert-success">
                  <span>{successMsg}</span>
                </div>
              )}
              {apiError && (
                <div className="alert-banner alert-danger">
                  <span>{apiError}</span>
                </div>
              )}

              <form onSubmit={handleAssignSubmit} className="portal-form">
                {/* Worker Selector */}
                <div className="form-group">
                  <label className="form-label" htmlFor="dispatch-worker-select">
                    Assign Field Technician <span className="required-star">*</span>
                  </label>
                  <select
                    id="dispatch-worker-select"
                    className="form-control form-select"
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Field Worker --</option>
                    {workers.map((w) => {
                      const isMatch = w.specialization === recommendedSpecialization;
                      return (
                        <option key={w.id} value={w.id}>
                          {w.workerId} - {w.name} ({w.specialization}) {isMatch ? '★ MATCH' : ''} [{w.activeTasksCount} active tasks]
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Target Completion Date */}
                <div className="form-group">
                  <label className="form-label" htmlFor="dispatch-expected-date">
                    Expected Completion Date <span className="required-star">*</span>
                  </label>
                  <input
                    id="dispatch-expected-date"
                    type="date"
                    className="form-control"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    required
                  />
                  <small className="form-hint">Used to compute SLA days remaining and overdue status.</small>
                </div>

                <div className="form-actions-right">
                  <Link to="/admin/dashboard" className="btn btn-secondary">
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    {isSaving ? 'Dispatching...' : 'Confirm Dispatch & SLA'}
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

export default AdminComplaintDetailPage;

