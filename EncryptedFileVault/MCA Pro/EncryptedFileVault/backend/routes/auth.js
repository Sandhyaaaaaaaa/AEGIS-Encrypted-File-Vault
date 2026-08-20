import express from 'express';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import User from '../models/User.js';
import File from '../models/File.js';
import { protect } from '../middleware/authMiddleware.js';
import { createLog } from '../utils/auditHelper.js';
import { sendOTP, alertAdminRecovery } from '../utils/emailService.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, publicKey, encryptedPrivateKey, vaultPin } = req.body;

    if (!username || !email || !password || !publicKey || !encryptedPrivateKey) {
      return res.status(400).json({ message: 'Please fill in all details' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Securely save the recovery PIN if provided
    let vaultPinHash = null;
    if (vaultPin && vaultPin.length === 6) {
      const pinSalt = await bcrypt.genSalt(10);
      vaultPinHash = await bcrypt.hash(vaultPin, pinSalt);
    }

    const user = await User.create({ username, email, password, publicKey, encryptedPrivateKey, vaultPin: vaultPinHash });

    await createLog(req, {
      user: user._id,
      username: user.username,
      email: user.email,
      action: 'REGISTER',
      details: `New account created for ${email}`,
      status: 'SUCCESS',
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.status(201).json({
      message: 'Account created successfully!',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      await createLog(req, {
        user: null,
        username: 'Unknown',
        email: email,
        action: 'LOGIN_FAILED',
        details: `Login attempt with unknown email: ${email}`,
        status: 'FAILED',
      });
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      await createLog(req, {
        user: user._id,
        username: user.username,
        email: user.email,
        action: 'LOGIN_FAILED',
        details: `Incorrect password attempt for ${email}`,
        status: 'FAILED',
      });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.mfaEnabled) {
      const tempToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      await createLog(req, {
        user: user._id,
        username: user.username,
        email: user.email,
        action: 'LOGIN_SUCCESS',
        details: 'Password correct — user needs to set up double security (MFA)',
        status: 'WARNING',
      });

      return res.status(200).json({
        message: 'MFA setup required',
        mfaSetupRequired: true,
        token: tempToken,
      });
    }

    await createLog(req, {
      user: user._id,
      username: user.username,
      email: user.email,
      action: 'LOGIN_SUCCESS',
      details: 'Password verified — OTP required',
      status: 'WARNING',
    });

    return res.status(200).json({
      message: 'Security code required',
      mfaRequired: true,
      userId: user._id,
    });

  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});



/**
 * @route   POST /api/auth/mfa/setup
 * @access  Private
 */
router.post('/mfa/setup', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const secret = speakeasy.generateSecret({
      name: `Aegis (${user.email})`,
    });

    user.mfaSecret = secret.base32;
    await user.save();

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    await createLog(req, {
      user: user._id,
      username: user.username,
      email: user.email,
      action: 'MFA_SETUP',
      details: 'Started security setup — created QR code',
      status: 'SUCCESS',
    });

    res.status(200).json({
      message: 'Please scan this code with your phone app',
      qrCode: qrCodeUrl,
      secret: secret.base32,
    });
  } catch (error) {
    res.status(500).json({ message: 'MFA setup failed', error: error.message });
  }
});

/**
 * @route   POST /api/auth/mfa/verify
 * @access  Private
 */
router.post('/mfa/verify', protect, async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'Please enter the OTP' });
    }

    const user = await User.findById(req.user.id);

    if (!user.mfaSecret) {
      return res.status(400).json({ message: 'Please setup MFA first' });
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: otp,
      window: 1,
    });

    if (!isValid) {
      await createLog(req, {
        user: user._id,
        username: user.username,
        email: user.email,
        action: 'MFA_FAILED',
        details: 'Wrong code entered during setup',
        status: 'FAILED',
      });
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    user.mfaEnabled = true;
    await user.save();

    await createLog(req, {
      user: user._id,
      username: user.username,
      email: user.email,
      action: 'MFA_VERIFIED',
      details: 'Double security (MFA) is now active',
      status: 'SUCCESS',
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Security enabled!',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'MFA verification failed', error: error.message });
  }
});

/**
 * @route   POST /api/auth/mfa/validate
 * @access  Public
 */
router.post('/mfa/validate', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'userId and OTP are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: otp,
      window: 1,
    });

    if (!isValid) {
      await createLog(req, {
        user: user._id,
        username: user.username,
        email: user.email,
        action: 'MFA_FAILED',
        details: 'Invalid OTP entered during login',
        status: 'FAILED',
      });
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    await createLog(req, {
      user: user._id,
      username: user.username,
      email: user.email,
      action: 'LOGIN_SUCCESS',
      details: `Successful login from ${req.headers['user-agent']?.split(' ')[0] || 'Unknown browser'}`,
      status: 'SUCCESS',
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Logged in successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'OTP validation failed', error: error.message });
  }
});

