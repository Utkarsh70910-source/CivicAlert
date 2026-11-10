import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../services/api';
import WorkerNavbar from '../components/WorkerNavbar';

/**
 * WorkerComplaintsPage Component
 * 
 * Route: /worker/complaints
 * Dedicated interface for municipal field workers to view, search, filter,
 * and update all assigned civic complaints.
 */
function WorkerComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [filterTab, setFilterTab] = useState('All'); // 'All' | 'Active' | 'Resolved' | 'Overdue'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Active complaint selected for quick status update modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('In Progress');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState(null);
  const [resolutionPhotoName, setResolutionPhotoName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState(null);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await complaintsApi.getAll();
      if (response.success && response.complaints) {
        setComplaints(response.complaints);
      }
    } catch (err) {
      setApiError(err.message || 'Failed to load assigned tasks.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Stat counts
  const totalCount = complaints.length;
  const inProgressCount = complaints.filter(
    (c) => c.status === 'In Progress' || c.status === 'Under Review' || c.status === 'Submitted'
  ).length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;
  const overdueCount = complaints.filter((c) => c.isOverdue).length;

  // Filter tasks according to active tab and search query
  const filteredTasks = complaints.filter((task) => {
    // Tab filter
    if (filterTab === 'Active' && task.status === 'Resolved') return false;
    if (filterTab === 'Resolved' && task.status !== 'Resolved') return false;
    if (filterTab === 'Overdue' && !task.isOverdue) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchRef = task.referenceId?.toLowerCase().includes(q);
      const matchLoc = task.location?.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchCitizen = task.citizenName?.toLowerCase().includes(q);
      if (!matchRef && !matchLoc && !matchDesc && !matchCitizen) return false;
    }

    return true;
  });

  const handleOpenUpdateModal = (task) => {
    setSelectedTask(task);
    setUpdateStatus(task.status);
    setResolutionNotes(task.resolutionNotes || '');
    setResolutionPhoto(task.resolutionPhoto || null);
    setResolutionPhotoName('');
    setUpdateSuccessMsg(null);
  };

  const handleCloseUpdateModal = () => {
    setSelectedTask(null);
    setIsUpdating(false);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setResolutionPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => setResolutionPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    setIsUpdating(true);
    setApiError(null);

    try {
      const response = await complaintsApi.updateStatus(selectedTask.id, {
        status: updateStatus,
        resolutionNotes: resolutionNotes.trim() || undefined,
        resolutionPhoto: resolutionPhoto || undefined,
      });

      if (response.success) {
        setUpdateSuccessMsg(`Task ${selectedTask.referenceId} updated to '${updateStatus}'!`);
        await loadTasks();
        setTimeout(() => {
          handleCloseUpdateModal();
        }, 1200);
      }
    } catch (err) {
      setApiError(err.message || 'Failed to update task.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="portal-dashboard-wrapper worker-portal-bg">
      {/* Dedicated Worker Header */}
      <WorkerNavbar />

      {/* Main Content Area */}
      <main className="container dashboard-main-content">
        {/* Page Title & Subtitle */}
        <div className="dashboard-section-title-row">
          <div>
            <h1 className="dashboard-page-heading">My Assigned Complaints</h1>
            <p className="dashboard-page-subheading">
              Inspect locations, verify citizen evidence, and submit field resolution progress.
            </p>
          </div>
          <Link to="/worker/dashboard" className="btn btn-secondary btn-sm">
            &larr; Back to Dashboard
          </Link>
        </div>

        {/* Tab Controls & Search Toolbar */}
        <div className="dashboard-filter-bar">
          <div className="tab-pill-group">
            <button
              type="button"
              className={`tab-pill ${filterTab === 'All' ? 'active' : ''}`}
              onClick={() => setFilterTab('All')}
            >
              All Assigned ({totalCount})
            </button>
            <button
              type="button"
              className={`tab-pill ${filterTab === 'Active' ? 'active' : ''}`}
              onClick={() => setFilterTab('Active')}
            >
              Active ({inProgressCount})
            </button>
            <button
              type="button"
              className={`tab-pill ${filterTab === 'Overdue' ? 'active' : ''}`}
              onClick={() => setFilterTab('Overdue')}
            >
              Overdue ({overdueCount})
            </button>
            <button
              type="button"
              className={`tab-pill ${filterTab === 'Resolved' ? 'active' : ''}`}
              onClick={() => setFilterTab('Resolved')}
            >
              Completed ({resolvedCount})
            </button>
          </div>

          <div className="filter-controls-right">
            <input
              type="text"
              className="form-control form-control-sm search-input"
              placeholder="Search by Ref ID, street, or citizen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '260px' }}
            />
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadTasks}>
              Refresh
            </button>
          </div>
        </div>

        {apiError && (
          <div className="alert-banner alert-danger">
            <span>{apiError}</span>
          </div>
        )}

        {/* Assigned Tasks Grid */}
        {isLoading ? (
          <div className="dashboard-loading-box">
            <div className="spinner-border"></div>
            <p>Loading assigned municipal tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3>No Tasks Found in this View</h3>
            <p>There are currently no tasks matching the selected filter ({filterTab}).</p>
          </div>
        ) : (
          <div className="worker-tasks-grid">
            {filteredTasks.map((task) => (
              <div key={task.id} className="worker-task-card">
                {/* Task Header */}
                <div className="task-card-header">
                  <div>
                    <span className="task-ref-tag">{task.referenceId}</span>
                    <span className="task-category-tag">{task.category}</span>
                  </div>

                  <div className="task-status-tags">
                    <span className={`status-badge status-${task.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                      {task.status}
                    </span>
                    {task.isOverdue && (
                      <span className="status-badge status-overdue">
                        Overdue ({Math.abs(task.daysRemaining)}d)
                      </span>
                    )}
                  </div>
                </div>

                {/* Task Body */}
                <div className="task-card-body">
                  <h3 className="task-card-title">{task.title || task.category}</h3>
                  <p className="task-card-desc">{task.description}</p>

                  <div className="task-meta-row">
                    <span className="task-meta-label">Location:</span>
                    <span className="task-meta-val location-text" title={task.location}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {task.location}
                    </span>
                  </div>

                  {/* Citizen Contact (Authorized for Worker) */}
                  <div className="task-meta-row citizen-meta-row">
                    <span className="task-meta-label">Citizen:</span>
                    <span className="task-meta-val">
                      {task.citizenName || 'Resident (Anonymous)'}
                      {task.citizenPhone && ` (${task.citizenPhone})`}
                    </span>
                  </div>

                  <div className="task-meta-row">
                    <span className="task-meta-label">Target SLA:</span>
                    <span className="task-meta-val">
                      {task.expectedCompletionDate ? (
                        <strong>
                          {new Date(task.expectedCompletionDate).toLocaleDateString()}
                          {task.daysRemaining !== null && !task.isOverdue && task.status !== 'Resolved' && (
                            <span className="text-muted" style={{ marginLeft: '0.4rem' }}>
                              ({task.daysRemaining}d left)
                            </span>
                          )}
                        </strong>
                      ) : (
                        <span className="text-muted">Unscheduled</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Task Footer Actions */}
                <div className="task-card-footer">
                  <Link
                    to={`/worker/complaints/${task.id}`}
                    className="btn btn-secondary btn-sm"
                    title="View details, photos, and exact map marker"
                  >
                    View Details &rarr;
                  </Link>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleOpenUpdateModal(task)}
                  >
                    Update Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Status Update Modal */}
        {selectedTask && (
          <div className="modal-backdrop" onClick={handleCloseUpdateModal}>
            <div className="modal-content update-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <span className="modal-eyebrow">Field Task Progress</span>
                  <h3 className="modal-title">Update {selectedTask.referenceId}</h3>
                  <span className="task-category-pill">{selectedTask.category}</span>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={handleCloseUpdateModal}
                  aria-label="Close modal"
                >
                  &times;
                </button>
              </div>

              {updateSuccessMsg && (
                <div className="alert-banner alert-success" style={{ margin: '1rem 1.5rem 0' }}>
                  <span>{updateSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveStatusUpdate} className="modal-body">
                {/* 1. Status Dropdown */}
                <div className="form-group">
                  <label className="form-label" htmlFor="update-status-select">
                    Task Status <span className="required-star">*</span>
                  </label>
                  <select
                    id="update-status-select"
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
                  <label className="form-label" htmlFor="update-notes-textarea">
                    Field Action Notes / Materials Used
                  </label>
                  <textarea
                    id="update-notes-textarea"
                    rows="3"
                    className="form-control form-textarea"
                    placeholder="Describe what was repaired, inspected, or dispatched..."
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
                    id="worker-photo-upload"
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
                    <label htmlFor="worker-photo-upload" className="file-upload-dropzone">
                      <div className="file-upload-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      </div>
                      <span className="file-upload-title">Attach Completed Repair Photo</span>
                      <span className="file-upload-hint">Upload photo of repaired site</span>
                    </label>
                  )}
                </div>

                <div className="modal-footer action-btn-row">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseUpdateModal}
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                    {isUpdating ? 'Saving...' : 'Save Status Update'}
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

export default WorkerComplaintsPage;

