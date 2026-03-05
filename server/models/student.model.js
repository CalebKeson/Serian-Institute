// models/Student.js
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
    uppercase: true
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
  timestamps: true
});

// Auto-generate student ID
studentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Student').countDocuments();
    this.studentId = `SI${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model('Student', studentSchema);