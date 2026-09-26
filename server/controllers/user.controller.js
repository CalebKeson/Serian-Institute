
import User from '../models/user.model.js';
import Student from '../models/student.model.js';
import Instructor from '../models/instructor.model.js';
import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';
import { errorHandler } from '../utils/error.js';
import mongoose from 'mongoose';

// ==================== ADMIN METHODS ====================

// @desc    Get all users with pagination and filters
// @route   GET /api/users
// @access  Private (Admin only)
export const getUsers = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role = '', 
      isActive = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (role) query.role = role;
    if (isActive !== '') query.isActive = isActive === 'true';
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const users = await User.find(query)
      .select('-password')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    // Get additional info for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        let studentInfo = null;
        
        if (user.role === 'student') {
          const student = await Student.findOne({ user: user._id });
          if (student) {
            studentInfo = {
              studentId: student.studentId,
              studentStatus: student.status,
            };
          }
        }
        
        return {
          ...user.toObject(),
          studentInfo
        };
      })
    );
    
    res.json({
      success: true,
      data: usersWithStats,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        results: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private (Admin only)
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }
    
    let studentInfo = null;
    if (user.role === 'student') {
      const student = await Student.findOne({ user: user._id });
      if (student) {
        studentInfo = student;
      }
    }
    
    res.json({
      success: true,
      data: {
        ...user.toObject(),
        studentInfo
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin only)
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, isActive } = req.body;
    
    if (!name || !email || !password) {
      return next(errorHandler(400, 'Name, email, and password are required'));
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(errorHandler(400, 'User with this email already exists'));
    }
    
    const validRoles = ['admin', 'instructor', 'student', 'parent', 'receptionist'];
    if (role && !validRoles.includes(role)) {
      return next(errorHandler(400, 'Invalid role specified'));
    }
    
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      isActive: isActive !== undefined ? isActive : true
    });
    
    let studentRecord = null;
    if (user.role === 'student') {
      studentRecord = await Student.create({
        user: user._id,
        dateOfBirth: new Date(),
        gender: 'other',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        },
        emergencyContact: {
          name: '',
          relationship: '',
          phone: ''
        },
        status: 'active',
        studentCategory: 'current'
      });
    }
    
    const userData = user.toObject();
    delete userData.password;
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        ...userData,
        studentRecord
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(errorHandler(400, messages.join(', ')));
    }
    next(errorHandler(500, error.message));
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive, password } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }
    
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return next(errorHandler(400, 'Email already in use'));
      }
    }
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password;
    
    await user.save();
    
    const userData = user.toObject();
    delete userData.password;
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: userData
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(errorHandler(400, messages.join(', ')));
    }
    next(errorHandler(500, error.message));
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }
    
    if (user._id.toString() === req.user._id.toString()) {
      return next(errorHandler(400, 'Cannot delete your own account'));
    }
    
    if (user.role === 'student') {
      const student = await Student.findOne({ user: user._id });
      if (student) {
        const enrollments = await mongoose.model('Enrollment').countDocuments({ student: student._id });
        if (enrollments > 0) {
          return next(errorHandler(400, `Cannot delete user with ${enrollments} enrollment(s). Remove from all courses first.`));
        }
        await Student.findByIdAndDelete(student._id);
      }
    }
    
    await User.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin only)
