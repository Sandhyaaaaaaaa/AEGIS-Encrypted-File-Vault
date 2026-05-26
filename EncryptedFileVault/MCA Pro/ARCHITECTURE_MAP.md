# Architecture & Connection Map

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                     http://localhost:3000                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ React Frontend
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      FRONTEND LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Pages      │  │  Components  │  │   Services   │          │
│  │              │  │              │  │              │          │
│  │ - Login      │  │ - Navbar     │  │ - authService│          │
│  │ - Register   │  │ - Sidebar    │  │ - fileService│          │
│  │ - Dashboard  │  │ - FileCard   │  │              │          │
│  │ - Upload     │  │              │  │              │          │
│  │ - MyFiles    │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────┬───────┘          │
│                                              │                   │
│                    ┌─────────────────────────▼─────────┐        │
│                    │      API Configuration            │        │
│                    │   (axios with interceptors)       │        │
│                    │   Base: http://localhost:5000/api │        │
│                    └─────────────────────────┬─────────┘        │
└──────────────────────────────────────────────┼──────────────────┘
                                               │
                                               │ HTTP Requests
                                               │ (JSON/FormData)
                                               │
┌──────────────────────────────────────────────▼──────────────────┐
│                      BACKEND LAYER                               │
│                   http://localhost:5000                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Express.js Server                         │    │
│  │  - CORS enabled                                        │    │
│  │  - JSON body parser                                    │    │
│  │  - Request logger                                      │    │
│  │  - Error handler                                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                     │
│  ┌────────────────────────▼──────────────────────────────┐    │
│  │              Middleware Layer                          │    │
│  │  - authMiddleware (JWT verification)                  │    │
│  │  - errorHandler (Global error handling)               │    │
│  │  - logger (Request logging)                           │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                     │
│  ┌────────────────────────▼──────────────────────────────┐    │
│  │              Routes Layer                              │    │
│  │                                                        │    │
│  │  /api/auth/                                           │    │
│  │    - POST /register                                   │    │
│  │    - POST /login                                      │    │
│  │                                                        │    │
│  │  /api/files/ (Protected)                             │    │
│  │    - POST /upload                                     │    │
│  │    - GET /myfiles                                     │    │
│  │    - GET /download/:id                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                     │
│  ┌────────────────────────▼──────────────────────────────┐    │
│  │              Utils Layer                               │    │
│  │  - cryptoUtil (AES encryption/decryption)             │    │
│  │  - File hashing (SHA-256)                             │    │
│  │  - Integrity verification                             │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                     │
│  ┌────────────────────────▼──────────────────────────────┐    │
│  │              Models Layer                              │    │
│  │  - User (username, email, password, role)             │    │
│  │  - File (filename, path, hash, iv, user)              │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               │ Mongoose ODM
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                      DATABASE LAYER                               │
│                         MongoDB                                   │
│                mongodb://localhost:27017/encrypted_vault          │
│                                                                   │
│  Collections:                                                     │
│  - users (user accounts)                                          │
│  - files (file metadata)                                          │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                      FILE SYSTEM                                   │
│              EncryptedFileVault/backend/uploads/                   │
│                                                                    │
│  - Original files (temporary)                                      │
│  - Encrypted files (permanent storage)                             │
└───────────────────────────────────────────────────────────────────┘
```

---

## Request Flow Diagrams

### 1. User Registration Flow

```
User (Browser)
    │
    │ 1. Fill registration form
    │    (username, email, password)
    ▼
Register.js
    │
    │ 2. Call authService.register()
    ▼
authService.js
    │
    │ 3. POST /api/auth/register
    │    Body: { username, email, password }
    ▼
api.js (axios)
    │
    │ 4. HTTP Request
    ▼
Backend Server (Express)
    │
    │ 5. Route: /api/auth/register
    ▼
auth.js (routes)
    │
    │ 6. Validate input
    │ 7. Check if user exists
    ▼
