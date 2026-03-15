// models/StudentFee.model.js
import mongoose from 'mongoose';

const studentFeeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student is required'],
    unique: true,
    index: true
  },
  courses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    coursePrice: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: [0, 'Total paid cannot be negative']
    },
    remainingBalance: {
      type: Number,
      default: 0,
      min: [0, 'Remaining balance cannot be negative']
    },
    paymentPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['unpaid', 'partial', 'paid', 'overpaid'],
      default: 'unpaid'
    },
    lastPaymentDate: {
      type: Date
    },
    payments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    }]
  }],
  totalFees: {
    type: Number,
    default: 0,
    min: [0, 'Total fees cannot be negative']
  },
  totalPaid: {
    type: Number,
    default: 0,
    min: [0, 'Total paid cannot be negative']
  },
  totalBalance: {
    type: Number,
    default: 0,
    min: [0, 'Total balance cannot be negative']
  },
  overallPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
studentFeeSchema.index({ 'courses.status': 1 });
studentFeeSchema.index({ totalBalance: -1 });
studentFeeSchema.index({ overallPercentage: -1 });

// Pre-save middleware to calculate totals and percentages
studentFeeSchema.pre('save', function(next) {
  // Calculate totals for each course
  this.courses.forEach(course => {
    course.remainingBalance = Math.max(0, course.coursePrice - course.totalPaid);
    course.paymentPercentage = course.coursePrice > 0 
      ? Math.min(100, Math.round((course.totalPaid / course.coursePrice) * 100)) 
      : 0;
    
    if (course.totalPaid >= course.coursePrice) {
      course.status = course.totalPaid > course.coursePrice ? 'overpaid' : 'paid';
    } else if (course.totalPaid > 0) {
      course.status = 'partial';
    } else {
      course.status = 'unpaid';
    }
  });

  // Calculate overall totals
  this.totalFees = this.courses.reduce((sum, course) => sum + course.coursePrice, 0);
  this.totalPaid = this.courses.reduce((sum, course) => sum + course.totalPaid, 0);
  this.totalBalance = this.totalFees - this.totalPaid;
  this.overallPercentage = this.totalFees > 0 
    ? Math.min(100, Math.round((this.totalPaid / this.totalFees) * 100)) 
    : 0;
  
  this.lastUpdated = new Date();
  next();
});

// FIXED: Static method to find or create a student fee record
studentFeeSchema.statics.findOrCreate = async function(studentId, session) {
  try {
    // Try to find existing fee record
    let studentFee = await this.findOne({ student: studentId })
      .populate({
        path: 'courses.course',
        select: 'courseCode name price'
      })
      .populate({
        path: 'courses.payments',
        select: 'amount paymentDate paymentMethod transactionId paymentFor status'
      })
      .session(session);
    
    // If not found, create new one
    if (!studentFee) {
      const [newStudentFee] = await this.create([{
        student: studentId,
        courses: []
      }], { session });
      
      studentFee = await this.findById(newStudentFee._id)
        .populate({
          path: 'courses.course',
          select: 'courseCode name price'
        })
        .session(session);
    }
    
    return studentFee;
  } catch (error) {
    console.error('Error in findOrCreate:', error);
    throw error;
  }
};

// Static method to update fee record after payment
studentFeeSchema.statics.updateAfterPayment = async function(studentId, courseId, paymentId, amount, session) {
  try {
    // First, find or create the student fee record
    let studentFee = await this.findOne({ student: studentId }).session(session);
    
    if (!studentFee) {
      // Create new fee record
      const course = await mongoose.model('Course').findById(courseId).session(session);
      
      if (!course) {
        throw new Error('Course not found');
      }
      
      const [newStudentFee] = await this.create([{
        student: studentId,
        courses: [{
          course: courseId,
          coursePrice: course.price || 0,
          totalPaid: amount,
          payments: [paymentId],
          lastPaymentDate: new Date()
        }]
      }], { session });
      
      studentFee = newStudentFee;
    } else {
      // Update existing record
      const courseIndex = studentFee.courses.findIndex(
        c => c.course && c.course.toString() === courseId.toString()
      );

      if (courseIndex === -1) {
        // New course for this student
        const course = await mongoose.model('Course').findById(courseId).session(session);
        
        if (!course) {
          throw new Error('Course not found');
        }
        
        studentFee.courses.push({
          course: courseId,
          coursePrice: course.price || 0,
          totalPaid: amount,
          payments: [paymentId],
          lastPaymentDate: new Date()
        });
      } else {
        // Update existing course
        studentFee.courses[courseIndex].totalPaid += amount;
        studentFee.courses[courseIndex].payments.push(paymentId);
        studentFee.courses[courseIndex].lastPaymentDate = new Date();
      }

      await studentFee.save({ session });
    }
    
    return studentFee;
  } catch (error) {
    console.error('Error in updateAfterPayment:', error);
    throw error;
  }
};

// Static method to get all students with fee summaries
studentFeeSchema.statics.getAllFeeSummaries = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.status) {
    matchStage['courses.status'] = filters.status;
  }
  if (filters.minBalance) {
    matchStage.totalBalance = { $gte: filters.minBalance };
  }
  if (filters.maxBalance) {
    matchStage.totalBalance = { ...matchStage.totalBalance, $lte: filters.maxBalance };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'studentInfo'
      }
    },
    { $unwind: '$studentInfo' },
    {
      $lookup: {
        from: 'users',
        localField: 'studentInfo.user',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    { $unwind: '$userInfo' },
    {
      $project: {
        studentId: '$studentInfo._id',
        studentNumber: '$studentInfo.studentId',
        studentName: '$userInfo.name',
        studentEmail: '$userInfo.email',
        totalFees: 1,
        totalPaid: 1,
        totalBalance: 1,
        overallPercentage: 1,
        courseCount: { $size: '$courses' },
        paymentStatus: {
          $switch: {
            branches: [
              { case: { $eq: ['$totalBalance', 0] }, then: 'Fully Paid' },
              { case: { $eq: ['$totalPaid', 0] }, then: 'No Payments' },
              { case: { $gt: ['$totalPaid', 0] }, then: 'Partial Payment' }
            ],
            default: 'Unknown'
          }
        },
        lastUpdated: 1
      }
    },
    { $sort: { totalBalance: -1 } }
  ]);
};

// Virtual for payment summary
studentFeeSchema.virtual('paymentSummary').get(function() {
  return {
    totalFees: this.totalFees,
    totalPaid: this.totalPaid,
    totalBalance: this.totalBalance,
    overallPercentage: this.overallPercentage,
    paymentStatus: this.totalBalance === 0 ? 'Fully Paid' : 
                   this.totalPaid === 0 ? 'No Payments' : 'Partial Payment'
  };
});

// Virtual for course breakdown
studentFeeSchema.virtual('courseBreakdown').get(function() {
  return this.courses.map(course => ({
    courseId: course.course?._id,
    courseCode: course.course?.courseCode,
    courseName: course.course?.name,
    price: course.coursePrice,
    paid: course.totalPaid,
    balance: course.remainingBalance,
    percentage: course.paymentPercentage,
    status: course.status,
    lastPayment: course.lastPaymentDate,
    paymentsCount: course.payments?.length || 0
  }));
});

// Virtual for alert status
studentFeeSchema.virtual('alertStatus').get(function() {
  if (this.overallPercentage >= 100) return 'success';
  if (this.overallPercentage >= 50) return 'warning';
  if (this.totalPaid > 0) return 'danger';
  return 'muted';
});

const StudentFee = mongoose.model('StudentFee', studentFeeSchema);

export default StudentFee;