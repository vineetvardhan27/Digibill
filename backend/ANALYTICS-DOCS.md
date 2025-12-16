# Analytics & Dashboard API Documentation

Complete documentation for analytics, dashboard, and due bills endpoints with MongoDB aggregation pipelines.

---

## 📊 Dashboard Endpoints

### GET /api/dashboard/stats

Get comprehensive dashboard statistics for the logged-in user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalSpend": 395000,
      "totalBills": 145,
      "totalSuppliers": 5,
      "pendingPayments": 28900,
      
      "paidBills": 140,
      "unpaidBills": 5,
      "paidAmount": 366100,
      
      "monthlySpend": 42700,
      "monthlyBills": 12,
      "monthlyChange": 12.5,
      
      "paymentRate": 96.55
    }
  }
}
```

**Fields Explained:**
- `totalSpend`: Total money spent across all suppliers
- `totalBills`: Total number of bills created
- `totalSuppliers`: Total number of suppliers
- `pendingPayments`: Total unpaid amount
- `paidBills` / `unpaidBills`: Count of paid/unpaid bills
- `paidAmount`: Total amount already paid
- `monthlySpend`: Total spend in current month
- `monthlyBills`: Bills created in current month
- `monthlyChange`: Percentage change vs previous month
- `paymentRate`: Percentage of bills that are paid

**MongoDB Aggregation Pipeline:**
```javascript
// Supplier stats
Supplier.aggregate([
  { $match: { createdBy: userId } },
  {
    $group: {
      _id: null,
      totalSuppliers: { $sum: 1 },
      totalSpend: { $sum: '$totalSpend' },
      totalPendingAmount: { $sum: '$pendingAmount' }
    }
  }
])

// Bill stats
Bill.aggregate([
  { $match: { createdBy: userId } },
  {
    $group: {
      _id: null,
      totalBills: { $sum: 1 },
      totalAmount: { $sum: '$amount' },
      paidBills: { $sum: { $cond: ['$isPaid', 1, 0] } },
      unpaidBills: { $sum: { $cond: ['$isPaid', 0, 1] } },
      paidAmount: { $sum: { $cond: ['$isPaid', '$amount', 0] } },
      pendingAmount: { $sum: { $cond: ['$isPaid', 0, '$amount'] } }
    }
  }
])

