# API Routes Documentation

Complete API documentation for Kirana Store Management System.

## Base URL
```
http://localhost:5000/api
```

## Authentication
All routes except `/api/health` and `/api/auth/*` require JWT authentication.

Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 Supplier Endpoints

### 1. Create Supplier
**POST** `/api/suppliers`

Creates a new supplier for the logged-in user.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Sharma Trading Co.",
  "phone": "9876543210",        // Optional, must be 10 digits
  "address": "Chandni Chowk, Delhi"  // Optional
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Supplier created successfully",
  "data": {
    "supplier": {
      "_id": "657abc123...",
      "name": "Sharma Trading Co.",
      "phone": "9876543210",
      "address": "Chandni Chowk, Delhi",
      "createdBy": "657xyz...",
      "totalSpend": 0,
      "pendingAmount": 0,
      "totalBills": 0,
      "createdAt": "2025-12-12T10:00:00.000Z",
      "updatedAt": "2025-12-12T10:00:00.000Z"
    }
  }
}
```

**Business Logic:**
- Checks for duplicate supplier names (case-insensitive) for the same user
- Initializes `totalSpend`, `pendingAmount`, and `totalBills` to 0

---

### 2. Get All Suppliers
**GET** `/api/suppliers`

Retrieves all suppliers for the logged-in user with pagination and filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `search` (optional) - Search in name, phone, or address
- `sortBy` (optional, default: "name") - Field to sort by (name, totalSpend, pendingAmount, etc.)
- `order` (optional, default: "asc") - Sort order (asc/desc)
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Example Request:**
```
GET /api/suppliers?search=sharma&sortBy=totalSpend&order=desc&page=1&limit=10
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "suppliers": [
      {
        "_id": "657abc123...",
        "name": "Sharma Trading Co.",
        "phone": "9876543210",
        "address": "Chandni Chowk, Delhi",
        "totalSpend": 125000,
        "pendingAmount": 15000,
        "totalBills": 45,
        "lastPurchaseDate": "2025-12-05T00:00:00.000Z",
        "createdAt": "2025-01-15T00:00:00.000Z",
        "updatedAt": "2025-12-12T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

---

### 3. Get Single Supplier
**GET** `/api/suppliers/:id`

Retrieves a specific supplier by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "supplier": {
      "_id": "657abc123...",
      "name": "Sharma Trading Co.",
      "phone": "9876543210",
      "address": "Chandni Chowk, Delhi",
      "totalSpend": 125000,
      "pendingAmount": 15000,
      "totalBills": 45,
      "lastPurchaseDate": "2025-12-05T00:00:00.000Z"
    }
  }
}
```

---

### 4. Update Supplier
**PUT** `/api/suppliers/:id`

Updates supplier information.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** (all fields optional)
```json
{
  "name": "Sharma Trading Co. Updated",
  "phone": "9876543211",
  "address": "New Address, Delhi"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Supplier updated successfully",
  "data": {
    "supplier": { /* updated supplier object */ }
  }
}
```

**Business Logic:**
- Checks for name conflicts if name is being changed
- Cannot update `totalSpend`, `pendingAmount`, or `totalBills` (auto-calculated)

---

### 5. Delete Supplier
**DELETE** `/api/suppliers/:id`

Deletes a supplier (only if no associated bills exist).

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Supplier deleted successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Cannot delete supplier with 5 associated bill(s). Delete bills first."
}
```

**Business Logic:**
- Prevents deletion if supplier has any bills
- Ensures data integrity

---

## 💰 Bill Endpoints

### 1. Create Bill
**POST** `/api/bills`

