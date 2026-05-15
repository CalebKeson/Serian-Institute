// src/pages/Auth/Login.jsx - WITH FOOTER TEXT
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
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const { login } = useAuthStore();
  const { signInWithGoogle, loading: googleLoading } = useGoogleAuth();
  const navigate = useNavigate();

  // Serian Institute Logo URL
  const LOGO_URL = "https://serianinstitute.ac.ke/wp-content/uploads/2025/02/Picture2-removebg-preview.png";

  // Check form validity whenever formData changes
  useEffect(() => {
    const { email, password } = formData;
    const isValid = email && password && password.length >= 6;
    setIsFormValid(isValid);
  }, [formData]);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

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

  const handleLogoError = () => {
    setLogoError(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md overflow-hidden">
        {/* Top bar */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-1 w-full"></div>

        <div className="px-5 py-5">
          {/* Logo and Title - With Serian Institute Logo */}
          <div className="text-center mb-4">
            {/* Logo Image with Fallback */}
            <div className="mx-auto mb-3">
              {!logoError ? (
                <img
                  src={LOGO_URL}
                  alt="Serian Institute Logo"
                  className="h-16 w-auto mx-auto object-contain"
                  onError={handleLogoError}
                />
              ) : (
                /* Fallback to text logo if image fails to load */
                <div className="mx-auto h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SI</span>
                </div>
              )}
            </div>
            <h1 className="text-lg font-bold text-gray-800">
              Welcome Back
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Sign in to continue
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            className="flex items-center justify-center gap-2 w-full py-2 mb-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || isSubmitting}
          >
            {googleLoading ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-600"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span className="text-gray-700 text-xs font-medium">
              {googleLoading ? "Signing in..." : "Login with Google"}
            </span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-4">
            <div className="border-t border-gray-200 w-full"></div>
            <span className="bg-white px-2 text-gray-400 text-xs">
              OR
            </span>
            <div className="border-t border-gray-200 w-full"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={onFinish} className="space-y-3">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-8 pr-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Lock className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              {formData.password && formData.password.length < 6 && (
                <p className="mt-1 text-xs text-red-600">
                  Min. 6 characters
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-blue-600 text-xs hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting || googleLoading}
              className="w-full h-8 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </>
              )}
            </button>

            {/* Register Link */}
            <div className="text-center pt-1">
              <span className="text-xs text-gray-500">
                New here?{" "}
                <Link
                  to="/register"
                  className="text-blue-600 font-medium hover:underline"
                >
                  Create account
                </Link>
              </span>
            </div>
          </form>
        </div>

        {/* Footer - Copyright */}
        <div className="border-t border-gray-100 px-5 py-3">
          <p className="text-center text-xs text-gray-400">
            © 2026 Serian Institute. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;