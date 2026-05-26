import express from "express";
import multer from "multer";
import fs from "fs";
import crypto from "crypto";
import File from "../models/File.js";
import User from "../models/User.js";
import SharedFile from "../models/SharedFile.js";
import { protect } from "../middleware/authMiddleware.js";
import { generateFileHash } from "../utils/cryptoUtil.js";
import { createLog } from "../utils/auditHelper.js";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: process.env.B2_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APP_KEY,
  },
});

const router = express.Router();

// ✅ Back to disk storage — B2 will be added later
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.enc`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

/**
 * POST /api/files/upload
 * Accept file that is already secured
 * Allows keeping different versions of the file
 */
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const originalName = req.body.originalName || "unknown.file";
    const wrappedKey = req.body.wrappedKey;
    const recoveryWrappedKey = req.body.recoveryWrappedKey || null;
    const pinWrappedKey = req.body.pinWrappedKey || null;

    if (!wrappedKey) {
      return res.status(400).json({ success: false, message: "Security key is missing" });
    }

    console.log("Encrypted file received");
    console.log("Original filename:", originalName);
    console.log("Saved as:", req.file.filename);
    console.log("Size:", req.file.size + " bytes");

    // Create a fingerprint for the file to check it later
    let hash = "";
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      hash = generateFileHash(fileBuffer);
    } catch (err) {
      console.warn("Fingerprint creation failed:", err.message);
    }

    // ── Versioning Logic ──────────────────────────────────────────────
    const existingFile = await File.findOne({
      owner: req.user.id,
      filename: originalName,
    }).sort({ version: -1 });

    let versionGroup;
    let version;

    if (existingFile) {
      versionGroup = existingFile.versionGroup;
      version = existingFile.version + 1;
      console.log(`Versioning: ${originalName} → v${version}`);
    } else {
      versionGroup = crypto.randomUUID();
      version = 1;
    }

    let b2Key = null;
    if (process.env.B2_BUCKET) {
      b2Key = req.file.filename;
      const fileStream = fs.createReadStream(req.file.path);
      await s3.send(new PutObjectCommand({
        Bucket: process.env.B2_BUCKET,
        Key: b2Key,
        Body: fileStream,
        ContentType: req.file.mimetype || "application/octet-stream",
      }));
      // Delete local file after upload to B2
      fs.unlinkSync(req.file.path);
    }

    // Save file info to database
    const newFile = new File({
      filename: originalName,
      path: req.file.path,       // keep local path just in case B2 is not used
      b2Key: b2Key,              // ✅ B2 Key
      mimetype: req.file.mimetype || "application/octet-stream",
      size: req.file.size,
      hash: hash,
      wrappedKey: wrappedKey,
      recoveryWrappedKey: recoveryWrappedKey,
      pinWrappedKey: pinWrappedKey,
      hasRecovery: !!(recoveryWrappedKey || pinWrappedKey),
      owner: req.user.id,
      version: version,
      versionGroup: versionGroup,
    });

    await newFile.save();

    // Audit log
    await createLog(req, {
      user: req.user.id,
      username: req.user.username,
      email: req.user.email,
      action: "FILE_UPLOAD",
      details: `Uploaded file: ${originalName} (v${version}, ${req.file.size} bytes)`,
      status: "SUCCESS",
    });

    res.json({
      success: true,
      message: version > 1
        ? `New version (v${version}) uploaded successfully`
        : "Your file has been secured and uploaded!",
      fileId: newFile._id,
      filename: originalName,
      version: version,
    });
  } catch (error) {
    console.error("Upload error:", error);

    await createLog(req, {
      user: req.user?.id,
      username: req.user?.username,
      email: req.user?.email,
      action: "FILE_UPLOAD",
      details: `Upload failed: ${error.message}`,
      status: "FAILED",
    });

    res.status(500).json({ success: false, message: "Server error during upload" });
  }
});

/**
 * GET /api/files/myfiles
 * Return latest version of each file for this user
 */
router.get("/myfiles", protect, async (req, res) => {
  try {
    const allFiles = await File.find({ owner: req.user.id })
      .select("filename size createdAt _id hash wrappedKey recoveryWrappedKey pinWrappedKey hasRecovery version versionGroup path b2Key")
      .sort({ createdAt: -1 });

    // Group by versionGroup, pick latest version
    const latestByGroup = {};
    for (const file of allFiles) {
      const group = file.versionGroup || file._id.toString();
      if (!latestByGroup[group] || file.version > latestByGroup[group].version) {
        latestByGroup[group] = file;
      }
    }

    // Count versions per group
    const versionCounts = {};
    for (const file of allFiles) {
      const group = file.versionGroup || file._id.toString();
      versionCounts[group] = (versionCounts[group] || 0) + 1;
    }

    const result = Object.values(latestByGroup)
      .map(file => ({
        ...file.toObject(),
        totalVersions: versionCounts[file.versionGroup || file._id.toString()] || 1,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(result);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ message: "Could not get the files" });
  }
});

/**
 * GET /api/files/:id/versions
 * Return all versions of a file
 */
router.get("/:id/versions", protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file || file.owner.toString() !== req.user.id) {
      return res.status(404).json({ message: "File not found" });
    }

    const versions = await File.find({
      owner: req.user.id,
      versionGroup: file.versionGroup,
    })
      .select("filename size createdAt _id hash wrappedKey recoveryWrappedKey pinWrappedKey hasRecovery version versionGroup")
      .sort({ version: -1 });

    res.json(versions);
  } catch (error) {
    console.error("Error fetching versions:", error);
    res.status(500).json({ message: "Could not get file versions" });
  }
});

/**
 * GET /api/files/:id/recovery-key
 * Return the recovery keys for a file (owner only)
 */
router.get("/:id/recovery-key", protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file || file.owner.toString() !== req.user.id) {
      return res.status(404).json({ message: "File not found" });
    }

    res.json({
      recoveryWrappedKey: file.recoveryWrappedKey || null,
      pinWrappedKey: file.pinWrappedKey || null,
    });
  } catch (error) {
    console.error("Error fetching recovery keys:", error);
    res.status(500).json({ message: "Could not get recovery keys" });
  }
});

/**
 * GET /api/files/download/:id
 * Send encrypted file back to client
 */
router.get("/download/:id", protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    // Check authorization — owner or shared recipient
    let isAuthorized = false;
    if (file) {
      if (file.owner.toString() === req.user.id.toString()) {
        isAuthorized = true;
      } else {
        const sharedRecord = await SharedFile.findOne({
          fileId: file._id,
          recipientId: req.user.id
        });
        if (sharedRecord) {
          isAuthorized = true;
        } else {
          console.warn(`[Download] No shared record found for file ${file._id} and recipient ${req.user.id}`);
        }
      }
    } else {
      console.warn(`[Download] File with ID ${req.params.id} not found in database`);
    }

    if (!isAuthorized) {
      console.warn(`[Download] Unauthorized access attempt by ${req.user.email} for file ${req.params.id}`);
      await createLog(req, {
        user: req.user.id,
        username: req.user.username,
        email: req.user.email,
        action: "FILE_DOWNLOAD",
        details: `Unauthorized download attempt for file ID: ${req.params.id}`,
        status: "FAILED",
      });
      return res.status(404).json({ message: "File not found or access denied" });
    }

    // Check if file is still the same (Integrity check)
    if (file.hash && file.path) {
      try {
        const fileBuffer = fs.readFileSync(file.path);
        const currentHash = generateFileHash(fileBuffer);
        if (currentHash !== file.hash) {
          return res.status(400).json({ message: "The file seems to have been changed or corrupted" });
        }
      } catch (err) {
        console.warn("Hash check skipped:", err.message);
      }
    }

    await createLog(req, {
      user: req.user.id,
      username: req.user.username,
      email: req.user.email,
      action: "FILE_DOWNLOAD",
      details: `Downloaded file: ${file.filename} (v${file.version || 1})`,
      status: "SUCCESS",
    });

    if (file.b2Key && process.env.B2_BUCKET) {
      const command = new GetObjectCommand({
        Bucket: process.env.B2_BUCKET,
        Key: file.b2Key,
      });
      const b2Response = await s3.send(command);
      res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
      res.setHeader("Content-Type", file.mimetype || "application/octet-stream");
      b2Response.Body.pipe(res);
    } else {
      res.download(file.path, file.filename);
    }

  } catch (error) {
    console.error("Download error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Download failed" });
    }
  }
});

/**
 * DELETE /api/files/:id
 * Delete file from disk and database
 */
router.delete("/:id", protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file || file.owner.toString() !== req.user.id) {
      await createLog(req, {
        user: req.user.id,
        username: req.user.username,
        email: req.user.email,
        action: "FILE_DELETE",
        details: `Unauthorized delete attempt for file ID: ${req.params.id}`,
        status: "FAILED",
      });
      return res.status(404).json({ message: "File not found" });
    }

    const filename = file.filename;

    if (file.b2Key && process.env.B2_BUCKET) {
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.B2_BUCKET,
        Key: file.b2Key,
      }));
    } else if (file.path && fs.existsSync(file.path)) {
      // Delete from local disk
      fs.unlinkSync(file.path);
    }

    await file.deleteOne();

    await createLog(req, {
      user: req.user.id,
      username: req.user.username,
      email: req.user.email,
      action: "FILE_DELETE",
      details: `Deleted file: ${filename} (v${file.version || 1})`,
      status: "SUCCESS",
    });

    res.json({ success: true, message: "File has been deleted" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Delete failed" });
  }
});

/**
 * POST /api/files/share
 * Share a file with another user securely
 */
router.post("/share", protect, async (req, res) => {
  try {
    const { fileId, recipientEmail, wrappedKey } = req.body;

    if (!fileId || !recipientEmail || !wrappedKey) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const file = await File.findById(fileId);
    if (!file || file.owner.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) {
      return res.status(404).json({ success: false, message: "Recipient user not found" });
    }

    if (recipient._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: "Cannot share with yourself" });
    }

    let expiresAt = null;
    if (req.body.expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(req.body.expiresInDays));
    }

    await SharedFile.findOneAndUpdate(
      { fileId: file._id, recipientId: recipient._id },
      { senderId: req.user.id, wrappedKey, expiresAt },
      { upsert: true, new: true }
    );

    await createLog(req, {
      user: req.user.id,
      username: req.user.username,
      email: req.user.email,
      action: "FILE_SHARE",
      details: `Shared file ${file.filename} with ${recipient.email}`,
      status: "SUCCESS",
    });

    res.json({ success: true, message: `File shared with ${recipient.username}!` });
  } catch (err) {
    console.error("Share error:", err);
    res.status(500).json({ success: false, message: "Failed to share file" });
  }
});

/**
 * GET /api/files/shared-with-me
 * Get all files shared with current user
 */
router.get("/shared-with-me", protect, async (req, res) => {
  try {
    const sharedRecords = await SharedFile.find({ recipientId: req.user.id })
      .populate("fileId", "filename size createdAt hash owner wrappedKey path b2Key version")
      .populate("senderId", "username email");

    const result = sharedRecords
      .filter(record => record.fileId) // Filter out deleted files
      .map(record => ({
        _id: record.fileId._id,
        filename: record.fileId.filename,
        size: record.fileId.size,
        hash: record.fileId.hash,
        createdAt: record.fileId.createdAt,
        version: record.fileId.version,
        wrappedKey: record.wrappedKey,
        sender: {
          username: record.senderId?.username || "Unknown",
          email: record.senderId?.email || "Unknown",
        },
      }));

    res.json(result);
  } catch (err) {
    console.error("Fetch shared files error:", err);
    res.status(500).json({ message: "Failed to fetch shared files" });
  }
});
/**
 * GET /api/files/shared-by-me
 * Get all files shared BY current user
 */
router.get("/shared-by-me", protect, async (req, res) => {
  try {
    const sharedRecords = await SharedFile.find({ senderId: req.user.id })
      .populate("fileId", "filename")
      .populate("recipientId", "email");

    const result = sharedRecords.map(record => ({
      _id: record._id,
      fileId: record.fileId?._id,
      filename: record.fileId?.filename || "Deleted File",
      recipient: record.recipientId?.email || "Unknown",
      sharedAt: record.createdAt,
      expiresAt: record.expiresAt,
    }));

    res.json(result);
  } catch (err) {
    console.error("Fetch shared-by-me files error:", err);
    res.status(500).json({ message: "Failed to fetch sent files" });
  }
});

/**
 * DELETE /api/files/share/:id
 * Revoke sharing access
 */
router.delete("/share/:id", protect, async (req, res) => {
  try {
    const sharedRecord = await SharedFile.findOne({
      _id: req.params.id,
      senderId: req.user.id
    }).populate("recipientId", "email").populate("fileId", "filename");

    if (!sharedRecord) {
      return res.status(404).json({ message: "Share record not found or unauthorized" });
    }

    await sharedRecord.deleteOne();

    await createLog(req, {
      user: req.user.id,
      username: req.user.username,
      email: req.user.email,
      action: "FILE_REVOKE",
      details: `Revoked access to ${sharedRecord.fileId?.filename} from ${sharedRecord.recipientId?.email}`,
      status: "SUCCESS",
    });

    res.json({ success: true, message: "Access has been removed" });
  } catch (err) {
    console.error("Revoke error:", err);
    res.status(500).json({ message: "Failed to revoke access" });
  }
});

export default router;