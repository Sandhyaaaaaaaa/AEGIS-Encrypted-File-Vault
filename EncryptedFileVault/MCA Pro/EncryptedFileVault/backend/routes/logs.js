import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { protect } from '../middleware/authMiddleware.js';
import { createLog } from '../utils/auditHelper.js';

const router = express.Router();

/**
 * @route   GET /api/logs/my
 * @desc    Get current user's own recent activity (for vault feed)
 * @access  Private
 */
router.get('/my', protect, async (req, res) => {
  try {
    const logs = await AuditLog.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('action details status createdAt ipAddress');

    await createLog(req, {
      user: req.user.id,
      username: req.user.username,
      email: req.user.email,
      action: 'ADMIN_VIEW_LOGS',
      details: 'User viewed their activity feed',
      status: 'SUCCESS',
    });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch logs', error: error.message });
  }
});

/**
 * @route   GET /api/logs/all
 * @desc    Get ALL logs (admin only)
 * @access  Private + Admin
 */
router.get('/all', protect, async (req, res) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username email role');

    const total = await AuditLog.countDocuments();

    await createLog(req, {
      user: req.user.id,
      username: req.user.username,
      email: req.user.email,
      action: 'ADMIN_VIEW_LOGS',
      details: `Admin viewed all audit logs (page ${page})`,
      status: 'SUCCESS',
    });

    res.status(200).json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch logs', error: error.message });
  }
});

/**
 * @route   GET /api/logs/stats
 * @desc    Get weekly file upload stats for chart (current user)
 * @access  Private
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      last7Days.push(d);
    }

    // Count uploads per day for this user
    const results = await Promise.all(
      last7Days.map(async (dayStart) => {
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const count = await AuditLog.countDocuments({
          user: req.user.id,
          action: 'FILE_UPLOAD',
          status: 'SUCCESS',
          createdAt: { $gte: dayStart, $lte: dayEnd },
        });

        return {
          day: days[dayStart.getDay()],
          files: count,
        };
      })
    );

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

export default router;