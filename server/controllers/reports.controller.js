// backend/controllers/reports.controller.js - COMPLETE FIXED VERSION

import mongoose from 'mongoose';
import Payment from '../models/payment.model.js';
import StudentFee from '../models/studentFee.model.js';
import Enrollment from '../models/enrollment.model.js';
import Student from '../models/student.model.js';
import Course from '../models/course.model.js';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';

// @desc    Generate fee collection report - FOR ALL STUDENTS WITH ENROLLMENTS
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

    // ============================================================
    // STEP 1: Get ALL students with enrollments for overall stats
    // ============================================================
    
    // Get all students with enrollments (active, completed, or graduated)
    const enrollments = await Enrollment.find({
      status: { $in: ['enrolled', 'completed', 'graduated'] }
    })
    .populate({
      path: 'student',
      populate: {
        path: 'user',
        select: 'name email phone'
      }
    })
    .populate('course', 'courseCode name price _id')
    .lean();

    // Calculate overall totals for ALL students
    const overallStats = {
      totalFees: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      totalStudents: 0,
      fullyPaidStudents: 0,
      partialStudents: 0,
      unpaidStudents: 0
    };

    const studentMap = new Map();

    for (const enrollment of enrollments) {
      const studentId = enrollment.student._id.toString();
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          studentId: enrollment.student._id,
          studentName: enrollment.student.user?.name || 'Unknown',
          totalFees: 0,
          totalPaid: 0
        });
      }

      const studentData = studentMap.get(studentId);
      
      // Get payments for this student and course within date range
      const payments = await Payment.find({
        student: enrollment.student._id,
        course: enrollment.course._id,
        status: 'completed',
        paymentDate: { $gte: start, $lte: end }
      }).lean();

      const coursePaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const courseFee = enrollment.course.price || 0;

      studentData.totalFees += courseFee;
      studentData.totalPaid += coursePaid;
    }

    // Calculate overall stats from student map
    for (const [studentId, data] of studentMap) {
      const balance = data.totalFees - data.totalPaid;
      overallStats.totalFees += data.totalFees;
      overallStats.totalCollected += data.totalPaid;
      overallStats.totalOutstanding += Math.max(0, balance);
      overallStats.totalStudents++;

      if (balance === 0 && data.totalPaid > 0) {
        overallStats.fullyPaidStudents++;
      } else if (data.totalPaid > 0 && balance > 0) {
        overallStats.partialStudents++;
      } else if (data.totalPaid === 0 && data.totalFees > 0) {
        overallStats.unpaidStudents++;
      }
    }

    const overallCollectionRate = overallStats.totalFees > 0 
      ? Math.round((overallStats.totalCollected / overallStats.totalFees) * 100) 
      : 0;

    // ============================================================
    // STEP 2: Payment aggregation by period for detailed report
    // ============================================================

    let groupFormat;
    if (groupBy === 'day') {
      groupFormat = '%Y-%m-%d';
    } else if (groupBy === 'month') {
      groupFormat = '%Y-%m';
    } else if (groupBy === 'course') {
      groupFormat = null;
    }

    let data;
    if (groupBy === 'course') {
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

    // ============================================================
    // RESPONSE: Include overall stats for ALL students
    // ============================================================

    const reportData = {
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        // Overall summary for ALL students (Collection Report)
        overall: {
          totalStudents: overallStats.totalStudents,
          totalFees: overallStats.totalFees,
          totalCollected: overallStats.totalCollected,
          totalOutstanding: overallStats.totalOutstanding,
          collectionRate: overallCollectionRate,
          fullyPaidStudents: overallStats.fullyPaidStudents,
          partialStudents: overallStats.partialStudents,
          unpaidStudents: overallStats.unpaidStudents,
          averageOutstanding: overallStats.totalStudents > 0 
            ? Math.round(overallStats.totalOutstanding / overallStats.totalStudents) 
            : 0
        },
        // Payment summary (from payment records)
        payments: {
          totalAmount: totals[0]?.totalAmount || 0,
          totalPayments: totals[0]?.totalPayments || 0,
          averageAmount: totals[0]?.averageAmount || 0,
          methodTotals
        }
      },
      details: data,
      studentBreakdown: {
        totalStudents: overallStats.totalStudents,
        fullyPaid: overallStats.fullyPaidStudents,
        partial: overallStats.partialStudents,
        unpaid: overallStats.unpaidStudents
      }
    };

    if (format === 'csv') {
      const summaryRows = [
        ['COLLECTION REPORT - ALL STUDENTS'],
        ['Period:', `${startDate} to ${endDate}`],
        [''],
        ['SUMMARY STATISTICS'],
        ['Total Students', overallStats.totalStudents],
        ['Total Fees', overallStats.totalFees],
        ['Total Collected', overallStats.totalCollected],
        ['Total Outstanding', overallStats.totalOutstanding],
        ['Collection Rate', `${overallCollectionRate}%`],
        ['Fully Paid Students', overallStats.fullyPaidStudents],
        ['Partial Payment Students', overallStats.partialStudents],
        ['Unpaid Students', overallStats.unpaidStudents],
        [''],
        ['DETAILED BREAKDOWN']
      ];

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
      const summaryCSV = summaryRows.map(row => row.join(',')).join('\n');
      const finalCSV = summaryCSV + '\n' + csv;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition', 
        `attachment; filename=collection_report_${startDate}_to_${endDate}.csv`
      );
      return res.send(finalCSV);
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

