// frontend/src/pages/Instructors/AddInstructor.jsx - COMPLETE FIXED VERSION

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  UserPlus,
  ArrowLeft,
  Save,
  X,
  Calendar,
  Phone,
  Home,
  User,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  GraduationCap,
  Award,
  DollarSign,
  Building,
  Users,
  Plus,
  Trash2,
} from "lucide-react";
import Layout from "../../components/Layout/Layout";
import { useInstructorStore } from "../../stores/instructorStore";
import { useAuthStore } from "../../stores/authStore";
import { formatInstructorForAPI } from "../../utils/instructorDataFormatter";
import toast from "react-hot-toast";

const AddInstructor = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createInstructor, instructors, fetchInstructors, loading } = useInstructorStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    designation: "Instructor",
    specialization: "",
    qualifications: [],
    certifications: [],
    expertise: [],
    hireDate: "",
    instructorSince: "",
    employmentType: "full-time",
    contractStartDate: "",
    contractEndDate: "",
    contractDuration: "",
    supervisor: "",
    salary: "",
    salaryCurrency: "KES",
    paymentSchedule: "monthly",
    bankAccount: {
      bankName: "",
      accountNumber: "",
      accountName: "",
      branch: "",
    },
    benefits: [],
    phone: "",
    personalEmail: "",
    dateOfBirth: "",
    gender: "",
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
    maxWorkload: 5,
    notes: "",
  });

  const [newQualification, setNewQualification] = useState({
    degree: "",
    institution: "",
    year: "",
    grade: "",
  });
  const [newCertification, setNewCertification] = useState({
    name: "",
    issuingBody: "",
    year: "",
    expiryDate: "",
  });
  const [newExpertise, setNewExpertise] = useState("");
  const [newBenefit, setNewBenefit] = useState("");

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch instructors for supervisor dropdown
  useEffect(() => {
    if (user?.role === "admin") {
      fetchInstructors();
    }
  }, [user, fetchInstructors]);

  if (user?.role !== "admin") {
    navigate("/instructors");
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else if (name.startsWith("emergencyContact.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        emergencyContact: { ...prev.emergencyContact, [field]: value },
      }));
    } else if (name.startsWith("bankAccount.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        bankAccount: { ...prev.bankAccount, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const addQualification = () => {
    if (newQualification.degree && newQualification.institution) {
      setFormData((prev) => ({
        ...prev,
        qualifications: [
          ...prev.qualifications,
          {
            ...newQualification,
            year: parseInt(newQualification.year) || null,
          },
        ],
      }));
      setNewQualification({ degree: "", institution: "", year: "", grade: "" });
    }
  };

  const removeQualification = (index) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index),
    }));
  };

  const addCertification = () => {
    if (newCertification.name && newCertification.issuingBody) {
      setFormData((prev) => ({
        ...prev,
        certifications: [
          ...prev.certifications,
          {
            ...newCertification,
            year: parseInt(newCertification.year) || null,
          },
        ],
      }));
      setNewCertification({
        name: "",
        issuingBody: "",
        year: "",
        expiryDate: "",
      });
    }
  };

  const removeCertification = (index) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const addExpertise = () => {
    if (newExpertise.trim()) {
      setFormData((prev) => ({
        ...prev,
        expertise: [...prev.expertise, newExpertise.trim()],
      }));
      setNewExpertise("");
    }
  };

  const removeExpertise = (index) => {
    setFormData((prev) => ({
      ...prev,
      expertise: prev.expertise.filter((_, i) => i !== index),
    }));
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setFormData((prev) => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()],
      }));
      setNewBenefit("");
    }
  };

  const removeBenefit = (index) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm password";
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.specialization) newErrors.specialization = "Specialization is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.hireDate) newErrors.hireDate = "Hire date is required";

    if (formData.email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (formData.salary && formData.salary < 0) {
      newErrors.salary = "Salary cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      const { confirmPassword, ...submitData } = formData;
      const cleanedData = {
        ...submitData,
        supervisor: submitData.supervisor || null,
        contractStartDate: submitData.contractStartDate || null,
        contractEndDate: submitData.contractEndDate || null,
      };

      const dataToSend = formatInstructorForAPI(cleanedData, true);
      const result = await createInstructor(dataToSend);

      if (result.success && result.data) {
        toast.success(`Instructor created successfully! Employee ID: ${result.data.employeeId}`);
        navigate(`/instructors/${result.data._id}`);
      } else {
        toast.error(result.message || "Failed to create instructor");
      }
    } catch (error) {
      console.error("Error creating instructor:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/instructors");
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
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
                  <UserPlus className="w-8 h-8 mr-3 text-blue-600" />
                  Add New Instructor
                </h1>
                <p className="mt-2 text-gray-600">
                  Create a new instructor account for Serian Institute
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Account Information Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Account Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter full name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="instructor@serian.ac.ke"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.password ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Create password (min. 6 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.confirmPassword ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                Professional Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Computer Science, Driving School"
                  />
                  {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Senior Instructor, Head of Department"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialization *</label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Web Development, Defensive Driving"
                  />
                  {errors.specialization && <p className="mt-1 text-sm text-red-600">{errors.specialization}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor</label>
                  <select
                    name="supervisor"
                    value={formData.supervisor}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Supervisor</option>
                    {instructors?.map((instructor) => (
                      <option key={instructor._id} value={instructor.user?._id || instructor._id}>
                        {instructor.user?.name || instructor.name} ({instructor.department || 'Instructor'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Qualifications Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                Qualifications
              </h2>
              
              {formData.qualifications.length > 0 && (
                <div className="mb-4 space-y-2">
                  {formData.qualifications.map((qual, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{qual.degree}</p>
                        <p className="text-sm text-gray-600">{qual.institution} ({qual.year})</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQualification(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Degree"
                  value={newQualification.degree}
                  onChange={(e) => setNewQualification({ ...newQualification, degree: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Institution"
                  value={newQualification.institution}
                  onChange={(e) => setNewQualification({ ...newQualification, institution: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Year"
                  value={newQualification.year}
                  onChange={(e) => setNewQualification({ ...newQualification, year: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={addQualification}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </button>
              </div>
            </div>

            {/* Employment Details Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Employment Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date *</label>
                  <input
                    type="date"
                    name="hireDate"
                    value={formData.hireDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.hireDate && <p className="mt-1 text-sm text-red-600">{errors.hireDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="visiting">Visiting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Workload (Courses)</label>
                  <input
                    type="number"
                    name="maxWorkload"
                    value={formData.maxWorkload}
                    onChange={handleChange}
                    min="1"
                    max="8"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Compensation Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                Compensation
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Salary</label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  {errors.salary && <p className="mt-1 text-sm text-red-600">{errors.salary}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Schedule</label>
                  <select
                    name="paymentSchedule"
                    value={formData.paymentSchedule}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-3">Bank Account</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="bankAccount.bankName"
                    value={formData.bankAccount.bankName}
                    onChange={handleChange}
                    placeholder="Bank Name"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    name="bankAccount.accountNumber"
                    value={formData.bankAccount.accountNumber}
                    onChange={handleChange}
                    placeholder="Account Number"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    name="bankAccount.accountName"
                    value={formData.bankAccount.accountName}
                    onChange={handleChange}
                    placeholder="Account Name"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    name="bankAccount.branch"
                    value={formData.bankAccount.branch}
                    onChange={handleChange}
                    placeholder="Branch"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Personal Information Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Phone className="w-5 h-5 mr-2 text-blue-600" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="0712345678"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Personal Email (Optional)</label>
                  <input
                    type="email"
                    name="personalEmail"
                    value={formData.personalEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="personal@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4 inline mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Save className="w-4 h-4 inline mr-2" />
                {isSubmitting || loading ? "Creating Instructor..." : "Create Instructor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddInstructor;