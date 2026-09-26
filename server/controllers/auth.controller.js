// controllers/auth.controller.js - COMPLETE FIXED VERSION

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import { 
  sendPasswordResetEmail, 
  sendPasswordResetConfirmation 
} from '../services/emailService.js';

// ============ TOKEN GENERATORS ============
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const generateResetToken = () => {
  const resetToken = crypto.randomBytes(20).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  const resetPasswordExpire = Date.now() + 5 * 60 * 1000;
  
  return { resetToken, hashedToken, resetPasswordExpire };
};

// ============ REGISTER ============
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(errorHandler(400, 'User already exists with this email'));
    }

    const validRoles = ['admin', 'instructor', 'student', 'parent', 'receptionist'];
    if (role && !validRoles.includes(role)) {
      return next(errorHandler(400, 'Invalid role specified'));
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student'
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    next(errorHandler(400, error.message));
  }
};

// ============ LOGIN ============
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return next(errorHandler(401, 'Invalid email or password'));
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(errorHandler(401, 'Invalid email or password'));
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    next(errorHandler(400, error.message));
  }
};

// ============ FORGOT PASSWORD ============
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists, a reset email has been sent'
      });
    }

    const { resetToken, hashedToken, resetPasswordExpire } = generateResetToken();

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = resetPasswordExpire;
    await user.save();

    await sendPasswordResetEmail(user.email, resetToken);

    res.json({
      success: true,
      message: 'If an account exists, a reset email has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    next(errorHandler(500, error.message));
  }
};

// ============ VALIDATE RESET TOKEN ============
export const validateResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return next(errorHandler(400, 'Invalid or expired reset token'));
    }
    
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(errorHandler(400, 'Invalid or expired reset token'));
    }

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        email: user.email
      }
    });
  } catch (error) {
    console.error('Validate token error:', error);
    next(errorHandler(500, error.message));
  }
};

// ============ RESET PASSWORD ============
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(errorHandler(400, 'Invalid or expired reset token'));
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await sendPasswordResetConfirmation(user.email);

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// ============ GOOGLE AUTH ============
export const googleAuth = async (req, res, next) => {
  try {
    const { email, name, photo } = req.body;

    if (!email || !name) {
      return next(errorHandler(400, 'Email and name are required'));
    }

    let user = await User.findOne({ email });

    if (user) {
      if (!user.isActive) {
        return next(errorHandler(403, 'Account is deactivated. Please contact support.'));
      }

      const token = generateToken(user._id);

      return res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: token
        }
      });
    } else {
      const randomPassword = Math.random().toString(36).slice(-8) + 
                            Math.random().toString(36).slice(-8);
      
      user = await User.create({
        name: name,
        email: email,
        password: randomPassword,
        role: 'student',
        isActive: true
      });

      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        message: 'User created successfully via Google',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: token
        }
      });
    }
  } catch (error) {
    console.error('Google auth error:', error);
    next(errorHandler(500, error.message));
  }
};

// ============ GET INSTRUCTORS ============
export const getInstructors = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return next(errorHandler(403, 'Not authorized to view instructors'));
    }

    const instructors = await User.find({ 
      role: 'instructor',
      isActive: true 
    }).select('name email role');

    res.json({
      success: true,
      data: instructors
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// ============ CREATE INSTRUCTOR ============
export const createInstructor = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, 'Only admin can create instructors'));
    }

    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(errorHandler(400, 'User with this email already exists'));
    }

    const instructor = await User.create({
      name,
      email,
      password,
      role: 'instructor'
    });

    res.status(201).json({
      success: true,
      message: 'Instructor created successfully',
      data: {
        _id: instructor._id,
        name: instructor.name,
        email: instructor.email,
        role: instructor.role
      }
    });
  } catch (error) {
    next(errorHandler(400, error.message));
  }
};

// ============ CHANGE PASSWORD - COMPLETE FIX ============
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(errorHandler(400, 'Current password and new password are required'));
    }

    if (newPassword.length < 6) {
      return next(errorHandler(400, 'New password must be at least 6 characters'));
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return next(errorHandler(401, 'Current password is incorrect'));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate NEW JWT token
    const newToken = generateToken(user._id);

    // Get user without password
    const userData = user.toObject();
    delete userData.password;

    // Send back new token AND user data
    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        token: newToken,
        user: userData
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    next(errorHandler(500, error.message));
  }
};