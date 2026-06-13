import express from 'express';
import Bill from '../models/Bill.js';
import Supplier from '../models/Supplier.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// ==================== DASHBOARD ROUTES ====================

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics for the logged-in user
// @access  Private
router.get('/dashboard/stats', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get supplier stats
    const supplierStats = await Supplier.aggregate([
      {
        $match: { createdBy: userId }
      },
      {
        $group: {
          _id: null,
          totalSuppliers: { $sum: 1 },
          totalSpend: { $sum: '$totalSpend' },
          totalPendingAmount: { $sum: '$pendingAmount' }
        }
      }
    ]);

    // Get bill stats
    const billStats = await Bill.aggregate([
      {
        $match: { createdBy: userId }
      },
      {
        $group: {
          _id: null,
          totalBills: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          paidBills: {
            $sum: { $cond: ['$isPaid', 1, 0] }
          },
          unpaidBills: {
            $sum: { $cond: ['$isPaid', 0, 1] }
          },
          paidAmount: {
            $sum: { $cond: ['$isPaid', '$amount', 0] }
          },
          pendingAmount: {
            $sum: { $cond: ['$isPaid', 0, '$amount'] }
          }
        }
      }
    ]);

    // Get current month stats
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

    const monthlyStats = await Bill.aggregate([
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
    ]);

    // Get previous month stats for comparison
    const firstDayOfPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const lastDayOfPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0, 23, 59, 59);

    const prevMonthStats = await Bill.aggregate([
      {
        $match: {
          createdBy: userId,
          date: { $gte: firstDayOfPrevMonth, $lte: lastDayOfPrevMonth }
        }
      },
      {
        $group: {
          _id: null,
          prevMonthSpend: { $sum: '$amount' }
        }
      }
    ]);

    // Calculate month-over-month change
    const currentMonthSpend = monthlyStats[0]?.monthlySpend || 0;
    const previousMonthSpend = prevMonthStats[0]?.prevMonthSpend || 0;
    const monthlyChange = previousMonthSpend > 0 
      ? ((currentMonthSpend - previousMonthSpend) / previousMonthSpend) * 100 
      : 0;

    // Combine all stats
    const stats = {
      totalSpend: supplierStats[0]?.totalSpend || 0,
      totalBills: billStats[0]?.totalBills || 0,
      totalSuppliers: supplierStats[0]?.totalSuppliers || 0,
      pendingPayments: billStats[0]?.pendingAmount || 0,
      
      // Additional useful stats
      paidBills: billStats[0]?.paidBills || 0,
      unpaidBills: billStats[0]?.unpaidBills || 0,
      paidAmount: billStats[0]?.paidAmount || 0,
      
      // Monthly stats
      monthlySpend: currentMonthSpend,
      monthlyBills: monthlyStats[0]?.monthlyBills || 0,
      monthlyChange: parseFloat(monthlyChange.toFixed(2)),
      
      // Percentage calculations
      paymentRate: billStats[0]?.totalBills > 0 
        ? parseFloat(((billStats[0]?.paidBills / billStats[0]?.totalBills) * 100).toFixed(2))
        : 0
    };

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== ANALYTICS ROUTES ====================

