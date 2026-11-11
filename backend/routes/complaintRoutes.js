/**
 * CivicAlert - Complaints API Routes
 * 
 * Endpoints:
 * - GET   /api/complaints             (List complaints: all for admin, assigned for worker, own for citizen)
 * - GET   /api/complaints/my          (Citizen: fetch only their own complaints, auth-required)
 * - POST  /api/complaints             (Citizen/Public report submission)
 * - GET   /api/complaints/:id         (Lookup by ID or Reference ID, public sanitized / worker / admin)
 * - PATCH /api/complaints/:id/status  (Update status, resolution notes, resolution photo)
 * - PATCH /api/complaints/:id/assign  (Admin assigns worker & expected completion date)
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {
  mockComplaints,
  mockUsers,
  enrichComplaint,
  sanitizeForPublic,
  saveData,
} = require('../data/mockData');
const { Complaint, User } = require('../models');
const { getIsConnected } = require('../config/db');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

const VALID_CATEGORIES = [
  'Roads & Potholes',
  'Streetlights',
  'Garbage & Sanitation',
  'Water & Drainage',
  'Other',
];

const VALID_STATUSES = ['Submitted', 'In Progress', 'Under Review', 'Resolved'];

/**
 * @route   GET /api/complaints
 * @desc    Get complaints list (Admin: all complaints; Worker: assigned complaints; Citizen: their complaints)
 * @access  Protected
 */
router.get('/', authenticate, async (req, res) => {
  const { role, id: userId, workerId, name, phone } = req.user;
  const { status, category, overdue } = req.query;

  if (getIsConnected()) {
    try {
      let filter = {};
      if (role === 'admin') {
        if (status && status !== 'All') filter.status = status;
        if (category && category !== 'All') filter.category = category;
      } else if (role === 'worker') {
        const workerKey = workerId || userId;
        filter.$or = [{ assignedWorkerId: userId }, { assignedWorkerId: workerKey }];
        if (status && status !== 'All') filter.status = status;
      } else if (role === 'citizen') {
        const citizenFilters = [{ citizenId: userId }];
        if (name) citizenFilters.push({ citizenName: name });
        if (phone) citizenFilters.push({ citizenPhone: phone });
        filter.$or = citizenFilters;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Unknown user role.',
        });
      }

      const docs = await Complaint.find(filter).sort({ createdAt: -1 });
      let enrichedResults = docs.map((doc) => doc.enrich());

      if (role === 'admin' && overdue === 'true') {
        enrichedResults = enrichedResults.filter((c) => c.isOverdue);
      }

      return res.status(200).json({
        success: true,
        count: enrichedResults.length,
        complaints: enrichedResults,
      });
    } catch (err) {
      console.error('[Complaints GET] MongoDB query error:', err.message);
    }
  }

  let results = [...mockComplaints];

  // Role-based filtering
  if (role === 'admin') {
    // Admin sees all complaints with optional filters
    if (status && status !== 'All') {
      results = results.filter((c) => c.status.toLowerCase() === status.toLowerCase());
    }
    if (category && category !== 'All') {
      results = results.filter((c) => c.category.toLowerCase() === category.toLowerCase());
    }
    if (overdue === 'true') {
      results = results.filter((c) => {
        const enriched = enrichComplaint(c);
        return enriched.isOverdue;
      });
    }
  } else if (role === 'worker') {
    // Worker sees ONLY assigned complaints
    results = results.filter(
      (c) => c.assignedWorkerId === userId || (workerId && c.assignedWorkerId === workerId)
    );

    if (status && status !== 'All') {
      results = results.filter((c) => c.status.toLowerCase() === status.toLowerCase());
    }
  } else if (role === 'citizen') {
    // Citizen sees only complaints submitted by them
    // Priority: match by citizenId (set when logged-in citizen submits), then fallback by name/phone
    results = results.filter(
      (c) =>
        (c.citizenId && c.citizenId === userId) ||
        (!c.citizenId && name && c.citizenName === name) ||
        (!c.citizenId && phone && c.citizenPhone === phone)
    );
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Unknown user role.',
    });
  }

  // Enrich with computed daysRemaining and isOverdue
  const enrichedResults = results.map(enrichComplaint);

  res.status(200).json({
    success: true,
    count: enrichedResults.length,
    complaints: enrichedResults,
  });
});

/**
 * @route   GET /api/complaints/my
 * @desc    Get complaints belonging to the authenticated citizen.
 * @access  Protected (Citizen only)
 */
