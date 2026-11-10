import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi, workersApi } from '../services/api';
import { CIVIC_CATEGORIES, CATEGORY_SPECIALIZATION_MAP } from '../constants/categories';
import AdminNavbar from '../components/AdminNavbar';
import ComplaintMap from '../components/ComplaintMap';
import ComplaintPhotoGallery from '../components/ComplaintPhotoGallery';

/**
 * AdminComplaintsPage Component
 * 
 * Route: /admin/complaints
 * Dedicated full complaints management interface for Municipal Administrators:
 * - Search by Reference ID, location, citizen name, issue description
 * - Filter by Status, Category, and Overdue SLA
 * - Data table with Ref ID, Category, Location, Citizen details, Status, Assigned Officer, Target Date, and Actions
 * - Quick Dispatch button linking directly to /admin/complaints/:id
 * - Quick Assign modal with category specialization matching
 * - Quick View drawer/modal with OpenStreetMap and citizen photos
 */
function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  // Modal: Assign Complaint
  const [assigningComplaint, setAssigningComplaint] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState(null);

  // Modal: View Complaint Full Details
  const [viewingComplaint, setViewingComplaint] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [complaintsRes, workersRes] = await Promise.all([
        complaintsApi.getAll({
          status: statusFilter,
          category: categoryFilter,
          overdue: showOverdueOnly,
        }),
        workersApi.getAll().catch(() => ({ workers: [] })),
      ]);

      if (complaintsRes && complaintsRes.complaints) {
        setComplaints(complaintsRes.complaints);
      }
      if (workersRes && workersRes.workers) {
        setWorkers(workersRes.workers);
      }
    } catch (err) {
      setApiError(err.message || 'Failed to load complaints.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, categoryFilter, showOverdueOnly]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side text search filter
  const filteredComplaints = complaints.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.referenceId?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.citizenName?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q)
    );
  });

  // Open Assignment Dialog
  const handleOpenAssignModal = (complaint) => {
    setAssigningComplaint(complaint);
    setSelectedWorkerId(complaint.assignedWorkerId || '');
    if (complaint.expectedCompletionDate) {
      setExpectedDate(complaint.expectedCompletionDate);
    } else {
      const target = new Date();
      target.setDate(target.getDate() + 3);
      setExpectedDate(target.toISOString().split('T')[0]);
    }
    setAssignSuccessMsg(null);
  };

  const handleCloseAssignModal = () => {
    setAssigningComplaint(null);
    setSelectedWorkerId('');
    setExpectedDate('');
    setAssignSuccessMsg(null);
  };

  const handleExecuteAssign = async (e) => {
    e.preventDefault();
    if (!selectedWorkerId) {
      setApiError('Please select a field worker.');
      return;
    }
    if (!expectedDate) {
      setApiError('Please specify an expected completion date.');
      return;
    }

    setIsAssigning(true);
    try {
      const response = await complaintsApi.assign(assigningComplaint.id, {
        workerId: selectedWorkerId,
        expectedCompletionDate: expectedDate,
      });

      if (response.success && response.complaint) {
        setAssignSuccessMsg(
          `Successfully dispatched complaint ${response.complaint.referenceId} to ${response.complaint.assignedWorkerName}!`
        );
        setTimeout(() => {
          handleCloseAssignModal();
          loadData();
        }, 1200);
      }
    } catch (err) {
      setApiError(err.message || 'Failed to assign complaint.');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="portal-dashboard-wrapper admin-portal-bg">
      <AdminNavbar />

      <main className="container dashboard-main-content">
        <div className="dashboard-page-header">
          <div>
            <h1 className="dashboard-title">Complaints Management</h1>
            <p className="dashboard-subtitle">
              Filter, search, inspect, and dispatch citizen grievances across all municipal categories.
            </p>
          </div>
          <div className="dashboard-actions">
            <Link to="/admin/dashboard" className="btn btn-secondary btn-sm">
              &larr; Back to Dashboard
            </Link>
          </div>
        </div>

        {apiError && (
          <div className="alert-banner alert-danger">
            <span>{apiError}</span>
          </div>
        )}

        {/* Filter & Search Toolbar */}
        <div className="table-filter-toolbar">
          <div className="filter-select-group">
            {/* Search Input */}
            <div className="search-filter-box">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search by Ref ID, location, or issue text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="filter-control">
              <label htmlFor="filter-status">Status:</label>
              <select
                id="filter-status"
                className="form-control form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted (Pending)</option>
                <option value="Under Review">Under Review</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="filter-control">
              <label htmlFor="filter-category">Category:</label>
              <select
                id="filter-category"
                className="form-control form-select-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="All">All Categories</option>
                {CIVIC_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Overdue Checkbox */}
            <label className="checkbox-filter-label">
              <input
                type="checkbox"
                checked={showOverdueOnly}
                onChange={(e) => setShowOverdueOnly(e.target.checked)}
              />
              <span>Show Overdue Only</span>
            </label>
          </div>

          <button type="button" className="btn btn-secondary btn-sm" onClick={loadData}>
            Refresh List
          </button>
        </div>

        {/* Complaints Data Table */}
        {isLoading ? (
          <div className="dashboard-loading-box">
            <div className="spinner-border"></div>
            <p>Loading complaints roster...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="empty-state-card">
            <h3>No Complaints Found</h3>
            <p>No complaints match the search or filter criteria.</p>
          </div>
        ) : (
          <div className="admin-table-card">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Citizen Details</th>
                  <th>Status</th>
                  <th>Assigned Officer</th>
                  <th>Target Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c) => (
                  <tr key={c.id} className={c.isOverdue ? 'row-overdue' : ''}>
                    <td>
                      <span className="table-ref-code">{c.referenceId}</span>
                    </td>
                    <td>
                      <span className="table-category-pill">{c.category}</span>
                    </td>
                    <td className="cell-location" title={c.location}>
                      {c.location}
                    </td>
                    <td>
                      <div className="citizen-cell">
                        <strong>{c.citizenName || 'Resident'}</strong>
                        <small>{c.citizenPhone || 'No phone'}</small>
                      </div>
                    </td>
                    <td>
                      <div className="status-cell-wrapper">
                        <span className={`status-badge status-${c.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                          {c.status}
                        </span>
                        {c.isOverdue && (
                          <span className="overdue-micro-badge">
                            Overdue ({Math.abs(c.daysRemaining)}d)
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {c.assignedWorkerName ? (
                        <span className="assigned-worker-tag">{c.assignedWorkerName}</span>
                      ) : (
                        <span className="unassigned-tag">Unassigned</span>
                      )}
                    </td>
                    <td>
                      {c.expectedCompletionDate ? (
                        <span className="date-cell">{new Date(c.expectedCompletionDate).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-muted">&mdash;</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        <Link
                          to={`/admin/complaints/${c.id}`}
                          className="btn btn-primary btn-xs"
                          title="Dedicated inspection and dispatch page"
                        >
                          Dispatch
                        </Link>
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => handleOpenAssignModal(c)}
                          title="Quick assign dialog"
                        >
                          Assign
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => setViewingComplaint(c)}
                          title="Quick drawer details"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal 1: Quick Dispatch & Assign Worker */}
      {assigningComplaint && (
        <div className="modal-backdrop" onClick={handleCloseAssignModal} role="dialog" aria-modal="true">
          <div className="modal-content modal-assign" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={handleCloseAssignModal}>
              &times;
            </button>

            <div className="modal-header">
              <div className="modal-icon-bubble admin-bubble">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h3 className="modal-title">Dispatch &amp; Assign Worker</h3>
                <span className="modal-phase-badge">{assigningComplaint.referenceId}</span>
              </div>
            </div>

            {assignSuccessMsg && (
              <div className="alert-banner alert-success">
                <span>{assignSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleExecuteAssign} className="report-modal-form">
              <div className="modal-body">
                <div className="assign-complaint-summary">
                  <h4>{assigningComplaint.category}</h4>
                  <p>{assigningComplaint.description}</p>
                  <small>Location: {assigningComplaint.location}</small>
                  <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: '#4338ca' }}>
                    Recommended Specialization: <strong>{CATEGORY_SPECIALIZATION_MAP[assigningComplaint.category] || 'General'}</strong>
                  </div>
                </div>

                {/* Worker Selector */}
                <div className="form-group">
                  <label className="form-label" htmlFor="select-worker">
                    Select Field Officer <span className="required-star">*</span>
                  </label>
                  <select
                    id="select-worker"
                    className="form-control form-select"
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Field Worker --</option>
                    {workers.map((w) => {
                      const isMatch = w.specialization === (CATEGORY_SPECIALIZATION_MAP[assigningComplaint.category]);
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
                  <label className="form-label" htmlFor="expected-date">
                    Expected Completion Date <span className="required-star">*</span>
                  </label>
                  <input
                    id="expected-date"
                    type="date"
                    className="form-control"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    required
                  >
                  </input>
                  <small className="form-hint">Sets the target SLA for automatic overdue tracking.</small>
                </div>
              </div>

              <div className="modal-footer form-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseAssignModal}
                  disabled={isAssigning}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isAssigning}>
                  {isAssigning ? 'Dispatching...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: View Full Complaint Details */}
      {viewingComplaint && (
        <div className="modal-backdrop" onClick={() => setViewingComplaint(null)} role="dialog" aria-modal="true">
          <div className="modal-content modal-assign" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <button type="button" className="modal-close-btn" onClick={() => setViewingComplaint(null)}>
              &times;
            </button>

            <div className="modal-header">
              <div>
                <span className="modal-phase-badge">{viewingComplaint.referenceId}</span>
                <h3 className="modal-title" style={{ marginTop: '0.25rem' }}>{viewingComplaint.category}</h3>
              </div>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <strong>Description:</strong>
                <p style={{ marginTop: '0.25rem', color: 'var(--color-text-secondary)' }}>
                  {viewingComplaint.description}
                </p>
              </div>

              <div>
                <strong>Location:</strong>
                <p style={{ marginTop: '0.25rem', color: 'var(--color-text-secondary)' }}>
                  {viewingComplaint.location}
                </p>
                {/* Map Display */}
                <div style={{ marginTop: '0.5rem' }}>
                  <ComplaintMap
                    latitude={viewingComplaint.latitude}
                    longitude={viewingComplaint.longitude}
                    address={viewingComplaint.location}
                    referenceId={viewingComplaint.referenceId}
                    height="180px"
                  />
                </div>
              </div>

              {/* Citizen Uploaded Photos */}
              <div>
                <ComplaintPhotoGallery
                  photos={viewingComplaint.photos}
                  photo={viewingComplaint.photo}
                  title="Citizen Uploaded Photo(s)"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div>
                  <strong>Citizen:</strong>
                  <div>{viewingComplaint.citizenName || 'Resident'}</div>
                  <small className="text-muted">{viewingComplaint.citizenPhone || 'No phone'}</small>
                </div>
                <div>
                  <strong>Status:</strong>
                  <div>
                    <span className={`status-badge status-${viewingComplaint.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                      {viewingComplaint.status}
                    </span>
                  </div>
                </div>
                <div>
                  <strong>Assigned Worker:</strong>
                  <div>{viewingComplaint.assignedWorkerName || 'Unassigned'}</div>
                </div>
                <div>
                  <strong>Target Date:</strong>
                  <div>{viewingComplaint.expectedCompletionDate || 'Not set'}</div>
                </div>
              </div>

              {viewingComplaint.resolutionNotes && (
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
                  <strong>Field Resolution Notes:</strong>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{viewingComplaint.resolutionNotes}</p>
                </div>
              )}
            </div>

            <div className="modal-footer form-footer">
              <Link
                to={`/admin/complaints/${viewingComplaint.id}`}
                className="btn btn-primary"
                onClick={() => setViewingComplaint(null)}
              >
                Open Full Inspection &amp; Dispatch &rarr;
              </Link>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewingComplaint(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminComplaintsPage;