Creates a new bill and automatically updates supplier statistics.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "supplierId": "657abc123...",
  "amount": 12500,
  "date": "2025-12-12T10:00:00.000Z",  // Optional, defaults to now
  "description": "Rice, Dal, Sugar supplies",  // Optional
  "isPaid": false,  // Optional, defaults to false
  "dueDate": "2025-12-31T00:00:00.000Z",  // Optional
  "items": [  // Optional
    {
      "name": "Basmati Rice",
      "quantity": 50,
      "price": 150,
      "unit": "kg"
    },
    {
      "name": "Toor Dal",
      "quantity": 30,
      "price": 120,
      "unit": "kg"
    }
  ],
  "imageUrl": "https://example.com/bill.jpg"  // Optional
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Bill created successfully",
  "data": {
    "bill": {
      "_id": "657def456...",
      "supplierId": {
        "_id": "657abc123...",
        "name": "Sharma Trading Co.",
        "phone": "9876543210",
        "address": "Chandni Chowk, Delhi"
      },
      "amount": 12500,
      "date": "2025-12-12T10:00:00.000Z",
      "description": "Rice, Dal, Sugar supplies",
      "isPaid": false,
      "dueDate": "2025-12-31T00:00:00.000Z",
      "items": [ /* array of items */ ],
      "createdBy": "657xyz...",
      "createdAt": "2025-12-12T10:00:00.000Z",
      "updatedAt": "2025-12-12T10:00:00.000Z",
      "isOverdue": false,
      "daysUntilDue": 19
    }
  }
}
```

**Business Logic (Block 3 & 4 from Diagram):**
1. **Always updates:** `supplier.totalSpend += bill.amount`
2. **If unpaid:** `supplier.pendingAmount += bill.amount`
3. **Updates:** `supplier.totalBills += 1`
4. **Updates:** `supplier.lastPurchaseDate` if this is the latest bill
5. **Virtual fields:**
   - `isOverdue`: Boolean indicating if bill is past due date
   - `daysUntilDue`: Number of days until/since due date

---

### 2. Get All Bills
**GET** `/api/bills`

Retrieves all bills with filtering, sorting, and statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `search` (optional) - Search in description
- `supplierId` (optional) - Filter by specific supplier
- `isPaid` (optional) - Filter by payment status (true/false)
- `startDate` (optional) - Filter bills from this date
- `endDate` (optional) - Filter bills until this date
- `sortBy` (optional, default: "date") - Field to sort by
- `order` (optional, default: "desc") - Sort order (asc/desc)
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Example Request:**
```
GET /api/bills?isPaid=false&sortBy=dueDate&order=asc&page=1&limit=20
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "bills": [
      {
        "_id": "657def456...",
        "supplierId": {
          "_id": "657abc123...",
          "name": "Sharma Trading Co.",
          "phone": "9876543210",
          "address": "Chandni Chowk, Delhi"
        },
        "amount": 12500,
        "date": "2025-12-12T10:00:00.000Z",
        "description": "Rice, Dal, Sugar supplies",
        "isPaid": false,
        "dueDate": "2025-12-31T00:00:00.000Z",
        "isOverdue": false,
        "daysUntilDue": 19
      }
    ],
    "stats": {
      "totalAmount": 395000,
      "paidAmount": 366100,
      "pendingAmount": 28900,
      "totalBills": 145,
      "paidBills": 140,
      "unpaidBills": 5
    },
    "pagination": {
      "total": 145,
      "page": 1,
      "limit": 20,
      "pages": 8
    }
  }
}
```

**Business Logic:**
- Returns aggregated statistics for all matching bills
- Bills are populated with supplier information
- Default sort is by date (newest first)

---

### 3. Get Single Bill
**GET** `/api/bills/:id`

Retrieves a specific bill by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "bill": {
      "_id": "657def456...",
      "supplierId": {
        "_id": "657abc123...",
        "name": "Sharma Trading Co.",
        "phone": "9876543210"
      },
      "amount": 12500,
      "description": "Rice, Dal, Sugar supplies",
      "isPaid": false,
      "items": [ /* array of items */ ]
    }
  }
}
```

---

### 4. Mark Bill as Paid ⭐
**PUT** `/api/bills/:id/pay`

