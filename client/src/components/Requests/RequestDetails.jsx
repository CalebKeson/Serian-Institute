// src/pages/Requests/RequestDetails.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import Layout from "../../components/Layout/Layout";
import { useRequestStore } from "../../stores/requestStore";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentRequest, fetchRequest, updateRequest, addNote, loading } =
    useRequestStore();
  const [noteContent, setNoteContent] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRequest(id);
    }
  }, [id]);

  // In RequestDetails.jsx - Update the handleAddNote function
  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      toast.error("Please enter note content");
      return;
    }

    if (loading) {
      toast.error("Please wait, previous operation in progress");
      return;
    }

    const result = await addNote(id, { content: noteContent });

    if (result.success) {
      setNoteContent("");
      toast.success("Note added successfully");
    } else {
      toast.error(result.message || "Failed to add note");
    }
  };

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    const result = await updateRequest(id, { status: newStatus });

    if (result.success) {
      toast.success(`Request marked as ${newStatus}`);
    } else {
      toast.error(result.message || "Failed to update status");
    }
    setIsUpdating(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentRequest) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Request Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The requested visitor request could not be found.
          </p>
          <button
            onClick={() => navigate("/requests")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Requests
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate("/requests")}
              className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Requests
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Visitor Request Details
            </h1>
          </div>

          <div className="flex gap-3">
            {user?.role === "admin" && (
              <div className="flex gap-2">
                <select
                  value={currentRequest.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isUpdating}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Request Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Request Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Visitor Details
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Name:</span>{" "}
                      {currentRequest.visitorName}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Phone:</span>{" "}
                      {currentRequest.visitorPhone}
                    </p>
                    {currentRequest.visitorEmail && (
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">
                          Email:
                        </span>{" "}
                        {currentRequest.visitorEmail}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Request Details
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Purpose:
                      </span>{" "}
                      {currentRequest.purpose}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Department:
                      </span>{" "}
                      {currentRequest.department}
                    </p>
                    <div className="flex gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentRequest.status)}`}
                      >
                        {currentRequest.status}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(currentRequest.priority)}`}
                      >
                        {currentRequest.priority} Priority
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Description
                </h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {currentRequest.description}
                </p>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Notes & Updates
              </h2>

              {/* Add Note Form */}
              <div className="mb-6">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add a note or update about this request..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleAddNote}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Note
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-4">
                {currentRequest.notes && currentRequest.notes.length > 0 ? (
                  currentRequest.notes.map((note, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-blue-500 pl-4 py-2"
                    >
                      <p className="text-gray-700">{note.content}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        By {note.addedBy?.name || "Unknown"} •{" "}
                        {formatDate(note.addedAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No notes yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Meta Info */}
          <div className="space-y-6">
            {/* Timeline Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Timeline
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Created</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(currentRequest.createdAt)}
                  </p>
                  {currentRequest.receptionist && (
                    <p className="text-sm text-gray-500 mt-1">
                      By {currentRequest.receptionist.name}
                    </p>
                  )}
                </div>

                {currentRequest.resolvedDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Resolved
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(currentRequest.resolvedDate)}
                    </p>
                  </div>
                )}

                {currentRequest.assignedTo && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Assigned To
                    </p>
                    <p className="text-sm text-gray-500">
                      {currentRequest.assignedTo.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {currentRequest.assignedTo.role}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                {user?.role === "admin" && currentRequest.assignedTo && (
                  <button
                    onClick={() => handleStatusChange("completed")}
                    disabled={
                      isUpdating || currentRequest.status === "completed"
                    }
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Mark as Completed
                  </button>
                )}

                <button
                  onClick={() => navigate("/requests")}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back to List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RequestDetails;
