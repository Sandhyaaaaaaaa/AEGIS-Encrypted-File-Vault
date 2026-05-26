# Encrypted File Vault - Setup Guide

## Project Overview
This is a full-stack MERN application for secure file storage with AES encryption, hash verification, and JWT authentication.

## Architecture
- **Backend**: Node.js + Express + MongoDB (Port 5000)
- **Frontend**: React + Material-UI (Port 3000)
- **Security**: AES-256 encryption, SHA-256 hashing, JWT authentication

---

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn

---

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd EncryptedFileVault/backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
The `.env` file is already configured with:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/encrypted_vault
JWT_SECRET=supersecretkey123
```

**Important**: Make sure MongoDB is running on your local machine at port 27017.

### 4. Start MongoDB
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 5. Start Backend Server
```bash
npm start
# or for development with auto-reload
npm run dev
```

Backend should now be running at: `http://localhost:5000`

---

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd phase1/frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Frontend Development Server
```bash
npm start
```

Frontend should now be running at: `http://localhost:3000`

---

## API Endpoints

### Authentication
- **POST** `/api/auth/register` - Register new user
  - Body: `{ username, email, password }`
  
- **POST** `/api/auth/login` - Login user
  - Body: `{ email, password }`

### File Operations (Protected Routes)
- **POST** `/api/files/upload` - Upload and encrypt file
  - Headers: `Authorization: Bearer <token>`
  - Body: FormData with `file` and `encryptionKey`
  
- **GET** `/api/files/myfiles` - Get user's files
  - Headers: `Authorization: Bearer <token>`
  
- **GET** `/api/files/download/:id` - Download and decrypt file
  - Headers: `Authorization: Bearer <token>`
  - Query: `?encryptionKey=<key>`

---

## Frontend Routes

- `/` - Login page
- `/register` - Registration page
- `/dashboard` - User dashboard (protected)
- `/upload` - File upload page (protected)
- `/myfiles` - View and download files (protected)
- `/ai-advisor` - AI security advisor (protected)
- `/about` - About page
- `/contact` - Contact page
- `/feedback` - Feedback page
- `/forgot-password` - Password recovery

---

## How to Use

### 1. Register a New Account
- Go to `http://localhost:3000/register`
- Enter username, email, and password
- Click "Register"

### 2. Login
- Go to `http://localhost:3000/`
- Enter email and password
- Click "Login"

### 3. Upload a File
- Navigate to "Upload" from the navbar
- Select a file
- Enter an encryption key (remember this!)
- Click "Upload & Encrypt"

### 4. View Your Files
- Navigate to "My Files" from the navbar
- See all your encrypted files

### 5. Download a File
- Click "Download" on any file
- Enter the encryption key you used during upload
- File will be decrypted and downloaded

---

## Security Features

1. **AES-256 Encryption**: Files are encrypted before storage
2. **SHA-256 Hashing**: File integrity verification
3. **JWT Authentication**: Secure user sessions
4. **Password Hashing**: bcrypt for password security
5. **Protected Routes**: Authentication required for file operations

---

## Project Structure

```
EncryptedFileVault/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT authentication
│   │   ├── errorHandler.js       # Error handling
│   │   └── logger.js             # Request logging
│   ├── models/
│   │   ├── user.js               # User schema
│   │   └── File.js               # File metadata schema
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   └── files.js              # File operation routes
│   ├── utils/
│   │   └── cryptoUtil.js         # Encryption utilities
│   ├── uploads/                  # File storage directory
│   ├── .env                      # Environment variables
│   ├── server.js                 # Express server
│   └── package.json

phase1/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js         # Navigation bar
│   │   │   ├── Sidebar.js        # Sidebar component
│   │   │   └── filecard.js       # File card component
│   │   ├── config/
│   │   │   └── api.js            # Axios configuration
│   │   ├── pages/
│   │   │   ├── Login.js          # Login page
│   │   │   ├── Register.js       # Registration page
│   │   │   ├── Dashboard.js      # Dashboard
│   │   │   ├── Upload.js         # File upload
│   │   │   ├── MyFiles.js        # File management
│   │   │   └── ...               # Other pages
│   │   ├── services/
│   │   │   ├── authService.js    # Authentication API calls
│   │   │   └── fileService.js    # File operation API calls
│   │   ├── App.js                # Main app component
│   │   └── index.js              # Entry point
│   └── package.json
```

---

## Troubleshooting

### Backend Issues

**MongoDB Connection Error**
- Ensure MongoDB is running
- Check the connection string in `.env`
- Try: `mongodb://localhost:27017/encrypted_vault` or `mongodb://127.0.0.1:27017/encrypted_vault`

**Port Already in Use**
- Change the PORT in `.env` file
- Kill the process using port 5000

### Frontend Issues

**CORS Error**
- Backend has CORS enabled, but ensure backend is running
- Check API_BASE_URL in `frontend/src/config/api.js`

**Authentication Issues**
- Clear browser localStorage
- Re-login with valid credentials

**File Upload Fails**
- Ensure encryption key is provided
- Check file size limits
- Verify backend uploads directory exists

---

## Testing the Connection

### Test Backend
```bash
# Test server is running
curl http://localhost:5000/api/auth/login

# Should return: {"message":"Please enter email and password"}
```

### Test Frontend-Backend Connection
1. Open browser console (F12)
2. Try to register/login
3. Check Network tab for API calls
4. Verify requests go to `http://localhost:5000/api/...`

---

## Next Steps

1. Start both backend and frontend servers
2. Register a new account
3. Upload and encrypt a test file
4. Download and verify the file
5. Explore other features

---

## Important Notes

- **Remember your encryption keys!** Files cannot be decrypted without them
- Encryption keys are NOT stored in the database for security
- Each file can have a different encryption key
- Keep your JWT token secure (stored in localStorage)

---

## Support

For issues or questions:
1. Check the console logs (backend and frontend)
2. Verify all dependencies are installed
3. Ensure MongoDB is running
4. Check that both servers are running on correct ports
