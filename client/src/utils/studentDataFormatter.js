/**
 * Formats student data for API requests
 */

export const formatStudentForAPI = (formData, isCreate = false) => {
  const data = { ...formData };
  
  // Format date to YYYY-MM-DD
  if (data.dateOfBirth) {
    if (data.dateOfBirth instanceof Date) {
      data.dateOfBirth = data.dateOfBirth.toISOString().split('T')[0];
    } else if (typeof data.dateOfBirth === 'string') {
      // Ensure it's in the right format
      const date = new Date(data.dateOfBirth);
      if (!isNaN(date.getTime())) {
        data.dateOfBirth = date.toISOString().split('T')[0];
      }
    }
  }
  
  // For creation, add role field
  if (isCreate) {
    data.role = 'student';
  }
  
  // Remove any undefined or null values
  Object.keys(data).forEach(key => {
    if (data[key] === undefined || data[key] === null) {
      delete data[key];
    }
  });
  
  return data;
};

/**
 * Formats API response data for the form
 */
export const formatStudentForForm = (studentData) => {
  if (!studentData) return {};
  
  const data = { ...studentData };
  
  // Format date for date input (YYYY-MM-DD)
  if (data.dateOfBirth) {
    const date = new Date(data.dateOfBirth);
    if (!isNaN(date.getTime())) {
      data.dateOfBirth = date.toISOString().split('T')[0];
    }
  }
  
  // Ensure nested objects exist
  data.address = data.address || {};
  data.emergencyContact = data.emergencyContact || {};
  
  return data;
};