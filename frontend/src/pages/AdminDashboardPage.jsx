import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintsApi, workersApi, statsApi } from '../services/api';
import { CIVIC_CATEGORIES, CATEGORY_SPECIALIZATION_MAP } from '../constants/categories';

/**
 * AdminDashboardPage Component
 * 
 * Municipal Administrator Command Center:
 * - Real-time statistics across all civic grievance categories (Total, Submitted, Under Review, In Progress, Resolved, Overdue)
 * - Complaints management with search, filters (Status, Category, Overdue)
 * - Worker management (View roster, specialization, active status, workload, Add new worker)
 * - Dispatch & Assignment (Assign complaint to worker based on specialization, set expected completion date)
 * - Navigation links for /admin/complaints and /admin/workers
 */
function AdminDashboardPage({ initialTab = 'complaints' }) {
  const { user, logout } = useAuth();

  // Navigation tab: 'complaints' | 'workers'
  const [activeTab, setActiveTab] = useState(initialTab);

  // Data states
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Filters & Search for Complaints tab
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

  // Modal: Add Worker
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerCategory, setNewWorkerCategory] = useState(CIVIC_CATEGORIES[0]);
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerPassword, setNewWorkerPassword] = useState('worker123');
  const [isSubmittingWorker, setIsSubmittingWorker] = useState(false);
  const [workerSuccessMsg, setWorkerSuccessMsg] = useState(null);

  // Modal: View Complaint Full Details
  const [viewingComplaint, setViewingComplaint] = useState(null);

  /**
   * Load all administrative data: Stats, Complaints, and Workers
   */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [statsRes, complaintsRes, workersRes] = await Promise.all([
        statsApi.get().catch(() => ({ stats: null })),
        complaintsApi.getAll({
          status: statusFilter,
          category: categoryFilter,
          overdue: showOverdueOnly,
        }),
        workersApi.getAll().catch(() => ({ workers: [] })),
      ]);

      if (statsRes && statsRes.stats) setStats(statsRes.stats);
      if (complaintsRes && complaintsRes.complaints) setComplaints(complaintsRes.complaints);
      if (workersRes && workersRes.workers) setWorkers(workersRes.workers);
    } catch (err) {
      setApiError(err.message || 'Failed to load administrative records.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, categoryFilter, showOverdueOnly]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync tab with route prop if changed
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Client-side text search filter (Ref ID, location, description, citizen name)
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
    setIsAssigning(false);
  };

  // Execute Assignment
  const handleExecuteAssign = async (e) => {
    e.preventDefault();
    if (!assigningComplaint || !selectedWorkerId) return;

    setIsAssigning(true);
    setApiError(null);

    try {
      const response = await complaintsApi.assign(assigningComplaint.id, {
        workerId: selectedWorkerId,
        expectedCompletionDate: expectedDate || undefined,
      });

      if (response.success) {
        setAssignSuccessMsg(`Successfully assigned to field officer!`);
        await loadData();
        setTimeout(() => {
          handleCloseAssignModal();
        }, 1200);
      }
    } catch (err) {
      setApiError(err.message || 'Assignment failed.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Execute Add Worker
  const handleExecuteAddWorker = async (e) => {
    e.preventDefault();
    if (!newWorkerName.trim()) return;

    setIsSubmittingWorker(true);
    setApiError(null);

    try {
      const response = await workersApi.create({
        name: newWorkerName.trim(),
        category: newWorkerCategory,
        specialization: CATEGORY_SPECIALIZATION_MAP[newWorkerCategory] || newWorkerCategory,
        phone: newWorkerPhone.trim() || undefined,
        password: newWorkerPassword.trim() || 'worker123',
      });

      if (response.success) {
        setWorkerSuccessMsg(`Worker ${response.worker.name} (${response.worker.workerId}) added!`);
        await loadData();
        setTimeout(() => {
          setIsAddWorkerOpen(false);
          setNewWorkerName('');
          setNewWorkerPhone('');
          setWorkerSuccessMsg(null);
        }, 1200);
      }
    } catch (err) {
      setApiError(err.message || 'Failed to create worker.');
    } finally {
      setIsSubmittingWorker(false);
    }
  };

  // Quick Status Change by Admin
  const handleQuickStatusChange = async (complaintId, newStatus) => {
    try {
      await complaintsApi.updateStatus(complaintId, { status: newStatus });
      await loadData();
    } catch (err) {
      setApiError(err.message || 'Status update failed.');
    }
  };

  return (
    <div className="portal-dashboard-wrapper admin-portal-bg">
      {/* Top Admin Navbar */}
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
              <span className="brand-title">CivicAlert Admin Portal</span>
              <span className="portal-badge-pill admin-badge-pill">Municipal Oversight</span>
            </div>
          </div>

          {/* Admin Header Navigation Links */}
          <nav className="admin-header-nav">
            <Link
              to="/admin/dashboard"
              className={`admin-header-link ${activeTab === 'complaints' && !searchQuery ? 'active' : ''}`}
              onClick={() => setActiveTab('complaints')}
            >
              Dashboard
            </Link>
            <Link
              to="/admin/complaints"
              className={`admin-header-link ${activeTab === 'complaints' ? 'active' : ''}`}
              onClick={() => setActiveTab('complaints')}
            >
              Complaints
            </Link>
            <Link
              to="/admin/workers"
              className={`admin-header-link ${activeTab === 'workers' ? 'active' : ''}`}
              onClick={() => setActiveTab('workers')}
            >
              Workers
            </Link>
          </nav>

          <div className="user-profile-widget">
            <div className="user-meta-text">
              <span className="user-name-bold">{user?.name || 'Administrator'}</span>
              <span className="user-role-badge">Department Head</span>
            </div>
            <button type="button" className="btn btn-secondary btn-sm logout-btn" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container dashboard-main-content">
        {/* Phase C Requirement 1: Overview Cards (Total, Submitted, Under Review, In Progress, Resolved, Overdue) */}
        {stats && (
          <div className="dashboard-stats-grid admin-stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper bg-blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </svg>
              </div>
              <div className="stat-card-text">
                <span className="stat-counter">{stats.totalComplaints}</span>
                <span className="stat-label">Total Complaints</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper bg-amber">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="stat-card-text">
                <span className="stat-counter">{stats.submittedCount}</span>
                <span className="stat-label">Submitted</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper bg-purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12h20" />
                  <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" />
                  <path d="M12 2v10" />
                </svg>
              </div>
              <div className="stat-card-text">
                <span className="stat-counter">{stats.underReviewCount || 0}</span>
                <span className="stat-label">Under Review</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper bg-cyan">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="stat-card-text">
                <span className="stat-counter">{stats.inProgressCount}</span>
                <span className="stat-label">In Progress</span>
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
                <span className="stat-counter">{stats.resolvedCount}</span>
                <span className="stat-label">Resolved</span>
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
                <span className="stat-counter">{stats.overdueCount}</span>
                <span className="stat-label">Overdue</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation: Complaints vs Worker Roster */}
        <div className="admin-tabs-nav">
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => setActiveTab('complaints')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Complaints Management ({complaints.length})</span>
          </button>

          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'workers' ? 'active' : ''}`}
            onClick={() => setActiveTab('workers')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Worker Management ({workers.length})</span>
          </button>
        </div>

        {apiError && (
          <div className="alert-banner alert-danger">
            <span>{apiError}</span>
          </div>
        )}

        {/* TAB 1: COMPLAINTS MANAGEMENT */}
        {activeTab === 'complaints' && (
          <div className="admin-tab-content">
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
          </div>
        )}

        {/* TAB 2: WORKER ROSTER MANAGEMENT */}
        {activeTab === 'workers' && (
          <div className="admin-tab-content">
            <div className="workers-toolbar">
              <div>
                <h2>Municipal Field Workers</h2>
                <p>Manage technicians, specializations, active availability, and task load.</p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsAddWorkerOpen(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add New Field Worker</span>
              </button>
            </div>

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

            <div className="workers-grid">
              {workers.map((w) => (
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
                      <span className="p-val">{w.phone}</span>
                    </div>
                    <div className="p-row">
                      <span className="p-label">Availability:</span>
                      <span className="worker-status-active">
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
                </div>
              ))}
            </div>
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
                  />
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

      {/* Modal 2: Add New Worker */}
      {isAddWorkerOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddWorkerOpen(false)} role="dialog" aria-modal="true">
          <div className="modal-content modal-assign" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={() => setIsAddWorkerOpen(false)}>
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
              <div className="alert-banner alert-success">
                <span>{workerSuccessMsg}</span>
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
                    Category <span className="required-star">*</span>
                  </label>
                  <select
                    id="new-worker-cat"
                    className="form-control form-select"
                    value={newWorkerCategory}
                    onChange={(e) => setNewWorkerCategory(e.target.value)}
                  >
                    {CIVIC_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat} &rarr; Specialization: {CATEGORY_SPECIALIZATION_MAP[cat]}
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

      {/* Modal 3: View Full Complaint Details */}
      {viewingComplaint && (
        <div className="modal-backdrop" onClick={() => setViewingComplaint(null)} role="dialog" aria-modal="true">
          <div className="modal-content update-task-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={() => setViewingComplaint(null)}>
              &times;
            </button>

            <div className="modal-header">
              <div>
                <span className="table-ref-code">{viewingComplaint.referenceId}</span>
                <h3 className="modal-title">{viewingComplaint.category}</h3>
              </div>
              <span className={`status-badge status-${viewingComplaint.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                {viewingComplaint.status}
              </span>
            </div>

            <div className="modal-body">
              <div className="detail-item">
                <span className="detail-label">Location:</span>
                <p className="detail-val">{viewingComplaint.location}</p>
              </div>

              <div className="detail-item">
                <span className="detail-label">Description:</span>
                <p className="detail-val">{viewingComplaint.description}</p>
              </div>

              <div className="detail-item">
                <span className="detail-label">Citizen Reporter (Administrative Record):</span>
                <p className="detail-val">
                  {viewingComplaint.citizenName} ({viewingComplaint.citizenPhone || 'No contact provided'})
                </p>
              </div>

              <div className="detail-item">
                <span className="detail-label">Assigned Field Worker:</span>
                <p className="detail-val">
                  {viewingComplaint.assignedWorkerName || 'Unassigned'}
                  {viewingComplaint.assignedWorkerPhone && ` - ${viewingComplaint.assignedWorkerPhone}`}
                </p>
              </div>

              <div className="detail-item">
                <span className="detail-label">Target Completion Date:</span>
                <p className="detail-val">
                  {viewingComplaint.expectedCompletionDate
                    ? new Date(viewingComplaint.expectedCompletionDate).toLocaleDateString()
                    : 'Not scheduled yet'}
                </p>
              </div>

              {viewingComplaint.resolutionNotes && (
                <div className="detail-item">
                  <span className="detail-label">Resolution Notes:</span>
                  <p className="detail-val">{viewingComplaint.resolutionNotes}</p>
                </div>
              )}

              {/* Quick Status Override by Admin */}
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Admin Status Override:</label>
                <div className="btn-group-sm">
                  {['Submitted', 'Under Review', 'In Progress', 'Resolved'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`btn btn-xs ${viewingComplaint.status === st ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => {
                        handleQuickStatusChange(viewingComplaint.id, st);
                        setViewingComplaint((prev) => ({ ...prev, status: st }));
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer action-btn-row">
              <Link
                to={`/admin/complaints/${viewingComplaint.id}`}
                className="btn btn-primary"
                onClick={() => setViewingComplaint(null)}
              >
                Open Full Dispatch Dossier &rarr;
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

export default AdminDashboardPage;
