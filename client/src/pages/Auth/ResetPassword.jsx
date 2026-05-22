import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAuthStore } from '../../stores/authStore';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [logoError, setLogoError] = useState(false);
  
  const { validateResetToken, resetPassword } = useAuthStore();

  const LOGO_URL = "/images/logo.png";

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast.error('Invalid reset link');
        navigate('/forgot-password');
        return;
      }

      try {
        const result = await validateResetToken(token);
        if (result.success) {
          setIsValidToken(true);
          setEmail(result.data.email);
        } else {
          toast.error('Invalid or expired reset link');
          navigate('/forgot-password');
        }
      } catch (error) {
        toast.error('Unable to validate reset link');
        navigate('/forgot-password');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { password, confirmPassword } = formData;
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await resetPassword(token, password);
      
      if (result.success) {
        toast.success(result.message);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(result.message || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoError = () => setLogoError(true);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return null;
  }

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
              <h1 className="text-xl font-bold text-gray-800">Create New Password</h1>
              <p className="text-gray-500 text-xs mt-0.5">
                For: <span className="font-medium text-purple-600">{email}</span>
              </p>
              <p className="text-[10px] text-amber-600 mt-1">
                ⚠️ Link expires in 5 minutes
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* New Password Field */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-300 outline-none transition-all"
                    placeholder="••••••"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-500"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {formData.password && formData.password.length < 6 && (
                  <p className="mt-1 text-[10px] text-red-500">Must be at least 6 characters</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-300 outline-none transition-all"
                    placeholder="••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-500"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-[10px] text-red-500">Passwords do not match</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 mt-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

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

export default ResetPassword;