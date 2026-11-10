/**
 * CivicAlert - Frontend API Service Layer
 * 
 * Centralized API client for all backend REST endpoints.
 * Automatically attaches authentication token from localStorage.
 */

/**
 * Resolves the backend REST API base URL.
 * In production (e.g. deployed on Render, Vercel, or Netlify):
 *   Configured via VITE_API_BASE_URL environment variable.
 * In local development:
 *   Falls back automatically to http://localhost:5000/api.
 */
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const sanitizedBaseUrl = rawBaseUrl.replace(/\/+$/, '');
const API_BASE_URL = sanitizedBaseUrl.endsWith('/api')
  ? sanitizedBaseUrl
  : `${sanitizedBaseUrl}/api`;

/**
 * Generic request helper with automatic JSON handling and Auth headers.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Retrieve token from localStorage if available
  const token = localStorage.getItem('civicalert_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // If backend is unreachable
    if (!err.status) {
      console.warn(`CivicAlert Backend unreachable at ${API_BASE_URL}. Ensure backend service is running.`);
    }
    throw err;
  }
}

// ============================================================================
// Authentication API
// ============================================================================
export const authApi = {
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: () => request('/auth/me'),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),
};

// ============================================================================
// Complaints API
// ============================================================================
export const complaintsApi = {
  getAll: (filters = {}) => {
    const query = new URLSearchParams();
    if (filters.status && filters.status !== 'All') query.append('status', filters.status);
    if (filters.category && filters.category !== 'All') query.append('category', filters.category);
    if (filters.overdue) query.append('overdue', 'true');
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/complaints${queryString}`);
  },

  getById: (id) => request(`/complaints/${encodeURIComponent(id)}`),

  create: (complaintData) =>
    request('/complaints', {
      method: 'POST',
      body: JSON.stringify(complaintData),
    }),

  updateStatus: (id, payload) =>
    request(`/complaints/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  assign: (id, payload) =>
    request(`/complaints/${encodeURIComponent(id)}/assign`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

// ============================================================================
// Workers API
// ============================================================================
export const workersApi = {
  getAll: () => request('/workers'),

  create: (workerData) =>
    request('/workers', {
      method: 'POST',
      body: JSON.stringify(workerData),
    }),

  update: (id, workerData) =>
    request(`/workers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(workerData),
    }),

  delete: (id) =>
    request(`/workers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

// ============================================================================
// Statistics API
// ============================================================================
export const statsApi = {
  get: () => request('/stats'),
};

