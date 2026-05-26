// src/services/fileService.js

import api from '../config/api';

// ----------------------------------------------------------------------------------
// HELPER: Robust Base64 conversion for Uint8Arrays
// ----------------------------------------------------------------------------------
const uint8ToBase64 = (bytes) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const base64ToUint8 = (base64) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// ----------------------------------------------------------------------------------
// HELPER: Derive Master Key from Passphrase (200,000 iterations)
// Used for file encryption/decryption
// ----------------------------------------------------------------------------------
const deriveMasterKeyAndSalt = async (passphrase, existingSalt = null) => {
  const encoder = new TextEncoder();
  const salt = existingSalt || crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const masterKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 200000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return { masterKey, salt };
};

// ----------------------------------------------------------------------------------
// HELPER: Derive key for RSA Private Key decryption (100,000 iterations)
// MUST match Register.js which uses 100,000 iterations
// ----------------------------------------------------------------------------------
const derivePrivateKeyDecryptionKey = async (password, salt) => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000, // Must match Register.js exactly
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
};

// ----------------------------------------------------------------------------------
// HELPER: Derive Recovery Key (200,000 iterations)
// Used for recovery key wrapping/unwrapping
// ----------------------------------------------------------------------------------
const deriveRecoveryKey = async (rawRecoveryKey, existingSalt = null) => {
  // Normalize: Trim whitespace and ensure uppercase for consistency
  const recoveryKeyString = rawRecoveryKey.trim().toUpperCase();
  const encoder = new TextEncoder();
  const salt = existingSalt || crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(recoveryKeyString),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 200000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return { derivedKey, salt };
};

// ----------------------------------------------------------------------------------
// HELPER: Derive PIN Key (100,000 iterations)
// Used for PIN wrapping/unwrapping
// ----------------------------------------------------------------------------------
const derivePinKey = async (rawPin, existingSalt = null) => {
  // Normalize: Trim whitespace
  const pin = rawPin.trim();
  const encoder = new TextEncoder();
  const salt = existingSalt || crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return { derivedKey, salt };
};

// ----------------------------------------------------------------------------------
// HELPER: Wrap an exported AES key with a wrapping key
// Returns base64 string: salt(16) + iv(12) + encrypted key
// ----------------------------------------------------------------------------------
const wrapKeyWithDerivedKey = async (exportedFileKey, derivedKey, salt) => {
  const wrapIv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedKeyBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: wrapIv },
    derivedKey,
    exportedFileKey
  );

  const wrappedBytes = new Uint8Array(salt.length + wrapIv.length + encryptedKeyBuffer.byteLength);
  wrappedBytes.set(salt, 0);
  wrappedBytes.set(wrapIv, salt.length);
  wrappedBytes.set(new Uint8Array(encryptedKeyBuffer), salt.length + wrapIv.length);

  return uint8ToBase64(wrappedBytes);
};

// ----------------------------------------------------------------------------------
// HELPER: Unwrap an AES key from a wrapped key blob
// Input: base64 string containing salt(16) + iv(12) + encrypted key
// ----------------------------------------------------------------------------------
const unwrapKeyFromBlob = async (wrappedKeyBase64, deriveFunction) => {
  const wrappedBytes = base64ToUint8(wrappedKeyBase64);
  const salt = wrappedBytes.slice(0, 16);
  const wrapIv = wrappedBytes.slice(16, 28);
  const encryptedKey = wrappedBytes.slice(28);

  const { derivedKey } = await deriveFunction(salt);

  const exportedKeyBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: wrapIv },
    derivedKey,
    encryptedKey
  );

  return new Uint8Array(exportedKeyBuffer);
};

// ----------------------------------------------------------------------------------
// HELPER: Generate Recovery Key string
// Format: AEGIS-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
// ----------------------------------------------------------------------------------
const generateRecoveryKeyString = () => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const hexString = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const groups = [];
  for (let i = 0; i < 64; i += 8) {
    groups.push(hexString.slice(i, i + 8));
  }
  return 'AEGIS-' + groups.join('-');
};

