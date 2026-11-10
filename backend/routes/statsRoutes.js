/**
 * CivicAlert - Dashboard Statistics Routes
 * 
 * Endpoints:
 * - GET /api/stats (Returns overview metrics for Admin Dashboard)
 */

const express = require('express');
const router = express.Router();
const { mockComplaints, mockUsers, enrichComplaint } = require('../data/mockData');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/stats
 * @desc    Get aggregate statistics for complaints and workers
 * @access  Protected (Admin only)
 */
router.get('/', authenticate, authorize(['admin']), (req, res) => {
  const enrichedList = mockComplaints.map(enrichComplaint);

  const totalComplaints = enrichedList.length;
  const submittedCount = enrichedList.filter((c) => c.status === 'Submitted').length;
  const underReviewCount = enrichedList.filter((c) => c.status === 'Under Review').length;
  const inProgressCount = enrichedList.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = enrichedList.filter((c) => c.status === 'Resolved').length;
  const overdueCount = enrichedList.filter((c) => c.isOverdue).length;

  const totalWorkers = mockUsers.filter((u) => u.role === 'worker').length;

  // Breakdown by category
  const categoryBreakdown = {};
  enrichedList.forEach((c) => {
    categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + 1;
  });

  res.status(200).json({
    success: true,
    stats: {
      totalComplaints,
      submittedCount,
      underReviewCount,
      inProgressCount,
      resolvedCount,
      overdueCount,
      totalWorkers,
      categoryBreakdown,
    },
  });
});

module.exports = router;
