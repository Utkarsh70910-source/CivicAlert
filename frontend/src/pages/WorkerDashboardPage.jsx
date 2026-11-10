import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintsApi } from '../services/api';

/**
 * WorkerDashboardPage Component
 * 
 * Task-oriented dashboard for municipal field personnel:
 * - View only assigned complaints
 * - Review citizen location & phone contact info
 * - Update status (In Progress, Under Review, Resolved)
 * - Add resolution notes & upload resolution photo
 */
function WorkerDashboardPage() {
  const { user, logout } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [filterTab, setFilterTab] = useState('All'); // 'All' | 'Active' | 'Resolved' | 'Overdue'
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Active complaint selected for status update
  const [selectedTask, setSelectedTask] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('In Progress');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState(null);
  const [resolutionPhotoName, setResolutionPhotoName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState(null);

  /**
   * Fetch worker's assigned tasks
   */
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

  // Compute stat counters
  const totalCount = complaints.length;
  const inProgressCount = complaints.filter(
    (c) => c.status === 'In Progress' || c.status === 'Under Review' || c.status === 'Submitted'
  ).length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;
  const overdueCount = complaints.filter((c) => c.isOverdue).length;

  // Filter tasks according to active tab
  const filteredTasks = complaints.filter((task) => {
    if (filterTab === 'Active') {
      return task.status !== 'Resolved';
    }
    if (filterTab === 'Resolved') {
      return task.status === 'Resolved';
    }
    if (filterTab === 'Overdue') {
      return task.isOverdue;
    }
    return true; // 'All'
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
        // Refresh local task list
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
              <span className="portal-badge-pill">Worker Workspace</span>
            </div>
          </div>

          <div className="user-profile-widget">
            <div className="user-meta-text">
              <span className="user-name-bold">{user?.name}</span>
              <span className="user-role-badge">
                {user?.workerId} &bull; {user?.category || 'Field Officer'}
              </span>
            </div>
            <button type="button" className="btn btn-secondary btn-sm logout-btn" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container dashboard-main-content">
        {/* Welcome & Statistics Strip */}
        <div className="dashboard-stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper bg-blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
            </div>
            <div className="stat-card-text">
              <span className="stat-counter">{totalCount}</span>
              <span className="stat-label">Total Assigned</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper bg-amber">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="stat-card-text">
              <span className="stat-counter">{inProgressCount}</span>
              <span className="stat-label">In Progress / Pending</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper bg-green">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="stat-card-text">
              <span className="stat-counter">{resolvedCount}</span>
              <span className="stat-label">Resolved / Closed</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper bg-red">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="stat-card-text">
              <span className="stat-counter">{overdueCount}</span>
              <span className="stat-label">Overdue Tasks</span>
            </div>
          </div>
        </div>

        {/* Tab Controls & Actions */}
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

          <button type="button" className="btn btn-secondary btn-sm" onClick={loadTasks}>
            Refresh Tasks
          </button>
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
                  <p className="task-description">{task.description}</p>

                  <div className="task-location-row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{task.location}</span>
                  </div>

                  {/* Citizen Contact Info (Authorized to Assigned Worker Only) */}
                  <div className="worker-citizen-contact-box">
                    <span className="contact-box-title">Citizen Contact (Field Coordination):</span>
                    <div className="contact-details-row">
                      <div className="contact-item">
                        <span className="c-label">Resident:</span>
                        <strong>{task.citizenName || 'Resident (Anonymous)'}</strong>
                      </div>
                      {task.citizenPhone && (
                        <div className="contact-item">
                          <span className="c-label">Phone:</span>
                          <a href={`tel:${task.citizenPhone}`} className="c-phone-link">
                            {task.citizenPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expected Completion Date */}
                  <div className="task-due-row">
                    <span className="due-label">Target Completion:</span>
                    <strong className={task.isOverdue ? 'text-danger' : 'text-slate-800'}>
                      {task.expectedCompletionDate
                        ? new Date(task.expectedCompletionDate).toLocaleDateString()
                        : 'Unscheduled'}
                    </strong>
                  </div>

                  {/* Existing Resolution Summary if any */}
                  {task.resolutionNotes && (
                    <div className="task-existing-notes">
                      <strong>Resolution Notes:</strong>
                      <p>{task.resolutionNotes}</p>
                    </div>
                  )}
                </div>

                {/* Task Footer / Action Buttons */}
                <div className="task-card-footer action-btn-row">
                  <Link
                    to={`/worker/complaints/${task.id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    View Details &rarr;
                  </Link>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleOpenUpdateModal(task)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>Quick Update</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Status & Resolution Update Modal Dialog */}
      {selectedTask && (
        <div className="modal-backdrop" onClick={handleCloseUpdateModal} role="dialog" aria-modal="true">
          <div className="modal-content update-task-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={handleCloseUpdateModal}>
              &times;
            </button>

            <div className="modal-header">
              <div className="modal-icon-bubble worker-bubble">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <div>
                <h3 className="modal-title">Update Task: {selectedTask.referenceId}</h3>
                <span className="modal-phase-badge">{selectedTask.category}</span>
              </div>
            </div>

            {updateSuccessMsg && (
              <div className="alert-banner alert-success">
                <span>{updateSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveStatusUpdate} className="report-modal-form">
              <div className="modal-body">
                {/* Status Selection */}
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
                    <option value="In Progress">In Progress (Work Underway)</option>
                    <option value="Under Review">Under Review (Inspection / Awaiting Materials)</option>
                    <option value="Resolved">Resolved (Completed &amp; Fixed)</option>
                  </select>
                </div>

                {/* Resolution Notes */}
                <div className="form-group">
                  <label className="form-label" htmlFor="resolution-notes">
                    Resolution / Inspection Notes
                  </label>
                  <textarea
                    id="resolution-notes"
                    rows="3"
                    className="form-control form-textarea"
                    placeholder="Enter what actions were taken (e.g. potholes filled with bitumen, streetlight bulb replaced, waste truck dispatched)..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  ></textarea>
                </div>

                {/* Resolution Photo Upload */}
                <div className="form-group">
                  <label className="form-label" htmlFor="resolution-photo-input">
                    Resolution Photo Evidence <span className="optional-tag">Optional</span>
                  </label>
                  <input
                    id="resolution-photo-input"
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
                    <label htmlFor="resolution-photo-input" className="file-upload-dropzone">
                      <span className="file-upload-title">Attach Completion Photo</span>
                      <span className="file-upload-hint">Upload photo of repaired issue</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="modal-footer form-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseUpdateModal}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                  {isUpdating ? 'Saving Update...' : 'Save Task Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkerDashboardPage;

