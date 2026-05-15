import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  // Core Information
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Date & Time
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  isAllDay: {
    type: Boolean,
    default: true
  },
  startTime: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
  },
  endTime: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
  },
  
  // Location
  location: {
    type: String,
    trim: true,
    default: 'Serian Institute Campus'
  },
  
  // Event Classification
  eventType: {
    type: String,
    enum: ['holiday', 'academic', 'social', 'administrative', 'closure'],
    required: [true, 'Event type is required'],
    default: 'academic'
  },
  
  // Impact Flags
  noClasses: {
    type: Boolean,
    default: false
  },
  officesClosed: {
    type: Boolean,
    default: false
  },
  isPublicHoliday: {
    type: Boolean,
    default: false
  },
  
  // Target Audience
  forRoles: [{
    type: String,
    enum: ['students', 'instructors', 'staff', 'parents', 'all'],
    default: ['all']
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
eventSchema.index({ startDate: 1 });
eventSchema.index({ endDate: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ startDate: 1, endDate: 1 });

// Virtual: Check if event is multi-day
eventSchema.virtual('isMultiDay').get(function() {
  if (!this.startDate || !this.endDate) return false;
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  return start.toDateString() !== end.toDateString();
});

// Virtual: Formatted date range
eventSchema.virtual('formattedDateRange').get(function() {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  
  if (this.isMultiDay) {
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }
  return start.toLocaleDateString();
});

// Virtual: Formatted time
eventSchema.virtual('formattedTime').get(function() {
  if (this.isAllDay) return 'All day';
  if (this.startTime && this.endTime) {
    return `${this.startTime} - ${this.endTime}`;
  }
  return '';
});

// Virtual: Status indicator
eventSchema.virtual('statusIndicator').get(function() {
  const today = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  
  if (end < today) return 'past';
  if (start <= today && end >= today) return 'ongoing';
  return 'upcoming';
});

// Ensure end date is not before start date
eventSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    if (new Date(this.startDate) > new Date(this.endDate)) {
      next(new Error('End date must be after start date'));
    }
  }
  next();
});

const Event = mongoose.model('Event', eventSchema);

export default Event;