router.get('/my', authenticate, authorize(['citizen']), async (req, res) => {
  const { id: userId, name, phone } = req.user;

  if (getIsConnected()) {
    try {
      const citizenFilters = [{ citizenId: userId }];
      if (name) citizenFilters.push({ citizenName: name });
      if (phone) citizenFilters.push({ citizenPhone: phone });

      const docs = await Complaint.find({ $or: citizenFilters }).sort({ createdAt: -1 });
      const enrichedResults = docs.map((doc) => doc.enrich());

      return res.status(200).json({
        success: true,
        count: enrichedResults.length,
        complaints: enrichedResults,
      });
    } catch (err) {
      console.error('[Complaints /my] MongoDB error:', err.message);
    }
  }

  const myComplaints = mockComplaints.filter(
    (c) =>
      (c.citizenId && c.citizenId === userId) ||
      (!c.citizenId && name && c.citizenName === name) ||
      (!c.citizenId && phone && c.citizenPhone === phone)
  );

  const enrichedResults = myComplaints.map(enrichComplaint);

  return res.status(200).json({
    success: true,
    count: enrichedResults.length,
    complaints: enrichedResults,
  });
});

/**
 * @route   POST /api/complaints
 * @desc    Submit a new citizen civic issue report
 * @access  Public (Citizen or Guest)
 */
router.post('/', optionalAuth, async (req, res) => {
  const {
    category,
    location,
    description,
    citizenName,
    citizenPhone,
    photoPreview,
    photos,
    latitude,
    longitude,
  } = req.body;

  // Validation
  const errors = [];
  if (!category || !category.trim()) {
    errors.push('Category is required.');
  }
  if (!location || !location.trim()) {
    errors.push('Location / Landmark is required.');
  }
  if (!description || !description.trim()) {
    errors.push('Problem description is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  // Normalize uploaded photos (supports both array 'photos' and single 'photoPreview')
  let normalizedPhotos = [];
  if (Array.isArray(photos)) {
    normalizedPhotos = photos.filter((p) => typeof p === 'string' && p.trim().length > 0);
  } else if (photoPreview && typeof photoPreview === 'string' && photoPreview.trim().length > 0) {
    normalizedPhotos = [photoPreview];
  }
  // Enforce reasonable limit (max 5 photos)
  normalizedPhotos = normalizedPhotos.slice(0, 5);

  // Generate unique Reference ID (e.g. CA-492817)
  let generatedRefId;
  let isUnique = false;
  while (!isUnique) {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    generatedRefId = `CA-${randomDigits}`;

    if (getIsConnected()) {
      try {
        const exists = await Complaint.findOne({ referenceId: generatedRefId });
        if (!exists) isUnique = true;
      } catch (_) {
        isUnique = !mockComplaints.some((c) => c.referenceId === generatedRefId);
      }
    } else {
      isUnique = !mockComplaints.some((c) => c.referenceId === generatedRefId);
    }
  }

  const newId = `cmp-${Date.now()}`;
  const newComplaint = {
    id: newId,
    customId: newId,
    referenceId: generatedRefId,
    category: category.trim(),
    title: `${category.trim()} reported at ${location.trim().slice(0, 30)}`,
    description: description.trim(),
    location: location.trim(),
    latitude: latitude !== undefined && latitude !== null && !isNaN(Number(latitude))
      ? Number(latitude)
      : null,
    longitude: longitude !== undefined && longitude !== null && !isNaN(Number(longitude))
      ? Number(longitude)
      : null,
    photos: normalizedPhotos,
    photoPreview: normalizedPhotos[0] || null,
    status: 'Submitted',
    citizenId: req.user ? req.user.id : null,   // Set when logged-in citizen submits
    citizenName: citizenName && citizenName.trim() ? citizenName.trim() : (req.user ? req.user.name : 'Anonymous Resident'),
    citizenPhone: citizenPhone && citizenPhone.trim() ? citizenPhone.trim() : (req.user ? (req.user.phone || null) : null),
    createdAt: new Date().toISOString(),
    assignedWorkerId: null,
    assignedWorkerName: null,
    assignedWorkerPhone: null,
    expectedCompletionDate: null,
    resolutionNotes: null,
    resolutionPhoto: null,
    resolvedAt: null,
  };

  if (getIsConnected()) {
    try {
      await Complaint.create(newComplaint);
    } catch (err) {
      console.error('[Complaints Create] Error saving to MongoDB:', err.message);
    }
  }

  // Prepend to in-memory store and persist
  mockComplaints.unshift(newComplaint);
  saveData();

  res.status(201).json({
    success: true,
    message: 'Civic issue report submitted successfully.',
    referenceId: generatedRefId,
    complaint: sanitizeForPublic(newComplaint),
  });
});

/**
 * @route   GET /api/complaints/:id
 * @desc    Track/View a specific complaint by ID or Reference ID (e.g. CA-100201)
 * @access  Public for tracking (sanitized) / Protected for full role details
 */
router.get('/:id', optionalAuth, async (req, res) => {
  const searchId = req.params.id.trim().toLowerCase();

  let complaint = null;

  if (getIsConnected()) {
    try {
      const orConditions = [
        { referenceId: new RegExp(`^${searchId}$`, 'i') },
        { customId: new RegExp(`^${searchId}$`, 'i') },
      ];
      if (mongoose.isValidObjectId(searchId)) {
        orConditions.push({ _id: searchId });
      }
      const doc = await Complaint.findOne({ $or: orConditions });
      if (doc) {
        complaint = doc.enrich();
      }
    } catch (err) {
      console.error('[Complaints /:id] MongoDB lookup error:', err.message);
    }
  }

  if (!complaint) {
    const raw = mockComplaints.find(
      (c) => c.id.toLowerCase() === searchId || c.referenceId.toLowerCase() === searchId
    );
    if (raw) {
      complaint = enrichComplaint(raw);
    }
  }

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: `No complaint found matching ID or Reference ID '${req.params.id}'. Please verify and try again.`,
    });
  }

  const enriched = enrichComplaint(complaint);

  // Authorization check for privacy:
  // 1. Admin gets complete details
  if (req.user && req.user.role === 'admin') {
    return res.status(200).json({
      success: true,
      complaint: enriched,
      accessLevel: 'admin',
    });
  }

  // 2. Worker permission check: worker can ONLY access complaints assigned directly to them
  if (req.user && req.user.role === 'worker') {
    const isAssigned =
      complaint.assignedWorkerId === req.user.id ||
      complaint.assignedWorkerId === req.user.workerId;

    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have authorization to view complaints assigned to other workers.',
      });
    }

    return res.status(200).json({
      success: true,
      complaint: enriched,
      accessLevel: 'worker-assigned',
    });
  }

  // 3. Citizen permission check: citizen can view their own complaints
  if (req.user && req.user.role === 'citizen') {
    const isOwner =
      (complaint.citizenId && complaint.citizenId === req.user.id) ||
      (!complaint.citizenId && complaint.citizenName === req.user.name) ||
      (!complaint.citizenId && complaint.citizenPhone === req.user.phone);

    if (isOwner) {
      // Return full enriched view to the authenticated citizen owner
      return res.status(200).json({
        success: true,
        complaint: enriched,
        accessLevel: 'citizen-owner',
      });
    }

    // Direct ID request (e.g. /cmp-xxx) by non-owner citizen is forbidden
    if (searchId.startsWith('cmp-')) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view this complaint.',
      });
    }

    // Public reference ID lookup (e.g. CA-xxxxx) falls through to sanitized public tracking view
    return res.status(200).json({
      success: true,
      complaint: sanitizeForPublic(complaint),
      accessLevel: 'public-sanitized',
    });
  }

  // 4. Public tracking view (Privacy Preserved: No citizen private phone/name exposed)
  return res.status(200).json({
    success: true,
    complaint: sanitizeForPublic(complaint),
    accessLevel: 'public-sanitized',
  });
});

