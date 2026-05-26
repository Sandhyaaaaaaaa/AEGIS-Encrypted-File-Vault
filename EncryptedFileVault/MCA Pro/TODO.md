## TODO: Settings/Profile Enhancements (Approved Plan)

### Plan Summary
- Backend: Add `/change-password` (POST) & `/delete-account` (DELETE) to auth.js
- Frontend: Add `changePassword()` & `deleteAccount()` to authService.js  
- Frontend Settings.js: Already fully implemented ✅

## COMPLETED ✅

**Final Status:** All steps done successfully!

### Completed Steps:
- [x] 0. User approved plan
- [x] 1. Create TODO.md 
- [x] 2. Read File.js model (confirmed: uses `owner` field)
- [x] 3. Edit backend/routes/auth.js (added `/change-password` PUT & `/delete-account` DELETE)
- [x] 4. Edit frontend/services/authService.js (added `changePassword()` & `deleteAccount()`)
- [x] 5. Verified integration (Settings.js already uses exact API calls)

### Changes Made:
1. **Backend `auth.js`**: 
   - ✅ Added `PUT /change-password`: bcrypt verify current → hash new → audit
   - ✅ Added `DELETE /delete-account`: delete files (`owner: userId`) + user → audit
   
2. **Frontend `authService.js`**:
   - ✅ Added `changePassword(current, new)`
   - ✅ Added `deleteAccount()`

3. **Frontend Settings.js**: Already perfect! 
   - Profile Info ✅ read-only
   - Change Password ✅ form+validation+API 
   - MFA Toggle ✅ OTP confirm+existing flows
   - Danger Zone ✅ username confirm+API+logout

**Test Instructions:**
```
# Backend (restart if running)
cd "EncryptedFileVault/backend"
npm start

# Frontend (restart if running)  
cd "phase1/frontend"
npm start

# Test flow:
1. Login → /settings
2. Change password (wrong current → error | correct → success)
3. Toggle MFA disable (OTP → success)
4. Delete account (wrong name → error | correct → deleted+logout)
```

**No new deps/installs needed.** Everything reuses existing bcrypt/jwt/protect/auditHelper/File model.

Task complete - no breaking changes to auth/routing/UI!

