import React, { useState } from 'react';
import { Link } from 'react-router';
import { useAuthStore } from '../../stores/authStore';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [logoError, setLogoError] = useState(false);
  
  const { requestPasswordReset } = useAuthStore();

  const LOGO_URL = "/images/logo.png";

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await requestPasswordReset(email);
      
      if (result.success) {
        toast.success(result.message);
        setEmailSent(true);
      } else {
        toast.error(result.message || 'Failed to send reset email');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoError = () => setLogoError(true);

  return (
    <div className="min-h-screen flex items-center justify-center p-3 bg-gray-50 relative overflow-hidden">
      {/* Large Gradient Circles Behind Form */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large Circle Top Left */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-purple-400/30 via-purple-500/20 to-transparent blur-3xl"></div>
        
        {/* Medium Circle Top Right */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-bl from-blue-400/30 via-blue-500/20 to-transparent blur-3xl"></div>
        
        {/* Large Circle Bottom Right */}
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-purple-500/20 via-blue-400/20 to-transparent blur-3xl"></div>
        
        {/* Small Circle Bottom Left */}
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-gradient-to-tr from-blue-500/20 via-purple-400/20 to-transparent blur-3xl"></div>
        
        {/* Center Subtle Glow */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-purple-300/10 via-blue-300/10 to-transparent blur-3xl"></div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-sm relative z-10">
        {/* Card */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-0.5 bg-gradient-to-r from-purple-400 via-purple-500 to-blue-500"></div>
          
          <div className="p-5">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              {!logoError ? (
                <img
                  src={LOGO_URL}
                  alt="SBTC Logo"
                  className="h-10 w-auto object-contain"
                  onError={handleLogoError}
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-base">S</span>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-gray-800">Reset Password</h1>
              <p className="text-gray-500 text-xs mt-0.5">
                {!emailSent ? 'Enter your email to receive a reset link' : 'Check your email'}
              </p>
            </div>

            {!emailSent ? (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-300 outline-none transition-all"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            ) : (
              /* Success Message */
              <div className="text-center space-y-3">
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex justify-center mb-2">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-green-800">Check Your Email</h3>
                  <p className="text-xs text-green-700 mt-1">
                    We've sent a reset link to <strong className="block mt-1 truncate">{email}</strong>
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    The link expires in <strong>5 minutes</strong>
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEmailSent(false);
                    handleSubmit(new Event('submit'));
                  }}
                  className="text-xs text-purple-500 hover:text-purple-600 font-medium"
                >
                  Click to resend
                </button>
              </div>
            )}

            {/* Back to Login Link */}
            <div className="mt-4 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs text-purple-500 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-400 mt-4">
          © 2026 Serian Institute. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;