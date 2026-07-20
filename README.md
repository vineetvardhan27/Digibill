<div align="center">

# Digibill
![CI](https://github.com/vineetvardhan27/Digibill/actions/workflows/ci.yml/badge.svg)

**Enterprise-grade B2B supplier and invoice management for modern small businesses**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js_v18+-43853D?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)

[Features](#-features) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [Configuration](#-configuration) · [API Reference](#-api-reference) · [Contributing](#-contributing)

</div>

---

## Overview

Digibill is a full-stack B2B invoice and supplier management platform built for small businesses and retail shops operating in the Indian market. It replaces manual, paper-based billing workflows with a digitized system that handles supplier relationships, GST-compliant invoicing, AI-assisted data entry, automated payment reminders, and cash flow forecasting — all in a single, unified interface.

**Why Digibill?**

- **Zero paper, full compliance** — Generate GST-compliant invoices with IGST/CGST/SGST breakdowns and HSN codes in seconds.
- **AI-first data entry** — Photograph a physical bill; the AI scanner extracts and pre-fills all fields automatically.
- **Proactive cash management** — Receive payment reminders before due dates and visualize 30/90-day cash outflows before they happen.
- **Collaborative supplier portal** — Suppliers get their own isolated dashboard to acknowledge invoices, upload PDFs, and raise formal disputes — at no cost to them.

---

## Features

### Core Platform

| Module | Description |
|---|---|
| **Supplier Management** | Centralized directory with automated health scores (0–100) computed from live payment history and trend analysis |
| **Digital Billing** | Line-item invoices with real-time GST calculations, HSN codes, and full IGST/CGST/SGST breakdown |
| **AI Bill Scanner (OCR)** | Image-to-invoice extraction via Groq Vision API (`meta-llama/llama-4-scout-17b-16e-instruct`) with fuzzy supplier name matching |
| **PDF Generation** | One-click, browser-side generation of GST-compliant, tabular invoice PDFs |
| **Duplicate Detection** | Debounced pre-save detection of duplicate entries (same supplier, amount within 2%, date within 7 days) |

### Automation & Integrations

| Module | Description |
|---|---|
| **Smart Payment Reminders** | Cron-based daily job sends email (Nodemailer) and WhatsApp (Twilio) reminders 1–3 days before due dates, with full send-log auditing |
| **Cash Flow Forecasting** | Detects recurring 30-day billing patterns per supplier (≥3 bills, ±5-day tolerance) and projects 30/90-day confirmed vs. predicted outflows via interactive Recharts area charts |

### B2B Network

| Module | Description |
|---|---|
| **Connection System** | Global supplier directory; shops send/receive connection requests; suppliers manage multiple connected shops from an independent dashboard |
| **Supplier Portal** | Magic-link email invite (48-hour validity); suppliers access an isolated dashboard to view invoices, upload PDFs, acknowledge receipts, and raise disputes |
| **Disputes Workflow** | Live unread badge on the Disputes page; shop owners review dispute reasons and resolve or reject with a single action |

### Platform & Security

| Module | Description |
|---|---|
| **Authentication** | JWT-based auth with separate token scopes for shop owners and supplier accounts |
| **Rate Limiting** | 3-tier express rate limiter: Global, Auth, and OCR endpoint protection |
| **Settings & Export** | Manage shop profile, toggle Dark Mode, disable supplier portal globally, and export the full database as JSON |

---

## Architecture

```
digibill/
├── src/                        # React frontend (Vite + TypeScript)
│   ├── components/             # Reusable UI components (shadcn/ui + Tailwind)
│   ├── pages/                  # Route-level views
│   │   ├── Dashboard.tsx
│   │   ├── Bills.tsx
│   │   ├── Suppliers.tsx
│   │   ├── Forecast.tsx
│   │   ├── Disputes.tsx
│   │   └── supplier/           # Isolated supplier portal views
│   ├── hooks/                  # Custom React hooks
│   └── lib/                    # API client, utilities, type definitions
│
└── backend/                    # Express.js API server (Node.js + TypeScript)
    ├── controllers/            # Route handlers
    ├── models/                 # Mongoose schemas
    ├── routes/                 # API route definitions
    ├── middleware/             # Auth, rate-limiting, error handling
    ├── services/
    │   ├── ocr.service.ts      # Groq Vision API integration
    │   ├── reminder.service.ts # Email + WhatsApp notification logic
    │   └── forecast.service.ts # Recurring pattern detection
    └── jobs/
        └── reminder.cron.ts    # Daily cron job (node-cron)
```

### Tech Stack

**Frontend:** React 18, TypeScript, Vite, React Router, Tailwind CSS, shadcn/ui, Recharts

**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, express-rate-limit, groq-sdk

**Third-Party Integrations:** `node-cron`, `nodemailer`, `twilio`, `cloudinary`, `multer`

---

## Getting Started

### Prerequisites

- Node.js **v18+**
- MongoDB (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Groq API key](https://console.groq.com) (required for AI Bill Scanner)
- *(Optional)* SMTP credentials, Twilio account, and Cloudinary account for reminders and supplier file uploads

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/digibill.git
cd digibill
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` with your credentials (see [Configuration](#-configuration) below), then start the server:

```bash
npm run dev
# Server runs on http://localhost:5000
```

### 3. Frontend Setup

In a new terminal from the project root:

```bash
npm install
npm run dev
# App runs on http://localhost:8080
```

---

## Configuration

All backend configuration is managed via `backend/.env`. Copy `backend/.env.example` and populate each value.

```env
# ── Server ────────────────────────────────────────────────────────────────────
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:8080

# ── Database ──────────────────────────────────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/digibill

# ── Security ──────────────────────────────────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRE=7d

# ── AI / OCR (Required for Bill Scanner) ──────────────────────────────────────
GROQ_API_KEY=your_groq_api_key

# ── Email Reminders & Supplier Invites (Nodemailer) ───────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_smtp_app_password
SMTP_FROM="Digibill <noreply@digibill.app>"

# ── WhatsApp Reminders (Twilio) ───────────────────────────────────────────────
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# ── Supplier File Uploads (Cloudinary) ────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Note:** The application runs in a degraded-but-functional mode without optional integrations (SMTP, Twilio, Cloudinary). Core billing and supplier management features are unaffected.

---

## Feature Guides

### AI Bill Scanner

1. Navigate to **Bills → Add Bill**.
2. Drag and drop an invoice image into the scanner zone.
3. Digibill processes the image in-memory via the Groq Vision API — no image is stored on our servers.
4. Extracted fields (total, due date, description, GST breakdown) are pre-populated automatically. The supplier name is matched using fuzzy logic against your existing supplier list.
5. Review line items on the saved bill detail view. Download a GST-compliant PDF at any time.

### Supplier Portal

1. Navigate to **Suppliers** and click **Invite to Portal** on a supplier card.
2. The supplier receives a branded email with a secure magic link (valid for 48 hours).
3. They create a password and log in at `/supplier/login` — an environment fully isolated from your owner account.
4. Suppliers can: view assigned invoices, acknowledge receipt, raise formal disputes with reasons, and upload their own invoice copies via Cloudinary.
5. Raised disputes appear immediately on your **Disputes** page with a live unread count badge.

### Cash Flow Forecasting

Digibill analyzes your bill history per supplier. A recurring pattern is detected when a supplier has 3 or more paid bills at a consistent interval of approximately 30 days (±5-day tolerance). Detected patterns generate forward projections displayed on the **Forecast** page, separated into:

- **Confirmed** — Actual pending bills already logged in the system.
- **Predicted** — AI-projected outflows based on recurring patterns.

Toggle between 30-day and 90-day views using the range selector.

---

## API Reference

The REST API is served at `http://localhost:5000/api`. All protected endpoints require a `Bearer` token in the `Authorization` header.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Register a new shop account |
| `POST` | `/api/auth/login` | — | Authenticate and receive JWT |
| `GET` | `/api/suppliers` | Owner | List all suppliers |
| `POST` | `/api/suppliers` | Owner | Create a supplier |
| `GET` | `/api/bills` | Owner | List all bills |
| `POST` | `/api/bills` | Owner | Create a bill |
| `POST` | `/api/bills/scan` | Owner | OCR scan an invoice image |
| `GET` | `/api/forecast` | Owner | Get 30/90-day cash flow forecast |
| `GET` | `/api/disputes` | Owner | List all disputes |
| `POST` | `/api/supplier/auth/login` | — | Supplier portal login |
| `GET` | `/api/supplier/bills` | Supplier | List bills visible to this supplier |

> Full OpenAPI documentation is forthcoming. See controller source files in `backend/controllers/` for complete parameter and response schemas.

---

## Contributing

Contributions are welcome. Please follow the workflow below to keep the codebase consistent.

1. **Fork** the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow** the existing code style. The project uses ESLint and Prettier; run the linter before committing:
   ```bash
   npm run lint
   ```

3. **Write descriptive commit messages** following [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat(ocr): improve supplier fuzzy-match threshold
   fix(cron): prevent duplicate reminder sends on retry
   ```

4. **Open a Pull Request** against `main` with a clear description of the change and any relevant context.

For significant changes, please open an issue first to discuss the approach.

---

## Roadmap

- [ ] OpenAPI / Swagger documentation
- [ ] Multi-currency support
- [ ] Native mobile app (React Native)
- [ ] Tally ERP / Zoho Books integration
- [ ] Role-based access control (RBAC) for shop staff accounts
- [ ] Bulk bill import via CSV/Excel

---

## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for full terms.

Copyright © 2026 Vineet Vardhan.

---

<div align="center">
  <sub>Built with care for small businesses navigating India's GST landscape.</sub>
</div>
