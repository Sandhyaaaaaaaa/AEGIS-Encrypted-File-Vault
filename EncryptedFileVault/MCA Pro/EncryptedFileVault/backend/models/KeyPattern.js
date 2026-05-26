import mongoose from 'mongoose';

/**
 * Adaptive Key Feedback System
 * Learns user patterns and provides personalized suggestions
 */
const keyPatternSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    keyLength: {
      type: Number,
      required: true,
    },
    hasUppercase: Boolean,
    hasLowercase: Boolean,
    hasNumbers: Boolean,
    hasSpecial: Boolean,
    strengthScore: Number,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const KeyPattern = mongoose.models.KeyPattern || mongoose.model('KeyPattern', keyPatternSchema);
export default KeyPattern;
