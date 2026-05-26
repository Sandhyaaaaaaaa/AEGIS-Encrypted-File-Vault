# Quick Reference Guide

## 🚀 Start Everything

```bash
# Terminal 1 - Backend
cd EncryptedFileVault/backend
npm start

# Terminal 2 - Frontend  
cd phase1/frontend
npm start

# MongoDB should already be running
```

---

## 📁 Key Files Created

### Frontend Connection Files
```
phase1/frontend/src/
├── config/
│   └── api.js                    ← Axios setup with JWT interceptors
├── services/
│   ├── authService.js            ← Login, Register, Logout
│   └── fileService.js            ← Upload, Download, List files
└── pages/
    └── MyFiles.js                ← NEW - File management page
```

### Updated Frontend Files
```
phase1/frontend/src/
├── pages/
│   ├── Login.js                  ← Connected to backend
│   ├── Register.js               ← Connected to backend
│   ├── Dashboard.js              ← Fetches real data
│   └── Upload.js                 ← Uploads to backend
├── components/
│   └── Navbar.js                 ← Added logout & auth menu
└── App.js                        ← Added MyFiles route
```

---

## 🔌 Connection Points

### Frontend → Backend
```javascript
// Base URL
http://localhost:5000/api

// Authentication
POST /api/auth/register  → Register new user
POST /api/auth/login     → Login user

// File Operations (Protected)
POST /api/files/upload      → Upload & encrypt file
GET  /api/files/myfiles     → Get user's files
GET  /api/files/download/:id → Download & decrypt file
```

### Authentication Flow
```
1. User logs in
2. Backend returns JWT token
3. Frontend stores token in localStorage
4. All API requests include: Authorization: Bearer <token>
5. Backend verifies token before processing
```

---

## 🔐 Security Features

| Feature | Technology | Location |
|---------|-----------|----------|
| Password Hashing | bcrypt | Backend - User model |
| Authentication | JWT | Backend - authMiddleware |
| File Encryption | AES-256-CBC | Backend - cryptoUtil |
| File Integrity | SHA-256 | Backend - cryptoUtil |
| API Protection | JWT Middleware | Backend - routes |

---

## 📊 Data Flow

### Upload File
```
User selects file + key
    ↓
Upload.js
    ↓
fileService.uploadFile()
    ↓
POST /api/files/upload (with JWT)
    ↓
Backend encrypts file
    ↓
Saves to uploads/enc-filename
    ↓
Stores metadata in MongoDB
    ↓
Returns success
```

### Download File
```
User clicks download
    ↓
MyFiles.js
    ↓
User enters decryption key
    ↓
fileService.downloadFile()
    ↓
GET /api/files/download/:id (with JWT)
    ↓
Backend decrypts file
    ↓
Verifies integrity
    ↓
Returns file blob
    ↓
Browser downloads file
```

---

## 🧪 Quick Test

### 1. Register
```
URL: http://localhost:3000/register
Input: username, email, password
Expected: Redirect to dashboard
```

### 2. Upload File
```
URL: http://localhost:3000/upload
Input: file + encryption key
Expected: Success message
```

### 3. View Files
```
URL: http://localhost:3000/myfiles
Expected: See uploaded file
```

### 4. Download File
```
Action: Click download button
Input: Same encryption key
Expected: File downloads and opens correctly
```

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| CORS Error | Check backend is running on port 5000 |
| 401 Error | Re-login to get new JWT token |
| Upload Fails | Ensure encryption key is provided |
| Download Fails | Use same key as upload |
| MongoDB Error | Start MongoDB service |

---

## 📝 Environment Setup

### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/encrypted_vault
JWT_SECRET=supersecretkey123
```

### Frontend (api.js)
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

---

## 🎯 What's Connected

✅ User Registration → Backend API
✅ User Login → Backend API  
✅ JWT Authentication → All protected routes
✅ File Upload → Backend with encryption
✅ File List → Backend database
✅ File Download → Backend with decryption
✅ Logout → Clear localStorage
✅ Protected Routes → Auto-redirect to login
✅ Error Handling → User-friendly messages
✅ Loading States → Better UX

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| SETUP_GUIDE.md | Complete setup instructions |
| CONNECTION_SUMMARY.md | Detailed connection info |
| START_SERVERS.md | Quick start guide |
| ARCHITECTURE_MAP.md | System architecture diagrams |
| CONNECTION_CHECKLIST.md | Testing checklist |
| QUICK_REFERENCE.md | This file |

---

## 🎨 Tech Stack

### Frontend
- React 19.2.0
- Material-UI 7.3.4
- Axios 1.12.2
- React Router 7.9.4

### Backend
- Express 5.1.0
- MongoDB (Mongoose 8.19.3)
- JWT (jsonwebtoken 9.0.2)
- bcrypt 3.0.3
- Multer 2.0.2

---

## 💡 Key Concepts

### JWT Token
- Stored in localStorage
- Sent with every protected request
- Expires in 7 days
- Contains user ID and role

### File Encryption
- AES-256-CBC algorithm
- User provides encryption key
- Key NOT stored in database
- Each file can have different key

### File Integrity
- SHA-256 hash created on upload
- Verified on download
- Detects file tampering
- Ensures data integrity

---

## 🔄 Request Headers

### Authentication Requests
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Protected Requests
```http
GET /api/files/myfiles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### File Upload
```http
POST /api/files/upload
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data

FormData:
  - file: [File object]
  - encryptionKey: "mySecretKey123"
```

---

## 📦 localStorage Structure

```javascript
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

## 🗄️ Database Collections

### users
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  role: String,
  createdAt: Date
}
```

### files
```javascript
{
  _id: ObjectId,
  filename: String,
  encryptedName: String,
  path: String,
  user: ObjectId (ref: User),
  hash: String,
  iv: String,
  uploadDate: Date
}
```

---

## ⚡ Performance Tips

- Small files (< 10MB) work best
- Large files may need timeout adjustments
- Use compression for better performance
- Clear browser cache if issues occur

---

## 🔒 Security Best Practices

✅ Never commit .env files
✅ Use strong JWT secrets in production
✅ Use HTTPS in production
✅ Implement rate limiting
✅ Add file size limits
✅ Validate file types
✅ Use strong encryption keys
✅ Regularly rotate JWT secrets

---

## 🎉 Success Indicators

### Backend Running
```
🚀 Server running on port 5000
✅ MongoDB Connected
```

### Frontend Running
```
Compiled successfully!
Local: http://localhost:3000
```

### Working Connection
- ✅ Can register new user
- ✅ Can login successfully
- ✅ Dashboard shows user data
- ✅ Can upload files
- ✅ Can view file list
- ✅ Can download files
- ✅ Can logout

---

## 📞 Support

If you encounter issues:
1. Check both terminal windows for errors
2. Check browser console (F12)
3. Verify MongoDB is running
4. Review documentation files
5. Check CONNECTION_CHECKLIST.md

---

## 🚀 You're All Set!

Your frontend and backend are now fully connected. Start both servers and begin using your Encrypted File Vault!

**Happy Encrypting! 🔐**
