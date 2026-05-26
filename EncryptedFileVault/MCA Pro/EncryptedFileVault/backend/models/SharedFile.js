import mongoose from 'mongoose';

const sharedFileSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  wrappedKey: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

const SharedFile = mongoose.models.SharedFile || mongoose.model('SharedFile', sharedFileSchema);
export default SharedFile;