// Monthly stats (current month)
Bill.aggregate([
  {
    $match: {
      createdBy: userId,
      date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
    }
  },
  {
    $group: {
      _id: null,
      monthlySpend: { $sum: '$amount' },
      monthlyBills: { $sum: 1 }
    }
  }
])
```

---

## 📈 Analytics Endpoints

### GET /api/analytics/charts

Get comprehensive chart data for analytics visualization.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `months` (optional, default: 6) - Number of months to include

**Example:**
```
GET /api/analytics/charts?months=6
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "monthlySpend": [
      {
        "year": 2025,
        "month": 7,
        "monthName": "Jul",
        "totalAmount": 32000,
        "billCount": 15,
        "paidAmount": 30000,
        "unpaidAmount": 2000
      },
      {
        "year": 2025,
        "month": 8,
        "monthName": "Aug",
        "totalAmount": 38000,
        "billCount": 18,
        "paidAmount": 38000,
        "unpaidAmount": 0
      }
      // ... more months
    ],
    "supplierBreakdown": [
      {
        "supplierId": "657abc123...",
        "supplierName": "Sharma Trading Co.",
        "phone": "9876543210",
        "address": "Chandni Chowk, Delhi",
        "totalSpend": 125000,
        "billCount": 45,
        "pendingAmount": 15000,
        "paidAmount": 110000,
        "percentage": 31.65
      }
      // ... top 10 suppliers
    ],
    "categoryBreakdown": [
      {
        "itemName": "Basmati Rice",
        "totalQuantity": 500,
        "totalValue": 75000,
        "avgPrice": 150
      }
      // ... top 10 items
    ],
    "paymentTrends": [
      {
        "year": 2025,
        "month": 12,
        "monthName": "Dec",
        "paymentsCount": 25,
        "paymentsAmount": 125000,
        "avgPaymentTime": 5.2
      }
      // ... last 6 months
    ]
  }
}
```

**MongoDB Aggregation Pipelines:**

#### 1. Monthly Spend (Last N Months)
```javascript
Bill.aggregate([
  {
    $match: {
      createdBy: userId,
      date: { $gte: monthsAgo }
    }
  },
  {
    $group: {
      _id: {
        year: { $year: '$date' },
        month: { $month: '$date' }
      },
      totalAmount: { $sum: '$amount' },
      billCount: { $sum: 1 },
      paidAmount: { $sum: { $cond: ['$isPaid', '$amount', 0] } },
      unpaidAmount: { $sum: { $cond: ['$isPaid', 0, '$amount'] } }
    }
  },
  {
    $sort: { '_id.year': 1, '_id.month': 1 }
  },
  {
    $project: {
      _id: 0,
      year: '$_id.year',
      month: '$_id.month',
      monthName: {
        $arrayElemAt: [
          ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          { $subtract: ['$_id.month', 1] }
        ]
      },
      totalAmount: 1,
      billCount: 1,
      paidAmount: 1,
      unpaidAmount: 1
    }
  }
])
```

**Features:**
- Automatically fills missing months with zero values
- Groups bills by year and month
- Calculates paid vs unpaid amounts per month
- Perfect for line/bar charts

#### 2. Supplier Breakdown (Top 10)
```javascript
Bill.aggregate([
  { $match: { createdBy: userId } },
  {
    $group: {
      _id: '$supplierId',
      totalSpend: { $sum: '$amount' },
      billCount: { $sum: 1 },
      pendingAmount: { $sum: { $cond: ['$isPaid', 0, '$amount'] } },
      paidAmount: { $sum: { $cond: ['$isPaid', '$amount', 0] } }
    }
  },
  {
    $lookup: {
      from: 'suppliers',
      localField: '_id',
      foreignField: '_id',
      as: 'supplier'
    }
  },
  { $unwind: '$supplier' },
  { $sort: { totalSpend: -1 } },
  { $limit: 10 },
  {
    $project: {
      _id: 0,
      supplierId: '$_id',
      supplierName: '$supplier.name',
      phone: '$supplier.phone',
      address: '$supplier.address',
      totalSpend: 1,
      billCount: 1,
      pendingAmount: 1,
      paidAmount: 1
    }
  }
])
```

**Features:**
- Top 10 suppliers by total spend
- Includes percentage of total spend
- Shows pending vs paid amounts per supplier
- Perfect for pie/doughnut charts

#### 3. Category/Item Breakdown (Top 10)
```javascript
Bill.aggregate([
  {
    $match: { 
      createdBy: userId,
      items: { $exists: true, $ne: [] }
    }
  },
  { $unwind: '$items' },
  {
    $group: {
      _id: '$items.name',
      totalQuantity: { $sum: '$items.quantity' },
      totalValue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
      avgPrice: { $avg: '$items.price' }
    }
  },
  { $sort: { totalValue: -1 } },
  { $limit: 10 },
  {
    $project: {
      _id: 0,
      itemName: '$_id',
      totalQuantity: 1,
      totalValue: { $round: ['$totalValue', 2] },
      avgPrice: { $round: ['$avgPrice', 2] }
    }
  }
])
```

**Features:**
- Analyzes bill items (if tracked)
- Shows most purchased items by value
- Calculates average price per item
- Useful for inventory insights

#### 4. Payment Trends
```javascript
Bill.aggregate([
  {
    $match: {
      createdBy: userId,
      isPaid: true,
      paidDate: { $exists: true }
    }
  },
  {
    $group: {
      _id: {
        year: { $year: '$paidDate' },
        month: { $month: '$paidDate' }
      },
      paymentsCount: { $sum: 1 },
      paymentsAmount: { $sum: '$amount' },
      avgPaymentTime: {
        $avg: {
          $divide: [
            { $subtract: ['$paidDate', '$date'] },
            1000 * 60 * 60 * 24  // Days
          ]
        }
      }
    }
  },
  { $sort: { '_id.year': 1, '_id.month': 1 } },
  { $limit: 6 }
])
```

**Features:**
- Tracks when bills are paid
- Calculates average payment time (days between bill date and payment)
- Shows payment patterns over time

---

### GET /api/analytics/summary

Get overall analytics summary with detailed breakdowns.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overall": {
      "totalBills": 145,
      "totalAmount": 395000,
      "avgBillAmount": 2724.14,
      "maxBillAmount": 25000,
      "minBillAmount": 500
    },
    "paymentStatus": {
      "paid": {
        "count": 140,
        "amount": 366100
      },
      "unpaid": {
        "count": 5,
        "amount": 28900
      }
    },
    "overdue": {
      "count": 2,
      "amount": 15000
    }
  }
}
```

