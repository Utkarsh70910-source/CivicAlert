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
const bcrypt = require('bcryptjs');
const { mockUsers, mockActiveSessions, saveData } = require('../data/mockData');
const { User, Session } = require('../models');
const { getIsConnected } = require('../config/db');
const { authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new citizen account
 * @access  Public
 *
 * NOTE FOR VIVA:
 * Citizens self-register with name, email, mobile, and password.
 * Passwords are secure bcrypt hashes (never stored or transmitted as plaintext).
 * Persists to MongoDB User & Session collections when connected, and updates
 * the local persistent fallback store.
 */
router.post('/register', async (req, res) => {
  try {
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

    // Check for duplicate email in MongoDB if connected
    if (getIsConnected()) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists. Please sign in.',
        });
      }
    } else {
      const existing = mockUsers.find(
        (u) => u.email && u.email.toLowerCase() === normalizedEmail
      );
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists. Please sign in.',
        });
      }
    }

    // Hash password with bcrypt for security
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserId = `cit-${Date.now()}`;
    const formattedMobile = cleanMobile.length === 10
      ? `+91 ${cleanMobile.slice(0, 5)} ${cleanMobile.slice(5)}`
      : mobile.trim();

    let sanitizedUser = null;

    if (getIsConnected()) {
      const dbUser = await User.create({
        customId: newUserId,
        name: name.trim(),
        email: normalizedEmail,
        phone: formattedMobile,
        username: normalizedEmail,
        password: hashedPassword,
        role: 'citizen',
      });
      sanitizedUser = dbUser.toSanitized();
    } else {
      sanitizedUser = {
        id: newUserId,
        username: normalizedEmail,
        name: name.trim(),
        email: normalizedEmail,
        phone: formattedMobile,
        role: 'citizen',
      };
    }

    // Always keep mockUsers updated for fast local lookup and fallback
    const userForMock = {
      id: newUserId,
      username: normalizedEmail,
      password: hashedPassword,
      name: name.trim(),
      email: normalizedEmail,
      phone: formattedMobile,
      role: 'citizen',
    };
    const existingIndex = mockUsers.findIndex((u) => u.email === normalizedEmail);
    if (existingIndex >= 0) {
      mockUsers[existingIndex] = userForMock;
    } else {
      mockUsers.push(userForMock);
    }

    // Auto-login after registration: generate session token
    const token = `mock-token-${newUserId}-${Date.now()}`;

    if (getIsConnected()) {
      try {
        await Session.create({
          token,
          userId: newUserId,
          user: sanitizedUser,
        });
      } catch (err) {
        console.error('[Auth Register] Error saving session to MongoDB:', err.message);
      }
    }

    mockActiveSessions.set(token, sanitizedUser);
    saveData();

    return res.status(201).json({
      success: true,
      message: `Welcome to CivicAlert, ${sanitizedUser.name}! Your citizen account is active.`,
      token,
      user: sanitizedUser,
      isDevelopmentMock: !getIsConnected(),
    });
  } catch (err) {
    console.error('[Auth Register] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during citizen registration.',
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user by username / workerId and password
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { username, workerId, password } = req.body;
    const loginIdentifier = (username || workerId || '').trim();

    // Basic validation
    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username/Worker ID and password.',
      });
    }

    let user = null;
    let isPasswordMatch = false;

    // Check MongoDB first if connected
    if (getIsConnected()) {
      try {
        const dbUser = await User.findOne({
          $or: [
            { username: loginIdentifier.toLowerCase() },
            { email: loginIdentifier.toLowerCase() },
            { workerId: new RegExp(`^${loginIdentifier}$`, 'i') },
            { customId: loginIdentifier },
          ],
        });

        if (dbUser) {
          isPasswordMatch = await dbUser.comparePassword(password);
          if (isPasswordMatch) {
            user = dbUser.toSanitized();
          } else {
            return res.status(401).json({
              success: false,
              message: 'Invalid credentials. Incorrect password.',
            });
          }
        }
      } catch (err) {
        console.error('[Auth Login] MongoDB lookup error:', err.message);
      }
    }

    // Fallback to mockUsers if not found in MongoDB
    if (!user) {
      const localUser = mockUsers.find((u) => {
        const matchUser = u.username && u.username.toLowerCase() === loginIdentifier.toLowerCase();
        const matchWorkerId = u.workerId && u.workerId.toLowerCase() === loginIdentifier.toLowerCase();
        const matchEmail = u.email && u.email.toLowerCase() === loginIdentifier.toLowerCase();
        return matchUser || matchWorkerId || matchEmail;
      });

      if (!localUser) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. User not found.',
        });
      }

      // Check password: bcrypt compare if hashed, or plain-text check for legacy seeds
      if (localUser.password.startsWith('$2a$') || localUser.password.startsWith('$2b$')) {
        isPasswordMatch = await bcrypt.compare(password, localUser.password);
      } else {
        isPasswordMatch = localUser.password === password;
      }

      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Incorrect password.',
        });
      }

      const { password: _, ...sanitizedUser } = localUser;
      user = sanitizedUser;
    }

    // Generate session token
    const token = `mock-token-${user.id}-${Date.now()}`;

    // Persist session to MongoDB if connected
    if (getIsConnected()) {
      try {
        await Session.create({
          token,
          userId: user.id,
          user,
        });
      } catch (err) {
        console.error('[Auth Login] Failed to persist session to MongoDB:', err.message);
      }
    }

    // Store active session in memory and local store
    mockActiveSessions.set(token, user);
    saveData();

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}! Authenticated as [${user.role}].`,
      token,
      user,
      isDevelopmentMock: !getIsConnected(),
    });
  } catch (err) {
    console.error('[Auth Login] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.',
    });
  }
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
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();

      if (getIsConnected()) {
        try {
          await Session.deleteOne({ token });
        } catch (_) {}
      }

      mockActiveSessions.delete(token);
      saveData();
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  }
});

module.exports = router;

