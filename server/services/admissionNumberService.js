import mongoose from 'mongoose';
import Enrollment from '../models/enrollment.model.js';
import Course from '../models/course.model.js';

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
    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const courseCode = course.courseCode;
    const currentYear = new Date().getFullYear().toString().slice(-2);
    
    // Count existing ENROLLED students for this course (not dropped or completed)
    const enrolledCount = await Enrollment.countDocuments({
      course: courseId,
      status: 'enrolled'
    });
    
    // Next sequential number (start from 1 if no enrollments)
    const sequentialNumber = String(enrolledCount + 1).padStart(3, '0');
    
    const admissionNumber = `${courseCode}/${sequentialNumber}/${currentYear}`;
    
    // Verify uniqueness (safety check)
    const existing = await Enrollment.findOne({ admissionNumber });
    if (existing) {
      // Extremely rare race condition - retry once
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
 * Generate admission number for a specific position (useful for testing or manual fixes)
 * 
 * @param {string} courseCode - The course code (e.g., CNA, DRV)
 * @param {number} sequenceNumber - The sequence number (1, 2, 3...)
 * @param {number} year - The year (e.g., 2026)
 * @returns {string} - Formatted admission number
 */
export const formatAdmissionNumber = (courseCode, sequenceNumber, year) => {
  const yearShort = year.toString().slice(-2);
  const seqPadded = String(sequenceNumber).padStart(3, '0');
  return `${courseCode}/${seqPadded}/${yearShort}`;
};

/**
 * Parse admission number into its components
 * 
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
    fullYear: 2000 + parseInt(parts[2], 10) // Assuming 21st century
  };
};

/**
 * Get all admission numbers for a specific student
 * 
 * @param {string} studentId - The student ID
 * @returns {Promise<Array>} - List of admission numbers with course details
 */
export const getStudentAdmissionNumbers = async (studentId) => {
  try {
    const enrollments = await Enrollment.find({ 
      student: studentId,
      status: 'enrolled'
    })
    .populate('course', 'courseCode name')
    .select('admissionNumber course status');
    
    return enrollments.map(enrollment => ({
      admissionNumber: enrollment.admissionNumber,
      courseCode: enrollment.course?.courseCode,
      courseName: enrollment.course?.name,
      courseId: enrollment.course?._id,
      status: enrollment.status
    }));
  } catch (error) {
    console.error('Error getting student admission numbers:', error);
    return [];
  }
};

/**
 * Check if a student has any admission numbers (is enrolled in any course)
 * 
 * @param {string} studentId - The student ID
 * @returns {Promise<boolean>} - True if student has at least one enrollment
 */
export const hasAnyAdmissionNumber = async (studentId) => {
  try {
    const count = await Enrollment.countDocuments({
      student: studentId,
      status: 'enrolled'
    });
    return count > 0;
  } catch (error) {
    console.error('Error checking admission numbers:', error);
    return false;
  }
};

/**
 * Get enrollment statistics for a course (for reporting)
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
      status: 'enrolled'
    });
    
    const completedEnrollments = await Enrollment.countDocuments({
      course: courseId,
      status: 'completed'
    });
    
    const droppedEnrollments = await Enrollment.countDocuments({
      course: courseId,
      status: 'dropped'
    });
    
    // Get the highest admission number sequence for this course
    const enrollments = await Enrollment.find({ 
      course: courseId,
      status: 'enrolled'
    }).select('admissionNumber');
    
    let maxSequence = 0;
    enrollments.forEach(enrollment => {
      try {
        const parsed = parseAdmissionNumber(enrollment.admissionNumber);
        if (parsed.sequenceNumber > maxSequence) {
          maxSequence = parsed.sequenceNumber;
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
      dropped: droppedEnrollments,
      activeEnrollments: totalEnrollments,
      maxSequenceNumber: maxSequence,
      nextSequenceNumber: maxSequence + 1,
      capacity: course.maxStudents,
      availableSpots: Math.max(0, course.maxStudents - totalEnrollments),
      isFull: totalEnrollments >= course.maxStudents
    };
  } catch (error) {
    console.error('Error getting course enrollment stats:', error);
    throw error;
  }
};

/**
 * Validate an admission number format and optionally check if it exists
 * 
 * @param {string} admissionNumber - Admission number to validate
 * @param {boolean} checkExists - Whether to check if it already exists in database
 * @returns {Promise<Object>} - { isValid, error, exists }
 */
export const validateAdmissionNumber = async (admissionNumber, checkExists = false) => {
  try {
    // Check format
    const formatRegex = /^[A-Z]{3,4}\/\d{3}\/\d{2}$/;
    if (!formatRegex.test(admissionNumber)) {
      return {
        isValid: false,
        error: 'Invalid format. Use: COURSECODE/001/26 (e.g., CNA/001/26)'
      };
    }
    
    // Parse to verify components
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
    
    // Check if exists in database
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
 * Bulk generate admission numbers for multiple students enrolling in same course
 * Useful for batch enrollments
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
    
    // Get current enrollment count
    const currentEnrollments = await Enrollment.countDocuments({
      course: courseId,
      status: 'enrolled'
    });
    
    const admissionNumbers = [];
    for (let i = 1; i <= count; i++) {
      const sequenceNumber = currentEnrollments + i;
      const seqPadded = String(sequenceNumber).padStart(3, '0');
      const admissionNumber = `${courseCode}/${seqPadded}/${currentYear}`;
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
    
    // Get all enrollments for this course sorted by enrollment date
    const enrollments = await Enrollment.find({ course: courseId })
      .sort({ enrollmentDate: 1 })
      .session(session);
    
    const updated = [];
    const errors = [];
    
    for (let i = 0; i < enrollments.length; i++) {
      const enrollment = enrollments[i];
      const sequenceNumber = i + 1;
      const seqPadded = String(sequenceNumber).padStart(3, '0');
      const newAdmissionNumber = `${courseCode}/${seqPadded}/${currentYear}`;
      
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