/**
 * @route   POST /api/auth/mfa/disable
 * @access  Private
 */
router.post('/mfa/disable', protect, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user.id);

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: otp,
      window: 1,
    });

    if (!isValid) {
      await createLog(req, {
        user: user._id,
        username: user.username,
        email: user.email,
        action: 'MFA_FAILED',
        details: 'Invalid OTP — failed attempt to disable MFA',
        status: 'FAILED',
      });
      return res.status(400).json({ message: 'Invalid OTP. Cannot disable MFA.' });
    }

    user.mfaEnabled = false;
    user.mfaSecret = null;
    await user.save();

    await createLog(req, {
      user: user._id,
      username: user.username,
      email: user.email,
      action: 'MFA_SETUP',
      details: 'MFA disabled by user',
      status: 'WARNING',
    });

    res.status(200).json({ message: 'MFA disabled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to disable MFA', error: error.message });
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    await createLog(req, {
      user: user._id,
      username: user.username,
      email: user.email,
      action: 'LOGIN_SUCCESS',
      details: 'Password changed successfully',
      status: 'SUCCESS',
    });

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
});

/**
 * @route   DELETE /api/auth/delete-account
 * @access  Private
 */
router.delete('/delete-account', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Delete all their files from DB
    await File.deleteMany({ owner: req.user.id });

    // Delete the user
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({ message: 'Your account has been deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete account', error: error.message });
  }
});

/**
 * @route   GET /api/auth/public-key/:email
 * @access  Private
 */
router.get('/public-key/:email', protect, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user || !user.publicKey) {
      return res.status(404).json({ message: 'Public key not found for this user' });
    }
    res.json({ publicKey: user.publicKey });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve public key', error: error.message });
  }
});

/**
 * @route   GET /api/auth/my-private-key
 * @access  Private
 */
router.get('/my-private-key', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.encryptedPrivateKey) {
      return res.status(404).json({ message: 'Private key not found' });
    }
    res.json({ privateKey: user.encryptedPrivateKey });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve private key', error: error.message });
  }
});

/**
 * @route   POST /api/auth/update-keys
 * @access  Private
 */
