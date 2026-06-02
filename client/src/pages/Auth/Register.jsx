// src/pages/Auth/Register.jsx - REDESIGNED TO MATCH LOGIN PAGE

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '../../stores/authStore';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { Mail, Lock, Eye, EyeOff, User, UserPlus, Sparkles, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const { register } = useAuthStore();
  const { signInWithGoogle, loading: googleLoading } = useGoogleAuth();
  const navigate = useNavigate();

  // Dynamically get current year
  const currentYear = new Date().getFullYear();

  // Beautiful Unsplash image - Same as login page
  const IMAGE_URL = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80";
  const LOGO_URL = "/images/logo.png";

  // Check form validity whenever formData changes
  useEffect(() => {
    const { name, email, password, confirmPassword } = formData;
    
    const allFieldsFilled = name && email && password && confirmPassword;
    const isPasswordValid = password.length >= 6;
    const passwordsMatch = password === confirmPassword;
    
    if (password && confirmPassword && !passwordsMatch) {
      setPasswordError('Passwords do not match');
    } else if (password && !isPasswordValid) {
      setPasswordError('Password must be at least 6 characters');
    } else {
      setPasswordError('');
    }
    
    const isValid = allFieldsFilled && isPasswordValid && passwordsMatch;
    setIsFormValid(isValid);
  }, [formData]);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleGoogleSignUp = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      toast.success('Account created with Google successfully!');
      navigate('/dashboard');
    } else {
      toast.error(result.message || 'Google sign-up failed');
    }
  };

  const onFinish = async (e) => {
    e.preventDefault();
    
    if (!isFormValid || isSubmitting) {
      toast.error('Please fill in all fields correctly');
      return;
    }

    setIsSubmitting(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const result = await register(registerData);
      
      if (result.success) {
        toast.success('Account created successfully! Welcome to Serian Institute.');
        navigate('/dashboard');
      } else {
        toast.error(result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoError = () => setLogoError(true);

  // Animation variants (matching login page)
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  const imageVariants = {
    hidden: { x: -30, opacity: 0, scale: 0.98 },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const formVariants = {
    hidden: { x: 30, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut", delay: 0.15 }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      {/* Main Card Container */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden bg-white flex flex-col md:flex-row"
      >
        {/* LEFT SIDE - IMAGE with overlay text */}
        <motion.div 
          variants={imageVariants}
          className="hidden md:block md:w-1/2 relative overflow-hidden min-h-[550px]"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-black/20 to-transparent z-10"></div>
          <img 
            src={IMAGE_URL} 
            alt="Campus" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute bottom-6 left-6 right-6 z-20 text-white">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Sparkles className="w-5 h-5 mb-2 text-yellow-300" />
              <p className="text-sm font-semibold leading-tight">
                "Start your journey towards excellence today."
              </p>
              <p className="text-xs text-white/80 mt-1">Join our learning community</p>
            </motion.div>
          </div>
        </motion.div>

        {/* RIGHT SIDE - REGISTRATION FORM */}
        <motion.div 
          variants={formVariants}
          className="w-full md:w-1/2 p-5 sm:p-6 flex flex-col justify-center"
        >
          {/* Logo */}
          <motion.div variants={itemVariants} className="flex justify-center mb-3">
            {!logoError ? (
              <img
                src={LOGO_URL}
                alt="SBTC Logo"
                className="h-12 w-auto object-contain"
                onError={handleLogoError}
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-sky-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">S</span>
              </div>
            )}
          </motion.div>

          {/* Form Title */}
          <motion.div variants={itemVariants} className="text-center mb-4">
            <h1 className="text-xl font-bold text-gray-800">Create Account</h1>
            <p className="text-gray-500 text-xs mt-0.5">Join Serian Institute today</p>
          </motion.div>

          {/* Google Sign Up */}
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignUp}
            disabled={googleLoading || isSubmitting}
            className="w-full py-2 mb-3 flex items-center justify-center gap-2 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all duration-200 text-xs font-medium text-gray-700 bg-white"
          >
            {googleLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span>Continue with Google</span>
          </motion.button>

          {/* Divider */}
          <motion.div variants={itemVariants} className="relative my-3">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-[10px]"><span className="px-2 bg-white text-gray-400">OR</span></div>
          </motion.div>

          {/* Registration Form */}
          <motion.form variants={itemVariants} onSubmit={onFinish} className="space-y-3">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">I am a</label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none appearance-none bg-white"
                >
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Administrator</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                  placeholder="Create password (min. 6 characters)"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-xs text-red-600">{passwordError}</p>
              )}
            </div>

            {/* Register Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!isFormValid || isSubmitting || googleLoading}
              className="w-full py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <><UserPlus className="w-3.5 h-3.5" /> Create Account</>
              )}
            </motion.button>
          </motion.form>

          {/* Login Link */}
          <motion.div variants={itemVariants} className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>

          {/* Footer with Dynamic Year */}
          <motion.p variants={itemVariants} className="text-center text-[10px] text-gray-400 mt-5">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;