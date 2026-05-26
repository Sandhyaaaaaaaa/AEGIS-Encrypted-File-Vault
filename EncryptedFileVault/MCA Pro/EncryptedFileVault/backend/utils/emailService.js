import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration on startup
transporter.verify((error, success) => {
  if (error) {
    if (process.env.EMAIL_USER === 'your-email@gmail.com') {
      console.warn('⚠️  EMAIL WARNING: You are still using placeholder credentials in .env. Recovery emails will fail.');
    } else {
      console.error('❌ EMAIL ERROR: Connection failed. Check your EMAIL_USER and EMAIL_PASS (App Password).');
      console.error(error.message);
    }
  } else {
    console.log('📧 Email Service: Ready to send recovery codes.');
  }
});

export const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: `"Aegis Secure Vault" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Aegis Account Recovery OTP',
    html: `
      <div style="font-family: 'Syne', sans-serif; background: #030b03; color: #fff; padding: 40px; border-radius: 20px;">
        <h1 style="color: #00ff64; border-bottom: 2px solid #00ff64; padding-bottom: 10px;">Security Verification</h1>
        <p style="font-size: 1.1rem;">You requested an account recovery. Use the following code to verify your identity:</p>
        <div style="background: rgba(0,255,100,0.1); border: 1px solid #00ff64; padding: 20px; font-size: 2.5rem; font-weight: bold; text-align: center; color: #00ff64; border-radius: 10px; margin: 30px 0;">
          ${otp}
        </div>
        <p style="color: rgba(255,255,255,0.6); font-size: 0.9rem;">This code will expire in 5 minutes. If you did not request this, please ignore this email and ensure your account is secure.</p>
        <div style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.1); pt-20px; font-size: 0.8rem; color: rgba(255,255,255,0.4);">
          AEGIS SECURE VAULT // MILITARY-GRADE ENCRYPTION
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send OTP:', error);
    throw new Error('Email delivery failed');
  }
};

export const alertAdminRecovery = async (userEmail) => {
  const mailOptions = {
    from: `"Aegis System Alert" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: '⚠️ SECURITY ALERT: Recovery Initiated',
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 2px solid #ff4444; border-radius: 10px;">
        <h2 style="color: #ff4444;">Account Recovery Alert</h2>
        <p>User <strong>${userEmail}</strong> has initiated an account recovery process.</p>
        <p>Timestamp: ${new Date().toLocaleString()}</p>
        <p style="color: #888;">No action is required unless this was unexpected.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`🚨 Admin alerted for recovery of ${userEmail}`);
  } catch (error) {
    console.warn('⚠️ Admin alert failed:', error.message);
  }
};
