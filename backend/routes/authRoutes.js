/**
 * CivicAlert - Authentication Routes
 * 
 * Endpoints:
 * - POST /api/auth/register (Citizen self-registration)
 * - POST /api/auth/login    (Authenticates citizen, worker, or admin)
 * - GET  /api/auth/me       (Returns authenticated user profile)
 * - POST /api/auth/logout   (Terminates current session)
 */

const express = require('express');
const router = express.Router();
const { mockUsers, mockActiveSessions } = require('../data/mockData');
const { authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new citizen account
 * @access  Public
 *
 * NOTE FOR VIVA:
 * Citizens self-register with name, email, mobile, and password.
 * We validate required fields, check for duplicate email, then push the
 * new user object into mockUsers (the in-memory array) exactly like the
 * existing seeded users. No password is ever returned to the client.
 */
router.post('/register', (req, res) => {
  const { name, email, mobile, password, confirmPassword } = req.body;

  // --- Validation ---
  const errors = [];

  if (!name || !name.trim()) errors.push('Full name is required.');
  if (!email || !email.trim()) {
    errors.push('Email address is required.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  }
  const cleanMobile = mobile ? mobile.trim() : '';
  if (!mobile || !mobile.trim()) {
    errors.push('Mobile number is required.');
  } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
    errors.push('Please provide a valid 10-digit Indian mobile number.');
  }
  if (!password) {
    errors.push('Password is required.');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  }
  if (!confirmPassword) {
    errors.push('Please confirm your password.');
  } else if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check for duplicate email
  const existing = mockUsers.find(
    (u) => u.email && u.email.toLowerCase() === normalizedEmail
  );
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email address already exists. Please sign in.',
    });
  }

  // Create new citizen user
  const newUserId = `cit-${Date.now()}`;
  const formattedMobile = cleanMobile.length === 10
    ? `+91 ${cleanMobile.slice(0, 5)} ${cleanMobile.slice(5)}`
    : mobile.trim();

  const newUser = {
    id: newUserId,
    username: normalizedEmail,          // email is used as username for citizens
    password,                           // plain-text in mock environment (bcrypt in production)
    name: name.trim(),
    email: normalizedEmail,
    phone: formattedMobile,
    role: 'citizen',
  };

  // Push to in-memory user store
  mockUsers.push(newUser);

  // Auto-login after registration
  const token = `mock-token-${newUser.id}-${Date.now()}`;
  mockActiveSessions.set(token, newUser);

  const { password: _, ...sanitizedUser } = newUser;

  return res.status(201).json({
    success: true,
    message: `Welcome to CivicAlert, ${newUser.name}! Your citizen account is active.`,
    token,
    user: sanitizedUser,
    isDevelopmentMock: true,
  });
});

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

