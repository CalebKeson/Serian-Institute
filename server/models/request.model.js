// models/Request.js
import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    visitorName: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true
    },
    visitorEmail: {
      type: String,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    visitorPhone: {
      type: String,
      required: [true, 'Phone number is required']
    },
    purpose: {
      type: String,
      required: [true, 'Purpose of visit is required'],
      enum: [
        'Admission Inquiry',
        'Fee Payment',
        'Document Submission',
        'Meeting Staff',
        'Complaint',
        'Other'
      ]
    },
    department: {
      type: String,
      enum: [
        'Admissions',
        'Accounts',
        'Administration',
        'Academic',
        'Library',
        'Sports',
        'Maintenance',
        'Other'
      ]
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    receptionist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    scheduledDate: {
      type: Date,
      default: Date.now
    },
    resolvedDate: {
      type: Date
    },
    notes: [{
      content: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    attachments: [{
      filename: String,
      path: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true
  }
);

// Index for faster queries
requestSchema.index({ status: 1, createdAt: -1 });
requestSchema.index({ receptionist: 1, createdAt: -1 });
requestSchema.index({ assignedTo: 1 });

export default mongoose.model('Request', requestSchema);