// ----------------------------------------------------------------------------------
// UPLOAD FILE — Triple Key Wrapping
// ----------------------------------------------------------------------------------
export const uploadFile = async (file, passphrase, vaultPin = null, onStageChange = null) => {
  if (!passphrase) throw new Error("Encryption key is required");

  const notifyStage = (stage) => { if (onStageChange) onStageChange(stage); };

  // Stage 1: Hash
  notifyStage(1);
  const originalBuffer = await file.arrayBuffer();

  let hashHex;
  try {
    const hashBuffer = await crypto.subtle.digest("SHA-256", originalBuffer);
    const hashArray = new Uint8Array(hashBuffer);
    hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    throw new Error("SHA-256 hashing failed: " + err.message);
  }

  // Stage 2: Encrypt
  notifyStage(2);
  let fileKey, fileIv, encryptedFileBuffer;
  try {
    fileKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    fileIv = crypto.getRandomValues(new Uint8Array(12));

    const metadata = {
      originalName: file.name,
      originalSize: file.size,
      originalType: file.type || 'application/octet-stream',
      sha256: hashHex,
      uploadedAt: new Date().toISOString()
    };

    const encoder = new TextEncoder();
    const metadataJson = JSON.stringify(metadata) + '\n';
    const metadataBuffer = encoder.encode(metadataJson);

    const fullData = new Uint8Array(metadataBuffer.byteLength + originalBuffer.byteLength);
    fullData.set(new Uint8Array(metadataBuffer), 0);
    fullData.set(new Uint8Array(originalBuffer), metadataBuffer.byteLength);

    encryptedFileBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: fileIv },
      fileKey,
      fullData
    );
  } catch (err) {
    throw new Error("AES-256-GCM encryption failed: " + err.message);
  }

  // Stage 3: Triple Key Wrapping
  notifyStage(3);
  const exportedFileKey = await crypto.subtle.exportKey("raw", fileKey);

  // Wrap 1: Passphrase Master Key (existing)
  let wrappedKeyStr;
  try {
    const { masterKey, salt: masterSalt } = await deriveMasterKeyAndSalt(passphrase);
    wrappedKeyStr = await wrapKeyWithDerivedKey(exportedFileKey, masterKey, masterSalt);
  } catch (err) {
    throw new Error("Passphrase key wrapping failed: " + err.message);
  }

  // Wrap 2: Recovery Key
  let recoveryWrappedKeyStr = null;
  let recoveryKeyString = null;
  try {
    recoveryKeyString = generateRecoveryKeyString();
    const { derivedKey: recoveryDerivedKey, salt: recoverySalt } = await deriveRecoveryKey(recoveryKeyString);
    recoveryWrappedKeyStr = await wrapKeyWithDerivedKey(exportedFileKey, recoveryDerivedKey, recoverySalt);
  } catch (err) {
    console.warn("Recovery key wrapping failed:", err.message);
  }

  // Wrap 3: Vault PIN (if provided)
  let pinWrappedKeyStr = null;
  if (vaultPin && vaultPin.length === 6) {
    try {
      const { derivedKey: pinDerivedKey, salt: pinSalt } = await derivePinKey(vaultPin);
      pinWrappedKeyStr = await wrapKeyWithDerivedKey(exportedFileKey, pinDerivedKey, pinSalt);
    } catch (err) {
      console.warn("PIN key wrapping failed:", err.message);
    }
  }

  // Stage 4: Upload
  notifyStage(4);
  try {
    const finalEncryptedFile = new Blob([fileIv, encryptedFileBuffer], {
      type: 'application/octet-stream'
    });

    const formData = new FormData();
    formData.append('file', finalEncryptedFile, file.name + '.enc');
    formData.append('originalName', file.name);
    formData.append('wrappedKey', wrappedKeyStr);
    if (recoveryWrappedKeyStr) {
      formData.append('recoveryWrappedKey', recoveryWrappedKeyStr);
    }
    if (pinWrappedKeyStr) {
      formData.append('pinWrappedKey', pinWrappedKeyStr);
    }

    const response = await api.post('/files/upload', formData, {
      headers: { 'Content-Type': undefined }
    });

    return {
      ...response.data,
      sha256: hashHex,
      recoveryKey: recoveryKeyString
    };
  } catch (err) {
    throw new Error(err.response?.data?.message || "Upload failed. Please try again.");
  }
};

