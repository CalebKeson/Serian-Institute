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
    enum: ['mpesa', 'cooperative_bank', 'family_bank', 'cash', 'other'],
    default: 'cash'
  },
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
    description: 'Internal reference or receipt number'
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

// Compound indexes for efficient queries
paymentSchema.index({ student: 1, course: 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ paymentMethod: 1, status: 1 });
// paymentSchema.index({ transactionId: 1 }, { unique: true, sparse: true });

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

// Pre-save middleware to format transaction ID for M-Pesa
paymentSchema.pre('save', function(next) {
  if (this.paymentMethod === 'mpesa' && this.transactionId) {
    this.transactionId = this.transactionId.trim().toUpperCase();
  }
  next();
});

// Static method to get total payments for a student
paymentSchema.statics.getStudentTotal = async function(studentId) {
  const result = await this.aggregate([
    { $match: { student: new mongoose.Types.ObjectId(studentId), status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return result.length > 0 ? result[0].total : 0;
};

// Static method to get payments breakdown by course for a student
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

// Static method to get payment statistics
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
                    { case: { $eq: ['$_id', 'cash'] }, then: 'Cash' }
                  ],
                  default: 'Other'
                }
              },
              total: 1,
              count: 1
            }
          }
        ],
        byPurpose: [
          { 
            $group: { 
              _id: '$paymentFor', 
              total: { $sum: '$amount' }, 
              count: { $sum: 1 } 
            }
          },
          {
            $project: {
              purpose: '$_id',
              purposeDisplay: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$_id', 'tuition'] }, then: 'Tuition Fee' },
                    { case: { $eq: ['$_id', 'registration'] }, then: 'Registration Fee' },
                    { case: { $eq: ['$_id', 'exam_fee'] }, then: 'Examination Fee' },
                    { case: { $eq: ['$_id', 'lab_fee'] }, then: 'Skills Lab Fee' },
                    { case: { $eq: ['$_id', 'materials'] }, then: 'Learning Materials' }
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
              paymentMethod: 1,
              paymentMethodDisplay: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$paymentMethod', 'mpesa'] }, then: 'M-Pesa' },
                    { case: { $eq: ['$paymentMethod', 'cooperative_bank'] }, then: 'Co-operative Bank' },
                    { case: { $eq: ['$paymentMethod', 'family_bank'] }, then: 'Family Bank' },
                    { case: { $eq: ['$paymentMethod', 'cash'] }, then: 'Cash' }
                  ],
                  default: 'Other'
                }
              },
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

// Instance method to generate receipt number
paymentSchema.methods.generateReceiptNumber = function() {
  const date = new Date(this.paymentDate);
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `RCP-${year}${month}${day}-${random}`;
};

export default mongoose.model('Payment', paymentSchema);