
import React, { useState } from 'react';
import { useRequestStore } from '../../stores/requestStore';
import { User, Mail, Phone, FileText, Building, Flag, X, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateRequestForm = ({ onSuccess, onCancel }) => {
  const { createRequest, loading } = useRequestStore();
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorEmail: '',
    visitorPhone: '',
    purpose: 'Admission Inquiry',
    department: 'Admissions',
    description: '',
    priority: 'medium'
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.visitorName.trim() || !formData.visitorPhone.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const result = await createRequest(formData);
    
    if (result.success) {
      onSuccess();
    } else {
      toast.error(result.message || 'Failed to create request');
    }
  };

  const purposeOptions = [
    'Admission Inquiry',
    'Fee Payment',
    'Document Submission',
    'Meeting Staff',
    'Complaint',
    'Other'
  ];

  const departmentOptions = [
    'Admissions',
    'Accounts',
    'Administration',
    'Academic',
    'Library',
    'Sports',
    'Maintenance',
    'Other'
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Two-column grid for compact layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Visitor Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Visitor Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="visitorName"
              value={formData.visitorName}
              onChange={handleChange}
              required
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Full name"
            />
          </div>
        </div>
        
        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              name="visitorPhone"
              value={formData.visitorPhone}
              onChange={handleChange}
              required
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Phone number"
            />
          </div>
        </div>
        
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              name="visitorEmail"
              value={formData.visitorEmail}
              onChange={handleChange}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Email address"
            />
          </div>
        </div>
        
        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Purpose of Visit *
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              required
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white appearance-none"
            >
              {purposeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Department
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white appearance-none"
            >
              {departmentOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Priority - Compact radio buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Priority Level
          </label>
          <div className="flex gap-2">
            {priorityOptions.map((priority) => (
              <label key={priority.value} className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value={priority.value}
                  checked={formData.priority === priority.value}
                  onChange={handleChange}
                  className="hidden"
                />
                <div className={`px-2 py-1.5 rounded-lg border text-center text-xs font-medium transition-all ${
                  formData.priority === priority.value 
                    ? `${priority.color} border-2 shadow-sm` 
                    : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                }`}>
                  {priority.label}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
      
      {/* Description - Full width, compact */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Request Description *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
          placeholder="Describe the visitor's request..."
          maxLength="500"
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-500">
            Describe the request in detail
          </p>
          <span className={`text-xs ${
            formData.description.length > 450 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {formData.description.length}/500
          </span>
        </div>
      </div>
      
      {/* Form Actions - Compact */}
      <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Create Request
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateRequestForm;