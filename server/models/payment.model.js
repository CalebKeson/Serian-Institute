// backend/models/payment.model.js - COMPLETE UPDATED VERSION

import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student is required'],
    index: true
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: [true, 'Enrollment is required'],
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required'],
    index: true
  },
  paymentDate: {
    type: Date,
    required: [true, 'Payment date is required'],
    default: Date.now
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['mpesa', 'cooperative_bank', 'family_bank', 'cash', 'bank_transfer', 'other'],
    default: 'cash'
  },
  
  // ============= PAYER INFORMATION =============
  payerName: {
    type: String,
    trim: true,
    required: [true, 'Payer name is required'],
    description: 'Name of the person making the payment (parent/guardian/student)'
  },
  payerRelationship: {
    type: String,
    enum: ['self', 'parent', 'guardian', 'sponsor', 'employer', 'other'],
    default: 'self',
    description: 'Relationship of payer to the student'
  },
  payerContact: {
    type: String,
    trim: true,
    description: 'Phone number or email of the payer'
  },
  payerNotes: {
    type: String,
    trim: true,
    maxlength: [200, 'Payer notes cannot exceed 200 characters']
  },
  
  // ============= RECEIPT NUMBER =============
  receiptNumber: {
    type: String,
    trim: true,
    required: [true, 'Receipt number is required'],
    unique: true,
    sparse: true,
    description: 'Receipt book number (e.g., RCP-001, 2024-001)'
  },
  
  // ============= EXISTING FIELDS =============
  transactionId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
    description: 'M-Pesa transaction ID or bank reference number'
  },
  paymentReference: {
    type: String,
    trim: true,
    description: 'Internal reference or additional reference number'
  },
  paymentFor: {
    type: String,
    enum: ['tuition', 'registration', 'exam_fee', 'lab_fee', 'materials', 'other'],
    required: [true, 'Payment purpose is required'],
    default: 'tuition'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recorded by user is required']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed',
    index: true
  },
  receiptGenerated: {
    type: Boolean,
    default: false
  },
  receiptUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
paymentSchema.index({ receiptNumber: 1 }, { unique: true, sparse: true });
paymentSchema.index({ payerName: 1 });
paymentSchema.index({ payerRelationship: 1 });
paymentSchema.index({ student: 1, course: 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ paymentMethod: 1, status: 1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `KSh ${this.amount.toLocaleString()}`;
});

// Virtual for payment method display
paymentSchema.virtual('paymentMethodDisplay').get(function() {
  const methods = {
    mpesa: 'M-Pesa',
    cooperative_bank: 'Co-operative Bank',
    family_bank: 'Family Bank',
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    other: 'Other'
  };
  return methods[this.paymentMethod] || this.paymentMethod;
});

// Virtual for payment purpose display
paymentSchema.virtual('paymentForDisplay').get(function() {
  const purposes = {
    tuition: 'Tuition Fee',
    registration: 'Registration Fee',
    exam_fee: 'Examination Fee',
    lab_fee: 'Skills Lab Fee',
    materials: 'Learning Materials',
    other: 'Other'
  };
  return purposes[this.paymentFor] || this.paymentFor;
});

// Virtual for payer relationship display
paymentSchema.virtual('payerRelationshipDisplay').get(function() {
  const relationships = {
    self: 'Self (Student)',
    parent: 'Parent',
    guardian: 'Guardian',
    sponsor: 'Sponsor',
    employer: 'Employer',
    other: 'Other'
  };
  return relationships[this.payerRelationship] || this.payerRelationship;
});

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  if (this.paymentMethod === 'mpesa' && this.transactionId) {
    this.transactionId = this.transactionId.trim().toUpperCase();
  }
  
  if (this.receiptNumber) {
    this.receiptNumber = this.receiptNumber.trim().toUpperCase();
  }
  
  next();
});

// ============= STATIC METHODS =============

