// models/Attendance.js
import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  date: {
    type: Date,
    required: [true, 'Attendance date is required'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Attendance date cannot be in the future'
    }
  },
  session: {
    type: String,
    enum: ['morning', 'afternoon', 'full-day'],
    default: 'full-day',
    required: [true, 'Session is required']
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    required: [true, 'Attendance status is required'],
    default: 'present'
  },
  checkInTime: {
    type: String, // Store as "HH:MM" format for late arrivals
    validate: {
      validator: function(time) {
        if (!time) return true;
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
      },
      message: 'Check-in time must be in HH:MM format'
    }
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters'],
    trim: true
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Marked by user is required']
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  excusedReason: {
    type: String,
    maxlength: [200, 'Excused reason cannot be more than 200 characters'],
    trim: true
  },
  isExcused: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure unique attendance per student-course-date-session
attendanceSchema.index({ 
  student: 1, 
  course: 1, 
  date: 1, 
  session: 1 
}, { 
  unique: true,
  partialFilterExpression: {
    date: { $exists: true },
    session: { $exists: true }
  }
});

// Index for better query performance
attendanceSchema.index({ course: 1, date: -1 });
attendanceSchema.index({ student: 1, date: -1 });
attendanceSchema.index({ date: 1, status: 1 });
attendanceSchema.index({ course: 1, student: 1, date: -1 });

// Virtual for formatted date (YYYY-MM-DD)
attendanceSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Virtual for attendance duration (in days)
attendanceSchema.virtual('attendanceDuration').get(function() {
  return Math.floor((new Date() - this.date) / (1000 * 60 * 60 * 24));
});

// Ensure virtual fields are serialized
attendanceSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to handle status logic
attendanceSchema.pre('save', function(next) {
  // Auto-set isExcused based on status
  if (this.status === 'excused') {
    this.isExcused = true;
  } else {
    this.isExcused = false;
  }

  // Clear excused reason if status is not excused
  if (this.status !== 'excused') {
    this.excusedReason = undefined;
  }

  // Clear check-in time if not late
  if (this.status !== 'late') {
    this.checkInTime = undefined;
  }

  next();
});

// Static method to get attendance for a course on a specific date
attendanceSchema.statics.getCourseAttendance = function(courseId, date, session = null) {
  const query = { 
    course: courseId, 
    date: { 
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999))
    } 
  };

  if (session) {
    query.session = session;
  }

  return this.find(query)
    .populate('student', 'studentId user')
    .populate('markedBy', 'name email')
    .sort({ 'student.user.name': 1 });
};

// Static method to get student attendance in date range
attendanceSchema.statics.getCourseAttendance = function(courseId, date, session = null) {
  const query = { 
    course: courseId, 
    date: { 
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999))
    } 
  };

  if (session) {
    query.session = session;
  }

  return this.find(query)
    .populate({
      path: 'student',
      select: 'studentId phone user',  // Add 'phone' here
      populate: {
        path: 'user',
        select: 'name email'
      }
    })
    .populate('markedBy', 'name email')
    .sort({ 'student.user.name': 1 });
};
// Static method to get attendance statistics
attendanceSchema.statics.getAttendanceStats = function(courseId, startDate, endDate) {
  const matchStage = {
    course: new mongoose.Types.ObjectId(courseId),
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        statusCounts: {
          $push: {
            status: '$_id',
            count: '$count'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        present: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$statusCounts',
                    as: 'item',
                    cond: { $eq: ['$$item.status', 'present'] }
                  }
                },
                0
              ]
            },
            { status: 'present', count: 0 }
          ]
        },
        absent: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$statusCounts',
                    as: 'item',
                    cond: { $eq: ['$$item.status', 'absent'] }
                  }
                },
                0
              ]
            },
            { status: 'absent', count: 0 }
          ]
        },
        late: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$statusCounts',
                    as: 'item',
                    cond: { $eq: ['$$item.status', 'late'] }
                  }
                },
                0
              ]
            },
            { status: 'late', count: 0 }
          ]
        },
        excused: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$statusCounts',
                    as: 'item',
                    cond: { $eq: ['$$item.status', 'excused'] }
                  }
                },
                0
              ]
            },
            { status: 'excused', count: 0 }
          ]
        }
      }
    },
    {
      $project: {
        total: 1,
        present: '$present.count',
        absent: '$absent.count',
        late: '$late.count',
        excused: '$excused.count',
        attendanceRate: {
          $multiply: [
            {
              $divide: [
                { $add: ['$present.count', '$excused.count'] },
                '$total'
              ]
            },
            100
          ]
        }
      }
    }
  ]);
};

// Instance method to get attendance summary
attendanceSchema.methods.getSummary = function() {
  return {
    attendanceId: this._id,
    student: this.student,
    course: this.course,
    date: this.date,
    session: this.session,
    status: this.status,
    checkInTime: this.checkInTime,
    isExcused: this.isExcused,
    markedBy: this.markedBy,
    markedAt: this.markedAt
  };
};

// Static method to check if attendance already exists
attendanceSchema.statics.attendanceExists = async function(studentId, courseId, date, session) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await this.findOne({
    student: studentId,
    course: courseId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    session: session
  });

  return !!existing;
};

export default mongoose.model('Attendance', attendanceSchema);