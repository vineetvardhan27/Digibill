# 📊 Digibill - Digital Bill & Supplier Management

Digibill is a comprehensive B2B supplier and bill management platform designed for small businesses and retail shops. It digitizes invoice tracking, manages supplier relationships, and provides expense analytics.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

---

## ✨ Key Features

*   **🏢 Supplier Management**: Track all your B2B suppliers, their contact info, and total spend in one place.
*   **📄 Digital Billing**: Log bills manually or organize them by supplier. Track pending vs paid status.
*   **🤖 AI Bill Scanning (OCR)**: Instantly extract bill details (amounts, line items, dates) by uploading a photo using the **Groq Vision API** (`meta-llama/llama-4-scout-17b-16e-instruct`).
*   **📊 Analytics Dashboard**: Visualize monthly spending trends, supplier breakdowns, and payment rates with interactive charts.
*   **⚙️ Settings & Data Export**: Fully manage your shop profile, toggle Dark Mode, and export your entire database (Bills & Suppliers) as a local JSON backup directly from the browser.
*   **🛡️ Security & Rate Limiting**: Secured with JWT authentication. Endpoints are protected by a 3-tier rate limiter (Global, Auth, and OCR) to prevent abuse and brute-force attacks.

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