**MongoDB Aggregation Pipeline:**
```javascript
Bill.aggregate([
  { $match: { createdBy: userId } },
  {
    $facet: {
      overall: [
        {
          $group: {
            _id: null,
            totalBills: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgBillAmount: { $avg: '$amount' },
            maxBillAmount: { $max: '$amount' },
            minBillAmount: { $min: '$amount' }
          }
        }
      ],
      paymentStatus: [
        {
          $group: {
            _id: '$isPaid',
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        }
      ],
      overdueBills: [
        {
          $match: {
            isPaid: false,
            dueDate: { $lt: new Date() }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        }
      ]
    }
  }
])
```

**Features:**
- Uses `$facet` to run multiple aggregations in one query
- Provides min/max/average bill amounts
- Splits data by payment status
- Identifies overdue bills

---

## ⏰ Due Bills Endpoints

### GET /api/bills/due

Get bills that are overdue or due soon.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `days` (optional, default: 7) - Number of days to look ahead

**Example:**
```
GET /api/bills/due?days=7
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bills": [
      {
        "_id": "657def456...",
        "amount": 12500,
        "date": "2025-12-05T00:00:00.000Z",
        "description": "Rice, Dal, Sugar",
        "dueDate": "2025-12-10T00:00:00.000Z",
        "isPaid": false,
        "supplier": {
          "_id": "657abc123...",
          "name": "Sharma Trading Co.",
          "phone": "9876543210",
          "address": "Chandni Chowk, Delhi"
        },
        "daysUntilDue": -2,
        "status": "overdue"
      },
      {
        "_id": "657def789...",
        "amount": 8500,
        "dueDate": "2025-12-15T00:00:00.000Z",
        "supplier": { /* ... */ },
        "daysUntilDue": 3,
        "status": "due_soon"
      }
    ],
    "grouped": {
      "overdue": [ /* array of overdue bills */ ],
      "dueSoon": [ /* array of due soon bills */ ]
    },
    "stats": {
      "overdue": {
        "count": 2,
        "amount": 15000
      },
      "dueSoon": {
        "count": 3,
        "amount": 13900
      },
      "total": {
        "count": 5,
        "amount": 28900
      }
    }
  }
}
```

**MongoDB Aggregation Pipeline:**
```javascript
Bill.aggregate([
  {
    $match: {
      createdBy: userId,
      isPaid: false,
      dueDate: { $exists: true, $ne: null }
    }
  },
  {
    $addFields: {
      daysUntilDue: {
        $divide: [
          { $subtract: ['$dueDate', currentDate] },
          1000 * 60 * 60 * 24
        ]
      },
      status: {
        $cond: {
          if: { $lt: ['$dueDate', currentDate] },
          then: 'overdue',
          else: {
            $cond: {
              if: { $lte: ['$dueDate', futureDate] },
              then: 'due_soon',
              else: 'upcoming'
            }
          }
        }
      }
    }
  },
  {
    $match: {
      $or: [
        { status: 'overdue' },
        { status: 'due_soon' }
      ]
    }
  },
  {
    $lookup: {
      from: 'suppliers',
      localField: 'supplierId',
      foreignField: '_id',
      as: 'supplier'
    }
  },
  { $unwind: '$supplier' },
  { $sort: { dueDate: 1 } }
])
```

