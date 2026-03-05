import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';

// Verify JWT token and attach user to request
export const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next(errorHandler(401, 'No token provided, access denied'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(errorHandler(401, 'Token is not valid'));
    }

    if (!user.isActive) {
      return next(errorHandler(401, 'Account is deactivated'));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(errorHandler(401, 'Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(errorHandler(401, 'Token expired'));
    }
    next(errorHandler(500, 'Server error'));
  }
};

// Verify admin role
export const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(errorHandler(403, 'Access denied. Admin privileges required.'));
  }
  next();
};

// CHANGED: Verify instructor or admin role (was teacherAuth)
export const instructorAuth = (req, res, next) => {
  if (!['admin', 'instructor'].includes(req.user.role)) {
    return next(errorHandler(403, 'Access denied. Instructor or admin privileges required.'));
  }
  next();
};

// Verify receptionist role
export const receptionistAuth = (req, res, next) => {
  if (!['admin', 'receptionist'].includes(req.user.role)) {
    return next(errorHandler(403, 'Access denied. Receptionist or admin privileges required.'));
  }
  next();
};

// Verify receptionist only (not admin)
export const receptionistOnly = (req, res, next) => {
  if (req.user.role !== 'receptionist') {
    return next(errorHandler(403, 'Access denied. Receptionist privileges required.'));
  }
  next();
};

// Optional: Verify specific roles
export const requireRoles = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(errorHandler(403, `Access denied. Required roles: ${roles.join(', ')}`));
    }
    next();
  };
};

// Check if user can access request (admin, receptionist who created it, or assigned staff)
export const canAccessRequest = async (req, res, next) => {
  try {
    const Request = (await import('../models/Request.js')).default;
    const request = await Request.findById(req.params.id);
    
    if (!request) {
      return next(errorHandler(404, 'Request not found'));
    }

    const userId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isReceptionistOwner = request.receptionist.toString() === userId;
    const isAssignedStaff = request.assignedTo && request.assignedTo.toString() === userId;
    
    if (!isAdmin && !isReceptionistOwner && !isAssignedStaff) {
      return next(errorHandler(403, 'Not authorized to access this request'));
    }
    
    req.request = request;
    next();
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};