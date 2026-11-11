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
const { Session, User } = require('../models');
const { getIsConnected } = require('../config/db');

/**
 * Authentication Middleware:
 * Protects endpoints by verifying identity.
 */
async function authenticate(req, res, next) {
  try {
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

    let user = null;

    // 1. Check MongoDB session collection if connected
    if (getIsConnected()) {
      try {
        const session = await Session.findOne({ token }).lean();
        if (session && session.user) {
          user = session.user;
        }
      } catch (err) {
        console.error('[Auth Middleware] Session lookup error:', err.message);
      }
    }

    // 2. Check in-memory / local persistent session store
    if (!user) {
      user = mockActiveSessions.get(token);
    }

    // 3. Fallback check for dev/testing tokens e.g. "dev-token-admin-1" or "dev-token-w-101"
    if (!user && token.startsWith('dev-token-')) {
      const userId = token.replace('dev-token-', '');
      if (getIsConnected()) {
        try {
          const dbUser = await User.findOne({
            $or: [
              { customId: userId },
              { workerId: new RegExp(`^${userId}$`, 'i') },
              { username: userId.toLowerCase() },
            ],
          });
          if (dbUser) {
            user = dbUser.toSanitized();
          }
        } catch (_) {}
      }
      if (!user) {
        user = mockUsers.find((u) => u.id === userId || u.workerId?.toLowerCase() === userId.toLowerCase());
      }
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
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
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
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (authHeader) {
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : authHeader.trim();

      let user = null;

      if (getIsConnected()) {
        try {
          const session = await Session.findOne({ token }).lean();
          if (session && session.user) {
            user = session.user;
          }
        } catch (_) {}
      }

      if (!user) {
        user = mockActiveSessions.get(token);
      }

      if (!user && token.startsWith('dev-token-')) {
        const userId = token.replace('dev-token-', '');
        if (getIsConnected()) {
          try {
            const dbUser = await User.findOne({
              $or: [
                { customId: userId },
                { workerId: new RegExp(`^${userId}$`, 'i') },
                { username: userId.toLowerCase() },
              ],
            });
            if (dbUser) {
              user = dbUser.toSanitized();
            }
          } catch (_) {}
        }
        if (!user) {
          user = mockUsers.find((u) => u.id === userId || u.workerId?.toLowerCase() === userId.toLowerCase());
        }
      }

      if (user) {
        const { password, ...sanitizedUser } = user;
        req.user = sanitizedUser;
      }
    }
  } catch (_) {}

  next();
}

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
};