// Get total payments for a student
paymentSchema.statics.getStudentTotal = async function(studentId) {
  const result = await this.aggregate([
    { $match: { student: new mongoose.Types.ObjectId(studentId), status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return result.length > 0 ? result[0].total : 0;
};

// Get all courses with outstanding balances for a student (for dropdown)
paymentSchema.statics.getStudentOutstandingBalances = async function(studentId) {
  const StudentFee = mongoose.model('StudentFee');
  const studentFee = await StudentFee.findOne({ student: studentId })
    .populate('courses.course', 'courseCode name price');
  
  if (!studentFee || !studentFee.courses.length) {
    return [];
  }
  
  return studentFee.courses.map(course => ({
    courseId: course.course._id,
    courseCode: course.course.courseCode,
    courseName: course.course.name,
    totalPrice: course.coursePrice,
    totalPaid: course.totalPaid,
    remainingBalance: course.remainingBalance,
    paymentPercentage: course.paymentPercentage,
    status: course.status
  }));
};

// Get payment summary for a student across all courses
paymentSchema.statics.getStudentPaymentSummary = async function(studentId) {
  const StudentFee = mongoose.model('StudentFee');
  const studentFee = await StudentFee.findOne({ student: studentId })
    .populate('courses.course', 'courseCode name price');
  
  if (!studentFee) {
    return {
      totalFees: 0,
      totalPaid: 0,
      totalBalance: 0,
      overallPercentage: 0,
      courses: []
    };
  }
  
  return {
    totalFees: studentFee.totalFees,
    totalPaid: studentFee.totalPaid,
    totalBalance: studentFee.totalBalance,
    overallPercentage: studentFee.overallPercentage,
    courses: studentFee.courses.map(course => ({
      courseId: course.course._id,
      courseCode: course.course.courseCode,
      courseName: course.course.name,
      price: course.coursePrice,
      paid: course.totalPaid,
      balance: course.remainingBalance,
      percentage: course.paymentPercentage,
      status: course.status
    }))
  };
};

// Get payments breakdown by course for a student
paymentSchema.statics.getStudentPaymentsByCourse = async function(studentId) {
  return this.aggregate([
    { $match: { student: new mongoose.Types.ObjectId(studentId), status: 'completed' } },
    {
      $group: {
        _id: '$course',
        totalPaid: { $sum: '$amount' },
        payments: { $push: '$$ROOT' },
        count: { $sum: 1 },
        lastPaymentDate: { $max: '$paymentDate' }
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
        courseId: '$_id',
        courseCode: '$courseInfo.courseCode',
        courseName: '$courseInfo.name',
        coursePrice: '$courseInfo.price',
        totalPaid: 1,
        payments: 1,
        count: 1,
        lastPaymentDate: 1,
        remainingBalance: { $subtract: ['$courseInfo.price', '$totalPaid'] },
        paymentPercentage: {
          $multiply: [
            { $divide: ['$totalPaid', '$courseInfo.price'] },
            100
          ]
        }
      }
    }
  ]);
};

// Get payment statistics
paymentSchema.statics.getPaymentStats = async function(startDate, endDate) {
  const matchStage = { status: 'completed' };
  
  if (startDate || endDate) {
    matchStage.paymentDate = {};
    if (startDate) matchStage.paymentDate.$gte = new Date(startDate);
    if (endDate) matchStage.paymentDate.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $facet: {
        totalStats: [
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
              totalPayments: { $sum: 1 },
              averageAmount: { $avg: '$amount' },
              minAmount: { $min: '$amount' },
              maxAmount: { $max: '$amount' }
            }
          }
        ],
        byMethod: [
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
                    { case: { $eq: ['$_id', 'cash'] }, then: 'Cash' },
                    { case: { $eq: ['$_id', 'bank_transfer'] }, then: 'Bank Transfer' }
                  ],
                  default: 'Other'
                }
              },
              total: 1,
              count: 1
            }
          }
        ],
        byRelationship: [
          {
            $group: {
              _id: '$payerRelationship',
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              relationship: '$_id',
              relationshipDisplay: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$_id', 'self'] }, then: 'Self (Student)' },
                    { case: { $eq: ['$_id', 'parent'] }, then: 'Parent' },
                    { case: { $eq: ['$_id', 'guardian'] }, then: 'Guardian' },
                    { case: { $eq: ['$_id', 'sponsor'] }, then: 'Sponsor' },
                    { case: { $eq: ['$_id', 'employer'] }, then: 'Employer' }
                  ],
                  default: 'Other'
                }
              },
              total: 1,
              count: 1
            }
          }
        ],
        byDay: [
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } },
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id': 1 } }
        ],
        byMonth: [
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$paymentDate' } },
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id': 1 } }
        ],
        recentPayments: [
          { $sort: { paymentDate: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'students',
              localField: 'student',
              foreignField: '_id',
              as: 'studentInfo'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'studentInfo.user',
              foreignField: '_id',
              as: 'userInfo'
            }
          },
          {
            $lookup: {
              from: 'courses',
              localField: 'course',
              foreignField: '_id',
              as: 'courseInfo'
            }
          },
          {
            $project: {
              amount: 1,
              formattedAmount: { $concat: ['KSh ', { $toString: '$amount' }] },
              paymentDate: 1,
              receiptNumber: 1,
              payerName: 1,
              payerRelationship: 1,
              paymentMethod: 1,
              transactionId: 1,
              studentName: { $arrayElemAt: ['$userInfo.name', 0] },
              studentId: { $arrayElemAt: ['$studentInfo.studentId', 0] },
              courseName: { $arrayElemAt: ['$courseInfo.name', 0] },
              courseCode: { $arrayElemAt: ['$courseInfo.courseCode', 0] }
            }
          }
        ]
      }
    }
  ]);
};

// Generate receipt number
paymentSchema.methods.generateReceiptNumber = function() {
  const date = new Date(this.paymentDate);
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `RCP-${year}${month}${day}-${random}`;
};

export default mongoose.model('Payment', paymentSchema);