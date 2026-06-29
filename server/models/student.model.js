// backend/models/student.model.js - UPDATED VERSION

import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: String,
    required: false,
    unique: true,
    trim: true,
    uppercase: true,
    default: null,
    sparse: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'graduated'],
    default: 'active'
  },
  
  // ============= NEW FIELDS =============
  
  // Student category for better classification
  studentCategory: {
    type: String,
    enum: ['current', 'graduated', 'alumni', 'transferred', 'dropped', 'prospective'],
    default: 'current'
  },
  
  // Graduation tracking
  graduationDate: {
    type: Date,
    default: null
  },
  graduationCertificate: {
    type: String,
    trim: true
  },
  graduationRemarks: {
    type: String,
    trim: true
  },
  
  // Referral tracking
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral'
  },
  referralSource: {
    type: String,
    enum: ['employee', 'agent', 'student', 'social_media', 'advertisement', 'walk_in', 'other']
  },
  referralDetails: {
    type: String,
    trim: true
  },
  
  // Historical record tracking
  isHistoricalRecord: {
    type: Boolean,
    default: false
  },
  historicalEnrollmentDate: {
    type: Date
  },
  historicalNotes: {
    type: String,
    trim: true
  },
  
  // Academic tracking
  academicStanding: {
    type: String,
    enum: ['good', 'probation', 'warning', 'suspension', 'honors', 'distinction'],
    default: 'good'
  },
  cumulativeGPA: {
    type: Number,
    min: 0,
    max: 4,
    default: 0
  },
  totalCreditsEarned: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
studentSchema.index({ studentCategory: 1 });
studentSchema.index({ graduationDate: 1 });
studentSchema.index({ referredBy: 1 });
studentSchema.index({ isHistoricalRecord: 1 });

// Auto-generate student ID before save and validation
studentSchema.pre('validate', async function(next) {
  if (this.isNew && !this.studentId) {
    try {
      const currentYear = new Date().getFullYear();
      const count = await mongoose.model('Student').countDocuments();
      const sequenceNumber = String(count + 1).padStart(3, '0');
      this.studentId = `SBTC/${sequenceNumber}/${currentYear}`;
      console.log(`Generated student ID: ${this.studentId}`);
    } catch (error) {
      console.error('Error generating student ID:', error);
      return next(error);
    }
  }
  next();
});

// Virtual to check if student has any enrollments (including completed)
studentSchema.virtual('hasEnrollments').get(async function() {
  const Enrollment = mongoose.model('Enrollment');
  const count = await Enrollment.countDocuments({
    student: this._id,
    status: { $in: ['enrolled', 'completed', 'graduated'] }
  });
  return count > 0;
});

// Virtual to get enrollment status text
studentSchema.virtual('enrollmentStatus').get(async function() {
  if (this.status === 'graduated' || this.studentCategory === 'graduated') {
    return 'graduated';
  }
  
  const Enrollment = mongoose.model('Enrollment');
  const hasActiveEnrollments = await Enrollment.countDocuments({
    student: this._id,
    status: 'enrolled'
  });
  
  if (hasActiveEnrollments > 0) {
    return 'enrolled';
  }
  
  return 'not enrolled';
});

// Virtual to get all admission numbers (including completed)
studentSchema.virtual('allAdmissionNumbers').get(async function() {
  const Enrollment = mongoose.model('Enrollment');
  const enrollments = await Enrollment.find({
    student: this._id,
    status: { $in: ['enrolled', 'completed', 'graduated'] }
  }).populate('course', 'courseCode');
  
  return enrollments.map(e => ({
    admissionNumber: e.admissionNumber,
    courseCode: e.course?.courseCode,
    status: e.status,
    completedAt: e.completedAt
  }));
});

// Method to check if student has completed all courses
studentSchema.methods.hasCompletedAllCourses = async function() {
  const Enrollment = mongoose.model('Enrollment');
  const enrollments = await Enrollment.find({
    student: this._id,
    status: { $in: ['enrolled', 'completed', 'graduated'] }
  });
  
  if (enrollments.length === 0) return false;
  
  const allCompleted = enrollments.every(e => e.status === 'completed' || e.status === 'graduated');
  return allCompleted;
};

// Method to mark student as graduated
studentSchema.methods.markAsGraduated = async function(graduationDate = new Date(), remarks = '') {
  const Enrollment = mongoose.model('Enrollment');
  
  // Mark all active enrollments as completed
  await Enrollment.updateMany(
    { student: this._id, status: 'enrolled' },
    { 
      $set: { 
        status: 'completed', 
        completedAt: graduationDate,
        completionNotes: remarks || 'Graduated from program'
      }
    }
  );
  
  // Update student record
  this.status = 'graduated';
  this.studentCategory = 'graduated';
  this.graduationDate = graduationDate;
  this.graduationRemarks = remarks;
  
  await this.save();
  return this;
};

export default mongoose.model('Student', studentSchema);