import crypto from "crypto";

/**
 * 🔐 Generate a random token (used for sharing links, reset tokens, etc.)
 */
export const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex"); // more secure than Math.random()
};

/**
 * 📁 Generate SHA-256 hash for a file
 * @param {Buffer} buffer - file data (e.g., req.file.buffer from multer)
 * @returns {string} hash
 */
export const generateFileHash = (buffer) => {
  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");
};

/**
 * 🔑 Generate a secure encryption key (if needed for server-side logic)
 */
export const generateEncryptionKey = () => {
  return crypto.randomBytes(32).toString("hex"); // 256-bit key
};