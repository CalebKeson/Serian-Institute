// components/Enquiry/EnquiryForm.jsx - COMPLETE NEW FILE

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MessageSquare,
  Send,
  Loader,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Calendar,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const EnquiryForm = ({ 
  onSubmit, 
  loading = false, 
  success = false,
  error = null,
  className = '',
  compact = false,
  showTitle = true
}) => {
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorEmail: '',
    visitorPhone: '',
    enquiryType: 'general_inquiry',
    message: '',
    courseOfInterest: [],
    courseOfInterestNames: [],
    preferredContactMethod: 'email',
    bestTimeToContact: 'anytime'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Load source data from localStorage (set by SourceTracker)
  useEffect(() => {
    const source = localStorage.getItem('visitorSource') || 'direct';
    const utmSource = localStorage.getItem('utmSource') || '';
    const utmMedium = localStorage.getItem('utmMedium') || '';
    const utmCampaign = localStorage.getItem('utmCampaign') || '';
    
    // Store source data in form state for submission
    setFormData(prev => ({
      ...prev,
      source,
      utmSource,
      utmMedium,
      utmCampaign
    }));
  }, []);

  const enquiryTypes = [
    { value: 'course_inquiry', label: 'Course Inquiry', icon: BookOpen },
    { value: 'admission_inquiry', label: 'Admission Inquiry', icon: User },
    { value: 'fee_inquiry', label: 'Fee Inquiry', icon: Calendar },
    { value: 'general_inquiry', label: 'General Inquiry', icon: MessageSquare },
    { value: 'complaint', label: 'Complaint', icon: AlertCircle },
    { value: 'feedback', label: 'Feedback', icon: MessageSquare },
    { value: 'other', label: 'Other', icon: MessageSquare }
  ];

  const contactMethods = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone Call' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'sms', label: 'SMS' }
  ];

  const timeOptions = [
    { value: 'morning', label: 'Morning (8am - 12pm)' },
    { value: 'afternoon', label: 'Afternoon (12pm - 5pm)' },
    { value: 'evening', label: 'Evening (5pm - 8pm)' },
    { value: 'anytime', label: 'Anytime' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked ? value : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when field is touched
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    validateField(name);
  };

  const validateField = (fieldName) => {
    const newErrors = {};
    
    if (fieldName === 'visitorName' || fieldName === 'all') {
      if (!formData.visitorName.trim()) {
        newErrors.visitorName = 'Full name is required';
      }
    }
    
    if (fieldName === 'visitorEmail' || fieldName === 'all') {
      if (!formData.visitorEmail.trim()) {
        newErrors.visitorEmail = 'Email address is required';
      } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.visitorEmail)) {
        newErrors.visitorEmail = 'Please enter a valid email address';
      }
    }
    
    if (fieldName === 'visitorPhone' || fieldName === 'all') {
      if (!formData.visitorPhone.trim()) {
        newErrors.visitorPhone = 'Phone number is required';
      } else if (!/^\d{10,15}$/.test(formData.visitorPhone.replace(/\D/g, ''))) {
        newErrors.visitorPhone = 'Please enter a valid phone number (10-15 digits)';
      }
    }
    
    if (fieldName === 'message' || fieldName === 'all') {
      if (!formData.message.trim()) {
        newErrors.message = 'Message is required';
      } else if (formData.message.length < 10) {
        newErrors.message = 'Message must be at least 10 characters';
      }
    }

    if (fieldName === 'enquiryType' || fieldName === 'all') {
      if (!formData.enquiryType) {
        newErrors.enquiryType = 'Please select an enquiry type';
      }
    }

    setErrors(prev => ({
      ...prev,
      ...newErrors
    }));
    
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    return validateField('all');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    // Prepare data for submission
    const submissionData = {
      ...formData,
      // Get visitor ID from localStorage
      visitorId: localStorage.getItem('visitorId') || null,
      sessionId: sessionStorage.getItem('sessionId') || null,
      // Get source from localStorage
      source: localStorage.getItem('visitorSource') || 'direct',
      utmSource: localStorage.getItem('utmSource') || '',
      utmMedium: localStorage.getItem('utmMedium') || '',
      utmCampaign: localStorage.getItem('utmCampaign') || '',
    };

    onSubmit(submissionData);
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Enquiry Submitted!</h3>
        <p className="text-gray-600 mb-4">
          Thank you for your enquiry. We will get back to you shortly.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Submit Another Enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {showTitle && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Get In Touch</h2>
          <p className="text-gray-600 mt-2">
            Fill in the form below and we'll get back to you as soon as possible
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="visitorName"
              value={formData.visitorName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your full name"
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                touched.visitorName && errors.visitorName 
                  ? 'border-red-300' 
                  : 'border-gray-300'
              }`}
            />
          </div>
          {touched.visitorName && errors.visitorName && (
            <p className="mt-1 text-sm text-red-600">{errors.visitorName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              name="visitorEmail"
              value={formData.visitorEmail}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="you@example.com"
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                touched.visitorEmail && errors.visitorEmail 
                  ? 'border-red-300' 
                  : 'border-gray-300'
              }`}
            />
          </div>
          {touched.visitorEmail && errors.visitorEmail && (
            <p className="mt-1 text-sm text-red-600">{errors.visitorEmail}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              name="visitorPhone"
              value={formData.visitorPhone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="0712345678"
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                touched.visitorPhone && errors.visitorPhone 
                  ? 'border-red-300' 
                  : 'border-gray-300'
              }`}
            />
          </div>
          {touched.visitorPhone && errors.visitorPhone && (
            <p className="mt-1 text-sm text-red-600">{errors.visitorPhone}</p>
          )}
        </div>
      </div>

      {/* Enquiry Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enquiry Type *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {enquiryTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = formData.enquiryType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, enquiryType: type.value }));
                  setErrors(prev => ({ ...prev, enquiryType: '' }));
                }}
                className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`text-xs font-medium ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
        {errors.enquiryType && (
          <p className="mt-1 text-sm text-red-600">{errors.enquiryType}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Message *
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={4}
            placeholder="Tell us how we can help you..."
            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
              touched.message && errors.message 
                ? 'border-red-300' 
                : 'border-gray-300'
            }`}
          />
        </div>
        <div className="flex justify-between mt-1">
          {touched.message && errors.message ? (
            <p className="text-sm text-red-600">{errors.message}</p>
          ) : (
            <p className="text-sm text-gray-500">
              {formData.message.length}/1000 characters
            </p>
          )}
          <span className={`text-sm ${
            formData.message.length > 900 ? 'text-red-500' : 'text-gray-400'
          }`}>
            {formData.message.length}/1000
          </span>
        </div>
      </div>

      {/* Preferred Contact Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Contact Method
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {contactMethods.map((method) => (
            <button
              key={method.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, preferredContactMethod: method.value }))}
              className={`p-3 border rounded-lg flex items-center justify-center gap-2 transition-all ${
                formData.preferredContactMethod === method.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <span className={`text-sm font-medium ${
                formData.preferredContactMethod === method.value ? 'text-blue-700' : 'text-gray-600'
              }`}>
                {method.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Best Time to Contact */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Best Time to Contact
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {timeOptions.map((time) => (
            <button
              key={time.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, bestTimeToContact: time.value }))}
              className={`p-3 border rounded-lg flex items-center justify-center gap-2 transition-all ${
                formData.bestTimeToContact === time.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <Clock className={`w-4 h-4 ${
                formData.bestTimeToContact === time.value ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <span className={`text-sm font-medium ${
                formData.bestTimeToContact === time.value ? 'text-blue-700' : 'text-gray-600'
              }`}>
                {time.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Enquiry
            </>
          )}
        </button>
        <p className="text-xs text-gray-500 text-center mt-3">
          By submitting this form, you agree to our privacy policy. We'll never share your information.
        </p>
      </div>
    </form>
  );
};

export default EnquiryForm;