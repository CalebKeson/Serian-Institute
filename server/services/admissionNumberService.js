// backend/services/admissionNumberService.js - COMPLETE FIXED VERSION

import mongoose from 'mongoose';
import Enrollment from '../models/enrollment.model.js';
import Course from '../models/course.model.js';

// ============ HELPER FUNCTIONS (Define FIRST before exports) ============

/**
 * Format admission number from components
 * @param {string} courseCode - Course code (e.g., CNA)
 * @param {number} sequenceNumber - Sequence number (e.g., 1)
 * @param {number|string} year - Year (e.g., 2026 or 26)
 * @returns {string} - Formatted admission number
 */
export const formatAdmissionNumber = (courseCode, sequenceNumber, year) => {
  const yearShort = year.toString().slice(-2);
  const seqPadded = String(sequenceNumber).padStart(3, '0');
  return `${courseCode}/${seqPadded}/${yearShort}`;
};

/**
 * Parse admission number into its components
 * @param {string} admissionNumber - Format: CNA/001/26
 * @returns {Object} - { courseCode, sequenceNumber, year }
 */
export const parseAdmissionNumber = (admissionNumber) => {
  const parts = admissionNumber.split('/');
  if (parts.length !== 3) {
    throw new Error('Invalid admission number format');
  }
  
  return {
    courseCode: parts[0],
    sequenceNumber: parseInt(parts[1], 10),
    year: parseInt(parts[2], 10),
    fullYear: 2000 + parseInt(parts[2], 10)
  };
};

/**
 * Validate an admission number format and optionally check if it exists
 * @param {string} admissionNumber - Admission number to validate
 * @param {boolean} checkExists - Whether to check if it already exists in database
 * @returns {Promise<Object>} - { isValid, error, exists }
 */
export const validateAdmissionNumber = async (admissionNumber, checkExists = false) => {
  try {
    const formatRegex = /^[A-Z]{3,4}\/\d{3}\/\d{2}$/;
    if (!formatRegex.test(admissionNumber)) {
      return {
        isValid: false,
        error: 'Invalid format. Use: COURSECODE/001/26 (e.g., CNA/001/26)'
      };
    }
    
    const parts = admissionNumber.split('/');
    const sequenceNum = parseInt(parts[1], 10);
    const yearShort = parseInt(parts[2], 10);
    
    if (sequenceNum < 1 || sequenceNum > 999) {
      return {
        isValid: false,
        error: 'Sequence number must be between 001 and 999'
      };
    }
    
    if (yearShort < 0 || yearShort > 99) {
      return {
        isValid: false,
        error: 'Year must be a valid 2-digit year (e.g., 24, 25, 26)'
      };
    }
    
    if (checkExists) {
      const exists = await Enrollment.findOne({ admissionNumber });
      return {
        isValid: true,
        exists: !!exists,
        enrollment: exists
      };
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('Error validating admission number:', error);
    return {
      isValid: false,
      error: error.message
    };
  }
};

/**
 * Generate a sequential admission number for a student enrolling in a course
 * Format: {courseCode}/{sequentialNumber}/{year}
 * Example: CNA/001/26
 * 
 * @param {string} courseId - The ID of the course
 * @returns {Promise<string>} - Generated admission number
 */
export const generateAdmissionNumber = async (courseId) => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const courseCode = course.courseCode;
    const currentYear = new Date().getFullYear().toString().slice(-2);
    
    // Count existing enrollments (including completed and graduated for historical continuity)
    const enrolledCount = await Enrollment.countDocuments({
      course: courseId,
      status: { $in: ['enrolled', 'completed', 'graduated'] }
    });
    
    const sequentialNumber = String(enrolledCount + 1).padStart(3, '0');
    const admissionNumber = formatAdmissionNumber(courseCode, sequentialNumber, currentYear);
    
    const existing = await Enrollment.findOne({ admissionNumber });
    if (existing) {
      console.warn(`Duplicate admission number detected: ${admissionNumber}. Retrying...`);
      return await generateAdmissionNumber(courseId);
    }
    
    return admissionNumber;
  } catch (error) {
    console.error('Error generating admission number:', error);
    throw error;
  }
};

/**
 * Get all admission numbers for a specific student (including completed)
 * 
 * @param {string} studentId - The student ID
 * @param {boolean} includeCompleted - Whether to include completed/graduated enrollments
 * @returns {Promise<Array>} - List of admission numbers with course details
 */
export const getStudentAdmissionNumbers = async (studentId, includeCompleted = true) => {
  try {
    const statusQuery = includeCompleted 
      ? { $in: ['enrolled', 'completed', 'graduated'] }
      : 'enrolled';
    
    const enrollments = await Enrollment.find({ 
      student: studentId,
      status: statusQuery
    })
    .populate('course', 'courseCode name')
    .select('admissionNumber course status completedAt');
    
    return enrollments.map(enrollment => ({
      admissionNumber: enrollment.admissionNumber,
      courseCode: enrollment.course?.courseCode,
      courseName: enrollment.course?.name,
      courseId: enrollment.course?._id,
      status: enrollment.status,
      completedAt: enrollment.completedAt
    }));
  } catch (error) {
    console.error('Error getting student admission numbers:', error);
    return [];
  }
};

/**
 * Check if a student has any admission numbers (including completed)
 * 
 * @param {string} studentId - The student ID
 * @param {boolean} includeCompleted - Whether to include completed/graduated enrollments
 * @returns {Promise<boolean>} - True if student has at least one enrollment
 */
export const hasAnyAdmissionNumber = async (studentId, includeCompleted = true) => {
  try {
    const statusQuery = includeCompleted 
      ? { $in: ['enrolled', 'completed', 'graduated'] }
      : 'enrolled';
    
    const count = await Enrollment.countDocuments({
      student: studentId,
      status: statusQuery
    });
    return count > 0;
  } catch (error) {
    console.error('Error checking admission numbers:', error);
    return false;
  }
};

/**
 * Get enrollment statistics for a course
 * 
 * @param {string} courseId - The course ID
 * @returns {Promise<Object>} - Statistics about enrollments
 */
export const getCourseEnrollmentStats = async (courseId) => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    const totalEnrollments = await Enrollment.countDocuments({ 
      course: courseId,
      status: { $in: ['enrolled', 'completed', 'graduated'] }
    });
    
    const completedEnrollments = await Enrollment.countDocuments({
      course: courseId,
      status: 'completed'
    });
    
    const graduatedEnrollments = await Enrollment.countDocuments({
      course: courseId,
      status: 'graduated'
    });
    
    const droppedEnrollments = await Enrollment.countDocuments({
      course: courseId,
      status: 'dropped'
    });
    
    const activeEnrollments = await Enrollment.countDocuments({
      course: courseId,
      status: 'enrolled'
    });
    
    const enrollments = await Enrollment.find({ 
      course: courseId,
      status: { $in: ['enrolled', 'completed', 'graduated'] }
    }).select('admissionNumber');
    
    let maxSequence = 0;
    enrollments.forEach(enrollment => {
      try {
        const parts = enrollment.admissionNumber.split('/');
        if (parts.length >= 2) {
          const sequence = parseInt(parts[1], 10);
          if (sequence > maxSequence) maxSequence = sequence;
        }
      } catch (err) {
        // Skip invalid admission numbers
      }
    });
    
    return {
      courseCode: course.courseCode,
      courseName: course.name,
      totalEnrolled: totalEnrollments,
      completed: completedEnrollments,
      graduated: graduatedEnrollments,
      dropped: droppedEnrollments,
      activeEnrollments,
      maxSequenceNumber: maxSequence,
      nextSequenceNumber: maxSequence + 1,
      capacity: course.maxStudents,
      availableSpots: Math.max(0, course.maxStudents - activeEnrollments),
      isFull: activeEnrollments >= course.maxStudents
    };
  } catch (error) {
    console.error('Error getting course enrollment stats:', error);
    throw error;
  }
};

/**
 * Bulk generate admission numbers for multiple students enrolling in same course
 * 
 * @param {string} courseId - The course ID
 * @param {number} count - Number of admission numbers to generate
 * @returns {Promise<Array>} - List of generated admission numbers
 */
export const bulkGenerateAdmissionNumbers = async (courseId, count) => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const courseCode = course.courseCode;
    
    const currentEnrollments = await Enrollment.countDocuments({
      course: courseId,
      status: { $in: ['enrolled', 'completed', 'graduated'] }
    });
    
    const admissionNumbers = [];
    for (let i = 1; i <= count; i++) {
      const sequenceNumber = currentEnrollments + i;
      const admissionNumber = formatAdmissionNumber(courseCode, sequenceNumber, currentYear);
      admissionNumbers.push(admissionNumber);
    }
    
    return admissionNumbers;
  } catch (error) {
    console.error('Error bulk generating admission numbers:', error);
    throw error;
  }
};

/**
 * Re-generate admission numbers for a course (fix missing or corrupted ones)
 * Use with caution - only for administrative fixes
 * 
 * @param {string} courseId - The course ID
 * @returns {Promise<Object>} - Results of regeneration
 */
export const regenerateCourseAdmissionNumbers = async (courseId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const course = await Course.findById(courseId).session(session);
    if (!course) {
      throw new Error('Course not found');
    }
    
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const courseCode = course.courseCode;
    
    const enrollments = await Enrollment.find({ course: courseId })
      .sort({ enrollmentDate: 1 })
      .session(session);
    
    const updated = [];
    const errors = [];
    
    for (let i = 0; i < enrollments.length; i++) {
      const enrollment = enrollments[i];
      const sequenceNumber = i + 1;
      const newAdmissionNumber = formatAdmissionNumber(courseCode, sequenceNumber, currentYear);
      
      try {
        enrollment.admissionNumber = newAdmissionNumber;
        await enrollment.save({ session });
        updated.push({
          oldNumber: enrollment.admissionNumber,
          newNumber: newAdmissionNumber,
          studentId: enrollment.student
        });
      } catch (err) {
        errors.push({
          enrollmentId: enrollment._id,
          error: err.message
        });
      }
    }
    
    await session.commitTransaction();
    session.endSession();
    
    return {
      success: true,
      courseCode,
      totalEnrollments: enrollments.length,
      updated: updated.length,
      errors,
      updatedList: updated
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error regenerating admission numbers:', error);
    throw error;
  }
};

// Default export
export default {
  generateAdmissionNumber,
  formatAdmissionNumber,
  parseAdmissionNumber,
  getStudentAdmissionNumbers,
  hasAnyAdmissionNumber,
  getCourseEnrollmentStats,
  validateAdmissionNumber,
  bulkGenerateAdmissionNumbers,
  regenerateCourseAdmissionNumbers
};