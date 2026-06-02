// src/pages/Auth/Login.jsx - WITH REGISTRATION LINK

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "../../stores/authStore";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const { login } = useAuthStore();
  const { signInWithGoogle, loading: googleLoading } = useGoogleAuth();
  const navigate = useNavigate();

  // Dynamically get current year
  const currentYear = new Date().getFullYear();

  // Beautiful Unsplash image - Modern campus/library with natural light
  const IMAGE_URL = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80";
  const LOGO_URL = "/images/logo.png";

  useEffect(() => {
    const { email, password } = formData;
    setIsFormValid(email && password && password.length >= 6);
  }, [formData]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
    if (localStorage.getItem("token")) navigate("/dashboard");
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      toast.success("Signed in with Google successfully!");
      navigate("/dashboard");
    } else {
      toast.error(result.message || "Google sign-in failed");
    }
  };

  const onFinish = async (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) {
      toast.error("Please fill in all fields correctly");
      return;
    }

    if (rememberMe) localStorage.setItem("rememberedEmail", formData.email);
    else localStorage.removeItem("rememberedEmail");

    setIsSubmitting(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        toast.success("Welcome back! Login successful.");
        navigate("/dashboard");
      } else {
        toast.error(result.message || "Login failed. Please try again.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoError = () => setLogoError(true);

  // Animation variants
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
          className="hidden md:block md:w-1/2 relative overflow-hidden min-h-[480px]"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-black/20 to-transparent z-10"></div>
          <img 
            src={IMAGE_URL} 
            alt="Campus" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
          {/* Inspirational Quote Overlay */}
          <div className="absolute bottom-6 left-6 right-6 z-20 text-white">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Sparkles className="w-5 h-5 mb-2 text-yellow-300" />
              <p className="text-sm font-semibold leading-tight">
                "Education is the most powerful weapon which you can use to change the world."
              </p>
              <p className="text-xs text-white/80 mt-1">— Nelson Mandela</p>
            </motion.div>
          </div>
        </motion.div>

        {/* RIGHT SIDE - LOGIN FORM */}
        <motion.div 
          variants={formVariants}
          className="w-full md:w-1/2 p-5 sm:p-6 flex flex-col justify-center"
        >
          {/* Logo */}
          <motion.div variants={itemVariants} className="flex justify-center mb-4">
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
            <h1 className="text-xl font-bold text-gray-800">Welcome back</h1>
            <p className="text-gray-500 text-xs mt-0.5">Sign in to your account</p>
          </motion.div>

          {/* Google Sign In */}
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
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

          {/* Login Form */}
          <motion.form variants={itemVariants} onSubmit={onFinish} className="space-y-3">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Email address</label>
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

            {/* Password Field */}
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
                  placeholder="Enter your password"
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-xs text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
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
                <><LogIn className="w-3.5 h-3.5" /> Sign in</>
              )}
            </motion.button>
          </motion.form>

          {/* Register Link - ADDED */}
          <motion.div variants={itemVariants} className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
                Create account
              </Link>
            </p>
          </motion.div>

          {/* Footer with Dynamic Year */}
          <motion.p variants={itemVariants} className="text-center text-[10px] text-gray-400 mt-5">
            © {currentYear} Serian Institute. All rights reserved.
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;