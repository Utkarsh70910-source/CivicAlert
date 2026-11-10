/**
 * CivicAlert - Authentication Routes
 * 
 * Endpoints:
 * - POST /api/auth/login  (Authenticates citizen, worker, or admin)
 * - GET  /api/auth/me     (Returns authenticated user profile)
 * - POST /api/auth/logout (Terminates current session)
 */

const express = require('express');
const router = express.Router();
const { mockUsers, mockActiveSessions } = require('../data/mockData');
const { authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user by username / workerId and password
 * @access  Public
 */
router.post('/login', (req, res) => {
  const { username, workerId, password } = req.body;
  const loginIdentifier = (username || workerId || '').trim();

  // Basic validation
  if (!loginIdentifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both username/Worker ID and password.',
    });
  }

  // Lookup in mock users by username, workerId, or email
  const user = mockUsers.find((u) => {
    const matchUser = u.username.toLowerCase() === loginIdentifier.toLowerCase();
    const matchWorkerId = u.workerId && u.workerId.toLowerCase() === loginIdentifier.toLowerCase();
    const matchEmail = u.email && u.email.toLowerCase() === loginIdentifier.toLowerCase();
    return matchUser || matchWorkerId || matchEmail;
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. User not found.',
    });
  }

  // Check password (plain text check in mock environment)
  if (user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Incorrect password.',
    });
  }

  // Generate development/mock session token
  const token = `mock-token-${user.id}-${Date.now()}`;

  // Store active session
  mockActiveSessions.set(token, user);

  // Return sanitized user (exclude password)
  const { password: _, ...sanitizedUser } = user;

  res.status(200).json({
    success: true,
    message: `Welcome back, ${user.name}! Authenticated as [${user.role}].`,
    token,
    user: sanitizedUser,
    isDevelopmentMock: true,
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user details
 * @access  Protected (Requires Bearer token)
 */
router.get('/me', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Log out active session
 * @access  Public / Protected
 */
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    mockActiveSessions.delete(token);
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

module.exports = router;

