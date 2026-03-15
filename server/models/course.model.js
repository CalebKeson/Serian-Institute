import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{3,4}\d{3}$/, 'Please enter a valid course code (e.g., CNA101, DRV101, PLB201, ELC301, COM401)']
  },
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    maxlength: [100, 'Course name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  courseType: {
    type: String,
    enum: ['driving', 'plumbing', 'electrical', 'computer', 'cna'],
    required: [true, 'Course type is required']
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    enum: ['1 month', '3 months', '6 months', '1 year', '2 years']
  },
  intakeMonth: {
    type: String,
    required: [true, 'Intake month is required'],
    enum: ['January', 'February', 'March', 'April', 'May', 'June', 
           'July', 'August', 'September', 'October', 'November', 'December']
  },
  intakeYear: {
    type: String,
    required: [true, 'Intake year is required'],
    match: [/^\d{4}$/, 'Year must be 4 digits (e.g., 2024)']
  },
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required'],
    validate: {
      validator: async function(instructorId) {
        const User = mongoose.model('User');
        const instructor = await User.findById(instructorId);
        return instructor && ['admin', 'instructor'].includes(instructor.role);
      },
      message: 'Instructor must be an instructor or admin'
    }
  },
  schedule: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    time: {
      type: String,
      trim: true
    },
    room: {
      type: String,
      trim: true,
      maxlength: [50, 'Room cannot be more than 50 characters']
    }
  },
  maxStudents: {
    type: Number,
    required: [true, 'Maximum students is required'],
    min: [1, 'Maximum students must be at least 1'],
    max: [100, 'Maximum students cannot exceed 100'],
    default: 20
  },
  practicalHours: {
    type: Number,
    required: [true, 'Practical hours are required'],
    min: [0, 'Practical hours cannot be negative'],
    default: 0
  },
  workshopRequired: {
    type: Boolean,
    default: false
  },
  skillsLabRequired: {
    type: Boolean,
    default: false
  },
  certification: {
    type: String,
    required: [true, 'Certification type is required'],
    enum: [
      'NTSA License', 
      'Government Trade Test', 
      'Institutional Certificate', 
      'Other',
      'CNA Certification',
      'NCLEX Preparation',
      'State Board Approved'
    ]
  },
  price: {
    type: Number,
    required: [true, 'Course price is required'],
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  requirements: {
    type: String,
    trim: true,
    maxlength: [500, 'Requirements cannot exceed 500 characters']
  },
  courseBreakdown: {
    type: String,
    trim: true,
    maxlength: [2000, 'Course breakdown cannot exceed 2000 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-generate course code based on course type
courseSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const typePrefixes = {
        driving: 'DRV',
        plumbing: 'PLB',
        electrical: 'ELC',
        computer: 'COM',
        cna: 'CNA'
      };
      
      const prefix = typePrefixes[this.courseType] || 'CRS';
      const count = await mongoose.model('Course').countDocuments({ courseType: this.courseType });
      
      this.courseCode = `${prefix}${String(count + 1).padStart(3, '0')}`;
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Indexes
courseSchema.index({ instructor: 1 });
courseSchema.index({ courseType: 1 });
courseSchema.index({ intakeMonth: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ price: 1 });

// Virtual for enrolled students count
courseSchema.virtual('enrolledCount').get(function() {
  try {
    if (!this.enrolledStudents || !Array.isArray(this.enrolledStudents)) {
      return 0;
    }
    return this.enrolledStudents.length;
  } catch (error) {
    console.error('Error in enrolledCount virtual:', error);
    return 0;
  }
});

// Virtual for available spots
courseSchema.virtual('availableSpots').get(function() {
  try {
    const maxStudents = this.maxStudents || 0;
    
    if (!this.enrolledStudents || !Array.isArray(this.enrolledStudents)) {
      return maxStudents;
    }
    
    return Math.max(0, maxStudents - this.enrolledStudents.length);
  } catch (error) {
    console.error('Error in availableSpots virtual:', error);
    return this.maxStudents || 0;
  }
});

// Virtual for isFull
courseSchema.virtual('isFull').get(function() {
  try {
    const maxStudents = this.maxStudents || 0;
    
    if (!this.enrolledStudents || !Array.isArray(this.enrolledStudents)) {
      return false;
    }
    
    return this.enrolledStudents.length >= maxStudents;
  } catch (error) {
    console.error('Error in isFull virtual:', error);
    return false;
  }
});

// Virtual for course display name
courseSchema.virtual('displayName').get(function() {
  try {
    const typeNames = {
      driving: 'Driving Classes',
      plumbing: 'Plumbing',
      electrical: 'Electrical Installation',
      computer: 'Computer Packages',
      cna: 'Certified Nursing Assistant'
    };
    const typeName = typeNames[this.courseType] || this.courseType || 'Unknown';
    const courseName = this.name || 'Unnamed Course';
    return `${typeName} - ${courseName}`;
  } catch (error) {
    console.error('Error in displayName virtual:', error);
    return this.name || 'Unknown Course';
  }
});

// Virtual for intake display
courseSchema.virtual('intakeDisplay').get(function() {
  try {
    const month = this.intakeMonth || 'Unknown';
    const year = this.intakeYear || 'Year';
    const batch = this.batchNumber || 'Batch';
    return `${month} ${year} (${batch})`;
  } catch (error) {
    console.error('Error in intakeDisplay virtual:', error);
    return 'Intake information unavailable';
  }
});

// Virtual for enrollment percentage
courseSchema.virtual('enrollmentPercentage').get(function() {
  try {
    const maxStudents = this.maxStudents || 1;
    
    if (!this.enrolledStudents || !Array.isArray(this.enrolledStudents)) {
      return 0;
    }
    
    return Math.min(100, Math.round((this.enrolledStudents.length / maxStudents) * 100));
  } catch (error) {
    console.error('Error in enrollmentPercentage virtual:', error);
    return 0;
  }
});

// Virtual for formatted price
courseSchema.virtual('formattedPrice').get(function() {
  return `KSh ${this.price?.toLocaleString() || '0'}`;
});

// Static method to find courses by instructor
courseSchema.statics.findByInstructor = function(instructorId) {
  return this.find({ instructor: instructorId }).populate('instructor', 'name email');
};

// Static method to find active courses
courseSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Static method to find courses by type
courseSchema.statics.findByType = function(courseType) {
  return this.find({ courseType, status: 'active' });
};

// Instance method to check if student is enrolled
courseSchema.methods.isStudentEnrolled = function(studentId) {
  try {
    if (!this.enrolledStudents || !Array.isArray(this.enrolledStudents)) {
      return false;
    }
    
    const studentIdStr = studentId?.toString();
    return this.enrolledStudents.some(id => id && id.toString() === studentIdStr);
  } catch (error) {
    console.error('Error in isStudentEnrolled:', error);
    return false;
  }
};

// Instance method to enroll student
courseSchema.methods.enrollStudent = function(studentId) {
  try {
    if (!this.enrolledStudents || !Array.isArray(this.enrolledStudents)) {
      this.enrolledStudents = [];
    }
    
    if (this.isFull) {
      throw new Error('Course is full');
    }
    if (this.isStudentEnrolled(studentId)) {
      throw new Error('Student is already enrolled');
    }
    this.enrolledStudents.push(studentId);
    return this.save();
  } catch (error) {
    throw error;
  }
};

// Instance method to remove student
courseSchema.methods.removeStudent = function(studentId) {
  try {
    if (!this.enrolledStudents || !Array.isArray(this.enrolledStudents)) {
      return this.save();
    }
    
    const studentIdStr = studentId?.toString();
    this.enrolledStudents = this.enrolledStudents.filter(id => 
      id && id.toString() !== studentIdStr
    );
    return this.save();
  } catch (error) {
    console.error('Error in removeStudent:', error);
    throw error;
  }
};

export default mongoose.model('Course', courseSchema);