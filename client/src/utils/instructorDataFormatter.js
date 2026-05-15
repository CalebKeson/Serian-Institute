// frontend/src/utils/instructorDataFormatter.js

// frontend/src/utils/instructorDataFormatter.js
// Update the formatInstructorForAPI function:

export const formatInstructorForAPI = (formData, isCreate = false) => {
  const data = { ...formData };

  // Remove empty string values for reference fields
  if (data.supervisor === "") {
    delete data.supervisor;
  }

  // Format dates
  if (data.dateOfBirth) {
    if (data.dateOfBirth instanceof Date) {
      data.dateOfBirth = data.dateOfBirth.toISOString().split("T")[0];
    } else if (typeof data.dateOfBirth === "string") {
      const date = new Date(data.dateOfBirth);
      if (!isNaN(date.getTime())) {
        data.dateOfBirth = date.toISOString().split("T")[0];
      }
    }
  }

  if (data.hireDate) {
    if (data.hireDate instanceof Date) {
      data.hireDate = data.hireDate.toISOString().split("T")[0];
    } else if (typeof data.hireDate === "string") {
      const date = new Date(data.hireDate);
      if (!isNaN(date.getTime())) {
        data.hireDate = date.toISOString().split("T")[0];
      }
    }
  }

  if (data.instructorSince) {
    if (data.instructorSince instanceof Date) {
      data.instructorSince = data.instructorSince.toISOString().split("T")[0];
    } else if (typeof data.instructorSince === "string") {
      const date = new Date(data.instructorSince);
      if (!isNaN(date.getTime())) {
        data.instructorSince = date.toISOString().split("T")[0];
      }
    }
  }

  if (data.contractStartDate && typeof data.contractStartDate === "string") {
    if (data.contractStartDate === "") {
      delete data.contractStartDate;
    } else {
      data.contractStartDate = new Date(data.contractStartDate);
    }
  }

  if (data.contractEndDate && typeof data.contractEndDate === "string") {
    if (data.contractEndDate === "") {
      delete data.contractEndDate;
    } else {
      data.contractEndDate = new Date(data.contractEndDate);
    }
  }

  // Remove any empty string values for reference fields
  const referenceFields = [
    "supervisor",
    "contractStartDate",
    "contractEndDate",
  ];
  referenceFields.forEach((field) => {
    if (
      data[field] === "" ||
      data[field] === null ||
      data[field] === undefined
    ) {
      delete data[field];
    }
  });

  // For creation, add role field
  if (isCreate) {
    data.role = "instructor";
  }

  // Remove any undefined or null values
  Object.keys(data).forEach((key) => {
    if (data[key] === undefined || data[key] === null || data[key] === "") {
      delete data[key];
    }
  });

  return data;
};

/**
 * Formats API response data for the form
 */
export const formatInstructorForForm = (instructorData) => {
  if (!instructorData) return {};

  const data = { ...instructorData };

  // Format dates for date inputs (YYYY-MM-DD)
  if (data.dateOfBirth) {
    const date = new Date(data.dateOfBirth);
    if (!isNaN(date.getTime())) {
      data.dateOfBirth = date.toISOString().split("T")[0];
    }
  }

  if (data.hireDate) {
    const date = new Date(data.hireDate);
    if (!isNaN(date.getTime())) {
      data.hireDate = date.toISOString().split("T")[0];
    }
  }

  if (data.instructorSince) {
    const date = new Date(data.instructorSince);
    if (!isNaN(date.getTime())) {
      data.instructorSince = date.toISOString().split("T")[0];
    }
  }

  // Ensure nested objects exist
  data.address = data.address || {};
  data.emergencyContact = data.emergencyContact || {};
  data.bankAccount = data.bankAccount || {};
  data.qualifications = data.qualifications || [];
  data.certifications = data.certifications || [];
  data.expertise = data.expertise || [];
  data.benefits = data.benefits || [];

  return data;
};

/**
 * Formats salary for display
 */
export const formatSalary = (salary, currency = "KES") => {
  if (!salary) return "Not specified";
  return `${currency} ${salary.toLocaleString()}`;
};

/**
 * Gets status badge color
 */
export const getStatusBadgeColor = (status) => {
  const statusConfig = {
    active: { color: "bg-green-100 text-green-800", label: "Active" },
    inactive: { color: "bg-gray-100 text-gray-800", label: "Inactive" },
    on_leave: { color: "bg-yellow-100 text-yellow-800", label: "On Leave" },
    terminated: { color: "bg-red-100 text-red-800", label: "Terminated" },
    retired: { color: "bg-purple-100 text-purple-800", label: "Retired" },
  };
  return statusConfig[status] || statusConfig.inactive;
};

/**
 * Gets salary status badge color
 */
export const getSalaryStatusBadgeColor = (status) => {
  const statusConfig = {
    pending: { color: "bg-red-100 text-red-800", label: "Pending" },
    partial: { color: "bg-yellow-100 text-yellow-800", label: "Partial" },
    paid: { color: "bg-green-100 text-green-800", label: "Paid" },
    overdue: { color: "bg-orange-100 text-orange-800", label: "Overdue" },
  };
  return statusConfig[status] || statusConfig.pending;
};

/**
 * Gets teaching status badge color
 */
export const getTeachingStatusBadgeColor = (status) => {
  const statusConfig = {
    available: { color: "bg-green-100 text-green-800", label: "Available" },
    fully_assigned: {
      color: "bg-orange-100 text-orange-800",
      label: "Fully Assigned",
    },
    on_break: { color: "bg-gray-100 text-gray-800", label: "On Break" },
  };
  return statusConfig[status] || statusConfig.available;
};
