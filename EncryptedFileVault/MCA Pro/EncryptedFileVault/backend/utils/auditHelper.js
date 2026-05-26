import AuditLog from '../models/AuditLog.js';

/**
 * Creates an audit log entry
 * Call this from any route to log an action
 *
 * @example
 * await createLog(req, {
 *   user: user._id,
 *   username: user.username,
 *   email: user.email,
 *   action: 'LOGIN_SUCCESS',
 *   details: 'User logged in successfully',
 *   status: 'SUCCESS'
 * });
 */
export const createLog = async (req, { user, username, email, action, details, status }) => {
  try {
    await AuditLog.create({
      user: user || null,
      username: username || 'Unknown',
      email: email || 'Unknown',
      action,
      details: details || '',
      status: status || 'SUCCESS',
      ipAddress: req.ip || req.connection?.remoteAddress || 'Unknown',
      userAgent: req.headers?.['user-agent'] || 'Unknown',
    });
  } catch (err) {
    // Never crash the app if logging fails — just warn
    console.warn('Audit log failed:', err.message);
  }
};