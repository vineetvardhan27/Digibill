# 🛍️ Kirana Management System - Complete Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Frontend Integration](#frontend-integration)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)

---

## 🎯 Overview

A modern, full-stack web application for managing Indian grocery stores (Kirana shops). Built with React, TypeScript, Node.js, Express, and MongoDB.

### Key Highlights
- ✅ **Complete Authentication** - JWT-based with secure password hashing
- ✅ **Supplier Management** - Track suppliers, spending, and pending payments
- ✅ **Bill Management** - Create, track, and mark bills as paid
- ✅ **Real-Time Dashboard** - Live statistics and analytics
- ✅ **Mobile-First Design** - Responsive UI optimized for all devices
- ✅ **RESTful API** - Well-documented backend with MongoDB aggregations

---

## ✨ Features

### 🔐 Authentication & Security
- User registration with email validation
- Secure login with JWT tokens
- Password hashing using bcrypt (10 rounds)
- Protected routes with authentication guards
- Auto-logout on token expiry (7 days)
- Token stored in localStorage

### 👥 Supplier Management
- CRUD operations for suppliers
- Contact details (phone, address, email)
- GST number tracking
- **Auto-calculated statistics:**
  - Total spend (sum of all bills)
  - Total bills count
  - Pending amount (unpaid bills)
- Search and filter suppliers

### 📄 Bill Management
- Create bills with supplier selection
- Set due dates and descriptions
- Mark bills as paid with payment date
- **Automatic updates:**
  - Supplier's total spend increases
  - Pending amount adjusts on payment
  - Bill count updates
- Filter by paid/unpaid status
- Search by supplier or description

### 📊 Dashboard Analytics
- **Hero Stats:**
  - Monthly spend with % change
  - Total spend across all time
  - Total bills count
  - Total suppliers
  - Pending payments alert
  - Payment rate percentage
  
- **Real-Time Calculations:**
  - Month-over-month comparison
  - Payment rate (% of bills paid)
  - Spending trends

### 📈 Advanced Analytics (API Ready)
- Monthly spending charts (last 6 months)
- Supplier breakdown pie charts
- Category-wise spending analysis
- Payment trend tracking
- Due bills notifications (overdue, due soon)
- Upcoming bills calendar

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18 | UI framework |
| TypeScript | Latest | Type safety |
| Vite | 5.4.19 | Build tool |
| Tailwind CSS | Latest | Styling |
| shadcn/ui | Latest | UI components |
| React Router | v6 | Routing |
| Axios | Latest | HTTP client |
| TanStack Query | Latest | Data fetching |
| Lucide React | Latest | Icons |
| Sonner | Latest | Toast notifications |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | v20+ | Runtime |
| Express | 4.18.2 | Web framework |
| MongoDB | Atlas | Database |
| Mongoose | 8.0.3 | ODM |
| JWT | 9.0.2 | Authentication |
| bcryptjs | 2.4.3 | Password hashing |
| express-validator | 7.0.1 | Input validation |

---

## 🚀 Getting Started

### Prerequisites
```bash
Node.js v16 or higher
npm or yarn
MongoDB Atlas account (or local MongoDB)
```

### Quick Start

1. **Clone and Install**
```bash
# Clone repository
git clone <repository-url>
cd Kirana

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

2. **Configure Environment**
```bash
# Create backend/.env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/digibill?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
PORT=5000
CLIENT_URL=http://localhost:5173
```

3. **Start Backend (Terminal 1)**
```bash
cd backend
npm start

# Expected output:
# 🚀 Server is running on http://localhost:5000
# ✅ MongoDB Connected
```

4. **Start Frontend (Terminal 2)**
```bash
npm run dev