// ----------------------------------------------------------------------------------
// GET MY FILES
// ----------------------------------------------------------------------------------
export const getMyFiles = async () => {
  const response = await api.get('/files/myfiles');
  return response.data;
};

// ----------------------------------------------------------------------------------
// GET RECOVERY KEYS FOR A FILE
// ----------------------------------------------------------------------------------
export const getFileRecoveryKeys = async (fileId) => {
  const response = await api.get(`/files/${fileId}/recovery-key`);
  return response.data;
};

// ----------------------------------------------------------------------------------
// VERIFY VAULT PIN FOR FILE RECOVERY
// ----------------------------------------------------------------------------------
export const verifyVaultPinForFile = async (pin) => {
  const response = await api.post('/auth/vault-pin/verify-file', { pin });
  return response.data;
};

// ----------------------------------------------------------------------------------
// HELPER: Download and decrypt file with a raw AES key
// ----------------------------------------------------------------------------------
const downloadAndDecryptWithKey = async (fileId, exportedFileKey, fallbackFilename) => {
  const fileKey = await crypto.subtle.importKey(
    "raw", exportedFileKey, "AES-GCM", true, ["decrypt"]
  );

  const response = await api.get(`/files/download/${fileId}`, { responseType: 'blob' });
  const encryptedArray = new Uint8Array(await response.data.arrayBuffer());

  const fileIv = encryptedArray.slice(0, 12);
  const ciphertext = encryptedArray.slice(12);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fileIv }, fileKey, ciphertext
    );

    const decryptedData = new Uint8Array(decryptedBuffer);
    const decoder = new TextDecoder();

    const newlineIndex = Array.from(decryptedData).findIndex(b => b === 0x0A);
    if (newlineIndex === -1) throw new Error("Invalid encrypted file format");

    const metadata = JSON.parse(decoder.decode(decryptedData.slice(0, newlineIndex)));
    const fileData = decryptedData.slice(newlineIndex + 1);

    const recomputedHashBuffer = await crypto.subtle.digest("SHA-256", fileData);
    const recomputedHash = Array.from(new Uint8Array(recomputedHashBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    if (recomputedHash !== metadata.sha256) {
      throw new Error("Integrity check failed: File may have been tampered with!");
    }

    return {
      blob: new Blob([fileData], { type: metadata.originalType }),
      filename: metadata.originalName || fallbackFilename,
      metadata
    };
  } catch (error) {
    if (error.name === 'OperationError') {
      throw new Error("Decryption failed. Key mismatch or corrupted file.");
    }
    throw error;
  }
};

// ----------------------------------------------------------------------------------
// DOWNLOAD OWN FILE (Passphrase Path)
// ----------------------------------------------------------------------------------
export const downloadFile = async (fileId, passphrase, fallbackFilename = "decrypted.file") => {
  const filesList = await getMyFiles();
  const fileMeta = filesList.find(f => f._id === fileId);
  if (!fileMeta || !fileMeta.wrappedKey) {
    throw new Error("File metadata not found or missing wrapped key.");
  }

  const wrappedKeyStr = fileMeta.wrappedKey;

  const wrappedKeyBytes = base64ToUint8(wrappedKeyStr);
  const masterSalt = wrappedKeyBytes.slice(0, 16);
  const wrapIv = wrappedKeyBytes.slice(16, 28);
  const encryptedFileKey = wrappedKeyBytes.slice(28);

  const { masterKey } = await deriveMasterKeyAndSalt(passphrase, masterSalt);

  let exportedFileKey;
  try {
    const exportedFileKeyBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: wrapIv },
      masterKey,
      encryptedFileKey
    );
    exportedFileKey = new Uint8Array(exportedFileKeyBuffer);
  } catch (error) {
    throw new Error("Wrong decryption key. Please check your passphrase.");
  }

  return downloadAndDecryptWithKey(fileId, exportedFileKey, fallbackFilename);
};

