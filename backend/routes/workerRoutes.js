/**
 * CivicAlert - Worker Management Routes
 * 
 * Endpoints:
 * - GET  /api/workers (Admin only: lists all municipal field workers)
 * - POST /api/workers (Admin only: registers a new field worker)
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const {
  mockUsers,
  mockComplaints,
  mockActiveSessions,
  saveData,
  CATEGORY_SPECIALIZATION_MAP,
} = require('../data/mockData');
const { User, Complaint, Session } = require('../models');
const { getIsConnected } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/workers
 * @desc    Get list of all registered field workers with active task counts
 * @access  Protected (Admin only)
 */
router.get('/', authenticate, authorize(['admin']), async (req, res) => {
  if (getIsConnected()) {
    try {
      const dbWorkers = await User.find({ role: 'worker' }).lean();
      const workersWithCounts = await Promise.all(
        dbWorkers.map(async (w) => {
          const wCustomId = w.customId || w._id.toString();
          const wWorkerId = w.workerId;

          const activeTasksCount = await Complaint.countDocuments({
            assignedWorkerId: { $in: [wCustomId, wWorkerId] },
            status: { $ne: 'Resolved' },
          });

          const totalCompletedCount = await Complaint.countDocuments({
            assignedWorkerId: { $in: [wCustomId, wWorkerId] },
            status: 'Resolved',
          });

          return {
            id: wCustomId,
            workerId: w.workerId,
            username: w.username,
            name: w.name,
            category: w.category || 'General Civic Works',
            specialization: w.specialization || w.category || 'General Civic Works',
            status: w.status || 'Active',
            phone: w.phone,
            email: w.email,
            activeTasksCount,
            totalCompletedCount,
          };
        })
      );

      return res.status(200).json({
        success: true,
        count: workersWithCounts.length,
        workers: workersWithCounts,
      });
    } catch (err) {
      console.error('[Workers GET] MongoDB error:', err.message);
    }
  }

  const workers = mockUsers
    .filter((u) => u.role === 'worker')
    .map((w) => {
      // Calculate active (unresolved) assignments count
      const activeTasksCount = mockComplaints.filter(
        (c) =>
          (c.assignedWorkerId === w.id || c.assignedWorkerId === w.workerId) &&
          c.status !== 'Resolved'
      ).length;

      const totalCompletedCount = mockComplaints.filter(
        (c) =>
          (c.assignedWorkerId === w.id || c.assignedWorkerId === w.workerId) &&
          c.status === 'Resolved'
      ).length;

      return {
        id: w.id,
        workerId: w.workerId,
        username: w.username,
        name: w.name,
        category: w.category || 'General Civic Works',
        specialization: w.specialization || w.category || 'General Civic Works',
        status: w.status || 'Active',
        phone: w.phone,
        email: w.email,
        activeTasksCount,
        totalCompletedCount,
      };
    });

  res.status(200).json({
    success: true,
    count: workers.length,
    workers,
  });
});

/**
 * @route   POST /api/workers
 * @desc    Create a new field worker in the municipal system
 * @access  Protected (Admin only)
 */
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  const { name, category, phone, email, password } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Worker name is required.' });
  }

  if (!category || !category.trim()) {
    return res.status(400).json({ success: false, message: 'Worker specialization category is required.' });
  }

  // Count existing workers to auto-generate worker ID like W-105
  let nextWorkerNum;
  if (getIsConnected()) {
    const count = await User.countDocuments({ role: 'worker' });
    nextWorkerNum = 101 + count;
  } else {
    const existingWorkers = mockUsers.filter((u) => u.role === 'worker');
    nextWorkerNum = 101 + existingWorkers.length;
  }

  const generatedWorkerId = `W-${nextWorkerNum}`;
  const username = `worker${nextWorkerNum}`;

  const specialization =
    req.body.specialization ||
    (CATEGORY_SPECIALIZATION_MAP && CATEGORY_SPECIALIZATION_MAP[category.trim()]) ||
    category.trim();

  const plainPassword = password && password.trim() ? password.trim() : 'worker123';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

  const newWorker = {
    id: `w-${nextWorkerNum}`,
    customId: `w-${nextWorkerNum}`,
    username,
    password: hashedPassword,
    name: name.trim(),
    role: 'worker',
    workerId: generatedWorkerId,
    category: category.trim(),
    specialization,
    status: 'Active',
    phone: phone && phone.trim() ? phone.trim() : '+91 98765 00000',
    email: email && email.trim() ? email.trim() : `${username}@civicalert.gov.in`,
  };

  if (getIsConnected()) {
    try {
      await User.create(newWorker);
    } catch (err) {
      console.error('[Workers Create] MongoDB save error:', err.message);
    }
  }

  mockUsers.push(newWorker);
  saveData();

  const { password: _, ...sanitizedWorker } = newWorker;

  res.status(201).json({
    success: true,
    message: `Worker ${newWorker.name} (${newWorker.workerId}) registered successfully. Default password: ${plainPassword}`,
    worker: sanitizedWorker,
  });
});