Marks a bill as paid and updates supplier's pending amount.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bill marked as paid successfully",
  "data": {
    "bill": {
      "_id": "657def456...",
      "amount": 12500,
      "isPaid": true,
      "paidDate": "2025-12-12T10:30:00.000Z",
      /* ...other bill fields... */
    },
    "supplier": {
      "id": "657abc123...",
      "name": "Sharma Trading Co.",
      "pendingAmount": 2500  // Updated amount
    }
  }
}
```

**Business Logic:**
1. Checks if bill is already paid (returns error if yes)
2. Updates: `bill.isPaid = true`
3. Sets: `bill.paidDate = currentDate`
4. Updates: `supplier.pendingAmount -= bill.amount`
5. Ensures `pendingAmount` never goes below 0

**Error Response (400):**
```json
{
  "success": false,
  "message": "Bill is already marked as paid"
}
```

---

### 5. Update Bill
**PUT** `/api/bills/:id`

Updates bill information and recalculates supplier statistics if amount changes.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** (all fields optional)
```json
{
  "amount": 13000,
  "description": "Updated description",
  "dueDate": "2026-01-15T00:00:00.000Z",
  "items": [
    {
      "name": "New Item",
      "quantity": 10,
      "price": 100,
      "unit": "kg"
    }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bill updated successfully",
  "data": {
    "bill": { /* updated bill object */ }
  }
}
```

**Business Logic:**
- **Cannot change amount of paid bills** (returns error)
- If amount changes on unpaid bill:
  - `supplier.totalSpend += (newAmount - oldAmount)`
  - `supplier.pendingAmount += (newAmount - oldAmount)`
- Recalculates supplier statistics automatically

**Error Response (400):**
```json
{
  "success": false,
  "message": "Cannot change amount of a paid bill"
}
```

---

### 6. Delete Bill
**DELETE** `/api/bills/:id`

Deletes a bill and updates supplier statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bill deleted successfully"
}
```

**Business Logic:**
1. Updates: `supplier.totalSpend -= bill.amount`
2. If unpaid: `supplier.pendingAmount -= bill.amount`
3. Updates: `supplier.totalBills -= 1`
4. Recalculates `supplier.lastPurchaseDate` if needed
5. Ensures all values never go below 0

---

## 🔐 Error Responses

All endpoints return consistent error responses:

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Supplier name is required",
      "param": "name",
      "location": "body"
    }
  ]
}
```

**Unauthorized (401):**
```json
{
  "success": false,
  "message": "No token provided. Authorization denied."
}
```

**Not Found (404):**
```json
{
  "success": false,
  "message": "Supplier not found"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "message": "Server error while creating supplier",
  "error": "Detailed error message (only in development mode)"
}
```

---

## 📊 Automatic Calculations

### Supplier Statistics (Auto-Updated)

These fields are automatically calculated and updated:

1. **totalSpend**
   - Increased when: Bill is created
   - Decreased when: Bill is deleted
   - Modified when: Bill amount is updated

2. **pendingAmount**
   - Increased when: Unpaid bill is created
   - Decreased when: Bill is marked as paid or deleted
   - Modified when: Unpaid bill amount is updated

3. **totalBills**
   - Increased when: Bill is created
   - Decreased when: Bill is deleted

4. **lastPurchaseDate**
   - Updated when: Bill is created (if it's the latest)
   - Recalculated when: Latest bill is deleted

### Bill Virtual Fields (Computed)

1. **isOverdue**: `Boolean`
   - `true` if unpaid and past due date
   - `false` if paid or no due date

2. **daysUntilDue**: `Number`
   - Positive: Days until due
   - Negative: Days overdue
   - `null`: If paid or no due date

---

## 🧪 Testing Workflow

1. **Register/Login** → Get JWT token
2. **Create Supplier** → Save supplier ID
3. **Create Unpaid Bill** → Check supplier's pendingAmount increased
4. **Get All Bills** → Verify bill appears with stats
5. **Mark Bill as Paid** → Check supplier's pendingAmount decreased
6. **Create Paid Bill** → Check supplier stats update correctly
7. **Update Bill** → Verify stats recalculate
8. **Delete Bill** → Verify supplier stats update

---

## 💡 Pro Tips

1. **Always check supplier stats after bill operations** to verify calculations
2. **Use query parameters** for filtering and sorting instead of fetching all data
3. **Store JWT token** securely (localStorage/sessionStorage in frontend)
4. **Handle 401 errors** to redirect to login page
5. **Use pagination** for large datasets to improve performance
6. **Check `isOverdue` field** to highlight overdue bills in UI
7. **Prevent amount changes on paid bills** is enforced by API
8. **Cannot delete supplier with bills** - delete bills first

---

## 📝 Implementation Notes

### Data Integrity
- All supplier-bill relationships are maintained automatically
- Cascade effects are handled (bill creation → supplier update)
- Prevents orphaned data (can't delete supplier with bills)

### Performance
- Indexes on frequently queried fields
- Pagination to limit response size
- Lean queries for faster reads
- Aggregation pipeline for statistics

### Security
- All routes protected by JWT authentication
- User isolation (can only see own data)
- Input validation on all fields
- MongoDB injection prevention

---

This API is ready for frontend integration! 🚀
