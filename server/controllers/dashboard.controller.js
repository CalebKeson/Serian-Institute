import Payment from '../models/payment.model.js';
import StudentFee from '../models/student.model.js';
import Course from '../models/course.model.js';
import Student from '../models/student.model.js';
import Enrollment from '../models/enrollment.model.js';
import { errorHandler } from '../utils/error.js';

// @desc    Get financial dashboard data
// @route   GET /api/dashboard/financial
// @access  Private (Admin, Instructor)
export const getFinancialDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Get today's collections
    const todayPayments = await Payment.aggregate([
      {
        $match: {
          paymentDate: {
            $gte: new Date(today.setHours(0, 0, 0, 0)),
            $lte: new Date(today.setHours(23, 59, 59, 999))
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get this month's collections
    const monthPayments = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: startOfMonth },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get this year's collections
    const yearPayments = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: startOfYear },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get outstanding balances
    const outstandingStats = await StudentFee.aggregate([
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: '$totalBalance' },
          totalFees: { $sum: '$totalFees' },
          totalPaid: { $sum: '$totalPaid' },
          studentCount: { $sum: 1 }
        }
      }
    ]);

    // Get students with highest outstanding
    const topDefaulters = await StudentFee.find({ totalBalance: { $gt: 0 } })
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort({ totalBalance: -1 })
      .limit(5);

    // Get payment method breakdown for this month
    const methodBreakdown = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: startOfMonth },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          method: '$_id',
          methodDisplay: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'mpesa'] }, then: 'M-Pesa' },
                { case: { $eq: ['$_id', 'cooperative_bank'] }, then: 'Co-operative Bank' },
                { case: { $eq: ['$_id', 'family_bank'] }, then: 'Family Bank' },
                { case: { $eq: ['$_id', 'cash'] }, then: 'Cash' }
              ],
              default: 'Other'
            }
          },
          total: 1,
          count: 1
        }
      }
    ]);

    // Get daily trend for this month
    const dailyTrend = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: startOfMonth },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get course-wise collection
    const courseCollections = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: startOfYear },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$course',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      { $unwind: '$courseInfo' },
      {
        $project: {
          courseCode: '$courseInfo.courseCode',
          courseName: '$courseInfo.name',
          total: 1,
          count: 1,
          expectedRevenue: '$courseInfo.price',
          enrolledCount: { $size: '$courseInfo.enrolledStudents' }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        collections: {
          today: todayPayments[0]?.total || 0,
          thisMonth: monthPayments[0]?.total || 0,
          thisYear: yearPayments[0]?.total || 0,
          todayCount: todayPayments[0]?.count || 0,
          monthCount: monthPayments[0]?.count || 0,
          yearCount: yearPayments[0]?.count || 0
        },
        outstanding: outstandingStats[0] || {
          totalOutstanding: 0,
          totalFees: 0,
          totalPaid: 0,
          studentCount: 0
        },
        topDefaulters: topDefaulters.map(d => ({
          studentId: d.student?.studentId,
          name: d.student?.user?.name,
          balance: d.totalBalance,
          percentage: d.overallPercentage,
          courses: d.courses.length
        })),
        paymentMethods: methodBreakdown,
        dailyTrend,
        topCourses: courseCollections
      }
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};