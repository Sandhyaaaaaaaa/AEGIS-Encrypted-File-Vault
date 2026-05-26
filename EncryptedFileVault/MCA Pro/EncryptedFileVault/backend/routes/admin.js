import express from "express";
import User from "../models/user.js";
import File from "../models/File.js";
import AuditLog from "../models/AuditLog.js";
import { protect } from "../middleware/authMiddleware.js";
import { createLog } from "../utils/auditHelper.js";

const router = express.Router();

// ─── Admin guard middleware ────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Admin only
 */
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select("username email role mfaEnabled createdAt")
      .sort({ createdAt: -1 });

    await createLog(req, {
      user: req.user.id,
      username: req.user.username,
      email: req.user.email,
      action: "ADMIN_VIEW_USERS",
      details: `Admin viewed all users (${users.length} total)`,
      status: "SUCCESS",
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
});

/**
 * @route   GET /api/admin/files
 * @desc    Get all files across all users
 * @access  Admin only
 */
router.get("/files", protect, adminOnly, async (req, res) => {
  try {
    const files = await File.find()
      .select("filename size createdAt owner mimetype")
      .populate("owner", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch files", error: error.message });
  }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get platform wide stats
 * @access  Admin only
 */
router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalFiles = await File.countDocuments();

    // Total storage used
    const storageResult = await File.aggregate([
      { $group: { _id: null, total: { $sum: "$size" } } }
    ]);
    const totalStorage = storageResult[0]?.total || 0;

    // Failed logins in last 24 hours
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    const failedLogins = await AuditLog.countDocuments({
      action: "LOGIN_FAILED",
      createdAt: { $gte: yesterday },
    });

    res.status(200).json({
      totalUsers,
      totalFiles,
      totalStorage,
      failedLogins,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats", error: error.message });
  }
});

export default router;