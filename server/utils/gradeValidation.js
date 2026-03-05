// utils/gradeValidation.js

/**
 * Validate academic year format
 */
export const validateAcademicYear = (year) => {
  const regex = /^\d{4}-\d{4}$/;
  if (!regex.test(year)) return false;
  
  const [start, end] = year.split('-').map(Number);
  return end === start + 1;
};

/**
 * Generate current academic year
 */
export const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Academic year starts in September (month 8)
  if (month >= 8) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

/**
 * Calculate weighted grade
 */
export const calculateWeightedGrade = (grades) => {
  let totalWeight = 0;
  let weightedSum = 0;
  
  grades.forEach(grade => {
    if (!grade.isDropped && grade.score && grade.maxScore) {
      const percentage = (grade.score / grade.maxScore) * 100;
      weightedSum += percentage * grade.weight;
      totalWeight += grade.weight;
    }
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
};

/**
 * Validate grade data
 */
export const validateGradeData = (data) => {
  const errors = [];
  
  if (!data.student) errors.push('Student is required');
  if (!data.course) errors.push('Course is required');
  if (!data.assessmentType) errors.push('Assessment type is required');
  if (!data.assessmentName) errors.push('Assessment name is required');
  if (data.score === undefined) errors.push('Score is required');
  if (!data.maxScore) errors.push('Maximum score is required');
  if (data.score > data.maxScore) errors.push('Score cannot exceed maximum score');
  if (data.weight && (data.weight < 0 || data.weight > 100)) {
    errors.push('Weight must be between 0 and 100');
  }
  if (data.assessmentDate && new Date(data.assessmentDate) > new Date()) {
    errors.push('Assessment date cannot be in the future');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};