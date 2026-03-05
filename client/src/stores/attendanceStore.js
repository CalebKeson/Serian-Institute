// src/stores/attendanceStore.js
import { create } from 'zustand';
import { attendanceAPI } from '../services/attendanceAPI';
import { courseAPI } from '../services/courseAPI';
import toast from 'react-hot-toast';

// Helper function for calculating late duration
const calculateLateDuration = (checkInTime, classStartTime) => {
  if (!checkInTime || !classStartTime) return null;
  
  const [checkHour, checkMin] = checkInTime.split(':').map(Number);
  const [startHour, startMin] = classStartTime.split(':').map(Number);
  
  const checkTotal = checkHour * 60 + checkMin;
  const startTotal = startHour * 60 + startMin;
  
  const diffMinutes = checkTotal - startTotal;
  if (diffMinutes <= 0) return null;
  
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m late`;
  }
  return `${minutes} min late`;
};

export const useAttendanceStore = create((set, get) => ({
  // State
  courseAttendance: [],
  studentAttendance: [],
  attendanceStats: {},
  attendanceCalendar: [],
  
  // Chart Data State
  chartData: {
    dailyTrend: [],
    statusDistribution: [],
    weeklyComparison: [],
    studentChartData: []
  },
  chartLoading: false,
  chartError: null,
  
  // Report State
  reportData: {
    records: [],
    summary: {
      totalDays: 0,
      totalRecords: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      averageAttendance: 0,
      attendanceRate: 0
    },
    comparison: {
      currentPeriod: {},
      previousPeriod: {},
      change: {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        rate: 0
      }
    }
  },
  reportLoading: false,
  reportError: null,
  selectedDateRange: {
    label: 'Last 30 Days',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },
  dateRangeOptions: attendanceAPI.getDateRangeOptions(),
  reportFilters: {
    status: '',
    groupBy: 'day',
    studentId: null
  },
  
  // ============= NEW STUDENT SUMMARY STATE =============
  studentSummary: {
    overview: {
      totalDays: 0,
      totalRecords: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      attendanceRate: 0,
      consecutiveAbsences: 0,
      currentStreak: 0,
      longestStreak: 0
    },
    courseBreakdown: [],
    calendarData: [],
    trendData: []
  },
  studentSummaryLoading: false,
  studentSummaryError: null,
  selectedStudentId: null,
  selectedStudentCourse: 'all',
  selectedMonth: new Date().getMonth() + 1,
  selectedYear: new Date().getFullYear(),
  
  loading: false,
  error: null,
  selectedDate: new Date().toISOString().split('T')[0],
  selectedSession: 'full-day',
  selectedCourse: null,
  enrolledStudents: [],
  searchTerm: '',
  
  // Edit Modal State
  editModalOpen: false,
  currentEditRecord: null,
  editModalLoading: false,
  editModalError: null,
  
  // Excused Modal State
  excusedModalOpen: false,
  currentExcusedRecord: null,
  excusedModalLoading: false,
  excusedModalError: null,
  
  // Class schedule for current course (for late validation)
  currentClassSchedule: null,
  
  filters: {
    status: '',
    dateRange: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  pagination: {
    current: 1,
    total: 1,
    results: 0,
    limit: 20
  },

  // Fetch enrolled students for a course
  fetchEnrolledStudents: async (courseId) => {
    try {
      const response = await courseAPI.getEnrolledStudents(courseId);
      if (response.data.success) {
        set({ enrolledStudents: response.data.data });
        return response.data.data;
      }
    } catch (error) {
      console.error('Failed to fetch enrolled students:', error);
      return [];
    }
  },

  // Fetch course attendance
  fetchCourseAttendance: async (courseId, date = null, session = null) => {
    set({ loading: true, error: null });
    
    const currentDate = date || get().selectedDate;
    const currentSession = 'full-day';
    
    const currentSelectedCourse = get().selectedCourse;
    if (currentSelectedCourse && currentSelectedCourse !== courseId) {
      set({ courseAttendance: [], enrolledStudents: [] });
    }
    
    try {
      let enrolledStudents = get().enrolledStudents;
      if (enrolledStudents.length === 0) {
        enrolledStudents = await get().fetchEnrolledStudents(courseId);
      }
      
      const result = await attendanceAPI.getCourseAttendance(courseId, currentDate, currentSession);
      
      if (result.success) {
        let attendanceData = result.data;
        const hasDefaultStudents = attendanceData.some(a => a._id === null);
        
        if (!hasDefaultStudents && attendanceData.length > 0 && enrolledStudents.length > 0) {
          const enrolledStudentsMap = new Map(
            enrolledStudents.map(student => [student._id, student])
          );
          
          const attendanceMap = new Map(
            attendanceData.map(a => [a.student?._id, a])
          );
          
          attendanceData = Array.from(enrolledStudentsMap.keys()).map(studentId => {
            const student = enrolledStudentsMap.get(studentId);
            const existingAttendance = attendanceMap.get(studentId);
            
            if (existingAttendance) {
              return {
                ...existingAttendance,
                student: student,
                _id: existingAttendance._id,
                status: existingAttendance.status,
                checkInTime: existingAttendance.checkInTime,
                notes: existingAttendance.notes,
                isExcused: existingAttendance.isExcused,
                excusedReason: existingAttendance.excusedReason,
                markedBy: existingAttendance.markedBy,
                markedAt: existingAttendance.markedAt,
                createdAt: existingAttendance.createdAt,
                updatedAt: existingAttendance.updatedAt
              };
            } else {
              return {
                _id: null,
                student: student,
                course: courseId,
                date: new Date(currentDate),
                session: currentSession,
                status: 'absent',
                checkInTime: null,
                notes: '',
                isExcused: false,
                markedBy: null,
                markedAt: null,
                createdAt: null,
                updatedAt: null
              };
            }
          });
        } else if (enrolledStudents.length > 0) {
          const enrolledStudentsMap = new Map(
            enrolledStudents.map(student => [student._id, student])
          );
          
          const attendanceMap = new Map(
            attendanceData.map(a => [a.student?._id, a])
          );
          
          attendanceData = Array.from(enrolledStudentsMap.keys()).map(studentId => {
            const student = enrolledStudentsMap.get(studentId);
            const existingAttendance = attendanceMap.get(studentId);
            
            if (existingAttendance) {
              return {
                ...existingAttendance,
                student: student
              };
            } else {
              return {
                _id: null,
                student: student,
                course: courseId,
                date: new Date(currentDate),
                session: currentSession,
                status: 'absent',
                checkInTime: null,
                notes: '',
                isExcused: false,
                markedBy: null,
                markedAt: null,
                createdAt: null,
                updatedAt: null
              };
            }
          });
        }
        
        set({ 
          courseAttendance: attendanceData,
          selectedDate: currentDate,
          selectedSession: currentSession,
          selectedCourse: courseId,
          loading: false 
        });
      } else {
        set({ error: result.message, loading: false });
        toast.error(result.message);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch course attendance';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  // Set current class schedule for late validation
  setCurrentClassSchedule: (schedule) => {
    set({ currentClassSchedule: schedule });
  },

  // Validate check-in time against class start time
  validateCheckInTime: (checkInTime, classStartTime) => {
    if (!checkInTime || !classStartTime) return { valid: true, message: '' };
    
    try {
      const [checkHour, checkMin] = checkInTime.split(':').map(Number);
      const [startHour, startMin] = classStartTime.split(':').map(Number);
      
      const checkTotal = checkHour * 60 + checkMin;
      const startTotal = startHour * 60 + startMin;
      
      if (checkTotal < startTotal) {
        return { 
          valid: false, 
          message: 'Check-in time cannot be before class start time' 
        };
      }
      
      return { valid: true, message: '' };
    } catch (error) {
      return { valid: false, message: 'Invalid time format' };
    }
  },

  // Calculate late duration
  getLateDuration: (checkInTime, classStartTime) => {
    return calculateLateDuration(checkInTime, classStartTime);
  },

  // Get color class based on lateness
  getLateColorClass: (checkInTime, classStartTime) => {
    if (!checkInTime || !classStartTime) return 'text-gray-600';
    
    const [checkHour, checkMin] = checkInTime.split(':').map(Number);
    const [startHour, startMin] = classStartTime.split(':').map(Number);
    
    const checkTotal = checkHour * 60 + checkMin;
    const startTotal = startHour * 60 + startMin;
    
    const diffMinutes = checkTotal - startTotal;
    
    if (diffMinutes <= 0) return 'text-gray-600';
    if (diffMinutes <= 15) return 'text-yellow-600';
    if (diffMinutes <= 30) return 'text-orange-600';
    if (diffMinutes <= 60) return 'text-orange-700';
    return 'text-red-600';
  },

  // Get background color class for late display
  getLateBgColorClass: (checkInTime, classStartTime) => {
    if (!checkInTime || !classStartTime) return 'bg-gray-100';
    
    const [checkHour, checkMin] = checkInTime.split(':').map(Number);
    const [startHour, startMin] = classStartTime.split(':').map(Number);
    
    const checkTotal = checkHour * 60 + checkMin;
    const startTotal = startHour * 60 + startMin;
    
    const diffMinutes = checkTotal - startTotal;
    
    if (diffMinutes <= 0) return 'bg-gray-100';
    if (diffMinutes <= 15) return 'bg-yellow-100';
    if (diffMinutes <= 30) return 'bg-orange-100';
    if (diffMinutes <= 60) return 'bg-orange-200';
    return 'bg-red-100';
  },

  // Get quick time options based on class start time
  getQuickTimeOptions: (classStartTime) => {
    if (!classStartTime) return [];
    
    const [startHour, startMin] = classStartTime.split(':').map(Number);
    const startTotal = startHour * 60 + startMin;
    
    const options = [
      { label: '15 min late', minutes: 15 },
      { label: '30 min late', minutes: 30 },
      { label: '45 min late', minutes: 45 },
      { label: '1 hour late', minutes: 60 },
      { label: '1.5 hours late', minutes: 90 },
    ];
    
    return options.map(option => {
      const total = startTotal + option.minutes;
      const hour = Math.floor(total / 60);
      const minute = total % 60;
      const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      
      return {
        ...option,
        timeString
      };
    });
  },

  // Fetch student attendance
  fetchStudentAttendance: async (studentId, startDate = null, endDate = null, courseId = null, page = 1, limit = 20) => {
    set({ loading: true, error: null });
    
    const currentStartDate = startDate || get().filters.dateRange.startDate;
    const currentEndDate = endDate || get().filters.dateRange.endDate;
    
    try {
      const result = await attendanceAPI.getStudentAttendance(studentId, currentStartDate, currentEndDate, courseId, page, limit);
      
      if (result.success) {
        set({ 
          studentAttendance: result.data,
          pagination: result.pagination,
          filters: {
            ...get().filters,
            dateRange: {
              startDate: currentStartDate,
              endDate: currentEndDate
            }
          },
          loading: false 
        });
      } else {
        set({ error: result.message, loading: false });
        toast.error(result.message);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch student attendance';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  // Mark attendance for a single student
  markAttendance: async (studentId, courseId, data) => {
    set({ loading: true, error: null });
    
    try {
      const attendanceData = {
        ...data,
        session: 'full-day'
      };
      
      const result = await attendanceAPI.markAttendance(studentId, courseId, attendanceData);
      
      if (result.success) {
        toast.success('Attendance marked successfully!');
        const { selectedDate, fetchCourseAttendance } = get();
        await fetchCourseAttendance(courseId, selectedDate, 'full-day');
        return { success: true, data: result.data };
      } else {
        set({ error: result.message, loading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark attendance';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // Bulk mark attendance
  bulkMarkAttendance: async (courseId, date, session, attendanceData) => {
    set({ loading: true, error: null });
    
    try {
      const result = await attendanceAPI.bulkMarkAttendance(courseId, date, 'full-day', attendanceData);
      
      if (result.success) {
        toast.success(result.message || 'Attendance marked successfully!');
        const { fetchCourseAttendance } = get();
        await fetchCourseAttendance(courseId, date, 'full-day');
        return { success: true, data: result.data };
      } else {
        set({ error: result.message, loading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to bulk mark attendance';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // Update attendance record
  updateAttendance: async (attendanceId, data) => {
    set({ loading: true, error: null });
    
    try {
      const updateData = {
        ...data,
        session: 'full-day'
      };
      
      const result = await attendanceAPI.updateAttendance(attendanceId, updateData);
      
      if (result.success) {
        toast.success('Attendance updated successfully!');
        const { selectedCourse, selectedDate, fetchCourseAttendance } = get();
        if (selectedCourse) {
          await fetchCourseAttendance(selectedCourse, selectedDate, 'full-day');
        }
        return { success: true, data: result.data };
      } else {
        set({ error: result.message, loading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update attendance';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // Quick status update
  quickUpdateStatus: async (studentId, courseId, status, checkInTime = null, notes = '') => {
    const { selectedDate, markAttendance, updateAttendance, fetchCourseAttendance } = get();
    
    const existingRecord = get().courseAttendance.find(
      a => a.student?._id === studentId && a._id !== null
    );
    
    const attendanceData = {
      date: selectedDate,
      session: 'full-day',
      status,
      checkInTime: status === 'late' ? checkInTime : null,
      notes,
      excusedReason: status === 'excused' ? notes : null
    };
    
    let result;
    if (existingRecord) {
      result = await updateAttendance(existingRecord._id, attendanceData);
    } else {
      result = await markAttendance(studentId, courseId, attendanceData);
    }
    
    return result;
  },

  // Open edit modal
  openEditModal: (record) => {
    set({ 
      editModalOpen: true, 
      currentEditRecord: record,
      editModalError: null 
    });
  },

  // Close edit modal
  closeEditModal: () => {
    set({ 
      editModalOpen: false, 
      currentEditRecord: null,
      editModalError: null 
    });
  },

  // Save attendance from edit modal
  saveAttendanceFromModal: async (formData) => {
    const state = get();
    const { currentEditRecord, selectedCourse, selectedDate } = state;
    
    if (!currentEditRecord) {
      toast.error('No attendance record selected');
      return { success: false };
    }

    set({ editModalLoading: true, editModalError: null });

    try {
      const attendanceData = {
        ...formData,
        session: 'full-day'
      };

      let result;
      
      if (!currentEditRecord._id) {
        result = await attendanceAPI.markAttendance(
          currentEditRecord.student._id,
          selectedCourse,
          attendanceData
        );
      } else {
        result = await attendanceAPI.updateAttendance(
          currentEditRecord._id,
          attendanceData
        );
      }

      if (result.success) {
        toast.success(
          !currentEditRecord._id 
            ? 'Attendance marked successfully!' 
            : 'Attendance updated successfully!'
        );
        
        set({ editModalOpen: false, currentEditRecord: null, editModalLoading: false });
        await state.fetchCourseAttendance(selectedCourse, selectedDate, 'full-day');
        
        return { success: true, data: result.data };
      } else {
        set({ 
          editModalError: result.message, 
          editModalLoading: false 
        });
        toast.error(result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save attendance';
      set({ 
        editModalError: errorMessage, 
        editModalLoading: false 
      });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Clear edit modal error
  clearEditModalError: () => {
    set({ editModalError: null });
  },

  // Open excused reason modal
  openExcusedModal: (record) => {
    set({ 
      excusedModalOpen: true, 
      currentExcusedRecord: record,
      excusedModalError: null 
    });
  },

  // Close excused reason modal
  closeExcusedModal: () => {
    set({ 
      excusedModalOpen: false, 
      currentExcusedRecord: null,
      excusedModalError: null 
    });
  },

  // Save excused reason and update attendance
  saveExcusedReason: async (reason) => {
    const state = get();
    const { currentExcusedRecord, selectedCourse, selectedDate } = state;
    
    if (!currentExcusedRecord) {
      toast.error('No attendance record selected');
      return { success: false };
    }

    set({ excusedModalLoading: true, excusedModalError: null });

    try {
      const attendanceData = {
        status: 'excused',
        excusedReason: reason,
        session: 'full-day',
        date: selectedDate,
        notes: currentExcusedRecord.notes || ''
      };

      let result;
      
      if (!currentExcusedRecord._id) {
        result = await attendanceAPI.markAttendance(
          currentExcusedRecord.student._id,
          selectedCourse,
          attendanceData
        );
      } else {
        result = await attendanceAPI.updateAttendance(
          currentExcusedRecord._id,
          attendanceData
        );
      }

      if (result.success) {
        toast.success('Excused reason saved successfully!');
        
        set({ excusedModalOpen: false, currentExcusedRecord: null, excusedModalLoading: false });
        await state.fetchCourseAttendance(selectedCourse, selectedDate, 'full-day');
        
        return { success: true, data: result.data };
      } else {
        set({ 
          excusedModalError: result.message, 
          excusedModalLoading: false 
        });
        toast.error(result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save excused reason';
      set({ 
        excusedModalError: errorMessage, 
        excusedModalLoading: false 
      });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Quick action to mark as excused
  markAsExcused: (studentId, courseId) => {
    const state = get();
    
    const existingRecord = state.courseAttendance.find(
      a => a.student?._id === studentId
    );
    
    if (existingRecord) {
      state.openExcusedModal(existingRecord);
    } else {
      const student = state.enrolledStudents.find(s => s._id === studentId);
      if (student) {
        const tempRecord = {
          _id: null,
          student: student,
          course: courseId,
          date: new Date(state.selectedDate),
          session: 'full-day',
          status: 'excused',
          notes: ''
        };
        state.openExcusedModal(tempRecord);
      }
    }
  },

  // ============= CHART DATA METHODS =============

  // Fetch course chart data
  fetchCourseChartData: async (courseId, startDate, endDate) => {
    set({ chartLoading: true, chartError: null });
    
    try {
      const [trendResult, distributionResult, weeklyResult] = await Promise.all([
        attendanceAPI.getDailyTrend(courseId, startDate, endDate),
        attendanceAPI.getStatusDistribution(courseId, startDate, endDate),
        attendanceAPI.getWeeklyComparison(courseId)
      ]);

      set({ 
        chartData: {
          dailyTrend: trendResult.success ? trendResult.data : [],
          statusDistribution: distributionResult.success ? distributionResult.data : [],
          weeklyComparison: weeklyResult.success ? weeklyResult.data : []
        },
        chartLoading: false 
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch chart data';
      set({ chartError: errorMessage, chartLoading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Fetch student chart data
  fetchStudentChartData: async (studentId, startDate, endDate) => {
    set({ chartLoading: true, chartError: null });
    
    try {
      const result = await attendanceAPI.getStudentChartData(studentId, startDate, endDate);
      
      if (result.success) {
        set({ 
          chartData: {
            ...get().chartData,
            studentChartData: result.data
          },
          chartLoading: false 
        });
        return { success: true, data: result.data };
      } else {
        set({ chartError: result.message, chartLoading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch student chart data';
      set({ chartError: errorMessage, chartLoading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Clear chart data
  clearChartData: () => {
    set({ 
      chartData: {
        dailyTrend: [],
        statusDistribution: [],
        weeklyComparison: [],
        studentChartData: []
      },
      chartError: null 
    });
  },

  // ============= REPORT METHODS =============

  // Fetch attendance report for date range
  fetchAttendanceReport: async (params = {}) => {
    set({ reportLoading: true, reportError: null });
    
    const state = get();
    const { selectedDateRange, reportFilters, selectedCourse } = state;
    
    const requestParams = {
      courseId: selectedCourse,
      startDate: selectedDateRange.startDate,
      endDate: selectedDateRange.endDate,
      status: reportFilters.status || undefined,
      groupBy: reportFilters.groupBy || 'day',
      ...params
    };

    try {
      const result = await attendanceAPI.getAttendanceReport(requestParams);
      
      if (result.success) {
        set({ 
          reportData: {
            records: result.data || [],
            summary: result.summary || {
              totalDays: 0,
              totalRecords: 0,
              present: 0,
              absent: 0,
              late: 0,
              excused: 0,
              averageAttendance: 0,
              attendanceRate: 0
            }
          },
          reportLoading: false 
        });

        // Also fetch comparison data
        await get().fetchPeriodComparison();
        
        return { success: true, data: result.data };
      } else {
        set({ reportError: result.message, reportLoading: false });
        toast.error(result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch report';
      set({ reportError: errorMessage, reportLoading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Fetch period comparison data
  fetchPeriodComparison: async () => {
    const state = get();
    const { selectedCourse, selectedDateRange } = state;
    
    if (!selectedCourse) return;

    try {
      const result = await attendanceAPI.getPeriodComparison(
        selectedCourse,
        selectedDateRange.startDate,
        selectedDateRange.endDate
      );
      
      if (result.success) {
        set({ 
          reportData: {
            ...state.reportData,
            comparison: result.data
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch comparison:', error);
    }
  },

  // Set date range
  setDateRange: (range) => {
    set({ selectedDateRange: range });
    // Auto-fetch report when range changes
    get().fetchAttendanceReport();
  },

  // Set report filters
  setReportFilters: (filters) => {
    set({ reportFilters: { ...get().reportFilters, ...filters } });
    // Auto-fetch report when filters change
    get().fetchAttendanceReport();
  },

  // Clear report data
  clearReportData: () => {
    set({ 
      reportData: {
        records: [],
        summary: {
          totalDays: 0,
          totalRecords: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          averageAttendance: 0,
          attendanceRate: 0
        },
        comparison: {
          currentPeriod: {},
          previousPeriod: {},
          change: {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            rate: 0
          }
        }
      },
      reportError: null 
    });
  },

  // Export report
  exportReport: async (format = 'csv') => {
    const state = get();
    const { selectedCourse, selectedDateRange, reportFilters } = state;
    
    try {
      const result = await attendanceAPI.exportAttendanceReport({
        courseId: selectedCourse,
        startDate: selectedDateRange.startDate,
        endDate: selectedDateRange.endDate,
        status: reportFilters.status
      }, format);
      
      return result;
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, message: 'Export failed' };
    }
  },

  // ============= NEW STUDENT SUMMARY METHODS =============

  // Fetch student summary data
  fetchStudentSummary: async (studentId, params = {}) => {
    set({ studentSummaryLoading: true, studentSummaryError: null, selectedStudentId: studentId });
    
    try {
      const { courseId, startDate, endDate } = params;
      
      // Fetch all student data in parallel
      const [summaryResult, calendarResult, breakdownResult, trendResult, absencesResult] = await Promise.all([
        attendanceAPI.getStudentSummary(studentId, { courseId, startDate, endDate }),
        attendanceAPI.getStudentCalendar(studentId, get().selectedYear, get().selectedMonth, courseId),
        attendanceAPI.getStudentCourseBreakdown(studentId, startDate, endDate),
        attendanceAPI.getStudentTrend(studentId, startDate, endDate, courseId),
        attendanceAPI.getConsecutiveAbsences(studentId)
      ]);

      const studentSummary = {
        overview: {
          ...(summaryResult.success ? summaryResult.data : {}),
          consecutiveAbsences: absencesResult.success ? absencesResult.data.count : 0,
          absenceDates: absencesResult.success ? absencesResult.data.dates : []
        },
        courseBreakdown: breakdownResult.success ? breakdownResult.data : [],
        calendarData: calendarResult.success ? calendarResult.data : [],
        trendData: trendResult.success ? trendResult.data : []
      };

      set({ 
        studentSummary,
        studentSummaryLoading: false 
      });

      return { success: true, data: studentSummary };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch student summary';
      set({ studentSummaryError: errorMessage, studentSummaryLoading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Fetch student calendar for specific month/year
  fetchStudentCalendar: async (studentId, year, month, courseId = null) => {
    set({ studentSummaryLoading: true, studentSummaryError: null });
    
    try {
      const result = await attendanceAPI.getStudentCalendar(studentId, year, month, courseId);
      
      if (result.success) {
        set({ 
          studentSummary: {
            ...get().studentSummary,
            calendarData: result.data
          },
          selectedYear: year,
          selectedMonth: month,
          studentSummaryLoading: false 
        });
        return { success: true, data: result.data };
      } else {
        set({ studentSummaryError: result.message, studentSummaryLoading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch calendar';
      set({ studentSummaryError: errorMessage, studentSummaryLoading: false });
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  },

  // Set selected course filter for student summary
  setSelectedStudentCourse: (courseId) => {
    set({ selectedStudentCourse: courseId });
    // Refresh summary with new course filter
    const state = get();
    if (state.selectedStudentId) {
      state.fetchStudentSummary(state.selectedStudentId, { courseId: courseId !== 'all' ? courseId : null });
    }
  },

  // Set month/year for calendar
  setCalendarMonth: (month, year) => {
    set({ selectedMonth: month, selectedYear: year });
    const state = get();
    if (state.selectedStudentId) {
      state.fetchStudentCalendar(
        state.selectedStudentId, 
        year, 
        month, 
        state.selectedStudentCourse !== 'all' ? state.selectedStudentCourse : null
      );
    }
  },

  // Clear student summary data
  clearStudentSummary: () => {
    set({ 
      studentSummary: {
        overview: {
          totalDays: 0,
          totalRecords: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          attendanceRate: 0,
          consecutiveAbsences: 0,
          currentStreak: 0,
          longestStreak: 0
        },
        courseBreakdown: [],
        calendarData: [],
        trendData: []
      },
      studentSummaryError: null,
      selectedStudentId: null
    });
  },

  // Fetch attendance statistics
  fetchAttendanceStats: async (courseId = null, studentId = null, startDate = null, endDate = null) => {
    set({ loading: true, error: null });
    
    const currentStartDate = startDate || get().filters.dateRange.startDate;
    const currentEndDate = endDate || get().filters.dateRange.endDate;
    
    try {
      const result = await attendanceAPI.getAttendanceStats(courseId, studentId, currentStartDate, currentEndDate);
      
      if (result.success) {
        set({ 
          attendanceStats: result.data,
          loading: false 
        });
        return { success: true, data: result.data };
      } else {
        set({ error: result.message, loading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch attendance statistics';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // Fetch attendance calendar
  fetchAttendanceCalendar: async (studentId, year, month, courseId = null) => {
    set({ loading: true, error: null });
    
    try {
      const result = await attendanceAPI.getAttendanceCalendar(studentId, year, month, courseId);
      
      if (result.success) {
        set({ 
          attendanceCalendar: result.data,
          loading: false 
        });
        return { success: true, data: result.data };
      } else {
        set({ error: result.message, loading: false });
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch calendar data';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // Get current attendance summary
  getCurrentAttendanceSummary: () => {
    const { courseAttendance } = get();
    
    const summary = {
      total: courseAttendance.length,
      present: courseAttendance.filter(a => a.status === 'present').length,
      absent: courseAttendance.filter(a => a.status === 'absent').length,
      late: courseAttendance.filter(a => a.status === 'late').length,
      excused: courseAttendance.filter(a => a.status === 'excused').length,
      notMarked: courseAttendance.filter(a => a.status === 'absent' && a._id === null).length
    };
    
    summary.attendanceRate = summary.total > 0 ? 
      ((summary.present + summary.excused) / summary.total) * 100 : 0;
    
    return summary;
  },

  // Clear course attendance data
  clearCourseAttendance: () => {
    set({ 
      courseAttendance: [],
      enrolledStudents: [],
      selectedCourse: null,
      currentClassSchedule: null
    });
  },

  // Setters
  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },

  setSelectedSession: (session) => {
    set({ selectedSession: 'full-day' });
  },

  setSelectedCourse: (courseId) => {
    set({ selectedCourse: courseId });
  },

  setSearchTerm: (searchTerm) => {
    set({ searchTerm });
  },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  setPagination: (pagination) => {
    set({ pagination: { ...get().pagination, ...pagination } });
  },

  clearError: () => {
    set({ error: null });
  },

  clearAttendance: () => {
    set({ 
      courseAttendance: [],
      studentAttendance: [],
      attendanceStats: {},
      attendanceCalendar: [],
      chartData: {
        dailyTrend: [],
        statusDistribution: [],
        weeklyComparison: [],
        studentChartData: []
      },
      reportData: {
        records: [],
        summary: {
          totalDays: 0,
          totalRecords: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          averageAttendance: 0,
          attendanceRate: 0
        },
        comparison: {
          currentPeriod: {},
          previousPeriod: {},
          change: {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            rate: 0
          }
        }
      },
      studentSummary: {
        overview: {
          totalDays: 0,
          totalRecords: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          attendanceRate: 0,
          consecutiveAbsences: 0,
          currentStreak: 0,
          longestStreak: 0
        },
        courseBreakdown: [],
        calendarData: [],
        trendData: []
      },
      enrolledStudents: [],
      selectedDate: new Date().toISOString().split('T')[0],
      selectedSession: 'full-day',
      selectedCourse: null,
      searchTerm: '',
      editModalOpen: false,
      currentEditRecord: null,
      editModalLoading: false,
      editModalError: null,
      excusedModalOpen: false,
      currentExcusedRecord: null,
      excusedModalLoading: false,
      excusedModalError: null,
      currentClassSchedule: null,
      pagination: {
        current: 1,
        total: 1,
        results: 0,
        limit: 20
      }
    });
  },

  resetFilters: () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    set({
      filters: {
        status: '',
        dateRange: {
          startDate: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }
      },
      searchTerm: '',
      pagination: {
        current: 1,
        total: 1,
        results: 0,
        limit: 20
      }
    });
  }
}));