/**
 * @route   PUT /api/workers/:id
 * @desc    Update worker details (Admin only)
 * @access  Protected (Admin only)
 */
router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
  const targetId = req.params.id;
  const worker = mockUsers.find(
    (u) => (u.id === targetId || u.workerId === targetId) && u.role === 'worker'
  );

  let mongoWorker = null;
  if (getIsConnected()) {
    try {
      mongoWorker = await User.findOne({
        role: 'worker',
        $or: [{ customId: targetId }, { workerId: targetId }],
      });
    } catch (_) {}
  }

  if (!worker && !mongoWorker) {
    return res.status(404).json({ success: false, message: 'Worker not found.' });
  }

  const { name, category, specialization, phone, email, status, workerId, username, password } = req.body;

  if (name !== undefined) {
    if (!name.trim()) {
      return res.status(400).json({ success: false, message: 'Worker name cannot be empty.' });
    }
    if (worker) worker.name = name.trim();
    if (mongoWorker) mongoWorker.name = name.trim();
  }

  if (category !== undefined && category.trim()) {
    const spec = specialization ||
      (CATEGORY_SPECIALIZATION_MAP && CATEGORY_SPECIALIZATION_MAP[category.trim()]) ||
      category.trim();

    if (worker) {
      worker.category = category.trim();
      worker.specialization = spec;
    }
    if (mongoWorker) {
      mongoWorker.category = category.trim();
      mongoWorker.specialization = spec;
    }
  }

  if (specialization !== undefined && specialization.trim()) {
    if (worker) worker.specialization = specialization.trim();
    if (mongoWorker) mongoWorker.specialization = specialization.trim();
  }

  if (phone !== undefined) {
    if (worker) worker.phone = phone.trim();
    if (mongoWorker) mongoWorker.phone = phone.trim();
  }

  if (email !== undefined) {
    if (worker) worker.email = email.trim();
    if (mongoWorker) mongoWorker.email = email.trim();
  }

  if (status !== undefined && status.trim()) {
    if (worker) worker.status = status.trim();
    if (mongoWorker) mongoWorker.status = status.trim();
  }

  if (workerId !== undefined && workerId.trim()) {
    const trimmedWorkerId = workerId.trim();
    const duplicateWorker = mockUsers.find(
      (u) =>
        u.role === 'worker' &&
        u.id !== (worker?.id || mongoWorker?.customId) &&
        u.workerId &&
        u.workerId.toLowerCase() === trimmedWorkerId.toLowerCase()
    );
    if (duplicateWorker) {
      return res.status(400).json({
        success: false,
        message: `Worker ID '${trimmedWorkerId}' is already assigned to another worker.`,
      });
    }
    if (worker) worker.workerId = trimmedWorkerId;
    if (mongoWorker) mongoWorker.workerId = trimmedWorkerId;
  }

  if (username !== undefined && username.trim()) {
    const trimmedUsername = username.trim();
    const duplicateUser = mockUsers.find(
      (u) =>
        u.id !== (worker?.id || mongoWorker?.customId) &&
        u.username.toLowerCase() === trimmedUsername.toLowerCase()
    );
    if (duplicateUser) {
      return res.status(400).json({
        success: false,
        message: `Username '${trimmedUsername}' is already taken.`,
      });
    }
    if (worker) worker.username = trimmedUsername;
    if (mongoWorker) mongoWorker.username = trimmedUsername;
  }

  if (password && password.trim()) {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password.trim(), salt);
    if (worker) worker.password = hashed;
    if (mongoWorker) mongoWorker.password = hashed;
  }

  // Synchronize complaints assigned to this worker so name/phone remain consistent
  const activeWorkerName = (worker || mongoWorker).name;
  const activeWorkerPhone = (worker || mongoWorker).phone;
  const activeWorkerId = (worker || mongoWorker).id || (worker || mongoWorker).customId;
  const activeWorkerCode = (worker || mongoWorker).workerId;

  mockComplaints.forEach((c) => {
    if (c.assignedWorkerId === activeWorkerId || c.assignedWorkerId === activeWorkerCode) {
      c.assignedWorkerName = activeWorkerName;
      if (activeWorkerPhone) c.assignedWorkerPhone = activeWorkerPhone;
    }
  });

  if (getIsConnected()) {
    if (mongoWorker) await mongoWorker.save();
    await Complaint.updateMany(
      { assignedWorkerId: { $in: [activeWorkerId, activeWorkerCode] } },
      { assignedWorkerName: activeWorkerName, assignedWorkerPhone: activeWorkerPhone }
    );
  }

  saveData();

  const finalWorker = worker || mongoWorker.toSanitized();
  const { password: _, ...sanitizedWorker } = finalWorker;

  res.status(200).json({
    success: true,
    message: `Worker ${sanitizedWorker.name} (${sanitizedWorker.workerId}) updated successfully.`,
    worker: sanitizedWorker,
  });
});

