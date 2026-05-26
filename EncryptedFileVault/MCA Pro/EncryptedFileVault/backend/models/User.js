import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please enter a username'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Please enter an email address'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please enter a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    publicKey: {
      type: String,
      default: null,
    },
    encryptedPrivateKey: {
      type: String,
      default: null,
    },

    // 🔐 MFA Fields
    mfaSecret: {
      type: String,
      default: null,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    vaultPin: {
      type: String,
      default: null,
    },

    // 🔐 Recovery Fields
    otpHash: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
    secretPhraseHash: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// 🔐 Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔑 Compare entered password with stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


// ✅ FIX (prevents OverwriteModelError)
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;