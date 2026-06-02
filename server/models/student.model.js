// backend/models/student.model.js - FIXED

import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: String,
    required: false,  // CHANGE THIS FROM 'true' TO 'false'
    unique: true,
    trim: true,
    uppercase: true,
    default: null,
    sparse: true  // ADD THIS - allows multiple null values but maintains uniqueness for non-null
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-generate student ID before save and validation
studentSchema.pre('validate', async function(next) {
  if (this.isNew && !this.studentId) {
    try {
      const currentYear = new Date().getFullYear();
      
      // Count existing students to get the next sequence number
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

// Virtual to check if student has any enrollments
studentSchema.virtual('hasEnrollments').get(function() {
  return false;
});

// Virtual to get enrollment status text
studentSchema.virtual('enrollmentStatus').get(function() {
  return 'not enrolled';
});

export default mongoose.model('Student', studentSchema);