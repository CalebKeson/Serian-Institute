// frontend/src/components/Instructors/AssignCourseModal.jsx
import React, { useState, useEffect } from "react";
import { X, BookOpen, AlertCircle } from "lucide-react";
import { useCourseStore } from "../../stores/courseStore";
import { useInstructorStore } from "../../stores/instructorStore";
import api from "../../services/api";
import toast from "react-hot-toast";

const AssignCourseModal = ({ instructor, onClose, onSuccess }) => {
  const { courses, fetchCourses, loading: coursesLoading } = useCourseStore();
  const { updateInstructorWorkload } = useInstructorStore();
  const [selectedCourse, setSelectedCourse] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [availableCourses, setAvailableCourses] = useState([]);

  // Fetch available courses (not assigned to this instructor)
  useEffect(() => {
    fetchAvailableCourses();
  }, []);

  const fetchAvailableCourses = async () => {
    try {
      const response = await api.get("/courses", {
        params: {
          status: "active",
          limit: 100,
        },
      });

      // Filter out courses already assigned to this instructor
      const allCourses = response.data.data || [];
      const assignedCourseIds =
        instructor.assignedCourses?.map((c) => c._id) || [];
      const available = allCourses.filter(
        (course) => !assignedCourseIds.includes(course._id),
      );

      setAvailableCourses(available);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      toast.error("Failed to load available courses");
    }
  };

  // In AssignCourseModal.jsx, update the handleAssign function:

  const handleAssign = async () => {
    if (!selectedCourse) {
      toast.error("Please select a course");
      return;
    }

    setAssigning(true);

    try {
      // Update the course with the instructor
      await api.put(`/courses/${selectedCourse}`, {
        instructor: instructor.user._id,
      });

      // Update instructor's workload
      const workloadResult = await updateInstructorWorkload(instructor._id);

      if (workloadResult?.success !== false) {
        toast.success("Course assigned successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error("Course assigned but failed to update workload");
        onSuccess(); // Still close and refresh
        onClose();
      }
    } catch (error) {
      console.error("Failed to assign course:", error);
      toast.error(error.response?.data?.message || "Failed to assign course");
    } finally {
      setAssigning(false);
    }
  };

  const currentWorkload = instructor.currentWorkload || 0;
  const maxWorkload = instructor.maxWorkload || 5;
  const hasCapacity = currentWorkload < maxWorkload;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              Assign Course to {instructor.user?.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workload Warning */}
        {!hasCapacity && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-sm text-red-700">
                This instructor has reached their maximum workload (
                {maxWorkload} courses). Cannot assign more courses.
              </p>
            </div>
          </div>
        )}

        {/* Workload Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Current Workload:</span>
            <span className="font-medium">
              {currentWorkload}/{maxWorkload} courses
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 rounded-full h-2 transition-all"
              style={{ width: `${(currentWorkload / maxWorkload) * 100}%` }}
            />
          </div>
        </div>

        {/* Course Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Course *
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            disabled={!hasCapacity}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Choose a course...</option>
            {availableCourses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.courseCode} - {course.name}
              </option>
            ))}
          </select>
          {availableCourses.length === 0 && !coursesLoading && (
            <p className="mt-2 text-sm text-yellow-600">
              No available courses found. All courses may already be assigned to
              this instructor.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!selectedCourse || !hasCapacity || assigning}
            className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {assigning ? "Assigning..." : "Assign Course"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignCourseModal;