/**
 * @route   PATCH /api/complaints/:id/status
 * @desc    Update complaint status, resolution notes, and resolution photo
 * @access  Protected (Worker assigned or Admin)
 */
router.patch('/:id/status', authenticate, authorize(['worker', 'admin']), async (req, res) => {
  const searchId = req.params.id.trim().toLowerCase();
  const { status, resolutionNotes, resolutionPhoto } = req.body;

  let complaint = mockComplaints.find(
    (c) => c.id.toLowerCase() === searchId || c.referenceId.toLowerCase() === searchId
  );

  let mongoDoc = null;
  if (getIsConnected()) {
    try {
      const orConditions = [
        { referenceId: new RegExp(`^${searchId}$`, 'i') },
        { customId: new RegExp(`^${searchId}$`, 'i') },
      ];
      if (mongoose.isValidObjectId(searchId)) {
        orConditions.push({ _id: searchId });
      }
      mongoDoc = await Complaint.findOne({ $or: orConditions });
    } catch (_) {}
  }

  if (!complaint && !mongoDoc) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found.',
    });
  }

  const assignedWorkerId = complaint ? complaint.assignedWorkerId : mongoDoc.assignedWorkerId;

  // Worker permission check: worker can only update their own assigned complaints
  if (req.user.role === 'worker') {
    const isAssigned =
      assignedWorkerId === req.user.id ||
      assignedWorkerId === req.user.workerId;

    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are only authorized to update complaints assigned directly to you.',
      });
    }
  }

  // Validate status
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  let resolvedAtVal = null;
  if (status) {
    if (status === 'Resolved') {
      resolvedAtVal = new Date().toISOString();
    }
  }

  // Update in-memory complaint
  if (complaint) {
    if (status) {
      complaint.status = status;
      if (status === 'Resolved' && !complaint.resolvedAt) {
        complaint.resolvedAt = resolvedAtVal;
      } else if (status !== 'Resolved') {
        complaint.resolvedAt = null;
      }
    }
    if (resolutionNotes !== undefined) {
      complaint.resolutionNotes = resolutionNotes;
    }
    if (resolutionPhoto !== undefined) {
      complaint.resolutionPhoto = resolutionPhoto;
    }
  }

  // Update in MongoDB
  if (getIsConnected() && mongoDoc) {
    try {
      if (status) {
        mongoDoc.status = status;
        if (status === 'Resolved') {
          mongoDoc.resolvedAt = new Date();
        } else {
          mongoDoc.resolvedAt = null;
        }
      }
      if (resolutionNotes !== undefined) mongoDoc.resolutionNotes = resolutionNotes;
      if (resolutionPhoto !== undefined) mongoDoc.resolutionPhoto = resolutionPhoto;
      await mongoDoc.save();
    } catch (err) {
      console.error('[Complaints Status] MongoDB save error:', err.message);
    }
  }

  saveData();

  const finalComplaint = complaint || (mongoDoc ? mongoDoc.enrich() : null);
  const enriched = enrichComplaint(finalComplaint);

  res.status(200).json({
    success: true,
    message: `Complaint status updated to '${finalComplaint.status}' successfully.`,
    complaint: enriched,
  });
});