export const getUserStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    const byRoleObject = {};
    byRole.forEach(item => {
      byRoleObject[item._id] = item.count;
    });
    
    const adminCount = await User.countDocuments({ role: 'admin' });
    const instructorCount = await User.countDocuments({ role: 'instructor' });
    const studentCount = await User.countDocuments({ role: 'student' });
    const parentCount = await User.countDocuments({ role: 'parent' });
    const receptionistCount = await User.countDocuments({ role: 'receptionist' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newToday = await User.countDocuments({
      createdAt: { $gte: today }
    });
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const newThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    
    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        newToday,
        newThisMonth,
        byRole: {
          admin: adminCount,
          instructor: instructorCount,
          student: studentCount,
          parent: parentCount,
          receptionist: receptionistCount
        },
        byRoleDetails: byRoleObject
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// ==================== PROFILE METHODS (For current user) ====================

// @desc    Get current user profile with role-specific data
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    let roleData = null;

    // Fetch role-specific data
    if (user.role === 'student') {
      const student = await Student.findOne({ user: userId });
      
      if (student) {
        const enrollments = await Enrollment.find({ 
          student: student._id,
          status: { $in: ['enrolled', 'completed'] }
        }).populate('course', 'courseCode name price');
        
        roleData = {
          studentId: student.studentId,
          status: student.status,
          studentCategory: student.studentCategory,
          enrollments: enrollments.map(e => ({
            courseId: e.course?._id,
            courseCode: e.course?.courseCode || 'N/A',
            courseName: e.course?.name || 'Unknown Course',
            admissionNumber: e.admissionNumber || 'N/A',
            status: e.status,
            enrollmentDate: e.enrollmentDate,
            grade: e.grade || 'N/A'
          })),
          completedEnrollmentsCount: enrollments.filter(e => e.status === 'completed').length,
          activeEnrollmentsCount: enrollments.filter(e => e.status === 'enrolled').length,
          hasEnrollments: enrollments.length > 0
        };
      }
    } else if (user.role === 'instructor') {
      const instructor = await Instructor.findOne({ user: userId })
        .populate('user', 'name email');
      
      if (instructor) {
        const courses = await Course.find({ 
          instructor: userId,
          status: 'active'
        }).select('courseCode name enrolledStudents');
        
        const totalStudents = courses.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0);
        
        roleData = {
          employeeId: instructor.employeeId,
          department: instructor.department,
          designation: instructor.designation,
          specialization: instructor.specialization,
          courses: courses.map(c => ({
            courseId: c._id,
            courseCode: c.courseCode,
            name: c.name,
            enrolledCount: c.enrolledStudents?.length || 0
          })),
          totalStudents: totalStudents,
          currentWorkload: courses.length,
          maxWorkload: instructor.maxWorkload || 5
        };
      }
    }

    // Format date of birth for response
    const userObj = user.toObject();
    if (userObj.dateOfBirth) {
      userObj.dateOfBirth = userObj.dateOfBirth.toISOString().split('T')[0];
    }

    res.json({
      success: true,
      data: {
        user: userObj,
        roleData
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, email, phone, address, dateOfBirth, gender, bio } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return next(errorHandler(400, 'Email already in use'));
      }
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (gender) user.gender = gender;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    const userData = user.toObject();
    delete userData.password;
    
    // Format date of birth for response
    if (userData.dateOfBirth) {
      userData.dateOfBirth = userData.dateOfBirth.toISOString().split('T')[0];
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: userData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(errorHandler(400, messages.join(', ')));
    }
    next(errorHandler(500, error.message));
  }
};

// @desc    Update avatar (stores in localStorage for now)
// @route   POST /api/users/profile/avatar
// @access  Private
export const updateAvatar = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { avatarData } = req.body; // Base64 image data from frontend

    if (!avatarData) {
      return next(errorHandler(400, 'Avatar data is required'));
    }

    // For now, we'll just validate the data and return success
    // The frontend stores the avatar in localStorage
    // Later, we'll save to cloud storage (Cloudinary, S3, etc.)
    
    // Optionally, you could save the avatar URL to the user record
    // For now, we'll just acknowledge receipt
    // const user = await User.findById(userId);
    // if (user) {
    //   user.avatarUrl = avatarData; // Or a URL
    //   await user.save();
    // }

    res.json({
      success: true,
      message: 'Avatar updated successfully (stored locally)',
      data: { avatarData }
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    next(errorHandler(500, error.message));
  }
};