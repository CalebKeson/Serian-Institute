// src/components/Courses/CourseTable.jsx - UPDATED VERSION
import React from "react";
import {
  BookOpen,
  Edit,
  Eye,
  Trash2,
  Users,
  Calendar,
  User,
  Building,
  BadgeCheck,
  XCircle,
  Clock,
  Car,
  Droplets,
  Zap,
  Cpu,
  Award,
} from "lucide-react";
import { useNavigate } from "react-router";

const CourseTable = ({
  courses,
  loading,
  onView,
  onEdit,
  onDelete,
  currentUser,
}) => {
  const navigate = useNavigate();
  const getCourseTypeIcon = (courseType) => {
    const icons = {
      driving: Car,
      plumbing: Droplets,
      electrical: Zap,
      computer: Cpu,
    };
    return icons[courseType] || BookOpen;
  };

  const getCourseTypeLabel = (courseType) => {
    const labels = {
      driving: "Driving",
      plumbing: "Plumbing",
      electrical: "Electrical",
      computer: "Computer",
    };
    return labels[courseType] || courseType;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: BadgeCheck },
      inactive: { color: "bg-gray-100 text-gray-800", icon: XCircle },
      completed: { color: "bg-blue-100 text-blue-800", icon: Award },
      cancelled: { color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.inactive;
    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Replace the getEnrollmentBadge function in CourseTable.jsx with this:

  const getEnrollmentBadge = (course) => {
    // Get enrolled count from either enrolledStudents array or enrolledCount virtual
    const enrolledCount =
      course.enrolledCount || course.enrolledStudents?.length || 0;
    const maxStudents = course.maxStudents || 0;
    const isFull = enrolledCount >= maxStudents;
    const percentage =
      maxStudents > 0 ? Math.round((enrolledCount / maxStudents) * 100) : 0;

    if (isFull) {
      return (
        <div className="flex flex-col space-y-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Users className="w-3 h-3 mr-1" />
            Full ({enrolledCount}/{maxStudents})
          </span>
          <span className="text-xs text-red-600">{percentage}% capacity</span>
        </div>
      );
    }

    if (enrolledCount === 0) {
      return (
        <div className="flex flex-col space-y-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Users className="w-3 h-3 mr-1" />
            No enrollments
          </span>
          <span className="text-xs text-gray-500">0/{maxStudents} spots</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col space-y-1">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Users className="w-3 h-3 mr-1" />
          {enrolledCount}/{maxStudents}
        </span>
        <div className="w-20 bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${
              percentage >= 80 ? "bg-orange-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const formatIntakeDate = (course) => {
    return `${course.intakeMonth} ${course.intakeYear}`;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center space-x-4 p-4 border-b border-gray-200"
          >
            <div className="rounded-lg bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No courses found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {currentUser?.role === "admin" ? (
            <>Get started by creating a new course.</>
          ) : (
            <>No courses are currently available.</>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-blue-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider"
            >
              Course
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider"
            >
              Details
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider"
            >
              Schedule
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider"
            >
              Enrollment
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-blue-900 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {courses.map((course) => {
            const CourseTypeIcon = getCourseTypeIcon(course.courseType);

            return (
              <tr
                key={course._id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className={`h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center ${
                        course.courseType === "driving"
                          ? "bg-red-100"
                          : course.courseType === "plumbing"
                            ? "bg-blue-100"
                            : course.courseType === "electrical"
                              ? "bg-yellow-100"
                              : "bg-purple-100"
                      }`}
                    >
                      <CourseTypeIcon
                        className={`w-5 h-5 ${
                          course.courseType === "driving"
                            ? "text-red-600"
                            : course.courseType === "plumbing"
                              ? "text-blue-600"
                              : course.courseType === "electrical"
                                ? "text-yellow-600"
                                : "text-purple-600"
                        }`}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {course.courseCode}
                      </div>
                      <div className="text-sm text-gray-500">{course.name}</div>
                      <div className="text-xs text-gray-400 flex items-center mt-1">
                        <Building className="w-3 h-3 mr-1" />
                        {getCourseTypeLabel(course.courseType)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{course.duration}</div>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                    {formatIntakeDate(course)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Batch: {course.batchNumber}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 flex items-center">
                    <User className="w-4 h-4 mr-2 text-blue-500" />
                    {course.instructor?.name || "Unassigned"}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <Clock className="w-4 h-4 mr-2 text-blue-500" />
                    {course.schedule?.time || "Not scheduled"}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {course.schedule?.days?.join(", ") || "No days set"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getEnrollmentBadge(course)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(course.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onView(course)}
                      className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded"
                      title="View Course"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {currentUser?.role === "admin" && (
                      <>
                        {/* Mark Attendance Button - Add this */}
                        <button
                          onClick={() =>
                            navigate(`/courses/${course._id}/attendance`)
                          }
                          className="text-green-600 hover:text-green-900 transition-colors p-1 rounded"
                          title="Mark Attendance"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(course)}
                          className="text-purple-600 hover:text-purple-900 transition-colors p-1 rounded"
                          title="Edit Course"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDelete(course)}
                          className="text-red-600 hover:text-red-900 transition-colors p-1 rounded"
                          title="Delete Course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CourseTable;
