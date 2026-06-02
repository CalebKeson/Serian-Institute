import mongoose from 'mongoose';
import Enrollment from '../models/enrollment.model.js';
import Course from '../models/course.model.js';

/**
 * Simple service to track course enrollment counts
 * This is a lightweight alternative to a separate Counter collection
 */

/**
 * Get the current enrollment count for a course
 * 
 * @param {string} courseId - The course ID
 * @returns {Promise<number>} - Number of enrolled students
 */
export const getCourseEnrollmentCount = async (courseId) => {
  try {
    const count = await Enrollment.countDocuments({
      course: courseId,
      status: 'enrolled'
    });
    return count;
  } catch (error) {
    console.error('Error getting course enrollment count:', error);
    throw error;
  }
};

/**
 * Get the next sequence number for a course's admission numbers
 * 
 * @param {string} courseId - The course ID
 * @returns {Promise<number>} - Next sequence number (starting from 1)
 */
export const getNextSequenceNumber = async (courseId) => {
  try {
    const currentCount = await getCourseEnrollmentCount(courseId);
    return currentCount + 1;
  } catch (error) {
    console.error('Error getting next sequence number:', error);
    throw error;
  }
};

/**
 * Get detailed enrollment metrics for a course
 * 
 * @param {string} courseId - The course ID
 * @returns {Promise<Object>} - Detailed metrics
 */
export const getCourseMetrics = async (courseId) => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    const [
      totalEnrolled,
      totalCompleted,
      totalDropped,
      totalWaitlisted
    ] = await Promise.all([
      Enrollment.countDocuments({ course: courseId, status: 'enrolled' }),
      Enrollment.countDocuments({ course: courseId, status: 'completed' }),
      Enrollment.countDocuments({ course: courseId, status: 'dropped' }),
      Enrollment.countDocuments({ course: courseId, status: 'waitlisted' })
    ]);
    
    // Get enrollment trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEnrollments = await Enrollment.countDocuments({
      course: courseId,
      enrollmentDate: { $gte: thirtyDaysAgo }
    });
    
    return {
      courseId: course._id,
      courseCode: course.courseCode,
      courseName: course.name,
      metrics: {
        totalEnrolled,
        totalCompleted,
        totalDropped,
        totalWaitlisted,
        activeEnrollments: totalEnrolled,
        recentEnrollments,
        capacity: course.maxStudents,
        utilizationRate: Math.round((totalEnrolled / course.maxStudents) * 100),
        availableSpots: Math.max(0, course.maxStudents - totalEnrolled)
      },
      nextSequenceNumber: totalEnrolled + 1,
      admissionNumberPrefix: `${course.courseCode}/`,
      currentYear: new Date().getFullYear().toString().slice(-2)
    };
  } catch (error) {
    console.error('Error getting course metrics:', error);
    throw error;
  }
};

/**
 * Check if course has reached capacity
 * 
 * @param {string} courseId - The course ID
 * @returns {Promise<boolean>} - True if course is full
 */
export const isCourseFull = async (courseId) => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    const enrolledCount = await getCourseEnrollmentCount(courseId);
    return enrolledCount >= course.maxStudents;
  } catch (error) {
    console.error('Error checking if course is full:', error);
    throw error;
  }
};

/**
 * Get available spots for a course
 * 
 * @param {string} courseId - The course ID
 * @returns {Promise<number>} - Number of available spots
 */
export const getAvailableSpots = async (courseId) => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    const enrolledCount = await getCourseEnrollmentCount(courseId);
    return Math.max(0, course.maxStudents - enrolledCount);
  } catch (error) {
    console.error('Error getting available spots:', error);
    throw error;
  }
};

export default {
  getCourseEnrollmentCount,
  getNextSequenceNumber,
  getCourseMetrics,
  isCourseFull,
  getAvailableSpots
};