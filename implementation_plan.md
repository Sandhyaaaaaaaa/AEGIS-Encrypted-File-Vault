# Goal Description

Restore all Phase 1 and Phase 2 features for the AEGIS Secure File Vault project. The UI components already exist but all backend logic and frontend service functions need to be carefully rebuilt from scratch based on the user's explicit requirements.

## User Review Required

Please review the proposed plan to ensure all requirements and file paths are correctly captured. The frontend is located at `D:\EncryptedFileVault\EncryptedFileVault\MCA Pro\phase1\frontend` and the backend is located at `D:\EncryptedFileVault\EncryptedFileVault\MCA Pro\EncryptedFileVault\backend`. 

## Open Questions

- Should I install the required npm packages (e.g. `express`, `mongoose`, `speakeasy`, etc.) on both frontend and backend automatically during the execution phase?
- Will you be running `npm start` / `npm run dev` or should I start the application after making all the code changes to verify it works?

## Proposed Changes

### Backend - Configuration & Utils
#### [MODIFY] backend/server.js
#### [MODIFY] backend/config/db.js
#### [MODIFY] backend/utils/auditHelper.js
#### [MODIFY] backend/utils/cryptoUtil.js

### Backend - Models
Ensure we use `mongoose.models.ModelName || mongoose.model(...)` to prevent overwrite errors.
#### [MODIFY] backend/models/User.js
#### [MODIFY] backend/models/File.js
#### [MODIFY] backend/models/AuditLog.js
#### [MODIFY] backend/models/SharedFile.js

### Backend - Middleware
#### [MODIFY] backend/middleware/authMiddleware.js
#### [NEW] backend/middleware/errorHandler.js

### Backend - Routes
Follow strictly the route order specified: POST /upload, GET /myfiles, POST /share, GET /shared-with-me, GET /download/:id, GET /:id/versions, GET /:id/recovery-key, DELETE /:id.
#### [MODIFY] backend/routes/auth.js
#### [MODIFY] backend/routes/files.js
#### [MODIFY] backend/routes/logs.js
#### [MODIFY] backend/routes/admin.js

### Frontend - Configuration & Services
#### [MODIFY] frontend/src/config/api.js
#### [MODIFY] frontend/src/services/authService.js
#### [MODIFY] frontend/src/services/fileService.js

### Frontend - Pages & Components
Hook up the newly built frontend services to the existing UI components. Provide correct implementations for all authentication, file encryption/decryption, sharing, MFA, and recovery logic as defined in the Phase 1 and 2 specs.
#### [MODIFY] frontend/src/pages/Login.js
#### [MODIFY] frontend/src/pages/Register.js
#### [MODIFY] frontend/src/pages/MFASetup.js
#### [MODIFY] frontend/src/pages/Dashboard.js
#### [MODIFY] frontend/src/pages/AdminDashboard.js
#### [MODIFY] frontend/src/pages/MyFiles.js
#### [MODIFY] frontend/src/pages/Upload.js
#### [MODIFY] frontend/src/pages/SharedFiles.js
#### [MODIFY] frontend/src/pages/Settings.js
#### [MODIFY] frontend/src/pages/About.js
#### [MODIFY] frontend/src/pages/Feedback.js
#### [MODIFY] frontend/src/components/Navbar.js
#### [MODIFY] frontend/src/App.js

## Verification Plan

### Automated Tests
- Review code changes for syntax errors.

### Manual Verification
- Start the MongoDB server and backend.
- Start the React frontend.
- Verify user registration (RSA key pair generation in browser).
- Verify login, MFA setup, and MFA validation.
- Verify file upload (AES-256-GCM encryption with derived master key).
- Verify file download (decryption).
- Verify file sharing (RSA wrapped keys).
- Verify admin panel and audit logs.
