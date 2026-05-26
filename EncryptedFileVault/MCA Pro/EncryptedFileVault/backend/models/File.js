import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String
  },
  b2Key: {
    type: String
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  hash: {
    type: String,
    required: true
  },
  wrappedKey: {
    type: String,
    required: true
  },
  recoveryWrappedKey: {
    type: String,
    default: null
  },
  pinWrappedKey: {
    type: String,
    default: null
  },
  hasRecovery: {
    type: Boolean,
    default: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  versionGroup: {
    type: String
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

const File = mongoose.models.File || mongoose.model('File', fileSchema);
export default File;
