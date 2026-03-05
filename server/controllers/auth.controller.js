import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import crypto from 'crypto';
import { 
  sendPasswordResetEmail, 
  sendPasswordResetConfirmation 
} from '../services/emailService.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register user
// @route   POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(errorHandler(400, 'User already exists with this email'));
    }

    // Validate role - CHANGED: "teacher" to "instructor"
    const validRoles = ['admin', 'instructor', 'student', 'parent', 'receptionist'];
    if (role && !validRoles.includes(role)) {
      return next(errorHandler(400, 'Invalid role specified'));
    }

    // Create user
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

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user
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

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found with email:', email);
      // Return success even if user doesn't exist (security best practice)
      return res.json({
        success: true,
        message: 'If an account exists, a reset email has been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token and expiration (5 minutes)
    user.resetPasswordToken = hashedToken;
    const expirationDate = new Date(Date.now() + 5 * 60 * 1000)
    user.resetPasswordExpire = expirationDate; // 5 minutes
    await user.save();

    // Send email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    console.log('🔗 Reset URL:', resetUrl);
    
    await sendPasswordResetEmail(user.email, resetToken);

    res.json({
      success: true,
      message: 'If an account exists, a reset email has been sent'
    });

  } catch (error) {
    console.error('🔥 ERROR in forgotPassword:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Validate reset token
// @route   GET /api/auth/reset-password/:token
export const validateResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      console.log('❌ ERROR: No token provided');
      return next(errorHandler(400, 'Invalid or expired reset token'));
    }
    
    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with valid, non-expired token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      console.log('🔍 Searching database for token...');
      
      // Let's search for ANY user with this token (even expired)
      const anyUser = await User.findOne({
        resetPasswordToken: hashedToken
      });
      
      if (anyUser) {
        console.log('⏰ Found user but token expired');
        console.log('📧 User email:', anyUser.email);
        console.log('⏳ Expiration time:', new Date(anyUser.resetPasswordExpire));
        console.log('⏳ Current time:', new Date());
        console.log('⏳ Is expired?', Date.now() > anyUser.resetPasswordExpire);
      } else {
        console.log('❌ No user found with this token at all');
        
        // Let's see what tokens exist in the database
        const allUsersWithTokens = await User.find({
          resetPasswordToken: { $exists: true }
        }).select('email resetPasswordExpire');
        
        console.log('📊 Total users with reset tokens:', allUsersWithTokens.length);
        allUsersWithTokens.forEach(u => {
          console.log(`   - ${u.email}: expires ${new Date(u.resetPasswordExpire)}`);
        });
      }
      
      console.log('❌ ERROR: Invalid or expired reset token');
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
    console.error('🔥 ERROR in validateResetToken:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid, non-expired token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(errorHandler(400, 'Invalid or expired reset token'));
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Send confirmation email
    await sendPasswordResetConfirmation(user.email);

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Google authentication
// @route   POST /api/auth/google-auth
export const googleAuth = async (req, res, next) => {
  try {
    const { email, name, photo } = req.body;

    // Validate required fields
    if (!email || !name) {
      return next(errorHandler(400, 'Email and name are required'));
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, sign them in
      // Check if user is active
      if (!user.isActive) {
        return next(errorHandler(403, 'Account is deactivated. Please contact support.'));
      }

      // Generate token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
      });

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
      // User doesn't exist, create new user
      // Generate a random password (Google users won't use it)
      const randomPassword = Math.random().toString(36).slice(-8) + 
                            Math.random().toString(36).slice(-8);
      
      // Create user with Google data
      user = await User.create({
        name: name,
        email: email,
        password: randomPassword,
        role: 'student', // Default role for Google signups
        isActive: true
      });

      // Generate token for new user
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
      });

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

// NEW: Get all instructors for course assignment
// @desc    Get all instructors (users with role 'instructor')
// @route   GET /api/auth/instructors
// @access  Private (admin, instructor)
export const getInstructors = async (req, res, next) => {
  try {
    // Check if user is authorized (admin or instructor)
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

// NEW: Create instructor (admin only)
// @desc    Create new instructor
// @route   POST /api/auth/instructors
// @access  Private (admin only)
export const createInstructor = async (req, res, next) => {
  try {
    // Only admin can create instructors
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, 'Only admin can create instructors'));
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(errorHandler(400, 'User with this email already exists'));
    }

    // Create instructor (role is forced to 'instructor')
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