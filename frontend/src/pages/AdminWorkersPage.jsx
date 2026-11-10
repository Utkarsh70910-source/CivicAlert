import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { workersApi } from '../services/api';
import { CIVIC_CATEGORIES, CATEGORY_SPECIALIZATION_MAP } from '../constants/categories';
import AdminNavbar from '../components/AdminNavbar';

/**
 * AdminWorkersPage Component
 * 
 * Route: /admin/workers
 * Dedicated municipal workforce roster management:
 * - View registered field officers, contact info, active workloads, and resolution metrics
 * - Specialization routing legend
 * - Register new field worker dialog
 * - Edit worker details (Name, Worker ID, Category, Specialization, Contact, Availability, Login Username, Password)
 * - Safe worker deletion with active-assignment protection (blocks deletion if worker has active tasks)
 */
function AdminWorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [globalSuccessMsg, setGlobalSuccessMsg] = useState(null);

  // ── Modal 1: Add New Worker ──
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerCategory, setNewWorkerCategory] = useState(CIVIC_CATEGORIES[0]);
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerPassword, setNewWorkerPassword] = useState('worker123');
  const [isSubmittingWorker, setIsSubmittingWorker] = useState(false);
  const [workerSuccessMsg, setWorkerSuccessMsg] = useState(null);
  const [addWorkerError, setAddWorkerError] = useState(null);

  // ── Modal 2: Edit Worker ──
  const [editingWorker, setEditingWorker] = useState(null);
  const [editName, setEditName] = useState('');
  const [editWorkerId, setEditWorkerId] = useState('');
  const [editCategory, setEditCategory] = useState(CIVIC_CATEGORIES[0]);
  const [editSpecialization, setEditSpecialization] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState(null);
  const [editErrorMsg, setEditErrorMsg] = useState(null);

  // ── Modal 3: Delete Worker Confirmation ──
  const [deletingWorker, setDeletingWorker] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState(null);

  const loadWorkers = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await workersApi.getAll();
      if (response && response.workers) {
        setWorkers(response.workers);
      }
    } catch (err) {
      setApiError(err.message || 'Failed to load worker roster.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkers();
  }, [loadWorkers]);

  // ── Action: Add New Worker ──
  const handleOpenAddModal = () => {
    setIsAddWorkerOpen(true);
    setNewWorkerName('');
    setNewWorkerCategory(CIVIC_CATEGORIES[0]);
    setNewWorkerPhone('');
    setNewWorkerPassword('worker123');
    setWorkerSuccessMsg(null);
    setAddWorkerError(null);
  };

  const handleExecuteAddWorker = async (e) => {
    e.preventDefault();
    setAddWorkerError(null);
    if (!newWorkerName.trim()) {
      setAddWorkerError('Worker full name is required.');
      return;
    }

    setIsSubmittingWorker(true);
    try {
      const response = await workersApi.create({
        name: newWorkerName.trim(),
        category: newWorkerCategory,
        phone: newWorkerPhone.trim() || undefined,
        password: newWorkerPassword.trim() || 'worker123',
      });

      if (response.success && response.worker) {
        setWorkerSuccessMsg(
          `Successfully registered ${response.worker.name} (${response.worker.workerId})!`
        );
        // Refresh immediately in local state
        setWorkers((prev) => [...prev, response.worker]);
        setTimeout(() => {
          setIsAddWorkerOpen(false);
          setNewWorkerName('');
          setNewWorkerPhone('');
          setWorkerSuccessMsg(null);
          loadWorkers();
        }, 1200);
      }
    } catch (err) {
      setAddWorkerError(err.message || 'Failed to create worker.');
    } finally {
      setIsSubmittingWorker(false);
    }
  };

  // ── Action: Edit Worker ──
  const handleOpenEdit = (w) => {
    setEditingWorker(w);
    setEditName(w.name || '');
    setEditWorkerId(w.workerId || '');
    setEditCategory(w.category || CIVIC_CATEGORIES[0]);
    setEditSpecialization(w.specialization || CATEGORY_SPECIALIZATION_MAP[w.category] || w.category || '');
    setEditPhone(w.phone || '');
    setEditEmail(w.email || '');
    setEditStatus(w.status || 'Active');
    setEditUsername(w.username || '');
    setEditPassword('');
    setEditSuccessMsg(null);
    setEditErrorMsg(null);
  };

  const handleEditCategoryChange = (e) => {
    const selectedCat = e.target.value;
    setEditCategory(selectedCat);
    setEditSpecialization(CATEGORY_SPECIALIZATION_MAP[selectedCat] || selectedCat);
  };

  const handleExecuteEditWorker = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditErrorMsg('Worker name cannot be empty.');
      return;
    }
    if (!editWorkerId.trim()) {
      setEditErrorMsg('Worker ID cannot be empty.');
      return;
    }

    setIsSubmittingEdit(true);
    setEditErrorMsg(null);
    try {
      const payload = {
        name: editName.trim(),
        workerId: editWorkerId.trim(),
        category: editCategory,
        specialization: editSpecialization.trim() || undefined,
        phone: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
        status: editStatus,
        username: editUsername.trim() || undefined,
      };

      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const response = await workersApi.update(editingWorker.id, payload);
      if (response.success && response.worker) {
        setEditSuccessMsg(`Worker ${response.worker.name} (${response.worker.workerId}) updated successfully.`);
        // Immediately update card in local list
        setWorkers((prev) =>
          prev.map((item) =>
            item.id === editingWorker.id
              ? { ...item, ...response.worker }
              : item
          )
        );
        setTimeout(() => {
          setEditingWorker(null);
          setEditSuccessMsg(null);
          loadWorkers();
        }, 1100);
      }
    } catch (err) {
      setEditErrorMsg(err.message || 'Failed to update worker.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // ── Action: Delete Worker ──
  const handleOpenDelete = (w) => {
    setDeletingWorker(w);
    setDeleteErrorMsg(null);
  };

  const handleExecuteDeleteWorker = async () => {
    if (!deletingWorker) return;

    // Front-end active assignment check
    if (deletingWorker.activeTasksCount > 0) {
      setDeleteErrorMsg(
        `Cannot delete ${deletingWorker.name}: Worker currently has ${deletingWorker.activeTasksCount} active assigned complaint(s). Active complaints must be reassigned in Complaints Management before this worker can be removed.`
      );
      return;
    }

    setIsDeleting(true);
    setDeleteErrorMsg(null);
    try {
      const response = await workersApi.delete(deletingWorker.id);
      if (response.success) {
        setGlobalSuccessMsg(`Worker ${deletingWorker.name} (${deletingWorker.workerId}) was successfully deleted.`);
        setWorkers((prev) => prev.filter((item) => item.id !== deletingWorker.id));
        setDeletingWorker(null);
        setTimeout(() => {
          setGlobalSuccessMsg(null);
          loadWorkers();
        }, 3000);
      }
    } catch (err) {
      setDeleteErrorMsg(err.message || 'Failed to delete worker.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="portal-dashboard-wrapper admin-portal-bg">
      <AdminNavbar />

      <main className="container dashboard-main-content">
        <div className="dashboard-page-header">
          <div>
            <h1 className="dashboard-title">Worker Management</h1>
            <p className="dashboard-subtitle">
              Manage field personnel roster, trade specializations, on-ground availability, and active task loads.
            </p>
          </div>
          <div className="dashboard-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenAddModal}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>+ Add New Field Worker</span>
            </button>
            <Link to="/admin/dashboard" className="btn btn-secondary btn-sm" style={{ marginLeft: '0.5rem' }}>
              &larr; Dashboard
            </Link>
          </div>
        </div>

        {globalSuccessMsg && (
          <div className="alert-banner alert-success" style={{ marginBottom: '1.25rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{globalSuccessMsg}</span>
          </div>
        )}

        {apiError && (
          <div className="alert-banner alert-danger">
            <span>{apiError}</span>
          </div>
        )}

        {/* Specialization Mapping Legend */}
        <div className="specialization-legend-box">
          <span className="legend-title">Specialization Dispatch Routing:</span>
          <div className="legend-chips">
            <span>Roads &amp; Potholes &rarr; <strong>Road Maintenance</strong></span>
            <span>Streetlights &rarr; <strong>Electrician</strong></span>
            <span>Garbage &amp; Sanitation &rarr; <strong>Sanitation</strong></span>
            <span>Water &amp; Drainage &rarr; <strong>Plumbing/Water</strong></span>
            <span>Other &rarr; <strong>Admin Review</strong></span>
          </div>
        </div>

        {isLoading ? (
          <div className="dashboard-loading-box">
            <div className="spinner-border"></div>
            <p>Loading municipal worker roster...</p>
          </div>
        ) : workers.length === 0 ? (
          <div className="empty-state-card">
            <h3>No Field Personnel Registered</h3>
            <p>Add your first municipal technician using the button above.</p>
          </div>
        ) : (
          <div className="workers-grid">
            {workers.map((w) => {
              const statusClass =
                w.status === 'Inactive'
                  ? 'worker-status-inactive'
                  : w.status === 'On Leave'
                  ? 'worker-status-leave'
                  : '';

              return (
                <div key={w.id} className="worker-profile-card">
                  <div className="profile-card-top">
                    <div className="profile-avatar">
                      {w.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h3 className="profile-name">{w.name}</h3>
                      <span className="profile-worker-id">{w.workerId}</span>
                    </div>
                  </div>

                  <div className="profile-details-list">
                    <div className="p-row">
                      <span className="p-label">Specialization:</span>
                      <strong className="p-val">{w.specialization || w.category}</strong>
                    </div>
                    <div className="p-row">
                      <span className="p-label">Category:</span>
                      <span className="p-val">{w.category}</span>
                    </div>
                    <div className="p-row">
                      <span className="p-label">Contact:</span>
                      <span className="p-val">{w.phone || 'Not provided'}</span>
                    </div>
                    {w.username && (
                      <div className="p-row">
                        <span className="p-label">Login User:</span>
                        <span className="p-val" style={{ fontFamily: 'monospace' }}>{w.username}</span>
                      </div>
                    )}
                    <div className="p-row">
                      <span className="p-label">Availability:</span>
                      <span className={`worker-status-active ${statusClass}`}>
                        <span className="status-dot"></span>
                        {w.status || 'Active'}
                      </span>
                    </div>
                    <div className="p-row">
                      <span className="p-label">Active Workload:</span>
                      <span className="p-val badge-active-workload">
                        {w.activeTasksCount} active task(s)
                      </span>
                    </div>
                    <div className="p-row">
                      <span className="p-label">Completed Tasks:</span>
                      <span className="p-val">{w.totalCompletedCount} resolved</span>
                    </div>
                  </div>

                  {/* Worker Action Buttons */}
                  <div className="worker-card-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEdit(w)}
                      title="Edit worker information"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span>Edit Worker</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-outline btn-sm"
                      onClick={() => handleOpenDelete(w)}
                      title="Delete worker from roster"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      <span>Delete Worker</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Modal 1: Register Field Worker ── */}
      {isAddWorkerOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddWorkerOpen(false)} role="dialog" aria-modal="true">
          <div className="modal-content modal-assign" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setIsAddWorkerOpen(false)}
              aria-label="Close dialog"
            >
              &times;
            </button>

            <div className="modal-header">
              <div className="modal-icon-bubble worker-bubble">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h3 className="modal-title">Register Field Worker</h3>
                <span className="modal-phase-badge">Municipal Roster</span>
              </div>
            </div>

            {workerSuccessMsg && (
              <div className="alert-banner alert-success" style={{ margin: '1rem 1.5rem 0' }}>
                <span>{workerSuccessMsg}</span>
              </div>
            )}

            {addWorkerError && (
              <div className="alert-banner alert-danger" style={{ margin: '1rem 1.5rem 0' }}>
                <span>{addWorkerError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteAddWorker} className="report-modal-form">
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="new-worker-name">
                    Full Name <span className="required-star">*</span>
                  </label>
                  <input
                    id="new-worker-name"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Anand Murthy"
                    value={newWorkerName}
                    onChange={(e) => setNewWorkerName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="new-worker-cat">
                    Assigned Category <span className="required-star">*</span>
                  </label>
                  <select
                    id="new-worker-cat"
                    className="form-control form-select"
                    value={newWorkerCategory}
                    onChange={(e) => setNewWorkerCategory(e.target.value)}
                  >
                    {CIVIC_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat} &rarr; Specialization: {CATEGORY_SPECIALIZATION_MAP[cat] || cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="new-worker-phone">
                    Phone Number
                  </label>
                  <input
                    id="new-worker-phone"
                    type="tel"
                    className="form-control"
                    placeholder="e.g. +91 98765 00000"
                    value={newWorkerPhone}
                    onChange={(e) => setNewWorkerPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="new-worker-pass">
                    Initial Password
                  </label>
                  <input
                    id="new-worker-pass"
                    type="text"
                    className="form-control"
                    value={newWorkerPassword}
                    onChange={(e) => setNewWorkerPassword(e.target.value)}
                  />
                  <small className="form-hint">Worker will sign in using their Worker ID and this password.</small>
                </div>
              </div>

              <div className="modal-footer form-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddWorkerOpen(false)}
                  disabled={isSubmittingWorker}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingWorker}>
                  {isSubmittingWorker ? 'Registering...' : 'Register Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Edit Worker Details ── */}
      {editingWorker && (
        <div className="modal-backdrop" onClick={() => setEditingWorker(null)} role="dialog" aria-modal="true">
          <div className="modal-content modal-assign" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setEditingWorker(null)}
              aria-label="Close dialog"
            >
              &times;
            </button>

            <div className="modal-header">
              <div className="modal-icon-bubble worker-bubble">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <div>
                <h3 className="modal-title">Edit Worker Profile</h3>
                <span className="modal-phase-badge">{editingWorker.workerId}</span>
              </div>
            </div>

            {editSuccessMsg && (
              <div className="alert-banner alert-success" style={{ margin: '1rem 1.5rem 0' }}>
                <span>{editSuccessMsg}</span>
              </div>
            )}

            {editErrorMsg && (
              <div className="alert-banner alert-danger" style={{ margin: '1rem 1.5rem 0' }}>
                <span>{editErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleExecuteEditWorker} className="report-modal-form">
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-worker-name">
                      Full Name <span className="required-star">*</span>
                    </label>
                    <input
                      id="edit-worker-name"
                      type="text"
                      className="form-control"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-worker-id">
                      Worker ID <span className="required-star">*</span>
                    </label>
                    <input
                      id="edit-worker-id"
                      type="text"
                      className="form-control"
                      value={editWorkerId}
                      onChange={(e) => setEditWorkerId(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-worker-cat">
                      Category <span className="required-star">*</span>
                    </label>
                    <select
                      id="edit-worker-cat"
                      className="form-control form-select"
                      value={editCategory}
                      onChange={handleEditCategoryChange}
                      required
                    >
                      {CIVIC_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-worker-spec">
                      Specialization
                    </label>
                    <input
                      id="edit-worker-spec"
                      type="text"
                      className="form-control"
                      value={editSpecialization}
                      onChange={(e) => setEditSpecialization(e.target.value)}
                      placeholder="e.g. Road Maintenance"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-worker-phone">
                      Contact Phone
                    </label>
                    <input
                      id="edit-worker-phone"
                      type="tel"
                      className="form-control"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+91 98765 00000"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-worker-status">
                      Availability Status
                    </label>
                    <select
                      id="edit-worker-status"
                      className="form-control form-select"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="Active">Active (Available for Dispatch)</option>
                      <option value="On Leave">On Leave (Temporary)</option>
                      <option value="Inactive">Inactive (Unavailable)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-worker-username">
                      Login Username
                    </label>
                    <input
                      id="edit-worker-username"
                      type="text"
                      className="form-control"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="e.g. worker101"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-worker-email">
                      Official Email
                    </label>
                    <input
                      id="edit-worker-email"
                      type="email"
                      className="form-control"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="worker@civicalert.gov.in"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-worker-pass">
                    Change Password (Optional)
                  </label>
                  <input
                    id="edit-worker-pass"
                    type="password"
                    className="form-control"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave empty to retain existing password"
                  />
                  <small className="form-hint">Worker will use this new password if provided. Otherwise, their existing password remains unchanged.</small>
                </div>
              </div>

              <div className="modal-footer form-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingWorker(null)}
                  disabled={isSubmittingEdit}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingEdit}>
                  {isSubmittingEdit ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 3: Delete Worker Confirmation ── */}
      {deletingWorker && (
        <div className="modal-backdrop" onClick={() => setDeletingWorker(null)} role="dialog" aria-modal="true">
          <div className="modal-content modal-assign" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setDeletingWorker(null)}
              aria-label="Close dialog"
            >
              &times;
            </button>

            <div className="modal-header">
              <div className="modal-icon-bubble" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <div>
                <h3 className="modal-title">Delete Field Worker</h3>
                <span className="modal-phase-badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                  {deletingWorker.workerId}
                </span>
              </div>
            </div>

            {deleteErrorMsg && (
              <div className="alert-banner alert-danger" style={{ margin: '1rem 1.5rem 0' }}>
                <span>{deleteErrorMsg}</span>
              </div>
            )}

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <p style={{ margin: 0, fontSize: '1rem', color: 'var(--color-slate-800)' }}>
                Are you sure you want to delete worker <strong>{deletingWorker.name}</strong> ({deletingWorker.workerId})?
              </p>

              {/* Active Tasks Safety Notice */}
              {deletingWorker.activeTasksCount > 0 ? (
                <div style={{
                  backgroundColor: '#fff7ed',
                  border: '1.5px solid #fdba74',
                  borderRadius: '6px',
                  padding: '0.9rem 1rem',
                  color: '#9a3412',
                  fontSize: '0.92rem'
                }}>
                  <strong>Cannot Delete Active Worker:</strong>
                  <p style={{ margin: '0.35rem 0 0 0' }}>
                    This officer currently has <strong>{deletingWorker.activeTasksCount} active unresolved complaint(s)</strong> assigned.
                    To preserve municipal service integrity, active complaints must be reassigned in Complaints Management before this worker can be deleted.
                  </p>
                  <div style={{ marginTop: '0.75rem' }}>
                    <Link to="/admin/complaints" className="btn btn-primary btn-xs">
                      Go to Complaints to Reassign &rarr;
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--color-slate-200)',
                  borderRadius: '6px',
                  padding: '0.85rem 1rem',
                  color: 'var(--color-slate-600)',
                  fontSize: '0.9rem'
                }}>
                  <span>
                    This worker has <strong>0 active tasks</strong>. Historical completed records ({deletingWorker.totalCompletedCount} resolved) will remain preserved in municipal archives.
                  </span>
                </div>
              )}
            </div>

            <div className="modal-footer form-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingWorker(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleExecuteDeleteWorker}
                disabled={isDeleting || deletingWorker.activeTasksCount > 0}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminWorkersPage;
