import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
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
  enrollmentDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: ['enrolled', 'dropped', 'completed', 'waitlisted'],
    default: 'enrolled',
    required: true
  },
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'F', null],
    default: null
  },
  enrolledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Enrolled by user is required']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters'],
    trim: true
  },
  droppedDate: {
    type: Date
  },
  completedDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index to ensure unique student-course combination
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Index for better query performance
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ student: 1, status: 1 });
enrollmentSchema.index({ enrollmentDate: -1 });

// FIXED: Virtual for enrollment duration with ULTIMATE null checks
enrollmentSchema.virtual('enrollmentDuration').get(function() {
  try {
    // Safely get enrollment date
    const enrollmentDate = this.enrollmentDate;
    if (!enrollmentDate) return 0;

    const enrollmentTime = new Date(enrollmentDate).getTime();
    if (isNaN(enrollmentTime)) return 0;

    const now = new Date().getTime();

    // Handle dropped status
    if (this.status === 'dropped' && this.droppedDate) {
      const droppedTime = new Date(this.droppedDate).getTime();
      if (!isNaN(droppedTime)) {
        return Math.floor((droppedTime - enrollmentTime) / (1000 * 60 * 60 * 24));
      }
    }
    
    // Handle completed status
    if (this.status === 'completed' && this.completedDate) {
      const completedTime = new Date(this.completedDate).getTime();
      if (!isNaN(completedTime)) {
        return Math.floor((completedTime - enrollmentTime) / (1000 * 60 * 60 * 24));
      }
    }
    
    // Handle enrolled status
    if (this.status === 'enrolled') {
      return Math.floor((now - enrollmentTime) / (1000 * 60 * 60 * 24));
    }
    
    return 0;
  } catch (error) {
    console.error('Error calculating enrollment duration:', error);
    return 0;
  }
});

// Ensure virtual fields are serialized
enrollmentSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Remove any problematic fields if needed
    return ret;
  }
});

// Also set toObject
enrollmentSchema.set('toObject', { 
  virtuals: true,
  transform: function(doc, ret) {
    return ret;
  }
});

// Pre-save middleware to handle status changes
enrollmentSchema.pre('save', function(next) {
  try {
    if (this.isModified('status')) {
      if (this.status === 'dropped' && !this.droppedDate) {
        this.droppedDate = new Date();
      } else if (this.status === 'completed' && !this.completedDate) {
        this.completedDate = new Date();
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to check if student is enrolled in course
enrollmentSchema.statics.isStudentEnrolled = async function(studentId, courseId) {
  try {
    const enrollment = await this.findOne({
      student: studentId,
      course: courseId,
      status: 'enrolled'
    });
    return !!enrollment;
  } catch (error) {
    console.error('Error checking student enrollment:', error);
    return false;
  }
};

// Static method to get active enrollments for a course
enrollmentSchema.statics.getCourseEnrollments = function(courseId, status = 'enrolled') {
  return this.find({ course: courseId, status })
    .populate({
      path: 'student',
      select: 'studentId user',
      populate: {
        path: 'user',
        select: 'name email'
      }
    })
    .populate('enrolledBy', 'name email')
    .sort({ enrollmentDate: -1 });
};

// Static method to get student's enrolled courses
enrollmentSchema.statics.getStudentEnrollments = function(studentId, status = 'enrolled') {
  return this.find({ student: studentId, status })
    .populate({
      path: 'course',
      select: 'courseCode name instructor schedule',
      populate: {
        path: 'instructor',
        select: 'name email'
      }
    })
    .populate('enrolledBy', 'name email')
    .sort({ enrollmentDate: -1 });
};

// Instance method to get enrollment summary with safe access
enrollmentSchema.methods.getSummary = function() {
  try {
    return {
      enrollmentId: this._id,
      student: this.student,
      course: this.course,
      status: this.status || 'unknown',
      enrollmentDate: this.enrollmentDate,
      duration: this.enrollmentDuration || 0,
      grade: this.grade || 'Not Graded'
    };
  } catch (error) {
    console.error('Error getting enrollment summary:', error);
    return {
      enrollmentId: this._id,
      status: 'error',
      duration: 0
    };
  }
};

export default mongoose.model('Enrollment', enrollmentSchema);