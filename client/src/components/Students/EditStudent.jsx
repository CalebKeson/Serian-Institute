// src/pages/Students/EditStudent.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { formatStudentForAPI, formatStudentForForm } from '../../utils/studentDataFormatter';
import {
  Edit,
  ArrowLeft,
  Save,
  X,
  Calendar,
  Phone,
  Home,
  User,
  AlertCircle,
  Mail,
  Loader,
} from "lucide-react";
import Layout from "../../components/Layout/Layout";
import { useStudentStore } from "../../stores/studentStore";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";

const EditStudent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const {
    currentStudent,
    fetchStudent,
    updateStudent,
    loading,
    clearCurrentStudent,
  } = useStudentStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },
    status: "active",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is admin
  if (user?.role !== "admin") {
    navigate("/students");
    return null;
  }

  // Fetch student data when component mounts
  useEffect(() => {
    if (id) {
      fetchStudent(id);
    }

    return () => {
      clearCurrentStudent();
    };
  }, [id]);

  // Update useEffect that populates form:
  useEffect(() => {
    if (currentStudent) {
      const formattedData = formatStudentForForm({
        name: currentStudent.user?.name || "",
        email: currentStudent.user?.email || "",
        dateOfBirth: currentStudent.dateOfBirth,
        gender: currentStudent.gender || "",
        phone: currentStudent.phone || "",
        address: currentStudent.address || {},
        emergencyContact: currentStudent.emergencyContact || {},
        status: currentStudent.status || "active",
      });
      setFormData(formattedData);
    }
  }, [currentStudent]);

  // Update handleSubmit:
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToSend = formatStudentForAPI(formData, false);
      const result = await updateStudent(id, dataToSend);

      if (result.success) {
        toast.success("Student updated successfully!");
        navigate(`/students/${id}`);
      } else {
        toast.error(result.message || "Failed to update student");
      }
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested objects (address, emergencyContact)
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    } else if (name.startsWith("emergencyContact.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.dateOfBirth)
      newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.address.street.trim())
      newErrors["address.street"] = "Street address is required";
    if (!formData.address.city.trim())
      newErrors["address.city"] = "City is required";
    if (!formData.address.state.trim())
      newErrors["address.state"] = "State is required";
    if (!formData.address.zipCode.trim())
      newErrors["address.zipCode"] = "Zip code is required";
    if (!formData.emergencyContact.name.trim())
      newErrors["emergencyContact.name"] = "Emergency contact name is required";
    if (!formData.emergencyContact.relationship.trim())
      newErrors["emergencyContact.relationship"] = "Relationship is required";
    if (!formData.emergencyContact.phone.trim())
      newErrors["emergencyContact.phone"] =
        "Emergency contact phone is required";

    // Email validation
    if (
      formData.email &&
      !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)
    ) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (
      formData.emergencyContact.phone &&
      !/^\d{10}$/.test(formData.emergencyContact.phone.replace(/\D/g, ""))
    ) {
      newErrors["emergencyContact.phone"] =
        "Please enter a valid 10-digit phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCancel = () => {
    navigate("/students");
  };

  if (loading && !currentStudent) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  if (!currentStudent && !loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Student not found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            The student you're looking for doesn't exist.
          </p>
          <button
            onClick={handleCancel}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Students
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCancel}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Edit className="w-8 h-8 mr-3 text-blue-600" />
                  Edit Student
                </h1>
                <p className="mt-2 text-gray-600">
                  Update student information for {currentStudent?.user?.name}
                </p>
                {currentStudent?.studentId && (
                  <p className="text-sm text-blue-600 font-medium">
                    Student ID: {currentStudent.studentId}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Personal Information Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.name ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter student's full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.email ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="student@serian.ac.ke"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label
                    htmlFor="dateOfBirth"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Date of Birth *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.dateOfBirth
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label
                    htmlFor="gender"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Gender *
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.gender ? "border-red-300" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.gender}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.phone ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="0712345678"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="graduated">Graduated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Home className="w-5 h-5 mr-2 text-blue-600" />
                Address Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Street */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="address.street"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Street Address *
                  </label>
                  <input
                    type="text"
                    id="address.street"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors["address.street"]
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter street address"
                  />
                  {errors["address.street"] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors["address.street"]}
                    </p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label
                    htmlFor="address.city"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    City *
                  </label>
                  <input
                    type="text"
                    id="address.city"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors["address.city"]
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter city"
                  />
                  {errors["address.city"] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors["address.city"]}
                    </p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label
                    htmlFor="address.state"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    State/Province *
                  </label>
                  <input
                    type="text"
                    id="address.state"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors["address.state"]
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter state or province"
                  />
                  {errors["address.state"] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors["address.state"]}
                    </p>
                  )}
                </div>

                {/* Zip Code */}
                <div>
                  <label
                    htmlFor="address.zipCode"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    ZIP/Postal Code *
                  </label>
                  <input
                    type="text"
                    id="address.zipCode"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors["address.zipCode"]
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter ZIP code"
                  />
                  {errors["address.zipCode"] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors["address.zipCode"]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
                Emergency Contact
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Emergency Contact Name */}
                <div>
                  <label
                    htmlFor="emergencyContact.name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    id="emergencyContact.name"
                    name="emergencyContact.name"
                    value={formData.emergencyContact.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors["emergencyContact.name"]
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter contact's full name"
                  />
                  {errors["emergencyContact.name"] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors["emergencyContact.name"]}
                    </p>
                  )}
                </div>

                {/* Relationship */}
                <div>
                  <label
                    htmlFor="emergencyContact.relationship"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Relationship *
                  </label>
                  <input
                    type="text"
                    id="emergencyContact.relationship"
                    name="emergencyContact.relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors["emergencyContact.relationship"]
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="e.g., Mother, Father, Guardian"
                  />
                  {errors["emergencyContact.relationship"] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors["emergencyContact.relationship"]}
                    </p>
                  )}
                </div>

                {/* Emergency Contact Phone */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="emergencyContact.phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Contact Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      id="emergencyContact.phone"
                      name="emergencyContact.phone"
                      value={formData.emergencyContact.phone}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors["emergencyContact.phone"]
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="0723456789"
                    />
                  </div>
                  {errors["emergencyContact.phone"] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors["emergencyContact.phone"]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting || loading
                  ? "Updating Student..."
                  : "Update Student"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditStudent;
