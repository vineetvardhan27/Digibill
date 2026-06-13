# 📊 Digibill - Digital Bill & Supplier Management

Digibill is a comprehensive B2B supplier and bill management platform designed for small businesses and retail shops. It digitizes invoice tracking, manages supplier relationships, and provides expense analytics.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

---

## ✨ Key Features

*   **🏢 Supplier Management & Health Scores**: Track all your B2B suppliers and automatically compute trust grades (0-100) based on real payment history and trends.
*   **📄 Digital Billing & Full GST Support**: Log bills with interactive line items. Built-in support for Indian GST slabs, HSN codes, IGST/CGST/SGST breakdowns, and live total calculations.
*   **🤖 AI Bill Scanning (OCR)**: Instantly extract bill details and GST data by uploading a photo using the **Groq Vision API**.
*   **⏰ Smart Payment Reminders**: Automated daily cron jobs that send payment reminders 1-3 days before due dates via **Email & WhatsApp**.
*   **🌐 Dedicated Supplier Portal (Auth & Invite)**: Send branded magic-link invites to suppliers. They get an isolated dashboard to view invoices, upload their own PDFs, acknowledge receipts, and raise formal disputes.
*   **💼 Bill Disputes Workflow**: Integrated system for shop owners to view a live dispute badge, review reasons, and accept/reject disputes directly from their dashboard.
*   **📈 Cash Flow Forecasting (30 & 90 Day)**: Detect recurring supplier patterns and visualize confirmed vs. predicted upcoming outflows via interactive charts.
*   **⚠️ Duplicate Bill Detection**: Smart, debounced front-end detection that catches accidental double-entries (same supplier, similar amount/date) before you hit save.
*   **🚀 Modern Landing & Pricing Page**: Stunning public-facing marketing site featuring a live invoice ticker, responsive pricing tiers, and smooth scroll animations.
*   **🖨️ PDF Generation**: Instantly generate and download professional, tabular GST invoice PDFs directly from the browser.
*   **⚙️ Settings & Data Export**: Manage shop profiles, toggle Dark Mode, disable portal access globally, and export your database.
*   **🛡️ Security**: Secured with JWT authentication and protected by a 3-tier rate limiter (Global, Auth, OCR).

---

## 🛠️ Tech Stack

*   **Frontend**: React 18, TypeScript, Vite, React Router, Tailwind CSS, shadcn/ui, Recharts
*   **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, express-rate-limit, groq-sdk

---

## 🚀 Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   MongoDB (Local or Atlas)
*   A Groq API Key (for the OCR feature)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

**Configure `backend/.env`:**
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/digibill

# Security
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:8080

# AI / OCR
GROQ_API_KEY=your_groq_api_key_here
```

Start the backend:
```bash
npm run dev
```

### 2. Frontend Setup

Open a new terminal:
```bash
# From the root directory
npm install
npm run dev
```

The application will be available at `http://localhost:8080`.

---

## 📖 How to Use the AI Scanner
1. Go to the **Bills** page and click **Add Bill**.
2. Drag and drop an invoice image into the scanner area.
3. Digibill will securely process the image (in-memory) via Groq Vision API.
4. The system will auto-populate the total amount, due date, description, and match the supplier name using fuzzy logic.
5. Review the extracted line items by clicking on the saved bill!

---

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License. Copyright (c) 2026 Vineet Vardhan.
