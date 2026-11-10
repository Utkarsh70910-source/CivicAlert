/**
 * CivicAlert - Worker Management Routes
 * 
 * Endpoints:
 * - GET  /api/workers (Admin only: lists all municipal field workers)
 * - POST /api/workers (Admin only: registers a new field worker)
 */

const express = require('express');
const router = express.Router();
const { mockUsers, mockComplaints, CATEGORY_SPECIALIZATION_MAP } = require('../data/mockData');
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

module.exports = router;