/**
 * @route   DELETE /api/workers/:id
 * @desc    Delete a field worker from the system (Admin only)
 * @access  Protected (Admin only)
 */
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  const targetId = req.params.id;
  const workerIndex = mockUsers.findIndex(
    (u) => (u.id === targetId || u.workerId === targetId) && u.role === 'worker'
  );

  let mongoWorker = null;
  if (getIsConnected()) {
    try {
      mongoWorker = await User.findOne({
        role: 'worker',
        $or: [{ customId: targetId }, { workerId: targetId }],
      });
    } catch (_) {}
  }

  if (workerIndex === -1 && !mongoWorker) {
    return res.status(404).json({ success: false, message: 'Worker not found.' });
  }

  const worker = workerIndex !== -1 ? mockUsers[workerIndex] : mongoWorker;
  const workerKey = worker.id || worker.customId;
  const workerCode = worker.workerId;

  // Active assignment check: Do NOT delete if worker has unresolved assigned complaints
  let activeCount = 0;
  if (getIsConnected()) {
    activeCount = await Complaint.countDocuments({
      assignedWorkerId: { $in: [workerKey, workerCode] },
      status: { $ne: 'Resolved' },
    });
  } else {
    activeCount = mockComplaints.filter(
      (c) =>
        (c.assignedWorkerId === workerKey || c.assignedWorkerId === workerCode) &&
        c.status !== 'Resolved'
    ).length;
  }

  if (activeCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete worker ${worker.name} (${worker.workerId}): Worker currently has ${activeCount} active assigned complaint(s). Please reassign them in Complaints Management first.`,
      activeTasksCount: activeCount,
    });
  }

  // Remove worker from mockUsers
  if (workerIndex !== -1) {
    mockUsers.splice(workerIndex, 1);
  }

  // Remove worker from MongoDB
  if (getIsConnected()) {
    try {
      await User.deleteOne({ role: 'worker', $or: [{ customId: targetId }, { workerId: targetId }] });
      await Session.deleteMany({ userId: { $in: [workerKey, workerCode] } });
    } catch (err) {
      console.error('[Workers Delete] MongoDB error:', err.message);
    }
  }

  // Invalidate any active session tokens for this worker
  for (const [token, sessionUser] of mockActiveSessions.entries()) {
    if (sessionUser.id === workerKey || sessionUser.workerId === workerCode) {
      mockActiveSessions.delete(token);
    }
  }

  saveData();

  res.status(200).json({
    success: true,
    message: `Worker ${worker.name} (${worker.workerId}) deleted successfully.`,
    deletedWorkerId: workerKey,
  });
});

module.exports = router;

