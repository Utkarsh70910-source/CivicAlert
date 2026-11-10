/**
 * CivicAlert - Worker Management Routes
 * 
 * Endpoints:
 * - GET  /api/workers (Admin only: lists all municipal field workers)
 * - POST /api/workers (Admin only: registers a new field worker)
 */

const express = require('express');
const router = express.Router();
const { mockUsers, mockComplaints, mockActiveSessions, CATEGORY_SPECIALIZATION_MAP } = require('../data/mockData');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/workers
 * @desc    Get list of all registered field workers with active task counts
 * @access  Protected (Admin only)
 */
router.get('/', authenticate, authorize(['admin']), (req, res) => {
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
router.post('/', authenticate, authorize(['admin']), (req, res) => {
  const { name, category, phone, email, password } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Worker name is required.' });
  }

  if (!category || !category.trim()) {
    return res.status(400).json({ success: false, message: 'Worker specialization category is required.' });
  }

  // Count existing workers to auto-generate worker ID like W-105
  const existingWorkers = mockUsers.filter((u) => u.role === 'worker');
  const nextWorkerNum = 101 + existingWorkers.length;
  const generatedWorkerId = `W-${nextWorkerNum}`;
  const username = `worker${nextWorkerNum}`;

  const specialization =
    req.body.specialization ||
    (CATEGORY_SPECIALIZATION_MAP && CATEGORY_SPECIALIZATION_MAP[category.trim()]) ||
    category.trim();

  const newWorker = {
    id: `w-${nextWorkerNum}`,
    username,
    password: password && password.trim() ? password.trim() : 'worker123',
    name: name.trim(),
    role: 'worker',
    workerId: generatedWorkerId,
    category: category.trim(),
    specialization,
    status: 'Active',
    phone: phone && phone.trim() ? phone.trim() : '+91 98765 00000',
    email: email && email.trim() ? email.trim() : `${username}@civicalert.gov.in`,
  };

  mockUsers.push(newWorker);

  const { password: _, ...sanitizedWorker } = newWorker;

  res.status(201).json({
    success: true,
    message: `Worker ${newWorker.name} (${newWorker.workerId}) registered successfully. Default password: ${newWorker.password}`,
    worker: sanitizedWorker,
  });
});

/**
 * @route   PUT /api/workers/:id
 * @desc    Update worker details (Admin only)
 * @access  Protected (Admin only)
 */
router.put('/:id', authenticate, authorize(['admin']), (req, res) => {
  const targetId = req.params.id;
  const worker = mockUsers.find(
    (u) => (u.id === targetId || u.workerId === targetId) && u.role === 'worker'
  );

  if (!worker) {
    return res.status(404).json({ success: false, message: 'Worker not found.' });
  }

  const { name, category, specialization, phone, email, status, workerId, username, password } = req.body;

  if (name !== undefined) {
    if (!name.trim()) {
      return res.status(400).json({ success: false, message: 'Worker name cannot be empty.' });
    }
    worker.name = name.trim();
  }

  if (category !== undefined && category.trim()) {
    worker.category = category.trim();
    if (!specialization) {
      worker.specialization =
        (CATEGORY_SPECIALIZATION_MAP && CATEGORY_SPECIALIZATION_MAP[category.trim()]) ||
        category.trim();
    }
  }

  if (specialization !== undefined && specialization.trim()) {
    worker.specialization = specialization.trim();
  }

  if (phone !== undefined) {
    worker.phone = phone.trim();
  }

  if (email !== undefined) {
    worker.email = email.trim();
  }

  if (status !== undefined && status.trim()) {
    worker.status = status.trim();
  }

  if (workerId !== undefined && workerId.trim()) {
    const trimmedWorkerId = workerId.trim();
    const duplicateWorker = mockUsers.find(
      (u) =>
        u.role === 'worker' &&
        u.id !== worker.id &&
        u.workerId &&
        u.workerId.toLowerCase() === trimmedWorkerId.toLowerCase()
    );
    if (duplicateWorker) {
      return res.status(400).json({
        success: false,
        message: `Worker ID '${trimmedWorkerId}' is already assigned to another worker.`,
      });
    }
    worker.workerId = trimmedWorkerId;
  }

  if (username !== undefined && username.trim()) {
    const trimmedUsername = username.trim();
    const duplicateUser = mockUsers.find(
      (u) =>
        u.id !== worker.id &&
        u.username.toLowerCase() === trimmedUsername.toLowerCase()
    );
    if (duplicateUser) {
      return res.status(400).json({
        success: false,
        message: `Username '${trimmedUsername}' is already taken.`,
      });
    }
    worker.username = trimmedUsername;
  }

  if (password && password.trim()) {
    worker.password = password.trim();
  }

  // Synchronize complaints assigned to this worker so name/phone remain consistent
  mockComplaints.forEach((c) => {
    if (c.assignedWorkerId === worker.id || c.assignedWorkerId === worker.workerId) {
      c.assignedWorkerName = worker.name;
      if (worker.phone) c.assignedWorkerPhone = worker.phone;
    }
  });

  const { password: _, ...sanitizedWorker } = worker;

  res.status(200).json({
    success: true,
    message: `Worker ${worker.name} (${worker.workerId}) updated successfully.`,
    worker: sanitizedWorker,
  });
});

/**
 * @route   DELETE /api/workers/:id
 * @desc    Delete a field worker from the system (Admin only)
 * @access  Protected (Admin only)
 */
router.delete('/:id', authenticate, authorize(['admin']), (req, res) => {
  const targetId = req.params.id;
  const workerIndex = mockUsers.findIndex(
    (u) => (u.id === targetId || u.workerId === targetId) && u.role === 'worker'
  );

  if (workerIndex === -1) {
    return res.status(404).json({ success: false, message: 'Worker not found.' });
  }

  const worker = mockUsers[workerIndex];

  // Active assignment check: Do NOT delete if worker has unresolved assigned complaints
  const activeComplaints = mockComplaints.filter(
    (c) =>
      (c.assignedWorkerId === worker.id || c.assignedWorkerId === worker.workerId) &&
      c.status !== 'Resolved'
  );

  if (activeComplaints.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete worker ${worker.name} (${worker.workerId}): Worker currently has ${activeComplaints.length} active assigned complaint(s). Please reassign them in Complaints Management first.`,
      activeTasksCount: activeComplaints.length,
    });
  }

  // Remove worker from mockUsers
  mockUsers.splice(workerIndex, 1);

  // Invalidate any active session tokens for this worker
  for (const [token, sessionUser] of mockActiveSessions.entries()) {
    if (sessionUser.id === worker.id || sessionUser.workerId === worker.workerId) {
      mockActiveSessions.delete(token);
    }
  }

  res.status(200).json({
    success: true,
    message: `Worker ${worker.name} (${worker.workerId}) deleted successfully.`,
    deletedWorkerId: worker.id,
  });
});

module.exports = router;