# Expected output:
# VITE v5.4.19 ready in 423 ms
# ➜  Local:   http://localhost:8080/
```

5. **Open Browser**
```
http://localhost:8080
```

---

## 📁 Project Structure

```
Kirana/
│
├── backend/                          # Backend API (Node.js + Express)
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT verification
│   ├── models/
│   │   ├── User.js                  # User schema (with bcrypt)
│   │   ├── Supplier.js              # Supplier schema
│   │   └── Bill.js                  # Bill schema (with hooks)
│   ├── routes/
│   │   ├── auth.js                  # Auth endpoints (register, login, me)
│   │   ├── api.js                   # CRUD for Suppliers & Bills
│   │   └── analytics.js             # Dashboard & Analytics endpoints
│   ├── .env                         # Environment variables
│   ├── server.js                    # Express app
│   └── package.json
│
├── src/                              # Frontend (React + TypeScript)
│   ├── components/
│   │   ├── dashboard/               # Dashboard-specific components
│   │   ├── layout/                  # Header, MobileNav
│   │   ├── views/                   # Main view components
│   │   │   ├── DashboardView.tsx   # Dashboard page
│   │   │   ├── SuppliersView.tsx   # Suppliers management
│   │   │   ├── BillsView.tsx       # Bills management
│   │   │   ├── AnalyticsView.tsx   # Analytics (ready)
│   │   │   └── SettingsView.tsx    # Settings
│   │   ├── ui/                      # shadcn UI components (40+ components)
│   │   └── ProtectedRoute.tsx       # Route guard
│   ├── contexts/
│   │   └── AuthContext.tsx          # Auth state management
│   ├── lib/
│   │   ├── api.ts                   # Axios API client (all endpoints)
│   │   ├── utils.ts                 # Utility functions
│   │   └── mockData.ts              # Mock data (deprecated)
│   ├── pages/
│   │   ├── Index.tsx                # Main app with tabs
│   │   ├── Login.tsx                # Login page
│   │   ├── Register.tsx             # Registration page
│   │   └── NotFound.tsx             # 404 page
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces
│   ├── App.tsx                      # App with routing
│   ├── main.tsx                     # React entry point
│   └── index.css                    # Global styles
│
├── Documentation/
│   ├── API-DOCS.md                  # Complete API reference
│   ├── ANALYTICS-DOCS.md            # Analytics API guide
│   ├── FRONTEND-INTEGRATION.md      # Integration details
│   ├── CODE-CHANGES.md              # Code modifications
│   └── QUICKSTART.md                # Quick setup guide
│
├── package.json                      # Frontend dependencies
├── vite.config.ts                    # Vite configuration
├── tailwind.config.ts                # Tailwind setup
└── tsconfig.json                     # TypeScript config
```

---

## 🔌 API Reference

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "657...",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Supplier Endpoints

#### Get All Suppliers
```http
GET /suppliers
Authorization: Bearer <token>
Query Params: ?search=text&sortBy=name&order=asc&page=1&limit=10
```

#### Create Supplier
```http
POST /suppliers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Sharma Trading Co.",
  "phone": "9876543210",
  "address": "Chandni Chowk, Delhi",
  "email": "sharma@example.com",
  "gstNumber": "29ABCDE1234F1Z5"
}
```

### Bill Endpoints

#### Get All Bills
```http
GET /bills
Authorization: Bearer <token>
Query Params: ?supplierId=657...&isPaid=false&startDate=2024-01-01&endDate=2024-12-31
```

#### Create Bill
```http
POST /bills
Authorization: Bearer <token>

{
  "supplierId": "657abc123...",
  "amount": 12500,
  "date": "2024-12-12",
  "dueDate": "2024-12-27",
  "description": "Rice, Dal, Sugar supplies"
}
```

#### Mark Bill as Paid
```http
PUT /bills/:id/pay
Authorization: Bearer <token>

{
  "paidDate": "2024-12-12"
}
```

### Dashboard Endpoint

#### Get Dashboard Stats
```http
GET /dashboard/stats
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "stats": {
      "totalSpend": 395000,
      "totalBills": 145,
      "totalSuppliers": 5,
      "pendingPayments": 28900,
      "monthlySpend": 42700,
      "monthlyChange": 12.5,
      "paymentRate": 96.55
    }
  }
}
```

**📚 Full API Documentation:** See [API-DOCS.md](./backend/API-DOCS.md)

---

## 🔗 Frontend Integration

### Authentication Flow

```typescript
// 1. Login
import { useAuth } from '@/contexts/AuthContext';

const { login } = useAuth();
await login('john@example.com', 'password123');
// Token automatically stored in localStorage

