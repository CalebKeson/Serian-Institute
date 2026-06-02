// src/utils/exportConfigs.js

/**
 * Export configuration factory
 * Creates page-specific export configurations
 */

// src/utils/exportConfigs.js - ADD THIS CONFIG

// Course Fees Report Export Configuration
export const courseFeesExportConfig = {
  title: 'Course Fee Report',
  filename: 'course_fee_report',
  
  columns: [
    { header: 'Student Name', accessor: 'studentName', width: 25 },
    { header: 'Student Number', accessor: 'studentNumber', width: 18 },
    { header: 'Admission Number', accessor: 'admissionNumber', width: 18 },
    { header: 'Phone', accessor: 'phone', width: 15 },
    { header: 'Total Fees (KSh)', accessor: 'totalFees', width: 15, type: 'currency' },
    { header: 'Amount Paid (KSh)', accessor: 'amountPaid', width: 15, type: 'currency' },
    { header: 'Balance (KSh)', accessor: 'balance', width: 15, type: 'currency' },
    { header: 'Payment %', accessor: 'paymentPercentage', width: 12 }
  ],
  
  summaryFields: [
    { label: 'Course Name', value: 'courseName', format: 'text' },
    { label: 'Course Code', value: 'courseCode', format: 'text' },
    { label: 'Expected Revenue', value: 'expectedRevenue', format: 'currency' },
    { label: 'Total Collected', value: 'totalCollected', format: 'currency' },
    { label: 'Outstanding Balance', value: 'outstandingBalance', format: 'currency' },
    { label: 'Collection Rate', value: 'collectionRate', format: 'percentage' },
    { label: 'Course Price', value: 'coursePrice', format: 'currency' },
    { label: 'Enrolled Students', value: 'enrolledStudents', format: 'number' }
  ],
  
  pdfOptions: {
    pageOrientation: 'landscape',
    fontSize: 9,
    includeCharts: false
  },
  
  excelOptions: {
    autoWidth: true,
    freezeHeader: true,
    includeCharts: false
  }
};

// Add this to your exportConfigs.js if not already present

// In exportConfigs.js, update the studentFeesExportConfig:

export const studentFeesExportConfig = {
  title: 'Student Fee Statement',
  filename: 'student_fee_statement',
  
  columns: [
    { header: 'Date', accessor: 'date', width: 12, type: 'date' },
    { header: 'Course', accessor: 'course', width: 25 },
    { header: 'Amount (KSh)', accessor: 'amount', width: 15, type: 'currency' },
    { header: 'Receipt Number', accessor: 'receiptNumber', width: 15 },
    { header: 'Paid By', accessor: 'paidBy', width: 20 },
    { header: 'Method', accessor: 'method', width: 15 },
    { header: 'Recorded By', accessor: 'recordedBy', width: 20 },  // NEW
    { header: 'Status', accessor: 'status', width: 12 }
  ],
  
  summaryFields: [
    { label: 'Student Name', value: 'studentName', format: 'text' },
    { label: 'Student ID', value: 'studentId', format: 'text' },
    { label: 'Student Email', value: 'studentEmail', format: 'text' },
    { label: 'Student Phone', value: 'studentPhone', format: 'text' },
    { label: 'Total Fees', value: 'totalFees', format: 'currency' },
    { label: 'Total Paid', value: 'totalPaid', format: 'currency' },
    { label: 'Balance', value: 'balance', format: 'currency' },
    { label: 'Payment Progress', value: 'paymentProgress', format: 'percentage' }
  ],
  
  pdfOptions: {
    pageOrientation: 'landscape',
    fontSize: 9,
    includeCharts: false
  },
  
  excelOptions: {
    autoWidth: true,
    freezeHeader: true,
    includeCharts: false
  }
};