// @desc    Generate outstanding fees report - FIXED TO INCLUDE ALL STUDENTS
// @route   GET /api/reports/outstanding
// @access  Private (Admin)
export const getOutstandingReport = async (req, res, next) => {
  try {
    const { minBalance = 0, courseId, format = 'json' } = req.query;
    const minBalanceNum = parseFloat(minBalance);

    console.log('📊 Fetching outstanding report with params:', { minBalance: minBalanceNum, courseId });

    // ============================================================
    // STEP 1: Get ALL students with enrollments (including completed/graduated)
    // ============================================================
    // FIXED: Include ALL enrollment statuses - enrolled, completed, graduated
    const enrollmentMatch = { 
      status: { $in: ['enrolled', 'completed', 'graduated'] } 
    };
    if (courseId) {
      enrollmentMatch.course = new mongoose.Types.ObjectId(courseId);
    }

    const enrollments = await Enrollment.find(enrollmentMatch)
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name email phone'
        }
      })
      .populate('course', 'courseCode name price _id')
      .lean();

    console.log(`📊 Found ${enrollments.length} enrollments (including completed/graduated)`);

    if (!enrollments || enrollments.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: {
            totalStudents: 0,
            totalOutstanding: 0,
            averageOutstanding: 0,
            unpaidCount: 0,
            partialCount: 0,
            paidCount: 0,
            totalFees: 0,
            totalPaid: 0
          },
          students: []
        }
      });
    }

    // Step 2: Group enrollments by student and calculate totals
    const studentMap = new Map();

    for (const enrollment of enrollments) {
      const studentId = enrollment.student._id.toString();
      const courseIdStr = enrollment.course._id.toString();
      
      if (!studentMap.has(studentId)) {
        // Determine student status from enrollment or student record
        let studentStatus = enrollment.student?.status || 'unknown';
        
        // If student is graduated or has completed enrollments, mark accordingly
        if (studentStatus === 'graduated') {
          studentStatus = 'graduated';
        } else if (enrollment.status === 'completed') {
          studentStatus = 'completed';
        } else if (enrollment.status === 'enrolled') {
          studentStatus = 'enrolled';
        }
        
        studentMap.set(studentId, {
          studentId: enrollment.student._id,
          studentNumber: enrollment.student.studentId || 'N/A',
          studentName: enrollment.student.user?.name || 'Unknown',
          email: enrollment.student.user?.email || '',
          phone: enrollment.student.phone || '',
          studentStatus: studentStatus,
          courses: [],
          totalFees: 0,
          totalPaid: 0,
          totalBalance: 0,
          paymentPercentage: 0,
          status: 'unpaid'
        });
      }

      const studentData = studentMap.get(studentId);
      
      // Get payments for this student and course
      const payments = await Payment.find({
        student: enrollment.student._id,
        course: enrollment.course._id,
        status: 'completed'
      }).lean();

      let coursePaid = 0;
      let paymentsCount = 0;
      let lastPaymentDate = null;

      if (payments && payments.length > 0) {
        coursePaid = payments.reduce((sum, p) => sum + p.amount, 0);
        paymentsCount = payments.length;
        lastPaymentDate = payments[payments.length - 1]?.paymentDate || null;
      }

      const courseFee = enrollment.course.price || 0;
      const courseBalance = Math.max(0, courseFee - coursePaid);

      studentData.courses.push({
        courseId: enrollment.course._id,
        courseCode: enrollment.course.courseCode,
        courseName: enrollment.course.name,
        price: courseFee,
        paid: coursePaid,
        balance: courseBalance,
        status: courseBalance === 0 ? 'paid' : coursePaid > 0 ? 'partial' : 'unpaid',
        lastPaymentDate,
        paymentsCount,
        enrollmentStatus: enrollment.status // Track the enrollment status
      });

      studentData.totalFees += courseFee;
      studentData.totalPaid += coursePaid;
      studentData.totalBalance += courseBalance;
    }

    // Step 3: Calculate percentages and status for each student
    const allStudents = Array.from(studentMap.values()).map(student => {
      student.paymentPercentage = student.totalFees > 0 
        ? Math.round((student.totalPaid / student.totalFees) * 100) 
        : 0;
      
      student.status = student.totalBalance === 0 ? 'paid' : 
                       student.totalPaid > 0 ? 'partial' : 'unpaid';
      
      return student;
    });

    // Step 4: Filter by minBalance if specified
    let filteredStudents = allStudents;
    if (minBalanceNum > 0) {
      filteredStudents = allStudents.filter(s => s.totalBalance >= minBalanceNum);
    }

    // Sort by balance descending (highest first)
    filteredStudents.sort((a, b) => b.totalBalance - a.totalBalance);

    // Step 5: Calculate summary statistics - FOR ALL STUDENTS
    const summary = {
      totalStudents: filteredStudents.length,
      totalOutstanding: filteredStudents.reduce((sum, s) => sum + s.totalBalance, 0),
      averageOutstanding: filteredStudents.length > 0 
        ? Math.round(filteredStudents.reduce((sum, s) => sum + s.totalBalance, 0) / filteredStudents.length)
        : 0,
      unpaidCount: filteredStudents.filter(s => s.totalPaid === 0 && s.totalBalance > 0).length,
      partialCount: filteredStudents.filter(s => s.totalPaid > 0 && s.totalBalance > 0).length,
      paidCount: filteredStudents.filter(s => s.totalBalance === 0).length,
      totalFees: filteredStudents.reduce((sum, s) => sum + s.totalFees, 0),
      totalPaid: filteredStudents.reduce((sum, s) => sum + s.totalPaid, 0),
      // Additional breakdown by enrollment status
      enrolledCount: filteredStudents.filter(s => s.studentStatus === 'enrolled').length,
      completedCount: filteredStudents.filter(s => s.studentStatus === 'completed' || s.studentStatus === 'graduated').length
    };

    console.log('📊 Outstanding report summary (ALL STUDENTS):', summary);

    // Step 6: Format response
    const responseData = {
      summary,
      students: filteredStudents.map(s => ({
        studentId: s.studentId,
        studentNumber: s.studentNumber,
        studentName: s.studentName,
        email: s.email,
        phone: s.phone,
        studentStatus: s.studentStatus,
        totalFees: s.totalFees,
        totalPaid: s.totalPaid,
        totalBalance: s.totalBalance,
        paymentPercentage: s.paymentPercentage,
        status: s.status,
        courses: s.courses
      }))
    };

    // Handle CSV export
    if (format === 'csv') {
      const csvData = [];
      filteredStudents.forEach(student => {
        if (student.courses.length > 0) {
          student.courses.forEach(course => {
            csvData.push({
              'Student ID': student.studentNumber,
              'Student Name': student.studentName,
              'Email': student.email,
              'Phone': student.phone,
              'Student Status': student.studentStatus || 'N/A',
              'Course Code': course.courseCode,
              'Course Name': course.courseName,
              'Course Price': course.price,
              'Amount Paid': course.paid,
              'Balance': course.balance,
              'Payment Status': course.status,
              'Last Payment': course.lastPaymentDate ? new Date(course.lastPaymentDate).toLocaleDateString() : 'N/A'
            });
          });
        } else {
          csvData.push({
            'Student ID': student.studentNumber,
            'Student Name': student.studentName,
            'Email': student.email,
            'Phone': student.phone,
            'Student Status': student.studentStatus || 'N/A',
            'Course Code': 'N/A',
            'Course Name': 'No courses',
            'Course Price': 0,
            'Amount Paid': 0,
            'Balance': 0,
            'Payment Status': 'No courses',
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
      data: responseData
    });

  } catch (error) {
    console.error('Outstanding report error:', error);
    next(errorHandler(500, error.message));
  }
};