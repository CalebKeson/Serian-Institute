// server.js
import express from "express";
import cors from "cors";
import connectDB from "./config/database.js";
import authRoutes from './routes/auth.route.js';
import studentRoutes from './routes/student.route.js';
import courseRoutes from './routes/course.route.js';
import enrollmentRoutes from './routes/enrollment.route.js';
import attendanceRoutes from './routes/attendance.route.js';
import requestRoutes from './routes/request.route.js';
import notificationRoutes from './routes/notification.route.js';
import gradeRoutes from './routes/grades.route.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware 
app.use(cors());
app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "Serian Management API is running!",
    version: "1.0.0",
  });
});

// Routes will be added here
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/grades', gradeRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";
  res.status(statusCode).json({ statusCode, success: false, message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
