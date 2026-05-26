/**
 * AEGIS Crypto Utilities
 * Handles secure key derivation and password analysis
 */

/**
 * Derives a cryptographic key from a passphrase using PBKDF2
 */
export const deriveKeyFromPassphrase = async (passphrase, salt) => {
  const enc = new TextEncoder();
  const passphraseKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    passphraseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

/**
 * AI-powered password strength analysis
 * Returns a score (0-4) and feedback
 */
export const analyzePasswordStrength = (password) => {
  if (!password) return { score: 0, feedback: "Enter a passphrase", color: "#666" };
  
  let score = 0;
  let feedback = [];

  if (password.length >= 8) score++;
  else feedback.push("Too short (min 8 chars)");

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  else feedback.push("Add mixed case");

  if (/[0-9]/.test(password)) score++;
  else feedback.push("Add a number");

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push("Add a symbol");

  const colors = ["#ff4d4d", "#ff944d", "#ffd11a", "#7cff1a", "#00ff66"];
  const labels = ["Very Weak", "Weak", "Fair", "Strong", "Military Grade"];

  return {
    score,
    label: labels[score],
    color: colors[score],
    feedback: feedback.length > 0 ? feedback[0] : "Perfect security",
    strength: (score / 4) * 100
  };
};

/**
 * Generates a random 16-byte salt
 */
export const generateSalt = () => {
  return window.crypto.getRandomValues(new Uint8Array(16));
};

/**
 * Generates an RSA-OAEP 2048-bit key pair for secure sharing
 */
export const generateRSAKeyPair = async () => {
  return await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Wraps an AES key with an RSA public key
 */
export const wrapKeyRSA = async (aesKey, publicKey) => {
  return await window.crypto.subtle.wrapKey(
    'raw',
    aesKey,
    publicKey,
    'RSA-OAEP'
  );
};

/**
 * Unwraps an AES key with an RSA private key
 */
export const unwrapKeyRSA = async (wrappedKey, privateKey) => {
  return await window.crypto.subtle.unwrapKey(
    'raw',
    wrappedKey,
    privateKey,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt']
  );
};
