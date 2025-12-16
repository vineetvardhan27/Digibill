# 📊 Digibill - Digital Bill & Supplier Management System

> A comprehensive B2B supplier and bill management platform designed for small businesses and retail shops to digitize their invoice tracking, supplier relationships, and expense analytics.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=flat)](https://expressjs.com/)

---

## 🎯 Project Overview

**Digibill** is a modern, full-stack web application that helps shopkeepers and small business owners manage their suppliers, track bills, monitor expenses, and gain actionable insights through real-time analytics. The platform eliminates manual record-keeping, reduces billing errors, and provides a centralized dashboard for complete financial visibility.

### 🏪 Built For
- **Small Retailers** managing multiple suppliers
- **Shopkeepers** tracking daily purchases and payments
- **B2B Business Owners** needing organized supplier records
- **Kirana Stores** digitizing traditional paper-based billing

---

## 💡 Problem Statement

Traditional supplier and bill management in small businesses faces several challenges:

### 📝 Manual Record Keeping Issues:
- ❌ Paper bills get lost or damaged
- ❌ Difficult to track pending payments
- ❌ No centralized view of all suppliers
- ❌ Manual calculation errors in totals
- ❌ Hard to analyze spending patterns
- ❌ Time-consuming bill searches

### 💸 Financial Management Pain Points:
- ❌ Missing payment due dates leading to penalties
- ❌ No visibility into monthly/yearly spending trends
- ❌ Inability to identify top spending suppliers
- ❌ Difficulty in budget planning
- ❌ Lack of real-time financial insights

### 🎯 Digibill Solution:
Provides a **single digital platform** where shopkeepers can:
- ✅ Store all supplier information securely
- ✅ Create and manage bills digitally
- ✅ Track payment statuses in real-time
- ✅ Visualize spending through interactive charts
- ✅ Receive alerts for due payments
- ✅ Generate comprehensive analytics reports

---

## ✨ Key Features

### 🏢 Supplier Management
- **Add/Edit/Delete Suppliers** - Complete CRUD operations with soft delete
- **Supplier Profiles** - Store contact details, addresses, and GST numbers
- **Spending Tracking** - Auto-calculated total spend per supplier
- **Bill History** - View all bills associated with each supplier
- **Supplier Analytics** - Identify top suppliers by spending

### 📄 Bill Management
- **Digital Bill Creation** - Add bills with items, quantities, and prices
- **Payment Tracking** - Mark bills as paid/unpaid
- **Due Date Alerts** - Visual indicators for overdue payments
- **Bulk Operations** - Filter, sort, and search bills
- **Bill Details** - Store descriptions, items, and metadata
- **Auto-calculations** - Automatic total amount computation

### 📊 Analytics & Insights
- **Dashboard Overview** - Real-time stats (total spend, pending payments, bill count)
- **Monthly Trends** - Spending patterns over last 6 months
- **Supplier Breakdown** - Visual distribution of spending by supplier
- **Top Products** - Most purchased items by value
- **Payment Analytics** - Track payment timelines and averages
- **Interactive Charts** - Bar charts, pie charts, and area graphs

### 🔐 Authentication & Security
- **JWT-Based Auth** - Secure token-based authentication
- **User Registration** - Email, name, phone, and password
- **Secure Login** - Encrypted password storage with bcrypt
- **Protected Routes** - Role-based access control
- **Session Management** - Auto-logout on token expiry

### 🎨 UI/UX Features
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark/Light Mode Ready** - Modern shadcn/ui components
- **Loading States** - Spinners during data fetch
- **Empty States** - Helpful messages for zero-data scenarios
- **Toast Notifications** - Real-time feedback for actions
- **Smooth Animations** - Polished user experience

---

## 🛠️ Tech Stack

### **Frontend**
| Technology | Purpose |
|------------|---------|
| **React 18** | UI library for building interactive interfaces |
| **TypeScript** | Type-safe JavaScript for better code quality |
| **Vite** | Lightning-fast build tool and dev server |
| **React Router** | Client-side routing and navigation |
| **shadcn/ui** | Beautifully designed UI component library |
| **Tailwind CSS** | Utility-first CSS framework |
| **Recharts** | Composable charting library for analytics |
| **Axios** | HTTP client for API communication |
| **date-fns** | Modern date utility library |
| **Sonner** | Toast notification system |

### **Backend**
| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime environment |
| **Express.js** | Web application framework |
| **MongoDB** | NoSQL database for data storage |
| **Mongoose** | ODM (Object Data Modeling) library |
| **JWT** | JSON Web Tokens for authentication |
| **bcryptjs** | Password hashing and encryption |
| **express-validator** | Request validation middleware |
| **CORS** | Cross-Origin Resource Sharing |

### **Database Schema**
- **Users** - Authentication and profile data
- **Suppliers** - Supplier information with soft delete
- **Bills** - Bill records with items and payment status

---

## 🏗️ System Architecture

```
┌─────────────────┐
│   React SPA     │  ← Frontend (Port 8080)
│   (TypeScript)  │
└────────┬────────┘
         │ HTTP/JSON
         ↓
┌─────────────────┐
│  Express REST   │  ← Backend API (Port 5000)
│   API Server    │
└────────┬────────┘
         │ Mongoose ODM
         ↓
┌─────────────────┐
│    MongoDB      │  ← Database (Cloud/Local)
│   Collections   │
└─────────────────┘

Data Flow:
1. User interacts with React UI
2. Axios sends HTTP requests to Express API
3. Express validates JWT tokens
4. Mongoose queries MongoDB
5. API returns JSON data
6. React updates UI with real-time data
```

---

## 📦 Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Package manager
- **MongoDB** - Local installation or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
- **Git** - Version control

### 🚀 Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/vineetvardhan27/Digibill.git
cd Digibill

# 2. Navigate to backend directory
cd backend

# 3. Install dependencies
npm install

# 4. Create .env file
cp .env.example .env

# 5. Configure environment variables
# Edit .env and add:
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key
# PORT=5000
# NODE_ENV=development

# 6. Start the backend server
npm start

# Server will run on http://localhost:5000
```

### 🎨 Frontend Setup

```bash
# 1. Navigate to root directory (from backend folder)
cd ..

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# Frontend will run on http://localhost:8080
```

### 🔑 Environment Variables

**Backend (.env)**
```env
# MongoDB Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/digibill?retryWrites=true&w=majority

# JWT Secret Key (use a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Server Configuration
PORT=5000
NODE_ENV=development

# Optional: Session Configuration
SESSION_SECRET=your_session_secret
```

**Frontend (if needed)**
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 🔌 API Overview

### **Authentication APIs**

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "9876543210"
}

Response: { success: true, token: "jwt_token", user: {...} }
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response: { success: true, token: "jwt_token", user: {...} }
```

```http
GET /api/auth/me
Authorization: Bearer <jwt_token>

Response: { success: true, user: {...} }
```

### **Supplier APIs**

```http
GET /api/suppliers
Authorization: Bearer <jwt_token>

Query Parameters:
- search (optional): Search by name
- sortBy (optional): Field to sort by
- order (optional): asc or desc
- page (optional): Page number
- limit (optional): Results per page

Response: { success: true, data: { suppliers: [...], pagination: {...} } }
```

```http
POST /api/suppliers
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "ABC Traders",
  "phone": "9876543210",
  "address": "123 Market Street",
  "email": "abc@traders.com",
  "gstNumber": "27AABCU9603R1ZM"
}

Response: { success: true, data: { supplier: {...} } }
```

```http
DELETE /api/suppliers/:id
Authorization: Bearer <jwt_token>

Response: { success: true, message: "Supplier deleted successfully" }
```

### **Bill APIs**

```http
GET /api/bills
Authorization: Bearer <jwt_token>

Query Parameters:
- supplierId (optional): Filter by supplier
- isPaid (optional): true or false
- startDate (optional): Filter by date range
- endDate (optional): Filter by date range
- sortBy (optional): Field to sort by
- order (optional): asc or desc

Response: { success: true, data: { bills: [...], stats: {...} } }
```

```http
POST /api/bills
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "supplierId": "supplier_id_here",
  "amount": 5000,
  "date": "2025-01-15",
  "dueDate": "2025-02-15",
  "description": "Monthly supplies",
  "items": [
    {
      "name": "Rice",
      "quantity": 50,
      "price": 80,
      "unit": "kg"
    }
  ]
}

Response: { success: true, data: { bill: {...} } }
```

```http
PUT /api/bills/:id/pay
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "paidDate": "2025-01-20"
}

Response: { success: true, data: { bill: {...} } }
```

### **Analytics APIs**

```http
GET /api/dashboard/stats
Authorization: Bearer <jwt_token>

Response: {
  success: true,
  data: {
    stats: {
      totalSpend: 50000,
      totalBills: 120,
      totalSuppliers: 15,
      pendingPayments: 12000,
      monthlySpend: 8500,
      monthlyChange: 12.5
    }
  }
}
```

```http
GET /api/analytics/charts?months=6
Authorization: Bearer <jwt_token>

Response: {
  success: true,
  data: {
    monthlySpend: [...],
    supplierBreakdown: [...],
    categoryBreakdown: [...],
    paymentTrends: [...]
  }
}
```

---

## 📖 Usage Guide

### **For Shopkeepers - Typical Workflow**

#### **1. First-Time Setup**
1. Register an account with email and password
2. Login to access the dashboard
3. Add your suppliers (name, phone, address)

#### **2. Daily Operations**
1. **Receive a bill from supplier** → Go to "Bills" page
2. **Click "Add Bill"** → Select supplier, enter amount, date, items
3. **Save the bill** → Bill appears in Recent Bills
4. **Track due payments** → Due Payments section shows upcoming deadlines

#### **3. Making Payments**
1. View **Due Payments** on dashboard
2. Click **"Pay"** button on a bill
3. Bill automatically marked as paid
4. Supplier's pending amount updates

#### **4. Monthly Review**
1. Navigate to **Analytics** tab
2. View **Monthly Spending Trend** chart
3. Check **Top Suppliers** breakdown
4. Review **Top Products** purchased
5. Use insights for budget planning

#### **5. Supplier Management**
1. View all suppliers on **Suppliers** page
2. Click supplier to see detailed spending
3. Edit supplier details if needed
4. Delete suppliers no longer needed (soft delete)

---

## 📸 Screenshots

> **Note:** Add screenshots here to showcase your application

Suggested screenshots:
- 📊 Dashboard Overview
- 📄 Bills List View
- ➕ Add Bill Dialog
- 🏢 Suppliers Management
- 📈 Analytics Charts
- 🔐 Login/Register Pages

---

## 🚀 Future Enhancements

### Planned Features (Roadmap)

#### **Phase 1: Intelligence**
- 🤖 **OCR Bill Scanning** - Upload bill photos, auto-extract data
- 🧠 **AI Spending Predictions** - Machine learning for budget forecasts
- 📱 **Mobile App** - React Native iOS/Android apps

#### **Phase 2: Compliance**
- 💼 **GST Integration** - Automatic GST calculations and reports
- 📊 **Tax Reports** - Generate annual tax filing reports
- 🧾 **Invoice Generation** - Create professional invoices for customers

#### **Phase 3: Collaboration**
- 👥 **Multi-User Support** - Team access with role-based permissions
- 🔔 **WhatsApp Notifications** - Payment reminders via WhatsApp
- 📧 **Email Reports** - Automated weekly/monthly email summaries

#### **Phase 4: Advanced Analytics**
- 📈 **Profit Margin Analysis** - Compare purchase vs selling prices
- 🎯 **Inventory Tracking** - Link bills to stock management
- 💹 **Cash Flow Projections** - Predict future cash requirements

#### **Phase 5: Integrations**
- 💳 **Payment Gateway** - Direct online payment to suppliers
- 🏦 **Bank Sync** - Auto-reconcile with bank statements
- 📦 **E-commerce Integration** - Connect with online stores

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve Digibill:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Contribution Guidelines
- Write clean, readable code
- Follow existing code style and conventions
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation if needed

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Vineet Vardhan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 👨‍💻 Author

**Vineet Vardhan**

- GitHub: [@vineetvardhan27](https://github.com/vineetvardhan27)
- Project Link: [https://github.com/vineetvardhan27/Digibill](https://github.com/vineetvardhan27/Digibill)

---

## 🙏 Acknowledgments

- **shadcn/ui** - For beautiful, accessible UI components
- **Recharts** - For powerful charting capabilities
- **MongoDB** - For flexible NoSQL database
- **Vite** - For blazing-fast development experience

---

## 📞 Support

If you have any questions or need help with setup:

- 🐛 Issues: [GitHub Issues](https://github.com/vineetvardhan27/Digibill/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/vineetvardhan27/Digibill/discussions)

---

<div align="center">

**⭐ If you find this project helpful, please give it a star! ⭐**

Made with ❤️ for small businesses and shopkeepers

</div>
