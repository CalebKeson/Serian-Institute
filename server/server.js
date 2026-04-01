// server.js
import express from "express";
import cors from "cors";
import connectDB from "./config/database.js";

// Existing routes
import authRoutes from './routes/auth.route.js';
import studentRoutes from './routes/student.route.js';
import courseRoutes from './routes/course.route.js';
import enrollmentRoutes from './routes/enrollment.route.js';
import attendanceRoutes from './routes/attendance.route.js';
import requestRoutes from './routes/request.route.js';
import notificationRoutes from './routes/notification.route.js';
import gradeRoutes from './routes/grades.route.js';
import paymentRoutes from './routes/payment.route.js';
import dashboardRoutes from './routes/dashboard.route.js';
import reportsRoutes from './routes/reports.route.js';

// NEW: Income & Expense routes
import incomeSourceRoutes from './routes/incomeSource.route.js'; 
import incomeTransactionRoutes from './routes/incomeTransaction.route.js';
import directorRoutes from './routes/director.route.js';
import expenseCategoryRoutes from './routes/expenseCategory.route.js';
import expenseRoutes from './routes/expense.route.js';
import financialReportRoutes from './routes/financialReport.route.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// ==================== CORS CONFIGURATION ====================
const allowedOrigins = [
  'https://serian-institute-live.vercel.app',
  'https://serian-institute.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

// Apply CORS middleware (this handles OPTIONS automatically)
app.use(cors(corsOptions));

// REMOVED: app.options('*', cors(corsOptions)); // This was causing the error

app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "Serian Management API is running!",
    version: "1.0.0",
  });
});

// ==================== EXISTING ROUTES ====================
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);

// ==================== NEW INCOME & EXPENSE ROUTES ====================

// Income Management
app.use('/api/income-sources', incomeSourceRoutes);
app.use('/api/income', incomeTransactionRoutes);

// Director Management
app.use('/api/directors', directorRoutes);

// Expense Management
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/expenses', expenseRoutes);

// Financial Reports
app.use('/api/financial', financialReportRoutes);

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    cors_enabled: true
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";
  res.status(statusCode).json({ statusCode, success: false, message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`CORS enabled for origins:`, allowedOrigins);
});