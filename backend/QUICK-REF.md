# 📋 Quick Reference Card

## 🚀 Server Info
- **URL:** http://localhost:5000
- **Status:** ✅ Running & Connected to MongoDB Atlas
- **Auth:** JWT Bearer Token Required (except /auth routes)

---

## 🔐 Authentication

```bash
# Register
POST /api/auth/register
Body: { username, email, password }
Returns: { token, user }

# Login
POST /api/auth/login
Body: { email, password }
Returns: { token, user }

# Get Current User
GET /api/auth/me
Header: Authorization: Bearer <token>
```

---

## 👥 Suppliers

```bash
# Create
POST /api/suppliers
Body: { name, phone?, address? }

# List All
GET /api/suppliers
Query: ?search=<term>&sortBy=<field>&order=<asc|desc>

# Get One
GET /api/suppliers/:id

# Update
PUT /api/suppliers/:id
Body: { name?, phone?, address? }

# Delete (only if no bills)
DELETE /api/suppliers/:id
```

---

## 💰 Bills

```bash
# Create (Updates supplier stats automatically)
POST /api/bills
Body: {
  supplierId,
  amount,
  description?,
  isPaid?,
  dueDate?,
  items?: [{ name, quantity, price, unit }]
}

# List All (with stats)
GET /api/bills
Query: ?isPaid=<bool>&supplierId=<id>&startDate=<date>&endDate=<date>
Returns: { bills, stats, pagination }

# Get One
GET /api/bills/:id

# Mark as Paid (Decreases supplier.pendingAmount)
PUT /api/bills/:id/pay

# Update
PUT /api/bills/:id
Body: { amount?, description?, dueDate?, items? }
Note: Cannot change amount of paid bills

# Delete (Updates supplier stats)
DELETE /api/bills/:id
```

---

## 📊 Automatic Calculations

### When Bill Created:
- ✅ supplier.totalSpend += bill.amount
- ✅ supplier.pendingAmount += bill.amount (if unpaid)
- ✅ supplier.totalBills += 1
- ✅ supplier.lastPurchaseDate updated

### When Bill Paid:
- ✅ bill.isPaid = true
- ✅ bill.paidDate = now
- ✅ supplier.pendingAmount -= bill.amount

### When Bill Deleted:
- ✅ supplier.totalSpend -= bill.amount
- ✅ supplier.pendingAmount -= bill.amount (if unpaid)
- ✅ supplier.totalBills -= 1

---

## 🧪 Test Sequence

1. Register/Login → Save token
2. Create Supplier → Save supplierId
3. Create Unpaid Bill → Check pending increased
4. Mark Bill as Paid → Check pending decreased
5. Get Bills → See stats summary

---

## 📁 Files Created

- ✅ routes/api.js (820+ lines)
- ✅ server.js (updated)
- ✅ API-DOCS.md (complete docs)
- ✅ API-COMPLETE.md (summary)
- ✅ thunder-collection.json (updated)

---

## 💡 Quick Tips

1. **All amounts in INR (₹)**
2. **Dates in ISO 8601 format**
3. **Phone: 10-digit Indian format**
4. **Pagination: ?page=1&limit=50**
5. **Search is case-insensitive**
6. **Stats auto-update, no manual calc needed**

---

## 🔗 Documentation

- 📄 **API-DOCS.md** - Full API reference
- 📄 **API-COMPLETE.md** - Implementation summary
- 📄 **README.md** - Setup guide
- 📄 **QUICKSTART.md** - Quick start
- 📄 **thunder-collection.json** - Test collection

---

Ready to use! 🎉