// ----------------------------------------------------------------------------------
// RECOVER FILE WITH RECOVERY KEY
// ----------------------------------------------------------------------------------
export const recoverFileWithRecoveryKey = async (fileId, recoveryKeyString, fallbackFilename = "recovered.file") => {
  // 1. Fetch recovery wrapped key from server
  const recoveryData = await getFileRecoveryKeys(fileId);
  if (!recoveryData.recoveryWrappedKey) {
    throw new Error("This file does not have a recovery key configured.");
  }

  // 2. Parse and unwrap
  try {
    const exportedFileKey = await unwrapKeyFromBlob(
      recoveryData.recoveryWrappedKey,
      async (salt) => {
        const result = await deriveRecoveryKey(recoveryKeyString, salt);
        return { derivedKey: result.derivedKey };
      }
    );

    // 3. Download and decrypt
    return downloadAndDecryptWithKey(fileId, exportedFileKey, fallbackFilename);
  } catch (error) {
    if (error.name === 'OperationError') {
      throw new Error("Invalid recovery key. Please check and try again.");
    }
    throw error;
  }
};

// ----------------------------------------------------------------------------------
// RECOVER FILE WITH VAULT PIN
// ----------------------------------------------------------------------------------
export const recoverFileWithPin = async (fileId, pin, fallbackFilename = "recovered.file") => {
  // 1. Verify PIN against server
  const verifyResult = await verifyVaultPinForFile(pin);
  if (!verifyResult.valid) {
    throw new Error("Invalid Vault PIN.");
  }

  // 2. Fetch pin wrapped key from server
  const recoveryData = await getFileRecoveryKeys(fileId);
  if (!recoveryData.pinWrappedKey) {
    throw new Error("This file does not have PIN recovery configured.");
  }

  // 3. Parse and unwrap
  try {
    const exportedFileKey = await unwrapKeyFromBlob(
      recoveryData.pinWrappedKey,
      async (salt) => {
        const result = await derivePinKey(pin, salt);
        return { derivedKey: result.derivedKey };
      }
    );

    // 4. Download and decrypt
    return downloadAndDecryptWithKey(fileId, exportedFileKey, fallbackFilename);
  } catch (error) {
    if (error.name === 'OperationError') {
      throw new Error("PIN recovery failed. Key mismatch.");
    }
    throw error;
  }
};

// ----------------------------------------------------------------------------------
// DELETE FILE
// ----------------------------------------------------------------------------------
export const deleteFile = async (fileId) => {
  const response = await api.delete(`/files/${fileId}`);
  return response.data;
};

// ----------------------------------------------------------------------------------
// GET FILE VERSIONS
// ----------------------------------------------------------------------------------
export const getFileVersions = async (fileId) => {
  const response = await api.get(`/files/${fileId}/versions`);
  return response.data;
};

// ----------------------------------------------------------------------------------
// SHARE FILE (RSA Key Wrapping — frontend crypto)
// ----------------------------------------------------------------------------------
export const shareFile = async (fileId, recipientEmail, rawPassphrase) => {
  const senderPassphrase = rawPassphrase.trim();
  if (!fileId || !recipientEmail || !senderPassphrase) {
    throw new Error("File ID, recipient email and passphrase are required");
  }

  // 1. Get recipient's RSA public key
  const userRes = await api.get(`/auth/public-key/${recipientEmail}`);
  const recipientPublicKeyStr = userRes.data.publicKey;
  if (!recipientPublicKeyStr) {
    throw new Error(`${recipientEmail} has no RSA public key. They must register again.`);
  }

  // 2. Get sender's wrapped key for this file
  const filesList = await getMyFiles();
  const fileMeta = filesList.find(f => f._id === fileId);

  if (!fileMeta || !fileMeta.wrappedKey) {
    throw new Error("This file was uploaded before the new encryption system. Please delete it and upload again to enable sharing.");
  }

  // 3. Decode sender's wrapped key
  const myWrappedKeyBytes = base64ToUint8(fileMeta.wrappedKey);
  const masterSalt = myWrappedKeyBytes.slice(0, 16);
  const wrapIv = myWrappedKeyBytes.slice(16, 28);
  const encryptedFileKey = myWrappedKeyBytes.slice(28);

  // 4. Derive sender's Master Key from passphrase
  const { masterKey } = await deriveMasterKeyAndSalt(senderPassphrase, masterSalt);

  // 5. Unwrap the file's AES key
  let exportedFileKey;
  try {
    const exportedFileKeyBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: wrapIv }, masterKey, encryptedFileKey
    );
    exportedFileKey = new Uint8Array(exportedFileKeyBuffer);
  } catch (error) {
    throw new Error("Incorrect passphrase. Cannot unlock the file key.");
  }

  // 6. Import recipient's RSA Public Key
  const binaryDer = base64ToUint8(recipientPublicKeyStr);
  const rsaPublicKey = await crypto.subtle.importKey(
    "spki", binaryDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true, ["encrypt"]
  );

  // 7. Wrap file's AES key with recipient's RSA Public Key
  const rsaWrappedKeyBuffer = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" }, rsaPublicKey, exportedFileKey
  );
  const rsaWrappedKeyStr = uint8ToBase64(new Uint8Array(rsaWrappedKeyBuffer));

  // 8. Send to server
  const response = await api.post("/files/share", {
    fileId,
    recipientEmail,
    wrappedKey: rsaWrappedKeyStr
  });

  return response.data;
};

