// controllers/reports.controller.js
import Payment from '../models/payment.model.js'; // ADD THIS IMPORT
import StudentFee from '../models/studentFee.model.js';
import { errorHandler } from '../utils/error.js';

// @desc    Generate fee collection report
// @route   GET /api/reports/collections
// @access  Private (Admin)
export const getCollectionReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day', format = 'json' } = req.query;

    if (!startDate || !endDate) {
      return next(errorHandler(400, 'Start date and end date are required'));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let groupFormat;
    if (groupBy === 'day') {
      groupFormat = '%Y-%m-%d';
    } else if (groupBy === 'month') {
      groupFormat = '%Y-%m';
    } else if (groupBy === 'course') {
      groupFormat = null; // Handle separately
    }

    let data;
    if (groupBy === 'course') {
      // Group by course
      data = await Payment.aggregate([
        {
          $match: {
            paymentDate: { $gte: start, $lte: end },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$course',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            payments: { $push: '$$ROOT' }
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
            averagePerPayment: { $divide: ['$total', '$count'] }
          }
        },
        { $sort: { total: -1 } }
      ]);
    } else {
      // Group by time period
      data = await Payment.aggregate([
        {
          $match: {
            paymentDate: { $gte: start, $lte: end },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: groupFormat, date: '$paymentDate' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            byMethod: {
              $push: {
                method: '$paymentMethod',
                amount: '$amount'
              }
            }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      // Add method breakdown for each period
      data = data.map(item => {
        const methodBreakdown = {};
        item.byMethod.forEach(p => {
          if (!methodBreakdown[p.method]) {
            methodBreakdown[p.method] = 0;
          }
          methodBreakdown[p.method] += p.amount;
        });
        
        return {
          period: item._id,
          total: item.total,
          count: item.count,
          methodBreakdown
        };
      });
    }

    // Calculate totals
    const totals = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalPayments: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
          byMethod: {
            $push: {
              method: '$paymentMethod',
              amount: '$amount'
            }
          }
        }
      }
    ]);

    const methodTotals = {};
    if (totals[0]) {
      totals[0].byMethod.forEach(p => {
        if (!methodTotals[p.method]) {
          methodTotals[p.method] = 0;
        }
        methodTotals[p.method] += p.amount;
      });
    }

    const reportData = {
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        totalAmount: totals[0]?.totalAmount || 0,
        totalPayments: totals[0]?.totalPayments || 0,
        averageAmount: totals[0]?.averageAmount || 0,
        methodTotals
      },
      details: data
    };

    if (format === 'csv') {
      // Flatten data for CSV
      let csvData = [];
      if (groupBy === 'course') {
        csvData = data.map(d => ({
          'Course Code': d.courseCode,
          'Course Name': d.courseName,
          'Total Collected': d.total,
          'Number of Payments': d.count,
          'Average Payment': d.averagePerPayment
        }));
      } else {
        csvData = data.map(d => ({
          'Period': d.period,
          'Total': d.total,
          'Payments Count': d.count,
          'M-Pesa': d.methodBreakdown?.mpesa || 0,
          'Co-operative Bank': d.methodBreakdown?.cooperative_bank || 0,
          'Family Bank': d.methodBreakdown?.family_bank || 0,
          'Cash': d.methodBreakdown?.cash || 0
        }));
      }

      const { Parser } = await import('json2csv');
      const parser = new Parser();
      const csv = parser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition', 
        `attachment; filename=collection_report_${startDate}_to_${endDate}.csv`
      );
      return res.send(csv);
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Collection report error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Generate outstanding fees report
// @route   GET /api/reports/outstanding
// @access  Private (Admin)
export const getOutstandingReport = async (req, res, next) => {
  try {
    const { minBalance = 0, courseId, format = 'json' } = req.query;
    const minBalanceNum = parseFloat(minBalance);

    console.log('Fetching outstanding report with params:', { minBalance: minBalanceNum, courseId });

    // Build query
    let query = {};
    if (minBalanceNum > 0) {
      query.totalBalance = { $gt: minBalanceNum };
    }

    // If courseId is provided, filter students enrolled in that course
    if (courseId) {
      // This would need to be handled differently - maybe join with enrollments
      // For now, we'll just log it
      console.log('Filtering by course:', courseId);
    }

    const studentFees = await StudentFee.find(query)
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      })
      .populate('courses.course', 'courseCode name price')
      .sort({ totalBalance: -1 });

    console.log(`Found ${studentFees.length} student fee records`);

    // If no student fees found, return empty structure
    if (!studentFees || studentFees.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: {
            totalStudents: 0,
            totalOutstanding: 0,
            averageOutstanding: 0,
            unpaidCount: 0,
            partialCount: 0
          },
          students: []
        }
      });
    }

    const reportData = studentFees.map(fee => {
      // Calculate per-student statistics
      const totalFees = fee.totalFees || 0;
      const totalPaid = fee.totalPaid || 0;
      const totalBalance = fee.totalBalance || 0;
      const paymentPercentage = totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0;

      // Determine status
      let status = 'unpaid';
      if (totalBalance === 0) {
        status = 'paid';
      } else if (totalPaid > 0) {
        status = 'partial';
      }

      return {
        studentId: fee.student?._id,
        studentNumber: fee.student?.studentId,
        studentName: fee.student?.user?.name || 'Unknown',
        email: fee.student?.user?.email || '',
        phone: fee.student?.phone || '',
        totalFees: totalFees,
        totalPaid: totalPaid,
        totalBalance: totalBalance,
        paymentPercentage: paymentPercentage,
        status: status,
        courses: (fee.courses || []).map(c => ({
          courseId: c.course?._id,
          courseCode: c.course?.courseCode,
          courseName: c.course?.name,
          price: c.coursePrice || 0,
          paid: c.totalPaid || 0,
          balance: c.remainingBalance || 0,
          status: c.status || 'unpaid',
          lastPaymentDate: c.lastPaymentDate,
          paymentsCount: c.payments?.length || 0
        }))
      };
    });

    // Calculate summary statistics
    const summary = {
      totalStudents: reportData.length,
      totalOutstanding: reportData.reduce((sum, s) => sum + s.totalBalance, 0),
      averageOutstanding: reportData.length > 0 
        ? Math.round(reportData.reduce((sum, s) => sum + s.totalBalance, 0) / reportData.length)
        : 0,
      unpaidCount: reportData.filter(s => s.totalPaid === 0).length,
      partialCount: reportData.filter(s => s.totalPaid > 0 && s.totalBalance > 0).length,
      paidCount: reportData.filter(s => s.totalBalance === 0).length
    };

    console.log('Summary:', summary);

    // Handle CSV export if needed
    if (format === 'csv') {
      const csvData = [];
      reportData.forEach(student => {
        if (student.courses.length > 0) {
          student.courses.forEach(course => {
            csvData.push({
              'Student ID': student.studentNumber,
              'Student Name': student.studentName,
              'Email': student.email,
              'Phone': student.phone,
              'Course Code': course.courseCode,
              'Course Name': course.courseName,
              'Course Price': course.price,
              'Amount Paid': course.paid,
              'Balance': course.balance,
              'Status': course.status,
              'Last Payment': course.lastPaymentDate ? new Date(course.lastPaymentDate).toLocaleDateString() : 'N/A'
            });
          });
        } else {
          // Student has no courses? This shouldn't happen, but handle it
          csvData.push({
            'Student ID': student.studentNumber,
            'Student Name': student.studentName,
            'Email': student.email,
            'Phone': student.phone,
            'Course Code': 'N/A',
            'Course Name': 'No courses',
            'Course Price': 0,
            'Amount Paid': 0,
            'Balance': 0,
            'Status': 'No courses',
            'Last Payment': 'N/A'
          });
        }
      });

      const { Parser } = await import('json2csv');
      const parser = new Parser();
      const csv = parser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition', 
        `attachment; filename=outstanding_report_${new Date().toISOString().split('T')[0]}.csv`
      );
      return res.send(csv);
    }

    res.json({
      success: true,
      data: {
        summary,
        students: reportData
      }
    });

  } catch (error) {
    console.error('Outstanding report error:', error);
    next(errorHandler(500, error.message));
  }
};