// Payment History Page Export Configuration
export const paymentHistoryExportConfig = {
  title: 'Payment History Report',
  filename: 'payment_history',
  
  columns: [
    { header: 'Date', accessor: 'paymentDate', type: 'date', width: 15 },
    { header: 'Receipt #', accessor: 'receiptNumber', width: 15 },
    { header: 'Student Name', accessor: 'student.user.name', width: 25 },
    { header: 'Student ID', accessor: 'student.studentId', width: 15 },
    { header: 'Course', accessor: 'course.name', width: 25 },
    { header: 'Amount (KSh)', accessor: 'amount', type: 'currency', width: 15 },
    { header: 'Method', accessor: 'paymentMethodDisplay', width: 15 },
    { header: 'Purpose', accessor: 'paymentForDisplay', width: 18 },
    { header: 'Payer Name', accessor: 'payerName', width: 25 },
    { header: 'Payer Relationship', accessor: 'payerRelationshipDisplay', width: 15 },
    { header: 'Transaction ID', accessor: 'transactionId', width: 20 },
    { header: 'Status', accessor: 'status', width: 12 }
  ],
  
  summaryFields: [
    { label: 'Total Transactions', accessor: 'amount', aggregation: 'count' },
    { label: 'Total Amount Collected', accessor: 'amount', aggregation: 'sum', format: 'currency' },
    { label: 'Average Transaction', accessor: 'amount', aggregation: 'average', format: 'currency' },
    { label: 'By M-Pesa', accessor: 'paymentMethod', filter: { method: 'mpesa' }, aggregation: 'sum', format: 'currency' },
    { label: 'By Bank Transfer', accessor: 'paymentMethod', filter: { method: 'bank_transfer' }, aggregation: 'sum', format: 'currency' },
    { label: 'By Cash', accessor: 'paymentMethod', filter: { method: 'cash' }, aggregation: 'sum', format: 'currency' }
  ],
  
  pdfOptions: {
    pageOrientation: 'landscape',
    fontSize: 7,
    includeCharts: false
  },
  
  excelOptions: {
    autoWidth: true,
    freezeHeader: true,
    includeCharts: true
  }
};

// Dashboard Export Configuration
export const dashboardExportConfig = {
  title: 'Fee Collection Dashboard Report',
  filename: 'fee_dashboard',
  
  columns: [
    { header: 'Date', accessor: 'paymentDate', type: 'date', width: 15 },
    { header: 'Student Name', accessor: 'studentName', width: 25 },
    { header: 'Course', accessor: 'courseName', width: 25 },
    { header: 'Amount', accessor: 'amount', type: 'currency', width: 15 },
    { header: 'Method', accessor: 'paymentMethodDisplay', width: 15 },
    { header: 'Status', accessor: 'status', width: 12 }
  ],
  
  summaryFields: [
    { label: 'Total Collected', accessor: 'amount', aggregation: 'sum', format: 'currency' },
    { label: 'Total Payments', accessor: 'amount', aggregation: 'count' },
    { label: 'Average Payment', accessor: 'amount', aggregation: 'average', format: 'currency' },
    { label: 'Outstanding Balance', value: '${summaryData.outstandingTotal}', format: 'currency' }
  ],
  
  pdfOptions: {
    pageOrientation: 'portrait',
    fontSize: 10,
    includeCharts: true
  },
  
  excelOptions: {
    autoWidth: true,
    freezeHeader: true,
    includeCharts: true
  }
};

// // Outstanding Report Export Configuration
// export const outstandingReportExportConfig = {
//   title: 'Outstanding Fee Report',
//   filename: 'outstanding_report',
  
//   columns: [
//     { header: 'Student Name', accessor: 'studentName', width: 25 },
//     { header: 'Student ID', accessor: 'studentNumber', width: 15 },
//     { header: 'Email', accessor: 'email', width: 30 },
//     { header: 'Phone', accessor: 'phone', width: 15 },
//     { header: 'Total Fees (KSh)', accessor: 'totalFees', type: 'currency', width: 15 },
//     { header: 'Amount Paid (KSh)', accessor: 'totalPaid', type: 'currency', width: 15 },
//     { header: 'Outstanding (KSh)', accessor: 'totalBalance', type: 'currency', width: 15 },
//     { header: 'Payment %', accessor: 'paymentPercentage', type: 'percentage', width: 12 },
//     { header: 'Status', accessor: 'status', width: 12 }
//   ],
  
//   summaryFields: [
//     { label: 'Students with Balance', accessor: 'studentName', aggregation: 'count' },
//     { label: 'Total Outstanding', accessor: 'totalBalance', aggregation: 'sum', format: 'currency' },
//     { label: 'Average Outstanding', accessor: 'totalBalance', aggregation: 'average', format: 'currency' },
//     { label: 'Unpaid Students', accessor: 'totalPaid', filter: { value: 0 }, aggregation: 'count' },
//     { label: 'Partial Payment Students', accessor: 'totalPaid', filter: { min: 0.01, max: 'totalFees-0.01' }, aggregation: 'count' }
//   ],
  
//   pdfOptions: {
//     pageOrientation: 'landscape',
//     fontSize: 9,
//     includeCharts: true
//   },
  
//   excelOptions: {
//     autoWidth: true,
//     freezeHeader: true,
//     includeCharts: true
//   }
// };