**Status Values:**
- `overdue`: Due date is in the past
- `due_soon`: Due date is within the specified days (default 7)
- `upcoming`: Due date is beyond the specified days

**Features:**
- Calculates days until due (negative = overdue)
- Groups bills by status
- Sorts by due date (earliest first)
- Provides aggregated statistics
- Perfect for alerts and notifications

---

### GET /api/bills/upcoming

Get upcoming bills within a custom date range.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDays` (optional, default: 0) - Start looking N days from now
- `endDays` (optional, default: 30) - Look until N days from now

**Example:**
```
GET /api/bills/upcoming?startDays=7&endDays=30
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bills": [ /* array of upcoming bills */ ],
    "groupedByWeek": {
      "This Week": [ /* bills */ ],
      "Next Week": [ /* bills */ ],
      "In 2-3 Weeks": [ /* bills */ ],
      "Later This Month": [ /* bills */ ]
    },
    "stats": {
      "count": 12,
      "totalAmount": 125000
    }
  }
}
```

**Features:**
- Custom date range filtering
- Automatically groups by week
- Useful for planning upcoming payments
- Can exclude immediate due bills by setting startDays > 0

---

## 💡 Usage Examples

### 1. Dashboard Page
```javascript
// Fetch dashboard stats
const response = await fetch('http://localhost:5000/api/dashboard/stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data: { stats } } = await response.json();

// Display stats
console.log(`Total Spend: ₹${stats.totalSpend}`);
console.log(`Pending Payments: ₹${stats.pendingPayments}`);
console.log(`Monthly Change: ${stats.monthlyChange}%`);
```

### 2. Analytics Charts
```javascript
// Fetch chart data
const response = await fetch('http://localhost:5000/api/analytics/charts?months=6', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();

// Monthly Spend Chart (Line/Bar)
const chartData = {
  labels: data.monthlySpend.map(m => m.monthName),
  datasets: [{
    label: 'Monthly Spend',
    data: data.monthlySpend.map(m => m.totalAmount)
  }]
};

// Supplier Breakdown Chart (Pie/Doughnut)
const pieData = {
  labels: data.supplierBreakdown.map(s => s.supplierName),
  datasets: [{
    data: data.supplierBreakdown.map(s => s.totalSpend)
  }]
};
```

### 3. Due Bills Alert
```javascript
// Fetch due bills
const response = await fetch('http://localhost:5000/api/bills/due?days=7', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();

// Show alert if there are overdue bills
if (data.stats.overdue.count > 0) {
  alert(`⚠️ You have ${data.stats.overdue.count} overdue bills totaling ₹${data.stats.overdue.amount}`);
}

// Show notification for due soon bills
if (data.stats.dueSoon.count > 0) {
  notify(`📅 ${data.stats.dueSoon.count} bills due within 7 days`);
}
```

---

## 🔧 Optimization Tips

1. **Indexes** (already created in models):
   - `{ createdBy: 1, date: -1 }` on Bill
   - `{ createdBy: 1, isPaid: 1 }` on Bill
   - `{ dueDate: 1, isPaid: 1 }` on Bill

2. **Caching**:
   - Dashboard stats can be cached for 5-10 minutes
   - Analytics charts can be cached for 1 hour
   - Due bills should be fresh (no cache)

3. **Pagination**:
   - Not needed for aggregated stats
   - Consider for large datasets in category breakdown

4. **Performance**:
   - All aggregations use indexes
   - `$lookup` is used efficiently (only when needed)
   - `$facet` combines multiple queries into one

---

## 📊 Summary

**Dashboard:**
- ✅ GET /dashboard/stats - Complete overview

**Analytics:**
- ✅ GET /analytics/charts - Monthly spend, supplier breakdown, category analysis
- ✅ GET /analytics/summary - Detailed summary with min/max/avg

**Due Bills:**
- ✅ GET /bills/due - Overdue and due soon bills
- ✅ GET /bills/upcoming - Upcoming bills by date range

All endpoints use MongoDB aggregation pipelines for efficient data processing! 🚀
