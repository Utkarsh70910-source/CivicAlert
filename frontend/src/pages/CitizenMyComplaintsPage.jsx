import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { complaintsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * CitizenMyComplaintsPage
 *
 * Shows all complaints submitted by the authenticated citizen.
 * Data is fetched from /api/complaints/my — backend enforces ownership
 * from the session token, NOT from query parameters.
 *
 * A citizen cannot see another citizen's complaints even by changing the URL.
 */

const STATUS_CONFIG = {
  Submitted: { label: 'Submitted', cls: 'status-submitted' },
  'Under Review': { label: 'Under Review', cls: 'status-under-review' },
  'In Progress': { label: 'In Progress', cls: 'status-in-progress' },
  Resolved: { label: 'Resolved', cls: 'status-resolved' },
};

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function CitizenMyComplaintsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/citizen/signin');
      return;
    }
    setIsLoading(true);
    setError(null);
    complaintsApi
      .getMy()
      .then((res) => {
        if (res.success) {
          setComplaints(res.complaints || []);
        } else {
          setError(res.message || 'Failed to load your complaints.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Could not load complaints. Please check the backend connection.');
      })
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, navigate]);

  const filtered = filterStatus === 'All'
    ? complaints
    : complaints.filter((c) => c.status === filterStatus);

  return (
    <div className="portal-page-container">
      {/* Page Header */}
      <div className="citizen-my-complaints-header">
        <div className="container">
          <div className="cmc-page-title-block">
            <div className="header-badge" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.1)' }}>Citizen Dashboard</div>
            <h1 className="cmc-page-title">My Complaints</h1>
            <p className="cmc-page-subtitle">
              All civic issues you have reported — updated in real time.
            </p>
          </div>
        </div>
      </div>

      <div className="container cmc-body">
        {/* Filter Bar */}
        <div className="cmc-filter-bar">
          {['All', 'Submitted', 'Under Review', 'In Progress', 'Resolved'].map((s) => (
            <button
              key={s}
              type="button"
              className={`cmc-filter-btn ${filterStatus === s ? 'active' : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              {s}
              {s !== 'All' && (
                <span className="cmc-filter-count">
                  {complaints.filter((c) => c.status === s).length}
                </span>
              )}
              {s === 'All' && (
                <span className="cmc-filter-count">{complaints.length}</span>
              )}
            </button>
          ))}

          <Link to="/report" className="btn btn-primary btn-sm cmc-new-btn" style={{ marginLeft: 'auto' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Report New Issue
          </Link>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="cmc-loading">
            <div className="spinner-border"></div>
            <p>Loading your complaints...</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="alert-banner alert-danger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="cmc-empty-state">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            {filterStatus === 'All' ? (
              <>
                <h3>No complaints yet</h3>
                <p>You haven&apos;t submitted any civic issue reports.</p>
                <Link to="/report" className="btn btn-primary">Report Your First Issue</Link>
              </>
            ) : (
              <>
                <h3>No {filterStatus} complaints</h3>
                <p>You have no complaints with status &ldquo;{filterStatus}&rdquo;.</p>
              </>
            )}
          </div>
        )}

        {/* Complaint Cards */}
        {!isLoading && !error && filtered.length > 0 && (
          <div className="cmc-cards-grid">
            {filtered.map((c) => (
              <ComplaintCard key={c.id} complaint={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ComplaintCard({ complaint: c }) {
  const statusCfg = STATUS_CONFIG[c.status] || { label: c.status, cls: 'status-submitted' };
  const isOverdue = c.isOverdue;

  return (
    <div className={`cmc-card ${isOverdue ? 'cmc-card-overdue' : ''}`}>
      {/* Card Top */}
      <div className="cmc-card-top">
        <div className="cmc-card-ref-row">
          <span className="cmc-card-ref">{c.referenceId}</span>
          <span className={`status-badge ${statusCfg.cls}`}>
            <span className="status-dot"></span>
            {statusCfg.label}
          </span>
          {isOverdue && (
            <span className="status-badge status-overdue">
              ⚠ Overdue
            </span>
          )}
        </div>
        <h3 className="cmc-card-title">{c.title || c.category}</h3>
      </div>

      {/* Card Meta */}
      <div className="cmc-card-meta">
        <div className="cmc-meta-row">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{c.location}</span>
        </div>
        <div className="cmc-meta-row">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Submitted: {formatDate(c.createdAt)}</span>
        </div>
        {c.expectedCompletionDate && (
          <div className={`cmc-meta-row ${isOverdue ? 'text-danger' : ''}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>
              {c.status === 'Resolved' ? 'Completed' : (isOverdue ? 'Overdue since' : 'Target:')} {new Date(c.expectedCompletionDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              {isOverdue && c.daysRemaining !== null && ` (${Math.abs(c.daysRemaining)} days past due)`}
              {!isOverdue && c.daysRemaining !== null && c.status !== 'Resolved' && ` (${c.daysRemaining} days left)`}
            </span>
          </div>
        )}
        {c.assignedWorkerName && (
          <div className="cmc-meta-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Worker: {c.assignedWorkerName}</span>
          </div>
        )}
      </div>

      {/* Category Tag */}
      <div className="cmc-card-category-tag">{c.category}</div>

      {/* Footer Action */}
      <div className="cmc-card-footer">
        <Link to={`/citizen/complaints/${c.id}`} className="btn btn-primary btn-sm cmc-view-btn">
          View Details →
        </Link>
      </div>
    </div>
  );
}

export default CitizenMyComplaintsPage;

