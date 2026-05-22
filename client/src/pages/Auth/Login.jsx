// src/pages/Auth/Login.jsx - WITH GRADIENT CIRCLES
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "../../stores/authStore";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import toast from "react-hot-toast";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const { login } = useAuthStore();
  const { signInWithGoogle, loading: googleLoading } = useGoogleAuth();
  const navigate = useNavigate();

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
    if (localStorage.getItem("token")) {
      navigate("/dashboard");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

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

    if (rememberMe) {
      localStorage.setItem("rememberedEmail", formData.email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

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
      console.error("Login error:", error);
      toast.error("An unexpected error occurred. Please try again.");
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
        {/* Card - Clean white with subtle shadow */}
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
              <h1 className="text-xl font-bold text-gray-800">Welcome Back</h1>
              <p className="text-gray-500 text-xs mt-0.5">Sign in to continue</p>
            </div>

            {/* Google Sign In */}
            <button
              className="w-full py-1.5 mb-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 text-sm"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || isSubmitting}
            >
              {googleLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span className="text-gray-600 text-xs">Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-400 text-[10px]">OR</span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={onFinish} className="space-y-3">
              {/* Email Field */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email ID</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-300 outline-none transition-all"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-300 outline-none transition-all"
                    placeholder="••••••"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-500"
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
                    className="w-3.5 h-3.5 text-purple-500 border-gray-300 rounded focus:ring-purple-300"
                  />
                  <span className="text-xs text-gray-600">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-purple-500 hover:text-purple-600 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting || googleLoading}
                className="w-full py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    LOGIN
                  </>
                )}
              </button>
            </form>
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

export default Login;