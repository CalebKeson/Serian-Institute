// backend/models/instructor.model.js
import mongoose from "mongoose";

const qualificationSchema = new mongoose.Schema({
  degree: {
    type: String,
    required: true,
  },
  institution: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  grade: String,
});

const certificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  issuingBody: {
    type: String,
    required: true,
  },
  year: Number,
  expiryDate: Date,
});

const bankAccountSchema = new mongoose.Schema({
  bankName: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  accountName: String,
  branch: String,
});

const salaryPaymentSchema = new mongoose.Schema({
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paidForMonth: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["Bank Transfer", "Cheque", "Cash", "Mobile Money"],
    default: "Bank Transfer",
  },
  transactionReference: String,
  notes: String,
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const instructorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },

    // Professional Information
    department: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      default: "Instructor",
    },
    specialization: {
      type: String,
      required: true,
    },
    qualifications: [qualificationSchema],
    certifications: [certificationSchema],
    expertise: [String],

    // Employment Details
    instructorSince: {
      type: Date,
      default: Date.now,
    },
    hireDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "visiting"],
      default: "full-time",
    },
    contractStartDate: Date,
    contractEndDate: Date,
    contractDuration: String,
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Make sure this is false
      validate: {
        validator: async function (supervisorId) {
          if (!supervisorId) return true;
          const User = mongoose.model("User");
          const supervisor = await User.findById(supervisorId);
          return (
            supervisor && ["admin", "instructor"].includes(supervisor.role)
          );
        },
        message: "Supervisor must be an admin or instructor",
      },
    },

    // Compensation
    salary: {
      type: Number,
      min: 0,
    },
    salaryCurrency: {
      type: String,
      default: "KES",
    },
    paymentSchedule: {
      type: String,
      enum: ["monthly", "bi-weekly"],
      default: "monthly",
    },
    bankAccount: bankAccountSchema,
    benefits: [String],

    // Salary Payment Tracking
    salaryStatus: {
      type: String,
      enum: ["pending", "partial", "paid", "overdue"],
      default: "pending",
    },
    lastSalaryPaidDate: Date,
    lastSalaryAmount: Number,
    salaryBalance: {
      type: Number,
      default: 0,
    },
    salaryPayments: [salaryPaymentSchema],

    // Personal Information
    phone: {
      type: String,
      required: true,
    },
    personalEmail: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },

    // Professional Status
    status: {
      type: String,
      enum: ["active", "inactive", "on_leave", "terminated", "retired"],
      default: "active",
    },
    teachingStatus: {
      type: String,
      enum: ["available", "fully_assigned", "on_break"],
      default: "available",
    },
    maxWorkload: {
      type: Number,
      default: 5,
      min: 1,
      max: 8,
    },
    currentWorkload: {
      type: Number,
      default: 0,
    },

    // Documents & Metadata
    profileImage: String,
    resume: String,
    contractDocument: String,
    notes: String,
    joinedFrom: String,
  },
  {
    timestamps: true,
  },
);

// Auto-generate employee ID before save
instructorSchema.pre("save", async function (next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("Instructor").countDocuments();
    this.employeeId = `INS${year}${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

// Method to update workload based on assigned courses
instructorSchema.methods.updateWorkload = async function () {
  const Course = mongoose.model("Course");
  const courses = await Course.find({
    instructor: this.user, // instructor field in Course references User ID
    status: "active",
  });
  this.currentWorkload = courses.length;
  this.teachingStatus =
    this.currentWorkload >= this.maxWorkload ? "fully_assigned" : "available";
  await this.save();
  return this.currentWorkload;
};

// Method to calculate salary balance
instructorSchema.methods.calculateSalaryBalance = function () {
  const totalPaid = this.salaryPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  this.salaryBalance = this.salary - totalPaid;

  if (this.salaryBalance <= 0) {
    this.salaryStatus = "paid";
  } else if (totalPaid > 0 && this.salaryBalance > 0) {
    this.salaryStatus = "partial";
  } else {
    this.salaryStatus = "pending";
  }

  return this.salaryBalance;
};

// Virtual for years of service
instructorSchema.virtual("yearsOfService").get(function () {
  const now = new Date();
  const hireDate = this.hireDate;
  const years = (now - hireDate) / (1000 * 60 * 60 * 24 * 365);
  return Math.floor(years);
});

// Virtual for full name
instructorSchema.virtual("fullName").get(async function () {
  await this.populate("user", "name");
  return this.user?.name || "Unknown";
});

export default mongoose.model("Instructor", instructorSchema);
