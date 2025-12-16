# 🎯 Quick Start Guide - Kirana Management App

## Prerequisites
- Node.js installed
- MongoDB Atlas account (already configured)
- Two terminals open

---

## 🚀 Start the Application

### Terminal 1 - Backend (Port 5000)
```bash
cd backend
npm start
```

**Expected Output:**
```
🚀 Server is running on http://localhost:5000
✅ MongoDB Connected: ac-oohzoi2-shard-00-00.p0uhjmf.mongodb.net
```

### Terminal 2 - Frontend (Port 8080)
```bash
npm run dev
```

**Expected Output:**
```
VITE v5.4.19 ready in 423 ms
➜  Local:   http://localhost:8080/
```

---

## 📱 Using the App

### 1. Register Account
1. Open http://localhost:8080
2. You'll be redirected to `/register`
3. Fill in:
   - Full Name
   - Email
   - Password (min 6 characters)
   - Phone (optional)
4. Click "Create Account"
5. You'll be logged in automatically

### 2. Add Suppliers
1. Click "Suppliers" tab in bottom navigation
2. Click the "+" button
3. Fill in:
   - Supplier Name (required)
   - Phone Number (required)
   - Address (required)
   - Email (optional)
   - GST Number (optional)
4. Click "Add Supplier"

**Backend automatically tracks:**
- Total spend (updated when bills are created)
- Total bills count
- Pending amount (updated when bills are created/paid)

### 3. Add Bills
1. Click "Bills" tab
2. Click "Add Bill" button
3. Select supplier from dropdown
4. Enter amount
5. Set due date (optional)
6. Add description (optional)
7. Click "Add Bill"

**Backend automatically:**
- Updates supplier's totalSpend
- Updates supplier's pendingAmount
- Updates supplier's totalBills count
- Creates bill with current date

### 4. Mark Bills as Paid
1. Go to "Bills" tab
2. Find unpaid bill
3. Click "Mark Paid" button

**Backend automatically:**
- Sets isPaid to true
- Sets paidDate to current date
- Decreases supplier's pendingAmount

### 5. View Dashboard
Click "Dashboard" tab to see:
- **Monthly Spend**: Total spent this month
- **Total Spend**: All-time spend
- **Total Bills**: Count of all bills
- **Suppliers**: Total suppliers count
- **Pending Payments**: Unpaid amount
- **Payment Rate**: % of bills paid

---

## 🔐 Authentication

### Login
- Email: test@example.com
- Password: password123

### Logout
1. Click user icon in top right
2. Click "Log out"

### Session
- JWT token stored in localStorage
- Expires after 7 days
- Automatically verified on page load

---

## 🛠️ Troubleshooting

### Backend Won't Start
**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Then restart
cd backend
npm start
```

### Frontend CSS Warning
**Warning:** `@import must precede all other statements`

**Solution:** This is just a warning, app still works fine. The @import for Google Fonts can be moved to the top of `index.css` if you want to remove it.

### MongoDB Connection Failed
**Error:** MongoDB disconnected

**Solution:**
1. Check `.env` file in backend folder
2. Ensure `MONGODB_URI` is correct
3. Check internet connection
4. Verify MongoDB Atlas cluster is running

### Token Expired
**Error:** Redirected to login unexpectedly

**Solution:**
1. Clear browser localStorage
2. Log in again

### API Requests Failing
**Check:**
1. Backend is running on port 5000
2. Check browser console for errors
3. Check Network tab in DevTools
4. Verify API base URL in `src/lib/api.ts` is `http://localhost:5000/api`

---

## 📊 Features Summary

### ✅ Implemented
- User registration & authentication
- JWT token-based auth
- Protected routes
- Suppliers CRUD
- Bills CRUD
- Mark bills as paid
- Dashboard statistics
- Real-time data updates
- Auto-calculation of supplier stats
- Loading states
- Error handling
- Toast notifications
- Responsive mobile-first UI
- User logout

### 🚧 Ready to Implement
- Analytics charts (API ready)
- Due bills alerts (API ready)
- Upcoming bills (API ready)
- Bill editing
- Supplier editing
- Bill deletion
- Supplier deletion
- Advanced filtering
- Search functionality
- Export to PDF
- Bill scanning

---

## 📁 Project Structure

```
Kirana/
├── backend/
│   ├── server.js              # Express server
│   ├── .env                   # Environment variables
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── Supplier.js        # Supplier schema
│   │   └── Bill.js            # Bill schema
│   ├── routes/
│   │   ├── auth.js            # Auth endpoints
│   │   ├── api.js             # Suppliers & Bills endpoints
│   │   └── analytics.js       # Analytics endpoints
│   └── middleware/
│       └── authMiddleware.js  # JWT verification
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx    # Auth state management
│   ├── lib/
│   │   └── api.ts             # API client (axios)
│   ├── pages/
│   │   ├── Index.tsx          # Main app (tabs)
│   │   ├── Login.tsx          # Login page
│   │   └── Register.tsx       # Register page
│   ├── components/
│   │   ├── ProtectedRoute.tsx # Route guard
│   │   └── views/
│   │       ├── DashboardView.tsx
│   │       ├── SuppliersView.tsx
│   │       ├── BillsView.tsx
│   │       ├── AnalyticsView.tsx
│   │       └── SettingsView.tsx
│   └── types/
│       └── index.ts           # TypeScript interfaces
└── Documentation/
    ├── API-DOCS.md            # API documentation
    ├── ANALYTICS-DOCS.md      # Analytics API docs
    └── FRONTEND-INTEGRATION.md # Integration guide
```

---

## 🔗 Important URLs

- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:5000
- **API Base**: http://localhost:5000/api
- **MongoDB**: MongoDB Atlas (cloud)

---

## 📞 Support

If you encounter issues:
1. Check terminal for error messages
2. Check browser console (F12)
3. Review FRONTEND-INTEGRATION.md
4. Review API-DOCS.md
5. Check MongoDB connection

---

## 🎉 Success!

You should now have:
- ✅ Backend running on port 5000
- ✅ Frontend running on port 8080
- ✅ MongoDB connected
- ✅ User authentication working
- ✅ Suppliers & Bills management working
- ✅ Dashboard showing real data

**Enjoy using your Kirana Management App! 🚀**