User Model
    │
    │ 8. Hash password (bcrypt)
    │ 9. Create user in MongoDB
    ▼
MongoDB
    │
    │ 10. User saved
    ◄────┘
    │
    │ 11. Generate JWT token
    ▼
Response
    │
    │ 12. { user, token, message }
    ▼
authService.js
    │
    │ 13. Store token in localStorage
    │ 14. Store user in localStorage
    ▼
Register.js
    │
    │ 15. Redirect to /dashboard
    ▼
Dashboard.js (Rendered)
```

### 2. File Upload Flow

```
User (Browser)
    │
    │ 1. Select file + enter encryption key
    ▼
Upload.js
    │
    │ 2. Call fileService.uploadFile()
    ▼
fileService.js
    │
    │ 3. Create FormData
    │    - file: File object
    │    - encryptionKey: string
    │
    │ 4. POST /api/files/upload
    │    Headers: { Authorization: Bearer <token> }
    ▼
api.js (axios interceptor)
    │
    │ 5. Add JWT token to headers
    ▼
Backend Server (Express)
    │
    │ 6. authMiddleware.protect()
    │    - Verify JWT token
    │    - Attach user to req.user
    ▼
files.js (routes)
    │
    │ 7. multer saves file temporarily
    │    uploads/timestamp-filename.ext
    ▼
cryptoUtil.js
    │
    │ 8. encryptFile()
    │    - Read original file
    │    - Encrypt with AES-256
    │    - Save to uploads/enc-filename
    │
    │ 9. generateFileHash()
    │    - Create SHA-256 hash
    ▼
File Model
    │
    │ 10. Save metadata to MongoDB
    │     - filename
    │     - encryptedName
    │     - path
    │     - hash
    │     - iv (initialization vector)
    │     - user (reference)
    ▼
MongoDB
    │
    │ 11. Metadata saved
    ◄────┘
    │
    │ 12. Delete original unencrypted file
    ▼
Response
    │
    │ 13. { success, message, fileId, hash }
    ▼
Upload.js
    │
    │ 14. Show success message
    ▼
User sees confirmation
```

### 3. File Download Flow

```
User (Browser)
    │
    │ 1. Click download button
    ▼
MyFiles.js
    │
    │ 2. Show dialog for decryption key
    │ 3. User enters key
    │
    │ 4. Call fileService.downloadFile()
    ▼
fileService.js
    │
    │ 5. GET /api/files/download/:id
    │    Query: ?encryptionKey=xxx
    │    Headers: { Authorization: Bearer <token> }
    ▼
Backend Server (Express)
    │
    │ 6. authMiddleware.protect()
    ▼
files.js (routes)
    │
    │ 7. Find file in MongoDB by ID
    ▼
File Model
    │
    │ 8. Get file metadata
    ◄────┘
    │
    │ 9. Check user owns file
    ▼
cryptoUtil.js
    │
    │ 10. decryptFile()
    │     - Read encrypted file
    │     - Decrypt with user's key
    │     - Save temporarily
    │
    │ 11. generateFileHash()
    │     - Hash decrypted file
    │
    │ 12. verifyFileIntegrity()
    │     - Compare with stored hash
    ▼
Response
    │
    │ 13. If integrity OK:
    │     - Send file as blob
    │     - Delete temp decrypted file
    │
    │     If integrity FAIL:
    │     - Return error
    │     - Delete temp file
    ▼
MyFiles.js
    │
    │ 14. Create download link
    │ 15. Trigger browser download
    ▼
User receives decrypted file
```

---

## Authentication Flow

### JWT Token Lifecycle

```
1. User Login/Register
   ↓
2. Backend generates JWT
   - Payload: { id: userId, role: userRole }
   - Secret: JWT_SECRET from .env
   - Expiry: 7 days
   ↓
3. Token sent to frontend
   ↓
4. Frontend stores in localStorage
   - Key: 'token'
   - Value: JWT string
   ↓
