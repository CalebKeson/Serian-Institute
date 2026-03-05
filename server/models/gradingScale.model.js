// models/GradingScale.js
import mongoose from 'mongoose';

const gradingScaleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Scale name is required'],
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['letter', 'percentage', 'pass_fail'],
    required: [true, 'Scale type is required']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  scale: [{
    letterGrade: {
      type: String,
      required: true
    },
    minPercentage: {
      type: Number,
      min: 0,
      max: 100,
      required: function() {
        return this.parent().type === 'letter';
      }
    },
    maxPercentage: {
      type: Number,
      min: 0,
      max: 100,
      required: function() {
        return this.parent().type === 'letter';
      },
      validate: {
        validator: function(value) {
          return value >= this.minPercentage;
        },
        message: 'Max percentage must be greater than or equal to min percentage'
      }
    },
    gpaValue: {
      type: Number,
      min: 0,
      max: 4,
      required: function() {
        return this.parent().type === 'letter';
      }
    },
    description: {
      type: String,
      maxlength: [100, 'Description cannot exceed 100 characters']
    },
    isPassing: {
      type: Boolean,
      default: true
    }
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null,
    description: 'If null, scale is global; if set, scale is course-specific'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
// gradingScaleSchema.index({ name: 1 }, { unique: true });
gradingScaleSchema.index({ course: 1 });
gradingScaleSchema.index({ isDefault: 1 });

// Ensure only one default scale per type
gradingScaleSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { type: this.type, isDefault: true, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Method to get letter grade from percentage
gradingScaleSchema.methods.getLetterGrade = function(percentage) {
  if (this.type !== 'letter') return null;
  
  const gradeEntry = this.scale.find(
    entry => percentage >= entry.minPercentage && percentage <= entry.maxPercentage
  );
  
  return gradeEntry ? gradeEntry.letterGrade : null;
};

// Method to get GPA value from percentage
gradingScaleSchema.methods.getGPAValue = function(percentage) {
  if (this.type !== 'letter') return null;
  
  const gradeEntry = this.scale.find(
    entry => percentage >= entry.minPercentage && percentage <= entry.maxPercentage
  );
  
  return gradeEntry ? gradeEntry.gpaValue : null;
};

// Static method to get default scale
gradingScaleSchema.statics.getDefaultScale = async function(type = 'letter') {
  const defaultScale = await this.findOne({ type, isDefault: true, isActive: true });
  
  if (defaultScale) return defaultScale;
  
  // If no default, create one
  return await this.create({
    name: `Default ${type} Scale`,
    type,
    isDefault: true,
    scale: type === 'letter' ? [
      { letterGrade: 'A', minPercentage: 90, maxPercentage: 100, gpaValue: 4.0, isPassing: true },
      { letterGrade: 'B', minPercentage: 80, maxPercentage: 89, gpaValue: 3.0, isPassing: true },
      { letterGrade: 'C', minPercentage: 70, maxPercentage: 79, gpaValue: 2.0, isPassing: true },
      { letterGrade: 'D', minPercentage: 60, maxPercentage: 69, gpaValue: 1.0, isPassing: true },
      { letterGrade: 'F', minPercentage: 0, maxPercentage: 59, gpaValue: 0.0, isPassing: false }
    ] : [],
    createdBy: null // System default
  });
};

const GradingScale = mongoose.model('GradingScale', gradingScaleSchema);

export default GradingScale;