// ----------------------------------------------------------------------------------
// GET SHARED FILES
// ----------------------------------------------------------------------------------
export const getSharedFiles = async () => {
  const response = await api.get("/files/shared-with-me");
  return response.data;
};

// ----------------------------------------------------------------------------------
// DOWNLOAD SHARED FILE
// ----------------------------------------------------------------------------------
export const downloadSharedFile = async (
  fileId,
  sharedWrappedKeyStr,
  userPassword,
  fallbackFilename = "shared.file"
) => {
  // 1. Get encrypted RSA Private Key from server
  const privateKeyRes = await api.get('/auth/my-private-key');
  const encryptedPrivKeyStr = privateKeyRes.data.privateKey;
  if (!encryptedPrivKeyStr) {
    throw new Error("You do not have a registered RSA private key.");
  }

  // 2. Decode private key bundle: salt(16) + iv(12) + ciphertext
  const combinedPrivKeyBytes = base64ToUint8(encryptedPrivKeyStr);
  const privSalt = combinedPrivKeyBytes.slice(0, 16);
  const privIv = combinedPrivKeyBytes.slice(16, 28);
  const privCiphertext = combinedPrivKeyBytes.slice(28);

  // 3. Derive decryption key using 100,000 iterations (matches Register.js)
  const privDerivationKey = await derivePrivateKeyDecryptionKey(userPassword, privSalt);

  // 4. Decrypt the RSA private key
  let decryptedPrivKeyStr;
  try {
    const decryptedPrivKeyBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: privIv },
      privDerivationKey,
      privCiphertext
    );
    decryptedPrivKeyStr = new TextDecoder().decode(decryptedPrivKeyBuf);
  } catch (error) {
    throw new Error("Wrong account password. Cannot unlock your private key.");
  }

  // 5. Import RSA Private Key
  const binaryPrivDer = base64ToUint8(decryptedPrivKeyStr);
  const rsaPrivateKey = await crypto.subtle.importKey(
    "pkcs8", binaryPrivDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false, ["decrypt"]
  );

  // 6. Unwrap AES file key using RSA Private Key
  const rsaWrappedKeyBytes = base64ToUint8(sharedWrappedKeyStr);

  let exportedFileKey;
  try {
    const exportedFileKeyBuffer = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" }, rsaPrivateKey, rsaWrappedKeyBytes
    );
    exportedFileKey = new Uint8Array(exportedFileKeyBuffer);
  } catch (error) {
    if (error.name === "DataError" || error.name === "OperationError") {
      throw new Error("Failed to unwrap file key. Your RSA private key does not match the one used to share this file. This usually happens if you regenerated your security keys after the file was shared.");
    }
    throw new Error("Failed to unwrap file key. The share may be corrupted or was created for a different security key.");
  }

  // 7. Download and decrypt
  return downloadAndDecryptWithKey(fileId, exportedFileKey, fallbackFilename);
};