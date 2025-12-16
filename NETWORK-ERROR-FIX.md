# 🔧 Network Error Fix - Step by Step Guide

## ✅ Issues Fixed

### 1. CSS Import Order Warning ✓
**Issue:** `@import must precede all other statements`

**Fixed in:** `src/index.css`
- Moved Google Fonts import to the top of the file
- Now @import comes before @tailwind directives

### 2. CORS Configuration ✓
**Issue:** Backend was only allowing `http://localhost:5173` but frontend runs on `http://localhost:8080`

**Fixed in:** 
- `backend/.env` - Added `CLIENT_URL=http://localhost:8080`
- `backend/server.js` - Updated CORS to accept both ports:
  ```javascript
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:8080'],
    credentials: true
  }));
  ```

---

## 🚀 How to Fix the Network Error

### Step 1: Restart Backend Server

**Terminal 1:**
```bash
cd backend
npm start
```

**Expected Output:**
```
🚀 Server is running on http://localhost:5000
✅ MongoDB Connected: ac-oohzoi2-shard-00-00.p0uhjmf.mongodb.net
```

**If you see "Port 5000 already in use":**
```powershell
# Kill existing process
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Then restart
cd backend
npm start
```

### Step 2: Restart Frontend

**Terminal 2:**
```bash
# Stop current process (Ctrl+C)
# Then restart
npm run dev
```

**Expected Output:**
```
VITE v5.4.19  ready in 423 ms
➜  Local:   http://localhost:8080/
```

### Step 3: Clear Browser Cache

1. Open browser DevTools (F12)
2. Right-click on reload button
3. Select "Empty Cache and Hard Reload"
4. Or clear localStorage:
   - Application tab → Local Storage → http://localhost:8080
   - Right-click → Clear

### Step 4: Test Registration

1. Open http://localhost:8080
2. Click "Sign up" or go to `/register`
3. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
4. Click "Create Account"

---

## 🔍 Debugging Network Errors

### Check 1: Backend is Running
```bash
# In browser, open:
http://localhost:5000/api/auth/verify-token
```
**Expected:** 401 Unauthorized (this is good - backend is running)

### Check 2: CORS Headers
Open browser DevTools → Network tab → Try to register

**Look for these headers in the response:**
```
Access-Control-Allow-Origin: http://localhost:8080
Access-Control-Allow-Credentials: true
```

### Check 3: Request Details
In Network tab, click on the failed request:

**Headers tab should show:**
```
Request URL: http://localhost:5000/api/auth/register
Request Method: POST
Status Code: (should be 200, 201, or specific error)
```

**Payload tab should show:**
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

### Check 4: Console Errors
Open browser Console tab and look for:

**CORS Error:**
```
Access to XMLHttpRequest at 'http://localhost:5000/api/auth/register' 
from origin 'http://localhost:8080' has been blocked by CORS policy
```
**Solution:** Make sure backend server restarted after CORS fix

**Network Error:**
```
AxiosError: Network Error
```
**Solution:** Backend is not running or on wrong port

**Connection Refused:**
```
net::ERR_CONNECTION_REFUSED
```
**Solution:** Backend server is not started

---

## 🛠️ Common Solutions

### Solution 1: Check Environment Variables
```bash
# backend/.env should have:
PORT=5000
CLIENT_URL=http://localhost:8080
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
```

### Solution 2: Check Backend Routes
```bash
# In backend/server.js, verify:
app.use('/api/auth', authRoutes);  // Not /auth
```

### Solution 3: Check API Client URL
```typescript
// In src/lib/api.ts, verify:
const API_BASE_URL = 'http://localhost:5000/api';
// Note: /api is included in base URL
```

### Solution 4: MongoDB Connection
If you see "MongoDB connection failed":
```bash
# Check backend/.env
MONGODB_URI=mongodb+srv://vineetvardhan07_db_user:sample2710@cluster0.p0uhjmf.mongodb.net/?appName=Cluster0
```

### Solution 5: Port Conflicts
```powershell
# Check what's using port 5000
Get-NetTCPConnection -LocalPort 5000

# Kill the process
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

---

## 📝 Test Checklist

After restarting both servers:

- [ ] Backend shows "Server is running on http://localhost:5000"
- [ ] Backend shows "MongoDB Connected"
- [ ] Frontend shows "ready in" message
- [ ] Browser opens http://localhost:8080
- [ ] No CORS errors in browser console
- [ ] Registration form appears
- [ ] Can type in all fields
- [ ] Submit button is clickable

---

## 🎯 Quick Test

**Test backend is working:**
```bash
# PowerShell
curl http://localhost:5000/api/auth/verify-token
```
**Expected:** 401 error (this is good!)

**Test registration API:**
```powershell
$headers = @{
    "Content-Type" = "application/json"
}
$body = @{
    name = "Test User"
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5000/api/auth/register -Method POST -Headers $headers -Body $body
```

---

## 💡 Still Having Issues?

### Check Backend Logs
Look at Terminal 1 (backend) for errors:
- MongoDB connection errors
- Route not found errors
- Validation errors

### Check Browser Console
Look for:
- Red error messages
- Network request details
- CORS policy errors

### Common Error Messages

**"Network Error"**
→ Backend not running or wrong URL

**"CORS policy"**
→ Backend CORS not configured for port 8080

**"401 Unauthorized"**
→ Good! Backend is working, just need valid credentials

**"404 Not Found"**
→ Check API route path (should be /api/auth/register)

**"500 Internal Server Error"**
→ Check backend logs for detailed error

**"Failed to fetch"**
→ Backend is not accessible, check if it's running

---

## 🔄 Full Reset (If Nothing Works)

```bash
# Stop all processes (Ctrl+C in both terminals)

# Terminal 1 - Backend
cd backend
rm -rf node_modules
npm install
npm start

# Terminal 2 - Frontend
npm install
npm run dev

# Browser
# Clear all site data in DevTools
# Hard refresh (Ctrl+Shift+R)
```

---

## ✅ Success Indicators

You'll know it's working when:

1. **Backend Terminal shows:**
   ```
   🚀 Server is running on http://localhost:5000
   ✅ MongoDB Connected
   ```

2. **Frontend Terminal shows:**
   ```
   ➜  Local:   http://localhost:8080/
   ```

3. **Browser Console shows:**
   - No red errors
   - Successful POST request to /api/auth/register
   - Status 200 or 201
   - Response with token and user data

4. **After Registration:**
   - Toast notification: "Registration successful!"
   - Automatically redirected to dashboard
   - Can see your name in top right corner

---

**Need more help?** Check the backend terminal logs and browser console for specific error messages!