// 2. Protected Routes
<ProtectedRoute>
  <DashboardView />
</ProtectedRoute>

// 3. Logout
const { logout } = useAuth();
logout(); // Clears token and redirects to login
```

### API Client Usage

```typescript
import { supplierAPI, billAPI, dashboardAPI } from '@/lib/api';

// Create supplier
const response = await supplierAPI.createSupplier({
  name: 'Sharma Trading Co.',
  phone: '9876543210',
  address: 'Delhi'
});

// Get bills
const bills = await billAPI.getBills({
  sortBy: 'date',
  order: 'desc'
});

// Get dashboard stats
const stats = await dashboardAPI.getStats();
```

### State Management

```typescript
// Using React hooks with API
const [suppliers, setSuppliers] = useState<Supplier[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await supplierAPI.getSuppliers();
      setSuppliers(response.data.suppliers);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

**📚 Full Integration Guide:** See [FRONTEND-INTEGRATION.md](./FRONTEND-INTEGRATION.md)

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Port 5000 Already in Use
```powershell
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

#### 2. MongoDB Connection Failed
- Check `.env` file in backend folder
- Verify `MONGODB_URI` is correct
- Ensure internet connection
- Whitelist your IP in MongoDB Atlas

#### 3. CORS Errors
```javascript
// backend/server.js
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080'],
  credentials: true
}));
```

#### 4. Token Expired
- Clear localStorage in browser DevTools
- Log in again
- Check JWT_SECRET in `.env`

#### 5. API Requests Fail
1. Check backend is running (port 5000)
2. Open browser console for errors
3. Check Network tab in DevTools
4. Verify API_BASE_URL in `src/lib/api.ts`

### Debug Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 8080
- [ ] MongoDB connected (check terminal)
- [ ] `.env` file exists in backend/
- [ ] Token present in localStorage
- [ ] CORS configured correctly
- [ ] All dependencies installed

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [API-DOCS.md](./backend/API-DOCS.md) | Complete API reference with examples |
| [ANALYTICS-DOCS.md](./backend/ANALYTICS-DOCS.md) | Analytics endpoints & MongoDB aggregations |
| [FRONTEND-INTEGRATION.md](./FRONTEND-INTEGRATION.md) | Frontend-backend integration guide |
| [CODE-CHANGES.md](./CODE-CHANGES.md) | Detailed code modifications |
| [QUICKSTART.md](./QUICKSTART.md) | Quick setup and testing guide |

---

## 🎓 Learn More

### Key Concepts

**JWT Authentication:**
- Token generated on login
- Stored in localStorage
- Sent with every API request
- Verified by middleware
- Expires after 7 days

**MongoDB Aggregations:**
- Dashboard stats use aggregation pipelines
- Automatic calculations for supplier stats
- Efficient queries with proper indexes

**React Context API:**
- Auth state managed globally
- User info accessible everywhere
- Token refresh on app load

**Automatic Updates:**
- Bill creation updates supplier stats
- Payment updates pending amounts
- Real-time dashboard recalculation

---

## 🚀 Next Steps

### Phase 1 - Current ✅
- [x] Authentication system
- [x] Supplier CRUD
- [x] Bill CRUD
- [x] Dashboard statistics
- [x] Mobile-responsive UI

### Phase 2 - Ready to Implement
- [ ] Analytics charts integration
- [ ] Due bills notifications
- [ ] Edit supplier/bill functionality
- [ ] Delete confirmation dialogs
- [ ] Advanced search and filters

### Phase 3 - Future Enhancements
- [ ] Bill scanning (OCR)
- [ ] Export to PDF
- [ ] Multi-currency support
- [ ] Inventory management
- [ ] Payment reminders
- [ ] Backup and restore

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👤 Author

**Vineet Vardhan**
- GitHub: [@vineetvardhan07](https://github.com/vineetvardhan07)

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [MongoDB Atlas](https://www.mongodb.com/atlas) - Cloud database
- [Vite](https://vitejs.dev/) - Lightning-fast build tool

---

**🎉 Happy Coding!**

For support, check the [troubleshooting](#-troubleshooting) section or review the [documentation](#-documentation).

---

Made with ❤️ for Kirana shop owners
