import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintsApi } from '../services/api';
import WorkerNavbar from '../components/WorkerNavbar';

/**
 * WorkerDashboardPage Component
 * 
 * Route: /worker/dashboard
 * Overview / High-level status dashboard for municipal field personnel:
 * - High-level KPI stat cards (Total, In Progress, Resolved, Overdue)
 * - Workload & Operational Summary metrics
 * - Urgent & Priority Tasks Spotlight (direct links to /worker/complaints/:id)
 * - Clear navigation callout to full complaints list (/worker/complaints)
 */
function WorkerDashboardPage() {
  const { user } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

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

  // Stat counters
  const totalCount = complaints.length;
  const inProgressCount = complaints.filter(
    (c) => c.status === 'In Progress' || c.status === 'Under Review' || c.status === 'Submitted'
  ).length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;
  const overdueCount = complaints.filter((c) => c.isOverdue).length;

  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  // Urgent / Priority Tasks (Overdue first, then High priority, then pending)
  const urgentTasks = complaints
    .filter((c) => c.status !== 'Resolved')
    .sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      const priorityWeight = { High: 3, Medium: 2, Low: 1 };
      return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    })
    .slice(0, 4);

  return (
    <div className="portal-dashboard-wrapper worker-portal-bg">
      <WorkerNavbar />

      <main className="container dashboard-main-content">
        {/* Welcome & Overview Header */}
        <div className="dashboard-page-header">
          <div>
            <h1 className="dashboard-title">Field Operations Overview</h1>
            <p className="dashboard-subtitle">
              Welcome back, <strong>{user?.name || 'Field Officer'}</strong> ({user?.workerId || 'Worker'}).
              Manage your assigned municipal tasks and track on-ground resolutions.
            </p>
          </div>
          <div className="dashboard-actions">
            <Link to="/worker/complaints" className="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              View All Complaints ({totalCount})
            </Link>
          </div>
        </div>

        {apiError && (
          <div className="alert-banner alert-danger">
            <span>{apiError}</span>
          </div>
        )}

        {isLoading ? (
          <div className="dashboard-loading-box">
            <div className="spinner-border"></div>
            <p>Loading operational overview...</p>
          </div>
        ) : (
          <>
            {/* 4 KPI Stat Cards */}
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

            {/* Performance & Operational Summary Row */}
            <div className="dashboard-summary-grid">
              {/* Summary Card 1: Workload Metric */}
              <div className="dashboard-card summary-card">
                <div className="summary-card-header">
                  <h3 className="summary-card-title">Performance Summary</h3>
                  <span className="badge badge-info">{user?.category || 'Field Officer'}</span>
                </div>
                <div className="summary-metric-row">
                  <div className="metric-box">
                    <span className="metric-value">{resolutionRate}%</span>
                    <span className="metric-label">Resolution Rate</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-value">{inProgressCount}</span>
                    <span className="metric-label">Active Workload</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-value">{overdueCount > 0 ? 'Requires Action' : 'Good'}</span>
                    <span className="metric-label">SLA Compliance</span>
                  </div>
                </div>
                <div className="progress-bar-container" style={{ marginTop: '1.25rem' }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${resolutionRate}%`,
                      backgroundColor: resolutionRate >= 70 ? 'var(--color-success)' : 'var(--color-warning)',
                    }}
                  ></div>
                </div>
                <p className="summary-card-hint">
                  {resolvedCount} of {totalCount} assigned tasks successfully resolved.
                </p>
              </div>

              {/* Summary Card 2: Quick Navigation Callout */}
              <div className="dashboard-card summary-card quick-nav-card">
                <div className="summary-card-header">
                  <h3 className="summary-card-title">Task Management</h3>
                  <span className="badge badge-primary">Quick Access</span>
                </div>
                <p className="summary-card-description">
                  View full task inspection details, interactive OpenStreetMap location pins,
                  citizen contact records, and upload proof of resolution photos.
                </p>
                <div className="quick-nav-actions" style={{ marginTop: '1.5rem' }}>
                  <Link to="/worker/complaints" className="btn btn-primary btn-block">
                    Open Full Complaints List ({totalCount}) &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Urgent Tasks Spotlight */}
            <div className="dashboard-section-box">
              <div className="section-header-row">
                <div>
                  <h2 className="section-title">Priority & Urgent Tasks Spotlight</h2>
                  <p className="section-subtitle">
                    Tasks that require immediate field inspection or are approaching SLA deadlines.
                  </p>
                </div>
                <Link to="/worker/complaints" className="sub-link">
                  View All &rarr;
                </Link>
              </div>

              {urgentTasks.length === 0 ? (
                <div className="empty-state-card">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <h4>No Urgent Pending Tasks</h4>
                  <p>All active tasks are currently within SLA deadlines or resolved.</p>
                </div>
              ) : (
                <div className="spotlight-grid">
                  {urgentTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`spotlight-task-card ${task.isOverdue ? 'card-overdue' : ''}`}
                    >
                      <div className="spotlight-header">
                        <span className="task-ref-id">{task.referenceId}</span>
                        <div className="spotlight-badges">
                          {task.isOverdue && <span className="status-badge badge-overdue">OVERDUE</span>}
                          <span className={`status-badge badge-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {task.status}
                          </span>
                        </div>
                      </div>

                      <div className="spotlight-body">
                        <div className="spotlight-category">{task.category}</div>
                        <p className="spotlight-desc">{task.description}</p>
                        <div className="spotlight-meta">
                          <span className="meta-item">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {task.location}
                          </span>
                          {task.expectedCompletionDate && (
                            <span className="meta-item">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              Target: {task.expectedCompletionDate}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="spotlight-footer">
                        <Link to={`/worker/complaints/${task.id}`} className="btn btn-secondary btn-sm btn-block">
                          Inspect & Update Task &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default WorkerDashboardPage;
