// models/Grade.js
import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
  // Core references
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
  
  // Assessment details
  assessmentType: {
    type: String,
    enum: ['quiz', 'assignment', 'midterm', 'final', 'project', 'participation', 'lab', 'presentation'],
    required: [true, 'Assessment type is required']
  },
  assessmentName: {
    type: String,
    required: [true, 'Assessment name is required'],
    trim: true,
    maxlength: [100, 'Assessment name cannot exceed 100 characters']
  },
  
  // Score information
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [0, 'Score cannot be negative'],
    validate: {
      validator: function(value) {
        return value <= this.maxScore;
      },
      message: 'Score cannot exceed maximum score'
    }
  },
  maxScore: {
    type: Number,
    required: [true, 'Maximum score is required'],
    min: [1, 'Maximum score must be at least 1']
  },
  
  // Auto-calculated fields
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  letterGrade: {
    type: String,
    enum: ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'P', 'NP', 'INC'],
    default: null
  },
  
  // Weight and term
  weight: {
    type: Number,
    default: 1,
    min: 0,
    max: 100,
    description: 'Weight multiplier for this assessment'
  },
  term: {
    type: String,
    enum: ['Term 1', 'Term 2', 'Term 3', 'Final', 'Summer'],
    required: [true, 'Term is required']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY (e.g., 2024-2025)']
  },
  
  // Dates
  assessmentDate: {
    type: Date,
    required: [true, 'Assessment date is required'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Assessment date cannot be in the future'
    }
  },
  dateRecorded: {
    type: Date,
    default: Date.now
  },
  
  // Additional information
  comments: {
    type: String,
    maxlength: [500, 'Comments cannot exceed 500 characters'],
    trim: true
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Graded by user is required']
  },
  
  // Status flags
  isPublished: {
    type: Boolean,
    default: false,
    description: 'Whether grade is visible to student'
  },
  isExtraCredit: {
    type: Boolean,
    default: false
  },
  isDropped: {
    type: Boolean,
    default: false,
    description: 'Whether this grade is dropped from calculations'
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
gradeSchema.index({ student: 1, course: 1, term: 1, academicYear: 1 });
gradeSchema.index({ course: 1, assessmentType: 1, assessmentDate: -1 });
gradeSchema.index({ student: 1, isPublished: 1 });
gradeSchema.index({ gradedBy: 1, dateRecorded: -1 });

// Pre-save middleware to calculate percentage and letter grade
gradeSchema.pre('save', function(next) {
  // Calculate percentage
  if (this.maxScore > 0) {
    this.percentage = (this.score / this.maxScore) * 100;
  }

  // Auto-assign letter grade based on percentage
  this.letterGrade = this.calculateLetterGrade();
  
  // Update the updatedAt field
  this.updatedAt = Date.now();
  
  next();
});

// Pre-update middleware
gradeSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Instance method to calculate letter grade
gradeSchema.methods.calculateLetterGrade = function() {
  if (this.percentage === undefined) return null;
  
  const percentage = this.percentage;
  
  // Standard A-F scale
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
};

// Instance method to get grade points (for GPA calculation)
gradeSchema.methods.getGradePoints = function() {
  const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0, 'P': null, 'NP': null, 'INC': null
  };
  return gradePoints[this.letterGrade] || null;
};

// Static method to get all grades for a course
gradeSchema.statics.getCourseGrades = function(courseId, term = null, academicYear = null) {
  const query = { course: courseId };
  if (term) query.term = term;
  if (academicYear) query.academicYear = academicYear;
  
  return this.find(query)
    .populate('student', 'studentId user')
    .populate('gradedBy', 'name email')
    .sort({ assessmentDate: -1, assessmentName: 1 });
};

// Static method to get student grades across all courses
gradeSchema.statics.getStudentGrades = function(studentId, academicYear = null) {
  const query = { student: studentId };
  if (academicYear) query.academicYear = academicYear;
  
  return this.find(query)
    .populate('course', 'courseCode name')
    .populate('gradedBy', 'name email')
    .sort({ assessmentDate: -1 });
};

// Static method to calculate course statistics
gradeSchema.statics.getCourseStatistics = async function(courseId, term = null, academicYear = null) {
  const matchStage = {
    course: new mongoose.Types.ObjectId(courseId)
  };
  
  if (term) matchStage.term = term;
  if (academicYear) matchStage.academicYear = academicYear;

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$score' },
        averagePercentage: { $avg: '$percentage' },
        highestScore: { $max: '$score' },
        lowestScore: { $min: '$score' },
        totalAssessments: { $sum: 1 },
        totalStudents: { $addToSet: '$student' }
      }
    },
    {
      $project: {
        _id: 0,
        averageScore: { $round: ['$averageScore', 1] },
        averagePercentage: { $round: ['$averagePercentage', 1] },
        highestScore: 1,
        lowestScore: 1,
        totalAssessments: 1,
        totalStudents: { $size: '$totalStudents' }
      }
    }
  ]);

  return stats[0] || {
    averageScore: 0,
    averagePercentage: 0,
    highestScore: 0,
    lowestScore: 0,
    totalAssessments: 0,
    totalStudents: 0
  };
};

// Static method to get grade distribution
gradeSchema.statics.getGradeDistribution = async function(courseId, term = null, academicYear = null) {
  const matchStage = {
    course: new mongoose.Types.ObjectId(courseId)
  };
  
  if (term) matchStage.term = term;
  if (academicYear) matchStage.academicYear = academicYear;

  const distribution = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$letterGrade',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return distribution.map(item => ({
    grade: item._id,
    count: item.count
  }));
};

// Static method to check if grade already exists
gradeSchema.statics.gradeExists = async function(studentId, courseId, assessmentName, assessmentDate) {
  const startOfDay = new Date(assessmentDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(assessmentDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await this.findOne({
    student: studentId,
    course: courseId,
    assessmentName: assessmentName,
    assessmentDate: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });

  return !!existing;
};

// Virtual for formatted score (score/maxScore)
gradeSchema.virtual('formattedScore').get(function() {
  return `${this.score}/${this.maxScore}`;
});

// Virtual for status (based on percentage)
gradeSchema.virtual('status').get(function() {
  if (!this.percentage) return 'pending';
  if (this.percentage >= 60) return 'passing';
  return 'failing';
});

// Virtual for display name
gradeSchema.virtual('displayName').get(function() {
  return `${this.assessmentType} - ${this.assessmentName}`;
});

// Ensure virtuals are included in JSON
gradeSchema.set('toJSON', { virtuals: true });
gradeSchema.set('toObject', { virtuals: true });

const Grade = mongoose.model('Grade', gradeSchema);

export default Grade;