/**
 * CivicAlert - Authentication & Role-Based Authorization Middleware
 * 
 * NOTE FOR COLLEGE VIVA / EVALUATION:
 * ----------------------------------------------------------------------------
 * 1. authenticate:
 *    Inspects the incoming 'Authorization' HTTP header for a Bearer token.
 *    Validates the token against active sessions, ensures it is active,
 *    and attaches the sanitized user object (excluding password) to req.user.
 * 
 * 2. authorize(allowedRoles):
 *    Verifies that req.user.role is authorized to perform the requested operation.
 *    If an unauthorized role (or worker attempting admin access) is detected,
 *    it sends a 403 Forbidden HTTP response, preventing access at the backend layer.
 * 
 * 3. optionalAuth:
 *    Permits both public and authenticated callers, attaching req.user if a valid
 *    token exists.
 * ----------------------------------------------------------------------------
 */

const { mockUsers, mockActiveSessions } = require('../data/mockData');

/**
 * Authentication Middleware:
 * Protects endpoints by verifying identity.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed: No authorization token provided. Please log in.',
    });
  }

  // Token expected as "Bearer <token>" or raw token
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed: Invalid authorization header format.',
    });
  }

  // 1. Check in-memory active session map
  let user = mockActiveSessions.get(token);

  // 2. Fallback check for dev/testing tokens e.g. "dev-token-admin-1" or "dev-token-w-101"
  if (!user && token.startsWith('dev-token-')) {
    const userId = token.replace('dev-token-', '');
    user = mockUsers.find((u) => u.id === userId || u.workerId?.toLowerCase() === userId.toLowerCase());
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed: Session expired or invalid token. Please log in again.',
    });
  }

  // Attach sanitized user to request object (NEVER attach password)
  const { password, ...sanitizedUser } = user;
  req.user = sanitizedUser;

  next();
}

/**
 * Role-Based Access Control (RBAC) Middleware Factory:
 * Restricts access to specific user roles (e.g. ['admin'], ['worker'], ['admin', 'worker'])
 */
function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied. Role '${req.user.role}' is not permitted to perform this action. Required role(s): [${allowedRoles.join(', ')}].`,
      });
    }

    next();
  };
}

/**
 * Optional Authentication Middleware:
 * Inspects token if provided, but does not block if missing.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader) {
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : authHeader.trim();

    let user = mockActiveSessions.get(token);
    if (!user && token.startsWith('dev-token-')) {
      const userId = token.replace('dev-token-', '');
      user = mockUsers.find((u) => u.id === userId || u.workerId?.toLowerCase() === userId.toLowerCase());
    }

    if (user) {
      const { password, ...sanitizedUser } = user;
      req.user = sanitizedUser;
    }
  }

  next();
}

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
};

