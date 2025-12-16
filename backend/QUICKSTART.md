# Quick Start Guide - Kirana Backend

## ✅ Setup Complete!

Your backend is ready to run. Here's what has been created:

### 📁 Files Created

1. **Server Setup**
   - `server.js` - Main Express server with CORS and middleware
   - `package.json` - Dependencies and scripts
   - `.env` - Environment configuration
   - `.gitignore` - Git ignore rules

2. **Database**
   - `config/db.js` - MongoDB connection with error handling

3. **Models** (Mongoose Schemas)
   - `models/User.js` - User authentication with password hashing
   - `models/Supplier.js` - Supplier management with auto-calculated stats
   - `models/Bill.js` - Bill tracking with automatic supplier updates

4. **Authentication**
   - `routes/auth.js` - Register, Login, Verify endpoints
   - `middleware/authMiddleware.js` - JWT token verification

5. **Documentation**
   - `README.md` - Complete API documentation

---

## 🚀 Running the Backend

### Step 1: Make sure MongoDB is running

**Option A - Local MongoDB:**
```bash
# Check if MongoDB is running
mongosh
# or
mongo
```

**Option B - MongoDB Atlas:**
- Update the `MONGODB_URI` in `.env` with your Atlas connection string

### Step 2: Start the server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
✅ MongoDB Connected: localhost
🚀 Server running on port 5000 in development mode
```

---

## 🧪 Testing the API

### 1. Health Check
Open your browser or use curl:
```bash
curl http://localhost:5000/api/health
```

### 2. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"shopkeeper\",\"email\":\"shop@test.com\",\"password\":\"test123\"}"
```

### 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"shop@test.com\",\"password\":\"test123\"}"
```

Save the token from the response!

### 4. Get User Info (Protected Route)
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔌 Connecting to React Frontend

In your React app, create an API service:

```javascript
// src/services/api.js
const API_URL = 'http://localhost:5000/api';

export const register = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return response.json();
};

export const login = async (credentials) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return response.json();
};

export const getUser = async (token) => {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

---

## 📝 Available API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Health check | No |
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/verify-token` | Verify token validity | No |

---

## 🎯 Next Steps

1. **Create Supplier Routes** - CRUD operations for suppliers
2. **Create Bill Routes** - CRUD operations for bills
3. **Create Analytics Routes** - Dashboard statistics
4. **Add Image Upload** - For bill receipts
5. **Connect React Frontend** - Replace mock data with API calls

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
❌ Error connecting to MongoDB
```
**Solution:** Make sure MongoDB is running locally or check your Atlas connection string

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Change the PORT in `.env` to another port like 5001

### JWT Secret Warning
**Solution:** Change the JWT_SECRET in `.env` to a strong random string for production

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Introduction](https://jwt.io/introduction)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)

---

Happy Coding! 🎉
