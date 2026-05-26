# Quick Start Guide

## Prerequisites Check
Before starting, ensure:
- ✅ Node.js is installed
- ✅ MongoDB is installed and running
- ✅ Dependencies are installed in both backend and frontend

---

## Step 1: Install Dependencies

### Backend
```bash
cd EncryptedFileVault/backend
npm install
```

### Frontend
```bash
cd phase1/frontend
npm install
```

---

## Step 2: Start MongoDB

### Windows
```cmd
net start MongoDB
```

### macOS/Linux
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### Verify MongoDB is Running
```bash
mongosh
# or
mongo
```

---

## Step 3: Start Backend Server

Open a terminal/command prompt:

```bash
cd EncryptedFileVault/backend
npm start
```

You should see:
```
🚀 Server running on port 5000
✅ MongoDB Connected
```

**Keep this terminal open!**

---

## Step 4: Start Frontend Server

Open a NEW terminal/command prompt:

```bash
cd phase1/frontend
npm start
```

Browser should automatically open to `http://localhost:3000`

**Keep this terminal open too!**

---

## Step 5: Test the Application

1. **Register a new account**
   - Go to http://localhost:3000/register
   - Enter username, email, password
   - Click Register

2. **Login**
   - You'll be redirected to dashboard
   - Or go to http://localhost:3000/

3. **Upload a file**
   - Click "Upload" in navbar
   - Select a file
   - Enter encryption key (e.g., "mySecretKey123")
   - Click "Upload & Encrypt"

4. **View your files**
   - Click "My Files" in navbar
   - See your uploaded files

5. **Download a file**
   - Click "Download" button
   - Enter the same encryption key you used
   - File will be decrypted and downloaded

---

## Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Check if port 5000 is available
- Check `.env` file exists in backend folder

### Frontend won't start
- Check if port 3000 is available
- Try: `npm install` again
- Clear npm cache: `npm cache clean --force`

### Can't login/register
- Check backend terminal for errors
- Open browser console (F12) and check Network tab
- Verify backend is running on port 5000

### File upload fails
- Check if `uploads/` folder exists in backend
- Verify you entered an encryption key
- Check backend terminal for errors

---

## Stopping the Servers

### Stop Backend
- Press `Ctrl + C` in backend terminal

### Stop Frontend
- Press `Ctrl + C` in frontend terminal

### Stop MongoDB (Optional)
```bash
# Windows
net stop MongoDB

# macOS/Linux
sudo systemctl stop mongod
```

---

## Default Ports

- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **MongoDB**: mongodb://localhost:27017

---

## Quick Commands Reference

```bash
# Backend
cd EncryptedFileVault/backend
npm install          # Install dependencies
npm start           # Start server
npm run dev         # Start with nodemon (auto-reload)

# Frontend
cd phase1/frontend
npm install          # Install dependencies
npm start           # Start development server
npm run build       # Build for production

# MongoDB
net start MongoDB    # Windows - Start
net stop MongoDB     # Windows - Stop
mongosh             # Connect to MongoDB shell
```

---

## Environment Variables

Backend `.env` file:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/encrypted_vault
JWT_SECRET=supersecretkey123
```

Frontend API URL (in `src/config/api.js`):
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

---

## Success Indicators

### Backend Running Successfully
```
🚀 Server running on port 5000
✅ MongoDB Connected
```

### Frontend Running Successfully
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

### MongoDB Running Successfully
```bash
mongosh
# Should connect without errors
```

---

## First Time Setup Checklist

- [ ] Node.js installed
- [ ] MongoDB installed
- [ ] Backend dependencies installed (`npm install`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] MongoDB service started
- [ ] Backend server started (port 5000)
- [ ] Frontend server started (port 3000)
- [ ] Browser opened to http://localhost:3000
- [ ] Test registration works
- [ ] Test login works
- [ ] Test file upload works
- [ ] Test file download works

---

## Need Help?

1. Check both terminal windows for error messages
2. Check browser console (F12) for frontend errors
3. Verify all services are running
4. Review SETUP_GUIDE.md for detailed instructions
5. Review CONNECTION_SUMMARY.md for architecture details
