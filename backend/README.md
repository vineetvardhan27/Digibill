# Kirana Store Management - Backend API

Backend REST API for the Kirana Store Management System built with Node.js, Express, MongoDB, and JWT authentication.

## 🚀 Features

- ✅ User authentication with JWT tokens
- ✅ Password hashing with bcryptjs
- ✅ MongoDB database with Mongoose ODM
- ✅ Input validation with express-validator
- ✅ CORS enabled for frontend integration
- ✅ Environment-based configuration
- ✅ Automatic supplier statistics calculation
- ✅ Bill tracking with due date management

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn package manager

## 🛠️ Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables:**
   
   Edit the `.env` file with your settings:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/kirana-db
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d
   CLIENT_URL=http://localhost:5173
   ```

## 🗄️ Database Setup

### Option 1: Local MongoDB

1. Install MongoDB locally from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```
3. Use the default URI in `.env`: `mongodb://localhost:27017/kirana-db`

### Option 2: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Add your IP address to the whitelist (or use 0.0.0.0/0 for development)
4. Create a database user
5. Get your connection string and update `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kirana-db?retryWrites=true&w=majority
   ```

## 🏃 Running the Application

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "shopkeeper1",
  "email": "shop@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6578a1b2c3d4e5f6g7h8i9j0",
      "username": "shopkeeper1",
      "email": "shop@example.com",
      "createdAt": "2024-12-12T10:30:00.000Z"
    }
  }
}
```

#### 2. Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "shop@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6578a1b2c3d4e5f6g7h8i9j0",
      "username": "shopkeeper1",
      "email": "shop@example.com",
      "createdAt": "2024-12-12T10:30:00.000Z"
    }
  }
}
```

#### 3. Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "6578a1b2c3d4e5f6g7h8i9j0",
      "username": "shopkeeper1",
      "email": "shop@example.com",
      "createdAt": "2024-12-12T10:30:00.000Z"
    }
  }
}
```

#### 4. Verify Token
```http
POST /api/auth/verify-token
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "message": "Kirana Backend API is running",
  "timestamp": "2024-12-12T10:30:00.000Z"
}
```

## 🔐 Using Protected Routes

For protected routes, include the JWT token in the Authorization header:

```javascript
// Example with fetch
fetch('http://localhost:5000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Example with axios
axios.get('http://localhost:5000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── middleware/
│   └── authMiddleware.js     # JWT authentication middleware
├── models/
│   ├── User.js              # User schema with password hashing
│   ├── Supplier.js          # Supplier schema with auto-calculations
│   └── Bill.js              # Bill schema with supplier stat updates
├── routes/
│   └── auth.js              # Authentication routes
├── .env.example             # Example environment variables
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies and scripts
└── server.js               # Main application entry point
```

## 🗃️ Database Schemas

### User Schema
```javascript
{
  username: String (unique, 3-30 chars),
  email: String (unique, valid email),
  passwordHash: String (hashed with bcrypt),
  timestamps: true
}
```

### Supplier Schema
```javascript
{
  name: String (required),
  phone: String (10 digits),
  address: String,
  createdBy: ObjectId (ref: User),
  totalSpend: Number (auto-calculated),
  pendingAmount: Number (auto-calculated),
  totalBills: Number (auto-calculated),
  lastPurchaseDate: Date,
  timestamps: true
}
```

### Bill Schema
```javascript
{
  supplierId: ObjectId (ref: Supplier),
  amount: Number (required),
  date: Date,
  description: String,
  isPaid: Boolean (default: false),
  dueDate: Date,
  createdBy: ObjectId (ref: User),
  items: [{
    name: String,
    quantity: Number,
    price: Number,
    unit: String
  }],
  imageUrl: String,
  paidDate: Date,
  timestamps: true
}
```

## 🔧 Next Steps

To complete the backend, you should add:

1. **Supplier Routes** (`routes/suppliers.js`)
   - GET /api/suppliers - List all suppliers
   - POST /api/suppliers - Create new supplier
   - GET /api/suppliers/:id - Get single supplier
   - PUT /api/suppliers/:id - Update supplier
   - DELETE /api/suppliers/:id - Delete supplier

2. **Bill Routes** (`routes/bills.js`)
   - GET /api/bills - List all bills
   - POST /api/bills - Create new bill
   - GET /api/bills/:id - Get single bill
   - PUT /api/bills/:id - Update bill
   - PUT /api/bills/:id/pay - Mark bill as paid
   - DELETE /api/bills/:id - Delete bill

3. **Analytics Routes** (`routes/analytics.js`)
   - GET /api/analytics/dashboard - Dashboard statistics
   - GET /api/analytics/monthly - Monthly spending data
   - GET /api/analytics/suppliers - Supplier breakdown

4. **Image Upload** (using multer or similar)

## 🧪 Testing the API

You can test the API using:

1. **Thunder Client** (VS Code extension)
2. **Postman**
3. **cURL**
4. **Your React frontend**

Example cURL command:
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## 🛡️ Security Features

- Password hashing with bcryptjs (10 salt rounds)
- JWT tokens with configurable expiration
- Input validation and sanitization
- CORS configuration
- Environment variable protection
- Sensitive data excluded from JSON responses

## 📝 License

ISC

## 👨‍💻 Author

Kirana Store Management System
