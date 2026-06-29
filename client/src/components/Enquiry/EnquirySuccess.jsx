// components/Enquiry/EnquirySuccess.jsx - COMPLETE NEW FILE

import React from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle, Mail, Phone, Clock, Home, ArrowRight } from 'lucide-react';

const EnquirySuccess = ({ enquiryData = null, onReset = null }) => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    if (onReset) {
      onReset();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      {/* Success Icon */}
      <div className="text-center">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Enquiry Submitted!</h2>
        <p className="mt-2 text-gray-600">
          Thank you for reaching out to Serian Institute.
        </p>
      </div>

      {/* What Happens Next */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">What happens next?</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Check Your Email</p>
              <p className="text-sm text-gray-500">
                We'll send a confirmation email to your inbox shortly.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Phone className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">We'll Call You</p>
              <p className="text-sm text-gray-500">
                Our team will contact you within 24 hours via your preferred method.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Quick Response</p>
              <p className="text-sm text-gray-500">
                We aim to respond to all enquiries within 24-48 hours.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry Summary (if data provided) */}
      {enquiryData && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Enquiry Summary
          </h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-gray-500">Name:</span>{' '}
              <span className="font-medium text-gray-900">{enquiryData.visitorName}</span>
            </p>
            <p>
              <span className="text-gray-500">Email:</span>{' '}
              <span className="font-medium text-gray-900">{enquiryData.visitorEmail}</span>
            </p>
            <p>
              <span className="text-gray-500">Phone:</span>{' '}
              <span className="font-medium text-gray-900">{enquiryData.visitorPhone}</span>
            </p>
            <p>
              <span className="text-gray-500">Type:</span>{' '}
              <span className="font-medium text-gray-900">{enquiryData.enquiryTypeDisplay || enquiryData.enquiryType}</span>
            </p>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleBackToHome}
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </button>
        <button
          onClick={() => window.location.reload()}
          className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          Submit Another
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default EnquirySuccess;