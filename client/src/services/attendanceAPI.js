// src/services/attendanceAPI.js
import api from './api';
import toast from 'react-hot-toast';

export const attendanceAPI = {
  // Mark attendance for a single student
  markAttendance: async (studentId, courseId, data) => {
    try {
      const attendanceData = {
        ...data,
        session: 'full-day'
      };
      
      const response = await api.post('/attendance', {
        studentId,
        courseId,
        ...attendanceData
      });

      toast.success('Attendance marked successfully!');
      return { 
        success: true, 
        data: response.data.data 
      };

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark attendance';
      toast.error(errorMessage);
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  },

  // Bulk mark attendance for multiple students
  bulkMarkAttendance: async (courseId, date, session, attendanceData) => {
    try {
      const response = await api.post('/attendance/bulk', {
        courseId,
        date,
        session: 'full-day',
        attendanceData
      });

      toast.success(response.data.message || 'Attendance marked successfully!');
      return { 
        success: true, 
        data: response.data.data 
      };

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to bulk mark attendance';
      toast.error(errorMessage);
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  },

  // Get attendance for a course on a specific date
  getCourseAttendance: async (courseId, date, session = 'full-day') => {
    try {
      const response = await api.get(`/attendance/course/${courseId}`, {
        params: { date, session: 'full-day' }
      });

      return { 
        success: true, 
        data: response.data.data 
      };

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch course attendance';
      toast.error(errorMessage);
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  },

  // Get attendance history for a student
  getStudentAttendance: async (studentId, startDate, endDate, courseId = null, page = 1, limit = 20) => {
    try {
      const params = {
        startDate,
        endDate,
        page,
        limit
      };
      
      if (courseId) {
        params.courseId = courseId;
      }

      const response = await api.get(`/attendance/student/${studentId}`, { params });

      return { 
        success: true, 
        data: response.data.data,
        pagination: response.data.pagination 
      };

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch student attendance';
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  },

  // Update attendance record
  updateAttendance: async (attendanceId, data) => {
    try {
      const updateData = {
        ...data,
        session: 'full-day'
      };
      
      const response = await api.put(`/attendance/${attendanceId}`, updateData);

      toast.success('Attendance updated successfully!');
      return { 
        success: true, 
        data: response.data.data 
      };

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update attendance';
      toast.error(errorMessage);
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  },

  // Get attendance statistics
  getAttendanceStats: async (courseId = null, studentId = null, startDate, endDate) => {
    try {
      const params = {
        startDate,
        endDate
      };
      
      if (courseId) params.courseId = courseId;
      if (studentId) params.studentId = studentId;

      const response = await api.get('/attendance/stats', { params });

      return { 
        success: true, 
        data: response.data.data 
      };

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch attendance statistics';
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  },

  // Get attendance calendar data
  getAttendanceCalendar: async (studentId, year, month, courseId = null) => {
    try {
      const params = {
        year,
        month
      };
      
      if (courseId) params.courseId = courseId;

      const response = await api.get(`/attendance/calendar/${studentId}`, { params });

      return { 
        success: true, 
        data: response.data.data,
        period: response.data.period 
      };

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch calendar data';
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  },

  // ============= CHART DATA ENDPOINTS =============

  // Get course chart data for analytics
  getCourseChartData: async (courseId, startDate, endDate) => {
    try {
      const response = await api.get(`/attendance/course/${courseId}/charts`, {
        params: { startDate, endDate }
      });
      
      return { 
        success: true, 
        data: response.data.data 
      };
    } catch (error) {
      console.error('Get course chart data error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch chart data';
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  },

  // Get student chart data for analytics
  getStudentChartData: async (studentId, startDate, endDate) => {
    try {
      const response = await api.get(`/attendance/student/${studentId}/charts`, {
        params: { startDate, endDate }
      });
      
      return { 
        success: true, 
        data: response.data.data 
      };
    } catch (error) {
      console.error('Get student chart data error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch student chart data';
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  },

  // Get daily trend data for course
  getDailyTrend: async (courseId, startDate, endDate) => {
    try {
      const response = await api.get(`/attendance/course/${courseId}/trend`, {
        params: { startDate, endDate }
      });
      
      return { 
        success: true, 
        data: response.data.data 
      };
    } catch (error) {
      console.error('Get daily trend error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch trend data';
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  },

  // Get status distribution
  getStatusDistribution: async (courseId, startDate, endDate) => {
    try {
      const response = await api.get(`/attendance/course/${courseId}/distribution`, {
        params: { startDate, endDate }
      });
      
      return { 
        success: true, 
        data: response.data.data 
      };
    } catch (error) {
      console.error('Get status distribution error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch distribution data';
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  },

  // Get weekly comparison
  getWeeklyComparison: async (courseId, weeks = 8) => {
    try {
      const response = await api.get(`/attendance/course/${courseId}/weekly`, {
        params: { weeks }
      });
      
      return { 
        success: true, 
        data: response.data.data 
      };
    } catch (error) {
      console.error('Get weekly comparison error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch weekly data';
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  },

  // ============= REPORT & DATE RANGE ENDPOINTS =============

  // Get attendance report for date range
  getAttendanceReport: async (params) => {
    try {
      const { courseId, studentId, startDate, endDate, status, groupBy } = params;
      
      const response = await api.get('/attendance/reports', {
        params: { courseId, studentId, startDate, endDate, status, groupBy }
      });
      
      return {
        success: true,
        data: response.data.data,
        summary: response.data.summary
      };
    } catch (error) {
      console.error('Get attendance report error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch attendance report';
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Get summary statistics for date range
  getRangeSummary: async (courseId, startDate, endDate) => {
    try {
      const response = await api.get(`/attendance/course/${courseId}/summary`, {
        params: { startDate, endDate }
      });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get range summary error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch range summary';
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Compare with previous period
  getPeriodComparison: async (courseId, startDate, endDate) => {
    try {
      // Calculate previous period of same length
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      const prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - daysDiff + 1);
      
      const response = await api.get(`/attendance/course/${courseId}/compare`, {
        params: { 
          currentStart: startDate,
          currentEnd: endDate,
          previousStart: prevStart.toISOString().split('T')[0],
          previousEnd: prevEnd.toISOString().split('T')[0]
        }
      });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get period comparison error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch period comparison';
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Export attendance report
  exportAttendanceReport: async (params, format = 'csv') => {
    try {
      const { courseId, startDate, endDate, status } = params;
      
      const response = await api.get(`/attendance/export/${format}`, {
        params: { courseId, startDate, endDate, status },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${startDate}_to_${endDate}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Report exported as ${format.toUpperCase()} successfully!`);
      return {
        success: true
      };
    } catch (error) {
      console.error('Export attendance report error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to export report';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Get available date ranges (for quick select)
  getDateRangeOptions: () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);
    
    return [
      {
        label: 'Today',
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      },
      {
        label: 'Yesterday',
        startDate: yesterday.toISOString().split('T')[0],
        endDate: yesterday.toISOString().split('T')[0]
      },
      {
        label: 'This Week',
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: endOfWeek.toISOString().split('T')[0]
      },
      {
        label: 'This Month',
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0]
      },
      {
        label: 'Last Month',
        startDate: startOfLastMonth.toISOString().split('T')[0],
        endDate: endOfLastMonth.toISOString().split('T')[0]
      },
      {
        label: 'This Year',
        startDate: startOfYear.toISOString().split('T')[0],
        endDate: endOfYear.toISOString().split('T')[0]
      },
      {
        label: 'Last 7 Days',
        startDate: new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      {
        label: 'Last 30 Days',
        startDate: new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      {
        label: 'Last 90 Days',
        startDate: new Date(today.setDate(today.getDate() - 90)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      }
    ];
  },

  // ============= STUDENT SUMMARY ENDPOINTS =============

  // Get student attendance summary
  getStudentSummary: async (studentId, params = {}) => {
    try {
      const { courseId, startDate, endDate } = params;
      
      const response = await api.get(`/attendance/student/${studentId}/summary`, {
        params: { courseId, startDate, endDate }
      });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get student summary error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch student summary';
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Get student attendance calendar data
  getStudentCalendar: async (studentId, year, month, courseId = null) => {
    try {
      const params = { year, month };
      if (courseId) params.courseId = courseId;
      
      const response = await api.get(`/attendance/student/${studentId}/calendar`, { params });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get student calendar error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch student calendar';
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Get student course breakdown
  getStudentCourseBreakdown: async (studentId, startDate, endDate) => {
    try {
      const response = await api.get(`/attendance/student/${studentId}/courses`, {
        params: { startDate, endDate }
      });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get student course breakdown error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch course breakdown';
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Get consecutive absences
  getConsecutiveAbsences: async (studentId) => {
    try {
      const response = await api.get(`/attendance/student/${studentId}/absences/consecutive`);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get consecutive absences error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch consecutive absences';
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Get student attendance trend
  getStudentTrend: async (studentId, startDate, endDate, courseId = null) => {
    try {
      const params = { startDate, endDate };
      if (courseId) params.courseId = courseId;
      
      const response = await api.get(`/attendance/student/${studentId}/trend`, { params });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get student trend error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch student trend';
      return {
        success: false,
        message: errorMessage
      };
    }
  }
};

export default attendanceAPI;