// src/components/Requests/CreateRequestForm.jsx
import React, { useState } from 'react';
import { useRequestStore } from '../../stores/requestStore';
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
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visitor Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visitor Name *
          </label>
          <input
            type="text"
            name="visitorName"
            value={formData.visitorName}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter visitor full name"
          />
        </div>
        
        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            name="visitorPhone"
            value={formData.visitorPhone}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter phone number"
          />
        </div>
        
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            name="visitorEmail"
            value={formData.visitorEmail}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter email address"
          />
        </div>
        
        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purpose of Visit *
          </label>
          <select
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Admission Inquiry">Admission Inquiry</option>
            <option value="Fee Payment">Fee Payment</option>
            <option value="Document Submission">Document Submission</option>
            <option value="Meeting Staff">Meeting Staff</option>
            <option value="Complaint">Complaint</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Admissions">Admissions</option>
            <option value="Accounts">Accounts</option>
            <option value="Administration">Administration</option>
            <option value="Academic">Academic</option>
            <option value="Library">Library</option>
            <option value="Sports">Sports</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority Level
          </label>
          <div className="flex flex-wrap gap-3">
            {[
              { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
              { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
              { value: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-800' },
              { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
            ].map((priority) => (
              <label key={priority.value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value={priority.value}
                  checked={formData.priority === priority.value}
                  onChange={handleChange}
                  className="hidden"
                />
                <div className={`px-4 py-2 rounded-lg border transition-all ${
                  formData.priority === priority.value 
                    ? `${priority.color} border-transparent` 
                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                }`}>
                  {priority.label}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
      
      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Request Description *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows="4"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          placeholder="Please provide detailed description of the visitor's request..."
          maxLength="500"
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-500">
            Describe the request in detail for proper handling
          </p>
          <span className={`text-sm ${
            formData.description.length > 450 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {formData.description.length}/500
          </span>
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Request
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateRequestForm;