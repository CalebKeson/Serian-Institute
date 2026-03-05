// src/pages/Auth/Login.jsx - Updated with Google Auth
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "../../stores/authStore";
import { useGoogleAuth } from "../../hooks/useGoogleAuth"; // Import the hook
import toast from "react-hot-toast";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuthStore();
  const { signInWithGoogle, loading: googleLoading } = useGoogleAuth(); // Use the hook
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
        {/* Serian Institute Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-2 w-full transition-all duration-500 hover:h-3"></div>

        <div className="px-10 py-10">
          <div className="text-center mb-8">
            <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">SI</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 transition-all duration-300 hover:text-blue-600">
              Welcome to Serian Institute
            </h1>
            <p className="text-gray-500 mt-2 transition-all duration-300 hover:text-gray-700">
              Sign in to your account to continue
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            className="flex items-center justify-center gap-3 w-full py-3.5 mb-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || isSubmitting}
          >
            {googleLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                className="transition-transform duration-300 hover:scale-110"
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
            <span className="text-gray-700 font-medium transition-all duration-300 hover:text-blue-600">
              {googleLoading ? "Signing in with Google..." : "Sign in with Google"}
            </span>
          </button>

          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-gray-200 w-full transition-all duration-300 hover:border-gray-300"></div>
            <span className="bg-white px-3 text-gray-500 text-sm transition-all duration-300 hover:text-blue-600 hover:scale-110">
              OR
            </span>
            <div className="border-t border-gray-200 w-full transition-all duration-300 hover:border-gray-300"></div>
          </div>

          {/* Rest of the form remains the same */}
          <form onSubmit={onFinish} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400 transition-all duration-300 hover:text-blue-600 hover:scale-110"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400 transition-all duration-300 hover:text-blue-600 hover:scale-110"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400"
                  placeholder="Enter your password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-all duration-300 hover:scale-110"
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {formData.password && formData.password.length < 6 && (
                <p className="mt-1 text-sm text-red-600">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-blue-600 text-sm font-medium hover:underline transition-all duration-300"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting || googleLoading}
              className="w-full h-12 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Login
                </>
              )}
            </button>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <span className="text-gray-500 transition-all duration-300 hover:text-gray-700">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-blue-600 font-semibold hover:underline transition-all duration-300 hover:text-blue-700"
                >
                  Register
                </Link>
              </span>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 py-4 px-8 text-center transition-all duration-300 hover:bg-gray-100">
          <p className="text-xs text-gray-500 transition-all duration-300 hover:text-gray-700">
            © 2026 Serian Institute. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;