5. Every API request:
   - axios interceptor adds header
   - Authorization: Bearer <token>
   ↓
6. Backend middleware verifies:
   - Extract token from header
   - Verify with JWT_SECRET
   - Decode user ID
   - Attach user to req.user
   ↓
7. If valid: Continue to route handler
   If invalid: Return 401 Unauthorized
   ↓
8. Frontend interceptor catches 401:
   - Clear localStorage
   - Redirect to login
```

---

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  username: String (required, unique),
  email: String (required, unique),
  password: String (hashed with bcrypt),
  role: String (default: 'user'),
  createdAt: Date
}
```

### File Model
```javascript
{
  _id: ObjectId,
  filename: String (original name),
  encryptedName: String (stored name),
  path: String (file path),
  user: ObjectId (ref: User),
  hash: String (SHA-256 hash),
  iv: String (initialization vector),
  uploadDate: Date
}
```

---

## Security Layers

```
┌─────────────────────────────────────────────┐
│  Layer 1: HTTPS (Production)               │
│  - Encrypted communication                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Layer 2: CORS                              │
│  - Restrict origins                         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Layer 3: JWT Authentication                │
│  - Verify user identity                     │
│  - Token expiration                         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Layer 4: Password Hashing                  │
│  - bcrypt with salt                         │
│  - Never store plain passwords              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Layer 5: File Encryption                   │
│  - AES-256-CBC                              │
│  - User-provided keys                       │
│  - Keys not stored                          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Layer 6: File Integrity                    │
│  - SHA-256 hashing                          │
│  - Verify on download                       │
│  - Detect tampering                         │
└─────────────────────────────────────────────┘
```

---

## File Storage Structure

```
EncryptedFileVault/backend/uploads/
│
├── 1763005878503-hello.txt          (Temporary - deleted after encryption)
│
├── enc-1763005878503-hello.txt      (Encrypted - permanent)
│
├── dec-hello.txt                     (Temporary - deleted after download)
│
└── encrypted/                        (Optional subdirectory)
    └── ...
```

---

## Environment Configuration

### Backend (.env)
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/encrypted_vault
JWT_SECRET=supersecretkey123
```

### Frontend (api.js)
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login user |
| POST | /api/files/upload | Yes | Upload & encrypt file |
| GET | /api/files/myfiles | Yes | Get user's files |
| GET | /api/files/download/:id | Yes | Download & decrypt file |

---

## Frontend Routes Summary

| Route | Component | Protected | Description |
|-------|-----------|-----------|-------------|
| / | Login | No | Login page |
| /register | Register | No | Registration page |
| /dashboard | Dashboard | Yes | User dashboard |
| /upload | Upload | Yes | File upload |
| /myfiles | MyFiles | Yes | File management |
| /ai-advisor | AIAdvisor | Yes | AI security advisor |
| /about | About | No | About page |
| /contact | Contact | No | Contact page |
| /feedback | Feedback | No | Feedback page |
| /forgot-password | ForgotPassword | No | Password recovery |

---

## Technology Stack

### Frontend
- React 19.2.0
- React Router DOM 7.9.4
- Material-UI 7.3.4
- Axios 1.12.2
- Framer Motion 12.23.24

### Backend
- Node.js
- Express 5.1.0
- MongoDB 8.19.3 (Mongoose)
- JWT (jsonwebtoken 9.0.2)
- bcryptjs 3.0.3
- Multer 2.0.2
- CORS 2.8.5

### Security
- AES-256-CBC encryption
- SHA-256 hashing
- JWT authentication
- bcrypt password hashing

---

## Connection Points Summary

✅ Frontend → Backend: axios with base URL
✅ Authentication: JWT tokens in localStorage
✅ Protected Routes: authMiddleware verification
✅ File Upload: FormData with multipart/form-data
✅ File Download: Blob response type
✅ Error Handling: Global interceptors
✅ User State: localStorage persistence
✅ Database: Mongoose O