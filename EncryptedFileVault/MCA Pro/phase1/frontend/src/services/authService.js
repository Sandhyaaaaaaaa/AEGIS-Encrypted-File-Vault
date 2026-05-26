import api from '../config/api';

// ================= AUTH =================

// Register
export const register = async (username, email, password, vaultPin = null) => {
  // Generate RSA Keypair
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  // Export Public Key
  const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const publicKeyBase64 = window.btoa(Array.from(new Uint8Array(publicKeyBuffer)).map(b => String.fromCharCode(b)).join(''));

  // Export Private Key
  const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const privateKeyString = window.btoa(Array.from(new Uint8Array(privateKeyBuffer)).map(b => String.fromCharCode(b)).join(''));
  
  // Encrypt Private Key with PBKDF2 derived key from password
  const encoder = new TextEncoder();
  const passwordMaterial = await window.crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const aesKey = await window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    passwordMaterial,
    { name: "AES-GCM", length: 256 },
    false, ["encrypt"]
  );
  
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedPrivKeyBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, aesKey, encoder.encode(privateKeyString)
  );
  
  // Combine salt, iv, and ciphertext
  const combinedBuffer = new Uint8Array(salt.length + iv.length + encryptedPrivKeyBuffer.byteLength);
  combinedBuffer.set(salt, 0);
  combinedBuffer.set(iv, salt.length);
  combinedBuffer.set(new Uint8Array(encryptedPrivKeyBuffer), salt.length + iv.length);
  
  const encryptedPrivateKey = window.btoa(Array.from(combinedBuffer).map(b => String.fromCharCode(b)).join(''));

  const requestBody = { username, email, password, publicKey: publicKeyBase64, encryptedPrivateKey };
  if (vaultPin) {
    requestBody.vaultPin = vaultPin;
  }

  const res = await api.post('/auth/register', requestBody);

  if (res.data.token) {
    sessionStorage.setItem('token', res.data.token);
    sessionStorage.setItem('user', JSON.stringify(res.data.user));
  }

  return res.data;
};

// Generate and Save New Keys for existing user
export const generateAndSaveKeys = async (password) => {
  const token = sessionStorage.getItem('token');
  if (!token) throw new Error("Not authenticated");

  // Generate RSA Keypair
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  // Export Public Key
  const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const publicKeyBase64 = window.btoa(Array.from(new Uint8Array(publicKeyBuffer)).map(b => String.fromCharCode(b)).join(''));

  // Export Private Key
  const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const privateKeyString = window.btoa(Array.from(new Uint8Array(privateKeyBuffer)).map(b => String.fromCharCode(b)).join(''));
  
  // Encrypt Private Key with PBKDF2 derived key from password
  const encoder = new TextEncoder();
  const passwordMaterial = await window.crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const aesKey = await window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    passwordMaterial,
    { name: "AES-GCM", length: 256 },
    false, ["encrypt"]
  );
  
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedPrivKeyBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, aesKey, encoder.encode(privateKeyString)
  );
  
  // Combine salt, iv, and ciphertext
  const combinedBuffer = new Uint8Array(salt.length + iv.length + encryptedPrivKeyBuffer.byteLength);
  combinedBuffer.set(salt, 0);
  combinedBuffer.set(iv, salt.length);
  combinedBuffer.set(new Uint8Array(encryptedPrivKeyBuffer), salt.length + iv.length);
  
  const encryptedPrivateKey = window.btoa(Array.from(combinedBuffer).map(b => String.fromCharCode(b)).join(''));

  const res = await api.post('/auth/update-keys', { 
    publicKey: publicKeyBase64, 
    encryptedPrivateKey 
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
};

// Login
export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });

  if (res.data.token && !res.data.mfaRequired) {
    sessionStorage.setItem('token', res.data.token);
    sessionStorage.setItem('user', JSON.stringify(res.data.user));
  }

  return res.data;
};

// Logout
export const logout = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
};

// Get current user
export const getCurrentUser = () => {
  const user = sessionStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Auth check
export const isAuthenticated = () => {
  return !!sessionStorage.getItem('token');
};

// ================= MFA =================

export const validateMFA = async (userId, otp) => {
  const res = await api.post('/auth/mfa/validate', { userId, otp });

  if (res.data.token) {
    sessionStorage.setItem('token', res.data.token);
    sessionStorage.setItem('user', JSON.stringify(res.data.user));
  }

  return res.data;
};

export const setupMFA = async () => {
  const token = sessionStorage.getItem('token');

  const res = await api.post('/auth/mfa/setup', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
};

export const verifyMFA = async (otp) => {
  const token = sessionStorage.getItem('token');

  const res = await api.post('/auth/mfa/verify', { otp }, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
};

// ================= 🔐 RECOVERY =================

export const recoverAccount = async (email, recoveryKey) => {
  const res = await api.post('/auth/recover', {
    email,
    recoveryKey
  });

  return res.data;
};

export const sendRecoveryOTP = async (email) => {
  const res = await api.post('/auth/send-recovery-otp', { email });
  return res.data;
};

export const verifyRecoveryOTP = async (email, otp) => {
  const res = await api.post('/auth/verify-recovery-otp', { email, otp });
  return res.data;
};

export const finalizeRecovery = async (data) => {
  const res = await api.post('/auth/final-recovery', data);
  return res.data;
};

// ================= 🔑 VAULT PIN =================

export const setVaultPin = async (pin) => {
  const token = sessionStorage.getItem('token');
  const res = await api.post('/auth/vault-pin/set', { pin }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const verifyVaultPin = async (email, pin) => {
  const res = await api.post('/auth/vault-pin/verify', { email, pin });
  
  if (res.data.token) {
    sessionStorage.setItem('token', res.data.token);
    sessionStorage.setItem('user', JSON.stringify(res.data.user));
  }
  
  return res.data;
};