/**
 * @route   PATCH /api/complaints/:id/assign
 * @desc    Admin assigns a complaint to a field worker & sets expected completion date
 * @access  Protected (Admin only)
 */
router.patch('/:id/assign', authenticate, authorize(['admin']), async (req, res) => {
  const searchId = req.params.id.trim().toLowerCase();
  const { workerId, expectedCompletionDate } = req.body;

  if (!workerId) {
    return res.status(400).json({
      success: false,
      message: 'Worker ID is required for assignment.',
    });
  }

  let complaint = mockComplaints.find(
    (c) => c.id.toLowerCase() === searchId || c.referenceId.toLowerCase() === searchId
  );

  let mongoDoc = null;
  if (getIsConnected()) {
    try {
      const orConditions = [
        { referenceId: new RegExp(`^${searchId}$`, 'i') },
        { customId: new RegExp(`^${searchId}$`, 'i') },
      ];
      if (mongoose.isValidObjectId(searchId)) {
        orConditions.push({ _id: searchId });
      }
      mongoDoc = await Complaint.findOne({ $or: orConditions });
    } catch (_) {}
  }

  if (!complaint && !mongoDoc) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found.',
    });
  }

  // Look up worker in MongoDB or mockUsers
  let worker = null;
  if (getIsConnected()) {
    try {
      const dbWorker = await User.findOne({
        role: 'worker',
        $or: [
          { customId: workerId },
          { workerId: new RegExp(`^${workerId}$`, 'i') },
        ],
      });
      if (dbWorker) worker = dbWorker.toSanitized();
    } catch (_) {}
  }

  if (!worker) {
    worker = mockUsers.find(
      (u) =>
        u.role === 'worker' &&
        (u.id === workerId || (u.workerId && u.workerId.toLowerCase() === workerId.toLowerCase()))
    );
  }

  if (!worker) {
    return res.status(404).json({
      success: false,
      message: `Worker with ID '${workerId}' not found in active municipal roster.`,
    });
  }

  const assignedWorkerId = worker.id || worker.customId;
  const assignedWorkerName = worker.name;
  const assignedWorkerPhone = worker.phone || '+91 98765 00000';

  if (complaint) {
    complaint.assignedWorkerId = assignedWorkerId;
    complaint.assignedWorkerName = assignedWorkerName;
    complaint.assignedWorkerPhone = assignedWorkerPhone;
    if (expectedCompletionDate) {
      complaint.expectedCompletionDate = expectedCompletionDate;
    }
    if (complaint.status === 'Submitted') {
      complaint.status = 'In Progress';
    }
  }

  if (getIsConnected() && mongoDoc) {
    try {
      mongoDoc.assignedWorkerId = assignedWorkerId;
      mongoDoc.assignedWorkerName = assignedWorkerName;
      mongoDoc.assignedWorkerPhone = assignedWorkerPhone;
      if (expectedCompletionDate) {
        mongoDoc.expectedCompletionDate = expectedCompletionDate;
      }
      if (mongoDoc.status === 'Submitted') {
        mongoDoc.status = 'In Progress';
      }
      await mongoDoc.save();
    } catch (err) {
      console.error('[Complaints Assign] MongoDB save error:', err.message);
    }
  }

  saveData();

  const finalComplaint = complaint || (mongoDoc ? mongoDoc.enrich() : null);
  const enriched = enrichComplaint(finalComplaint);

  res.status(200).json({
    success: true,
    message: `Complaint ${finalComplaint.referenceId} successfully assigned to ${worker.name} (${worker.workerId}).`,
    complaint: enriched,
  });
});

module.exports = router;

module.exports = router;

