// src/pages/Directors/EditDirector.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Save,
  X,
  User,
  Mail,
  Phone,
  Home,
  AlertCircle,
  Loader,
  Edit,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useDirectorStore } from '../../stores/directorStore';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const EditDirector = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const {
    currentDirector,
    fetchDirector,
    updateDirector,
    loading
  } = useDirectorStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    role: 'member',
    shareholding: 0,
    isActive: true,
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is admin
  if (user?.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  // Fetch director data on mount
  useEffect(() => {
    if (id) {
      fetchDirector(id);
    }
  }, [id]);

  // Populate form when director data is loaded
  useEffect(() => {
    if (currentDirector) {
      setFormData({
        name: currentDirector.name || '',
        email: currentDirector.email || '',
        phone: currentDirector.phone || '',
        address: {
          street: currentDirector.address?.street || '',
          city: currentDirector.address?.city || '',
          state: currentDirector.address?.state || '',
          zipCode: currentDirector.address?.zipCode || ''
        },
        role: currentDirector.role || 'member',
        shareholding: currentDirector.shareholding || 0,
        isActive: currentDirector.isActive !== undefined ? currentDirector.isActive : true,
        notes: currentDirector.notes || ''
      });
    }
  }, [currentDirector]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle nested address fields
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value
        }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.address.street.trim()) {
      newErrors['address.street'] = 'Street address is required';
    }

    if (!formData.address.city.trim()) {
      newErrors['address.city'] = 'City is required';
    }

    if (!formData.address.state.trim()) {
      newErrors['address.state'] = 'State/Province is required';
    }

    if (!formData.address.zipCode.trim()) {
      newErrors['address.zipCode'] = 'ZIP/Postal code is required';
    }

    if (formData.shareholding < 0 || formData.shareholding > 100) {
      newErrors.shareholding = 'Shareholding must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateDirector(id, formData);

      if (result.success) {
        toast.success('Director updated successfully!');
        navigate(`/directors/${id}`);
      }
    } catch (error) {
      console.error('Error updating director:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/directors');
  };

  const roleOptions = [
    { value: 'chairman', label: 'Chairman' },
    { value: 'secretary', label: 'Secretary' },
    { value: 'treasurer', label: 'Treasurer' },
    { value: 'member', label: 'Member' }
  ];

  if (loading && !currentDirector) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  if (!currentDirector && !loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Director not found</h3>
          <p className="mt-1 text-sm text-gray-500">The director you're looking for doesn't exist.</p>
          <button
            onClick={handleCancel}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Directors
          </button>
        </div>
      </Layout>
    );
  }

  const hasInvestments = (currentDirector?.totalInvested || 0) > 0;

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
                  Edit Director
                </h1>
                <p className="mt-2 text-gray-600">
                  Update director information for {currentDirector?.name}
                </p>
                {hasInvestments && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Note: This director has invested {formatCurrency(currentDirector.totalInvested)}. 
                      Changing status may affect reporting.
                    </p>
                  </div>
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
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter director's full name"
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
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="director@serian.ac.ke"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
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
                        errors.phone ? 'border-red-300' : 'border-gray-300'
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
                  <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    id="address.street"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors['address.street'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter street address"
                  />
                  {errors['address.street'] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors['address.street']}
                    </p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    id="address.city"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors['address.city'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter city"
                  />
                  {errors['address.city'] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors['address.city']}
                    </p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province *
                  </label>
                  <input
                    type="text"
                    id="address.state"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors['address.state'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter state or province"
                  />
                  {errors['address.state'] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors['address.state']}
                    </p>
                  )}
                </div>

                {/* Zip Code */}
                <div>
                  <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP/Postal Code *
                  </label>
                  <input
                    type="text"
                    id="address.zipCode"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors['address.zipCode'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter ZIP code"
                  />
                  {errors['address.zipCode'] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors['address.zipCode']}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Director Details Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Director Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {roleOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shareholding */}
                <div>
                  <label htmlFor="shareholding" className="block text-sm font-medium text-gray-700 mb-2">
                    Shareholding (%)
                  </label>
                  <input
                    type="number"
                    id="shareholding"
                    name="shareholding"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.shareholding}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.shareholding ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                  {errors.shareholding && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.shareholding}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="isActive"
                        value="true"
                        checked={formData.isActive === true}
                        onChange={() => setFormData(prev => ({ ...prev, isActive: true }))}
                        className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="isActive"
                        value="false"
                        checked={formData.isActive === false}
                        onChange={() => setFormData(prev => ({ ...prev, isActive: false }))}
                        className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Inactive</span>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Any additional notes about the director..."
                  />
                </div>
              </div>
            </div>

            {/* Investment Summary (Read-only) */}
            {hasInvestments && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Investment Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Total Invested</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(currentDirector.totalInvested)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Repaid</p>
                    <p className="text-sm font-bold text-blue-600">{formatCurrency(currentDirector.totalRepaid)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Outstanding</p>
                    <p className="text-sm font-bold text-orange-600">{formatCurrency(currentDirector.outstandingBalance)}</p>
                  </div>
                </div>
              </div>
            )}

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
                {isSubmitting || loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Director
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditDirector;