import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintsApi, workersApi, statsApi } from '../services/api';
import { CIVIC_CATEGORIES } from '../constants/categories';
import AdminNavbar from '../components/AdminNavbar';

/**
 * AdminDashboardPage Component
 * 
 * Route: /admin/dashboard
 * Municipal Administrator Command Center (Executive Overview):
 * - Real-time statistics across all civic grievance categories (6 KPI Cards)
 * - Category grievance distribution analytics
 * - Field operations summary & workforce capacity
 * - Urgent & Unassigned Grievances Spotlight
 * - Fast links to Complaints Management (/admin/complaints) and Worker Management (/admin/workers)
 */
function AdminDashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [statsRes, complaintsRes, workersRes] = await Promise.all([
        statsApi.get().catch(() => ({ stats: null })),
        complaintsApi.getAll().catch(() => ({ complaints: [] })),
        workersApi.getAll().catch(() => ({ workers: [] })),
      ]);

      if (statsRes && statsRes.stats) setStats(statsRes.stats);
      if (complaintsRes && complaintsRes.complaints) setComplaints(complaintsRes.complaints);
      if (workersRes && workersRes.workers) setWorkers(workersRes.workers);
    } catch (err) {
      setApiError(err.message || 'Failed to load administrative overview records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Category distribution
  const totalCount = complaints.length;
  const categoryCounts = CIVIC_CATEGORIES.map((cat) => {
    const count = complaints.filter((c) => c.category === cat).length;
    const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
    return { category: cat, count, percentage };
  });

  // Worker metrics
  const activeWorkersCount = workers.filter((w) => w.status !== 'Inactive').length;
  const totalAssignedTasks = workers.reduce((acc, w) => acc + (w.activeTasksCount || 0), 0);
  const resolutionRate =
    stats && stats.totalComplaints > 0
      ? Math.round((stats.resolvedCount / stats.totalComplaints) * 100)
      : 0;

  return (
    <div className="portal-dashboard-wrapper admin-portal-bg">
      <AdminNavbar />

      <main className="container dashboard-main-content">
        {/* Header Strip */}
        <div className="dashboard-page-header">
          <div>
            <h1 className="dashboard-title">Executive Command Center</h1>
            <p className="dashboard-subtitle">
              Welcome back, <strong>{user?.name || 'Administrator'}</strong>. Municipal Operations Overview &amp; Grievance Redressal Monitoring.
            </p>
          </div>
          <div className="dashboard-actions">
            <Link to="/admin/complaints" className="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Manage Complaints
            </Link>
            <Link to="/admin/workers" className="btn btn-secondary" style={{ marginLeft: '0.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              Worker Roster
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
            <p>Loading administrative dashboard metrics...</p>
          </div>
        ) : (
          <>
            {/* 6 High-Level KPI Stat Cards */}
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
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="stat-card-text">
                    <span className="stat-counter">{stats.submittedCount}</span>
                    <span className="stat-label">Submitted (Pending)</span>
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

            {/* Middle Section: Field Operations Summary & Category Distribution */}
            <div className="dashboard-summary-grid">
              {/* Field Operations Overview Card */}
              <div className="dashboard-card summary-card">
                <div className="summary-card-header">
                  <h3 className="summary-card-title">Field Workforce Operations</h3>
                  <Link to="/admin/workers" className="badge badge-primary">
                    View Roster &rarr;
                  </Link>
                </div>
                <div className="summary-metric-row">
                  <div className="metric-box">
                    <span className="metric-value">{activeWorkersCount}</span>
                    <span className="metric-label">Active Officers</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-value">{totalAssignedTasks}</span>
                    <span className="metric-label">Active Dispatches</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-value">{resolutionRate}%</span>
                    <span className="metric-label">Overall Resolution</span>
                  </div>
                </div>
                <div className="progress-bar-container" style={{ marginTop: '1.25rem' }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${resolutionRate}%`,
                      backgroundColor: resolutionRate >= 60 ? 'var(--color-success)' : 'var(--color-warning)',
                    }}
                  ></div>
                </div>
                <p className="summary-card-hint">
                  {stats?.resolvedCount || 0} of {stats?.totalComplaints || 0} citizen grievances successfully resolved.
                </p>
                <div style={{ marginTop: '1rem' }}>
                  <Link to="/admin/workers" className="btn btn-secondary btn-sm btn-block">
                    Manage Technicians &amp; Specializations &rarr;
                  </Link>
                </div>
              </div>

              {/* Category Grievance Breakdown Card */}
              <div className="dashboard-card summary-card">
                <div className="summary-card-header">
                  <h3 className="summary-card-title">Grievance Distribution</h3>
                  <Link to="/admin/complaints" className="badge badge-info">
                    All Grievances &rarr;
                  </Link>
                </div>
                <div className="category-bars-list" style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {categoryCounts.map((item) => (
                    <div key={item.category} className="cat-bar-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600 }}>{item.category}</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="progress-bar-container" style={{ height: '6px' }}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: 'var(--color-primary)',
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>



            {/* Fast Navigation Callout */}
            <div className="dashboard-summary-grid" style={{ marginTop: '1.5rem' }}>
              <div className="dashboard-card summary-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Complaints Management</h4>
                  <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    Access complete search, multi-category filters, full grievance table, and dispatch controls.
                  </p>
                </div>
                <Link to="/admin/complaints" className="btn btn-primary">
                  Go to Complaints &rarr;
                </Link>
              </div>

              <div className="dashboard-card summary-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Field Personnel Roster</h4>
                  <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    Register municipal technicians, view task specializations, and monitor workload distribution.
                  </p>
                </div>
                <Link to="/admin/workers" className="btn btn-secondary">
                  Go to Workers &rarr;
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboardPage;