// Helper function to extract nested object values
export const getNestedValue = (obj, path) => {
  if (!path) return null;
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

// Helper function to format values based on type
export const formatExportValue = (value, type) => {
  if (value === null || value === undefined) return '-';
  
  switch (type) {
    case 'currency':
      return `KSh ${value.toLocaleString()}`;
    case 'date':
      return new Date(value).toLocaleDateString();
    case 'datetime':
      return new Date(value).toLocaleString();
    case 'percentage':
      return `${Math.round(value)}%`;
    default:
      return value;
  }
};

// Helper function to calculate aggregations
export const calculateAggregation = (data, field, aggregation, filter = null) => {
  let filteredData = [...data];
  
  if (filter) {
    filteredData = filteredData.filter(item => {
      if (filter.method) {
        return getNestedValue(item, 'paymentMethod') === filter.method;
      }
      if (filter.value !== undefined) {
        return getNestedValue(item, field) === filter.value;
      }
      if (filter.min !== undefined) {
        return getNestedValue(item, field) >= filter.min;
      }
      return true;
    });
  }
  
  const values = filteredData.map(item => getNestedValue(item, field)).filter(v => typeof v === 'number');
  
  switch (aggregation) {
    case 'sum':
      return values.reduce((sum, v) => sum + v, 0);
    case 'average':
      return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
    case 'count':
      return values.length;
    case 'min':
      return values.length > 0 ? Math.min(...values) : 0;
    case 'max':
      return values.length > 0 ? Math.max(...values) : 0;
    default:
      return null;
  }
};


// src/utils/exportConfigs.js - UPDATED Course Export Config

// Course Management Export Configuration (Simplified)
export const courseExportConfig = {
  title: 'Course Management Report',
  filename: 'courses_report',
  
  // Only the columns you want
  columns: [
    { header: 'Course Code', accessor: 'courseCode', width: 12 },
    { header: 'Course Name', accessor: 'courseName', width: 35 },
    { header: 'Instructor', accessor: 'instructor', width: 25 },
    { header: 'Enrolled', accessor: 'enrolledCount', width: 10, type: 'number' },
    { header: 'Price (KSh)', accessor: 'price', width: 15, type: 'currency' },
    { header: 'Certification', accessor: 'certification', width: 25 }
  ],
  
  // Summary fields - these will be populated from customSummaryData
  summaryFields: [
    { label: 'Total Courses', value: 'totalCourses', format: 'number' },
    { label: 'Active Courses', value: 'activeCourses', format: 'number' },
    { label: 'Total Enrollment', value: 'totalEnrollment', format: 'number' },
    { label: 'Total Capacity', value: 'totalCapacity', format: 'number' },
    { label: 'Utilization Rate', value: 'utilizationRate', format: 'percentage' },
    { label: 'Total Expected Revenue', value: 'totalExpectedRevenue', format: 'currency' }
  ],
  
  pdfOptions: {
    pageOrientation: 'landscape',
    fontSize: 10,
    includeCharts: false
  },
  
  excelOptions: {
    autoWidth: true,
    freezeHeader: true,
    includeCharts: false
  }
};

// src/utils/exportConfigs.js - UPDATE studentExportConfig

export const studentExportConfig = {
  title: 'Student Management Report',
  filename: 'students_report',
  
  columns: [
    { header: 'Student Name', accessor: 'studentName', width: 25 },
    { header: 'Student ID', accessor: 'studentId', width: 18 },  // ADDED
    { header: 'Admission Number', accessor: 'admissionNumber', width: 20 },
    { header: 'Email', accessor: 'email', width: 30 },
    { header: 'Phone', accessor: 'phone', width: 15 },
    { header: 'Enrollment Status', accessor: 'enrollmentStatus', width: 15 },
    { header: 'Enrolled Courses', accessor: 'enrolledCourses', width: 12, type: 'number' },
    { header: 'Enrollment Date', accessor: 'enrollmentDate', width: 12, type: 'date' },
    { header: 'Status', accessor: 'status', width: 12 }
  ],
  
  summaryFields: [
    { label: 'Total Students', value: 'totalStudents', format: 'number' },
    { label: 'Active Students', value: 'activeStudents', format: 'number' },
    { label: 'Enrolled Students', value: 'enrolledStudents', format: 'number' },
    { label: 'Not Enrolled Students', value: 'notEnrolledStudents', format: 'number' },
    { label: 'Graduated Students', value: 'graduatedStudents', format: 'number' }
  ],
  
  pdfOptions: {
    pageOrientation: 'landscape',
    fontSize: 10,
    includeCharts: false
  },
  
  excelOptions: {
    autoWidth: true,
    freezeHeader: true,
    includeCharts: false
  }
};


// Instructor Management Export Configuration
export const instructorExportConfig = {
  title: 'Instructor Management Report',
  filename: 'instructors_report',
  
  // Columns for the data table
  columns: [
    { header: 'Instructor Name', accessor: 'instructorName', width: 25 },
    { header: 'Employee ID', accessor: 'employeeId', width: 15 },
    { header: 'Department', accessor: 'department', width: 20 },
    { header: 'Email', accessor: 'email', width: 30 },
    { header: 'Phone', accessor: 'phone', width: 15 },
    { header: 'Bank Name', accessor: 'bankName', width: 20 },
    { header: 'Account Number', accessor: 'accountNumber', width: 18 },
    { header: 'Salary (KSh)', accessor: 'salary', width: 15, type: 'currency' }
  ],
  
  // Summary statistics
  summaryFields: [
    { label: 'Total Instructors', value: 'totalInstructors', format: 'number' },
    { label: 'Active Instructors', value: 'activeInstructors', format: 'number' },
    { label: 'On Leave', value: 'onLeaveInstructors', format: 'number' },
    { label: 'Departments', value: 'departmentsCount', format: 'number' },
    { label: 'New This Month', value: 'newThisMonth', format: 'number' }
  ],
  
  pdfOptions: {
    pageOrientation: 'landscape',
    fontSize: 10,
    includeCharts: false
  },
  
  excelOptions: {
    autoWidth: true,
    freezeHeader: true,
    includeCharts: false
  }
};

// In src/utils/exportConfigs.js - Update the feesDashboardExportConfig

export const feesDashboardExportConfig = {
  title: 'Fees Dashboard Report', // Shorter title (19 chars)
  filename: 'fees_dashboard_report',
  
  columns: [
    { header: 'Date', accessor: 'date', width: 12, type: 'date' },
    { header: 'Student Name', accessor: 'studentName', width: 20 },
    { header: 'Student ID', accessor: 'studentId', width: 15 },
    { header: 'Course', accessor: 'course', width: 20 },
    { header: 'Course Code', accessor: 'courseCode', width: 10 },
    { header: 'Amount (KSh)', accessor: 'amount', width: 12, type: 'currency' },
    { header: 'Payer Name', accessor: 'payerName', width: 20 },
    { header: 'Receipt No', accessor: 'receiptNumber', width: 15 },
    { header: 'Reference', accessor: 'reference', width: 15 }
  ],
  
  summaryFields: [
    { label: 'Total Fees', value: 'totalFees', format: 'currency' },
    { label: 'Total Collected', value: 'totalCollected', format: 'currency' },
    { label: 'Outstanding Balance', value: 'outstandingBalance', format: 'currency' },
    { label: 'Total Payments', value: 'totalPayments', format: 'number' },
    { label: 'Collection Rate', value: 'collectionRate', format: 'percentage' }
  ],
  
  pdfOptions: {
    pageOrientation: 'landscape',
    fontSize: 8,
    includeCharts: true
  },
  
  excelOptions: {
    autoWidth: true,
    freezeHeader: true,
    includeCharts: true
  }
};

// In exportConfigs.js, update the outstandingReportExportConfig:

export const outstandingReportExportConfig = {
  title: 'Outstanding Fees Report',
  filename: 'outstanding_report',
  
  columns: [
    { header: 'Student Name', accessor: 'studentName', width: 25 },
    { header: 'Student ID', accessor: 'studentId', width: 18 },
    { header: 'Phone', accessor: 'phone', width: 15 },
    { header: 'Course(s)', accessor: 'course', width: 30 },
    { header: 'Total Fees (KSh)', accessor: 'totalFees', width: 15, type: 'currency' },
    { header: 'Paid (KSh)', accessor: 'totalPaid', width: 15, type: 'currency' },
    { header: 'Balance (KSh)', accessor: 'balance', width: 15, type: 'currency' },
    { header: 'Progress', accessor: 'progress', width: 12 }
  ],
  
  summaryFields: [
    { label: 'Total Fees', value: 'totalFees', format: 'currency' },
    { label: 'Total Paid', value: 'totalPaid', format: 'currency' },
    { label: 'Total Outstanding', value: 'totalOutstanding', format: 'currency' },
    { label: 'Students with Balance', value: 'studentsWithBalance', format: 'number' },
    { label: 'Unpaid Students', value: 'unpaidStudents', format: 'number' }
  ],
  
  pdfOptions: {
    pageOrientation: 'landscape',
    fontSize: 9,
    includeCharts: false
  },
  
  excelOptions: {
    autoWidth: true,
    freezeHeader: true,
    includeCharts: false
  }
};