router.post('/update-keys', protect, async (req, res) => {
  try {
    const { publicKey, encryptedPrivateKey } = req.body;

    if (!publicKey || !encryptedPrivateKey) {
      return res.status(400).json({ message: 'Public and Private keys are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.publicKey = publicKey;
    user.encryptedPrivateKey = encryptedPrivateKey;
    await user.save();

    await createLog(req, {
      user: user._id,
      username: user.username,
      email: user.email,
      action: 'MFA_SETUP', // Using MFA_SETUP as a proxy for security changes
      details: 'RSA keypair generated/updated for the account',
      status: 'SUCCESS',
    });

    res.status(200).json({ message: 'Security keys saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update security keys', error: error.message });
  }
});

/**
 * @route   POST /api/auth/vault-pin/set
 * @access  Private
 */
router.post('/vault-pin/set', protect, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length < 4) {
      return res.status(400).json({ message: 'A valid PIN of at least 4 digits is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const salt = await bcrypt.genSalt(10);
    user.vaultPin = await bcrypt.hash(pin, salt);
    await user.save();

    await createLog(req, {
      user: user._id,
      username: user.username,
      email: user.email,
      action: 'MFA_SETUP',
      details: 'Recovery PIN has been set',
      status: 'SUCCESS',
    });

    res.status(200).json({ message: 'Recovery PIN saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to set Vault PIN', error: error.message });
  }
});

/**
 * @route   POST /api/auth/vault-pin/verify
 * @access  Public
 */
router.post('/vault-pin/verify', async (req, res) => {
  try {
    const { email, pin } = req.body;
    if (!email || !pin) {
      return res.status(400).json({ message: 'Email and PIN are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.vaultPin) {
      return res.status(400).json({ message: 'Invalid recovery attempt' });
    }

    const isMatch = await bcrypt.compare(pin, user.vaultPin);
    if (!isMatch) {
      await createLog(req, {
        user: user._id,
        username: user.username,
        email: user.email,
        action: 'LOGIN_FAILED',
        details: 'Failed Vault PIN recovery attempt',
        status: 'FAILED',
      });
      return res.status(400).json({ message: 'Invalid PIN' });
    }

    // Disable MFA to allow recovery
    user.mfaEnabled = false;
    user.mfaSecret = null;
    await user.save();

    await createLog(req, {
      user: user._id,
      username: user.username,
      email: user.email,
      action: 'LOGIN_SUCCESS',
      details: 'Account recovered via Vault PIN — MFA disabled',
      status: 'WARNING',
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Account recovered! Double security is now off',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Recovery failed', error: error.message });
  }
});

/**
 * @route   POST /api/auth/send-recovery-otp
 * @access  Public
 */
router.post('/send-recovery-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    
    // Security: Don't reveal if user exists
    if (!user) {
      return res.status(200).json({ message: 'If you have an account, we have sent a code to your email.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    user.otpHash = await bcrypt.hash(otp, salt);
    user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    // Send Real Email
    await sendOTP(email, otp);
    
    // Alert Admin
    await alertAdminRecovery(email);

    await createLog(req, {
      user: user._id,
      username: user.username,
      email: user.email,
      action: 'LOGIN_SUCCESS',
      details: 'Recovery code sent to email',
      status: 'WARNING',
    });

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
});

/**
 * @route   POST /api/auth/verify-recovery-otp
 * @access  Public
 */
router.post('/verify-recovery-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const user = await User.findOne({ email });
    if (!user || !user.otpHash || !user.otpExpiry) {
      return res.status(400).json({ message: 'Invalid or expired OTP session' });
    }

    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    const isMatch = await bcrypt.compare(otp, user.otpHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Wrong code entered' });
    }

    // OTP verified - clear it
    user.otpHash = null;
    user.otpExpiry = null;
    await user.save();

    res.status(200).json({ message: 'Code verified!', verified: true });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
});

/**
 * @route   POST /api/auth/final-recovery
 * @access  Public
 */
router.post('/final-recovery', async (req, res) => {
  try {
    const { email, recoveryType, recoveryValue, newPassword } = req.body;
    if (!email || !recoveryType || !recoveryValue || !newPassword) {
      return res.status(400).json({ message: 'Missing required recovery data' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let isValid = false;
    if (recoveryType === 'PIN') {
      if (!user.vaultPin) return res.status(400).json({ message: 'Vault PIN not configured for this account' });
      isValid = await bcrypt.compare(recoveryValue, user.vaultPin);
    } else if (recoveryType === 'PHRASE') {
      if (!user.secretPhraseHash) return res.status(400).json({ message: 'Secret phrase not configured' });
      isValid = await bcrypt.compare(recoveryValue.toLowerCase(), user.secretPhraseHash);
    }

    if (!isValid) {
      return res.status(400).json({ message: `Invalid ${recoveryType === 'PIN' ? 'Recovery PIN' : 'Recovery Phrase'}` });
    }

    // Success - Reset password and disable MFA
    user.password = newPassword;
    user.mfaEnabled = false;
    user.mfaSecret = null;
    await user.save();

    await createLog(req, {
      user: user._id,
      username: user.username,
      email: user.email,
      action: 'MFA_SETUP',
      details: 'Account recovered and password changed',
      status: 'SUCCESS',
    });

    res.status(200).json({ message: 'Account recovered! You can now log in with your new password.' });
  } catch (error) {
    res.status(500).json({ message: 'Final recovery failed', error: error.message });
  }
});

/**
 * @route   POST /api/auth/secret-phrase/set
 * @access  Private
 */
router.post('/secret-phrase/set', protect, async (req, res) => {
  try {
    const { phrase } = req.body;
    if (!phrase || phrase.length < 4) {
      return res.status(400).json({ message: 'Secret phrase must be at least 4 characters long' });
    }

    const user = await User.findById(req.user.id);
    const salt = await bcrypt.genSalt(10);
    user.secretPhraseHash = await bcrypt.hash(phrase.toLowerCase(), salt);
    await user.save();

    await createLog(req, {
      user: user._id,
      username: user.username,
      email: user.email,
      action: 'MFA_SETUP',
      details: 'Recovery phrase has been set',
      status: 'SUCCESS',
    });

    res.status(200).json({ message: 'Recovery phrase saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to set secret phrase', error: error.message });
  }
});

/**
 * @route   POST /api/auth/vault-pin/verify-file
 * @desc    Verify Vault PIN for file recovery (authenticated)
 * @access  Private
 */
router.post('/vault-pin/verify-file', protect, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ message: 'PIN is required', valid: false });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.vaultPin) {
      return res.status(400).json({ message: 'Vault PIN not configured', valid: false });
    }

    const isMatch = await bcrypt.compare(pin, user.vaultPin);
    if (!isMatch) {
      await createLog(req, {
        user: user._id,
        username: user.username,
        email: user.email,
        action: 'LOGIN_FAILED',
        details: 'Failed Vault PIN verification for file recovery',
        status: 'FAILED',
      });
      return res.status(400).json({ message: 'Invalid PIN', valid: false });
    }

    await createLog(req, {
      user: user._id,
      username: user.username,
      email: user.email,
      action: 'LOGIN_SUCCESS',
      details: 'Vault PIN verified for file recovery',
      status: 'SUCCESS',
    });

    res.status(200).json({ message: 'PIN verified', valid: true });
  } catch (error) {
    res.status(500).json({ message: 'PIN verification failed', error: error.message, valid: false });
  }
});

export default router;