// @route   GET /api/analytics/charts
// @desc    Get chart data for analytics (monthly spend & supplier breakdown)
// @access  Private
router.get('/analytics/charts', async (req, res) => {
  try {
    const userId = req.user._id;
    const { months = 6 } = req.query;

    // Calculate date range for last N months
    const currentDate = new Date();
    const monthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - parseInt(months), 1);

    // ========== MONTHLY SPEND AGGREGATION ==========
    const monthlySpendData = await Bill.aggregate([
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
          paidAmount: {
            $sum: { $cond: ['$isPaid', '$amount', 0] }
          },
          unpaidAmount: {
            $sum: { $cond: ['$isPaid', 0, '$amount'] }
          }
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
    ]);

    // Fill in missing months with zero values
    const filledMonthlyData = [];
    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[date.getMonth()];

      const existingData = monthlySpendData.find(d => d.year === year && d.month === month);
      
      filledMonthlyData.push({
        year,
        month,
        monthName,
        totalAmount: existingData?.totalAmount || 0,
        billCount: existingData?.billCount || 0,
        paidAmount: existingData?.paidAmount || 0,
        unpaidAmount: existingData?.unpaidAmount || 0
      });
    }

    // ========== SUPPLIER BREAKDOWN AGGREGATION ==========
    const supplierBreakdown = await Bill.aggregate([
      {
        $match: { createdBy: userId }
      },
      {
        $group: {
          _id: '$supplierId',
          totalSpend: { $sum: '$amount' },
          billCount: { $sum: 1 },
          pendingAmount: {
            $sum: { $cond: ['$isPaid', 0, '$amount'] }
          },
          paidAmount: {
            $sum: { $cond: ['$isPaid', '$amount', 0] }
          }
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
      {
        $unwind: '$supplier'
      },
      {
        $sort: { totalSpend: -1 }
      },
      {
        $limit: 10  // Top 10 suppliers
      },
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
    ]);

    // Calculate percentages for supplier breakdown
    const totalSpendAllSuppliers = supplierBreakdown.reduce((sum, s) => sum + s.totalSpend, 0);
    const supplierBreakdownWithPercentage = supplierBreakdown.map(supplier => ({
      ...supplier,
      percentage: totalSpendAllSuppliers > 0 
        ? parseFloat(((supplier.totalSpend / totalSpendAllSuppliers) * 100).toFixed(2))
        : 0
    }));

    // ========== CATEGORY/TAG ANALYSIS (if items are tracked) ==========
    const categoryBreakdown = await Bill.aggregate([
      {
        $match: { 
          createdBy: userId,
          items: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.name',
          totalQuantity: { $sum: '$items.quantity' },
          totalValue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          avgPrice: { $avg: '$items.price' }
        }
      },
      {
        $sort: { totalValue: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 0,
          itemName: '$_id',
          totalQuantity: 1,
          totalValue: { $round: ['$totalValue', 2] },
          avgPrice: { $round: ['$avgPrice', 2] }
        }
      }
    ]);

    // ========== PAYMENT TRENDS ==========
    const paymentTrends = await Bill.aggregate([
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
                1000 * 60 * 60 * 24  // Convert to days
              ]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 6
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
          paymentsCount: 1,
          paymentsAmount: 1,
          avgPaymentTime: { $round: ['$avgPaymentTime', 1] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        monthlySpend: filledMonthlyData,
        supplierBreakdown: supplierBreakdownWithPercentage,
        categoryBreakdown,
        paymentTrends
      }
    });
  } catch (error) {
    console.error('Get analytics charts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/analytics/summary
// @desc    Get overall analytics summary
// @access  Private
router.get('/analytics/summary', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get detailed analytics summary
    const summary = await Bill.aggregate([
      {
        $match: { createdBy: userId }
      },
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
    ]);

    const overall = summary[0].overall[0] || {
      totalBills: 0,
      totalAmount: 0,
      avgBillAmount: 0,
      maxBillAmount: 0,
      minBillAmount: 0
    };

    const paymentStatus = summary[0].paymentStatus.reduce((acc, item) => {
      if (item._id) {
        acc.paid = { count: item.count, amount: item.amount };
      } else {
        acc.unpaid = { count: item.count, amount: item.amount };
      }
      return acc;
    }, { paid: { count: 0, amount: 0 }, unpaid: { count: 0, amount: 0 } });

    const overdue = summary[0].overdueBills[0] || { count: 0, amount: 0 };

    res.status(200).json({
      success: true,
      data: {
        overall: {
          ...overall,
          avgBillAmount: parseFloat(overall.avgBillAmount.toFixed(2))
        },
        paymentStatus,
        overdue
      }
    });
  } catch (error) {
    console.error('Get analytics summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/analytics/forecast
// @desc    Get cash flow forecast for upcoming days
// @access  Private
router.get('/analytics/forecast', async (req, res) => {
  try {
    const userId = req.user._id;
    let days = parseInt(req.query.days) || 30;
    
    // Cap at 90 days
    if (days > 90) days = 90;

    const { generateForecast } = await import('../services/forecastService.js');
    const forecast = await generateForecast(userId, days);

    res.status(200).json({
      success: true,
      data: forecast
    });
  } catch (error) {
    console.error('Get forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating forecast',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== DUE BILLS ROUTES ====================

// @route   GET /api/bills/due
// @desc    Get bills that are due soon (within 7 days) or overdue
// @access  Private
router.get('/bills/due', async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 7 } = req.query;

    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + parseInt(days));

    // Get due and overdue bills
    const dueBills = await Bill.aggregate([
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
      {
        $unwind: '$supplier'
      },
      {
        $sort: { dueDate: 1 }  // Sort by due date (earliest first)
      },
      {
        $project: {
          _id: 1,
          amount: 1,
          date: 1,
          description: 1,
          dueDate: 1,
          isPaid: 1,
          items: 1,
          imageUrl: 1,
          createdAt: 1,
          updatedAt: 1,
          supplier: {
            _id: '$supplier._id',
            name: '$supplier.name',
            phone: '$supplier.phone',
            address: '$supplier.address'
          },
          daysUntilDue: { $round: ['$daysUntilDue', 0] },
          status: 1
        }
      }
    ]);

    // Calculate statistics
    const stats = {
      overdue: {
        count: dueBills.filter(b => b.status === 'overdue').length,
        amount: dueBills
          .filter(b => b.status === 'overdue')
          .reduce((sum, b) => sum + b.amount, 0)
      },
      dueSoon: {
        count: dueBills.filter(b => b.status === 'due_soon').length,
        amount: dueBills
          .filter(b => b.status === 'due_soon')
          .reduce((sum, b) => sum + b.amount, 0)
      },
      total: {
        count: dueBills.length,
        amount: dueBills.reduce((sum, b) => sum + b.amount, 0)
      }
    };

    // Group by status
    const groupedBills = {
      overdue: dueBills.filter(b => b.status === 'overdue'),
      dueSoon: dueBills.filter(b => b.status === 'due_soon')
    };

    res.status(200).json({
      success: true,
      data: {
        bills: dueBills,
        grouped: groupedBills,
        stats
      }
    });
  } catch (error) {
    console.error('Get due bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching due bills',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/bills/upcoming
// @desc    Get upcoming bills (within custom date range)
// @access  Private
router.get('/bills/upcoming', async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDays = 0, endDays = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + parseInt(startDays));

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(endDays));

    const upcomingBills = await Bill.find({
      createdBy: userId,
      isPaid: false,
      dueDate: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .populate('supplierId', 'name phone address')
      .sort({ dueDate: 1 })
      .lean();

    // Group by week
    const groupedByWeek = upcomingBills.reduce((acc, bill) => {
      const daysUntilDue = Math.ceil((new Date(bill.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      let weekLabel;

      if (daysUntilDue <= 7) {
        weekLabel = 'This Week';
      } else if (daysUntilDue <= 14) {
        weekLabel = 'Next Week';
      } else if (daysUntilDue <= 21) {
        weekLabel = 'In 2-3 Weeks';
      } else {
        weekLabel = 'Later This Month';
      }

      if (!acc[weekLabel]) {
        acc[weekLabel] = [];
      }
      acc[weekLabel].push(bill);
      return acc;
    }, {});

    const totalAmount = upcomingBills.reduce((sum, bill) => sum + bill.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        bills: upcomingBills,
        groupedByWeek,
        stats: {
          count: upcomingBills.length,
          totalAmount
        }
      }
    });
  } catch (error) {
    console.error('Get upcoming bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching upcoming bills',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
