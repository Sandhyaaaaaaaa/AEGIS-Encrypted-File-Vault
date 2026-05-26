import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    // Who did the action
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for failed login attempts
    },
    username: {
      type: String,
      default: 'Unknown',
    },
    email: {
      type: String,
      default: 'Unknown',
    },

    // What they did
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'REGISTER',
        'MFA_SETUP',
        'MFA_VERIFIED',
        'MFA_FAILED',
        'FILE_UPLOAD',
        'FILE_DOWNLOAD',
        'FILE_DELETE',
        'FILE_SHARE',
        'ADMIN_VIEW_USERS',
        'ADMIN_VIEW_LOGS',
      ],
    },

    // Extra info about the action
    details: {
      type: String,
      default: '',
    },

    // Was it successful or not
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'WARNING'],
      default: 'SUCCESS',
    },

    // Request info
    ipAddress: {
      type: String,
      default: 'Unknown',
    },
    userAgent: {
      type: String,
      default: 'Unknown',
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;