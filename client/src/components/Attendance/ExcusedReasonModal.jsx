// src/components/Attendance/ExcusedReasonModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Heart,
  AlertTriangle,
  Car,
  User,
  Church,
  Edit3,
  Clock,
  FileText,
  AlertCircle
} from 'lucide-react';

const ExcusedReasonModal = ({
  isOpen,
  onClose,
  onSave,
  initialReason = '',
  studentName,
  loading
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState('select'); // 'select' or 'custom'

  // Predefined reasons with icons and colors
  const reasonOptions = [
    {
      id: 'medical',
      label: 'Medical Appointment',
      icon: Heart,
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      hoverColor: 'hover:bg-red-100',
      iconColor: 'text-red-600',
      description: 'Doctor visits, hospital appointments, medical procedures'
    },
    {
      id: 'emergency',
      label: 'Family Emergency',
      icon: AlertTriangle,
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      hoverColor: 'hover:bg-orange-100',
      iconColor: 'text-orange-600',
      description: 'Urgent family matters, emergencies'
    },
    {
      id: 'transport',
      label: 'Transport Issues',
      icon: Car,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      hoverColor: 'hover:bg-yellow-100',
      iconColor: 'text-yellow-600',
      description: 'Vehicle breakdown, public transport delays'
    },
    {
      id: 'personal',
      label: 'Personal Reasons',
      icon: User,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:bg-blue-100',
      iconColor: 'text-blue-600',
      description: 'Personal matters, mental health day'
    },
    {
      id: 'religious',
      label: 'Religious Observance',
      icon: Church,
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      hoverColor: 'hover:bg-purple-100',
      iconColor: 'text-purple-600',
      description: 'Religious holidays, observances'
    },
    {
      id: 'other',
      label: 'Other',
      icon: Edit3,
      color: 'gray',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      hoverColor: 'hover:bg-gray-100',
      iconColor: 'text-gray-600',
      description: 'Other reasons not listed'
    }
  ];

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialReason) {
        // Check if initial reason matches any predefined reason
        const matchingReason = reasonOptions.find(
          option => option.label === initialReason
        );
        
        if (matchingReason) {
          setSelectedReason(matchingReason.id);
          setCustomReason('');
          setStep('select');
        } else {
          setSelectedReason('other');
          setCustomReason(initialReason);
          setStep('custom');
        }
      } else {
        setSelectedReason('');
        setCustomReason('');
        setStep('select');
      }
      setErrors({});
    }
  }, [isOpen, initialReason]);

  const handleReasonSelect = (reasonId) => {
    const reason = reasonOptions.find(r => r.id === reasonId);
    
    if (reasonId === 'other') {
      setSelectedReason('other');
      setStep('custom');
    } else {
      setSelectedReason(reasonId);
      // Auto-save for non-other reasons
      onSave(reason.label);
    }
  };

  const handleCustomReasonSave = () => {
    if (!customReason.trim()) {
      setErrors({ customReason: 'Please enter a reason' });
      return;
    }

    if (customReason.length > 200) {
      setErrors({ customReason: 'Reason cannot exceed 200 characters' });
      return;
    }

    onSave(customReason.trim());
  };

  const handleBackToSelect = () => {
    setStep('select');
    setSelectedReason('');
    setCustomReason('');
    setErrors({});
  };

  const getReasonIcon = (reasonId) => {
    const reason = reasonOptions.find(r => r.id === reasonId);
    if (!reason) return null;
    const IconComponent = reason.icon;
    return <IconComponent className={`w-5 h-5 ${reason.iconColor}`} />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60]">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-xl bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Excused Absence Reason
              </h2>
              {studentName && (
                <p className="text-sm text-gray-600">
                  For: {studentName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'select' ? (
          /* Step 1: Select Reason Category */
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Please select a reason for the excused absence:
            </p>

            <div className="grid grid-cols-1 gap-3">
              {reasonOptions.map((reason) => {
                const IconComponent = reason.icon;
                const isSelected = selectedReason === reason.id;
                
                return (
                  <button
                    key={reason.id}
                    onClick={() => handleReasonSelect(reason.id)}
                    className={`w-full p-4 border-2 rounded-xl transition-all ${
                      isSelected
                        ? `border-${reason.color}-500 ${reason.bgColor} ring-2 ring-${reason.color}-200`
                        : `border-gray-200 ${reason.hoverColor}`
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${reason.bgColor}`}>
                        <IconComponent className={`w-6 h-6 ${reason.iconColor}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-medium text-gray-900`}>
                            {reason.label}
                          </h3>
                          {isSelected && (
                            <Check className={`w-5 h-5 text-${reason.color}-600`} />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {reason.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Custom Reason Input */
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <button
                onClick={handleBackToSelect}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Back
              </button>
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <Edit3 className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Enter custom reason
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason Details *
              </label>
              <textarea
                id="customReason"
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  if (errors.customReason) {
                    setErrors({});
                  }
                }}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.customReason ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Please provide detailed reason for the absence..."
                maxLength="200"
                autoFocus
              />
              {errors.customReason && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.customReason}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500 text-right">
                {customReason.length}/200 characters
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  Please provide enough detail to help us understand the reason for absence. 
                  This information may be shared with instructors and administrators.
                </span>
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomReasonSave}
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Reason
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Quick Tips */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span>Quick selection saves time</span>
            </div>
            <div className="flex items-center">
              <FileText className="w-3 h-3 mr-1" />
              <span>200 char limit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcusedReasonModal;