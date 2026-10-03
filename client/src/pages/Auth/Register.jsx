// src/pages/Auth/Register.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '../../stores/authStore';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { Mail, Lock, Eye, EyeOff, User, UserPlus, Sparkles } from 'lucide-react';
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

  const currentYear = new Date().getFullYear();
  const IMAGE_URL = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80";
  const LOGO_URL = "/images/logo.png";

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

  /* =========================================================
     ANIMATIONS
  ========================================================= */

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        when: "beforeChildren",
        staggerChildren: 0.04
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.28, ease: "easeOut" }
    }
  };

  const imageVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.45, ease: "easeOut" }
    }
  };

  const formVariants = {
    hidden: { opacity: 0, x: 12 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.45, ease: "easeOut", delay: 0.04 }
    }
  };

  return (
    <div
      className="
        min-h-[100dvh]
        w-full
        bg-gradient-to-br
        from-slate-50
        via-gray-50
        to-zinc-100
        flex
        items-start
        justify-center
        px-3
        sm:px-4
        pt-[116px]
        md:pt-[132px]
        pb-4
        md:pb-6
      "
    >
      {/* =====================================================
          MAIN REGISTER CARD
      ====================================================== */}

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="
          w-full
          max-w-3xl
          bg-white
          rounded-2xl
          shadow-xl
          shadow-slate-300/40
          overflow-hidden
          flex
          flex-col
          md:flex-row
          border
          border-white/60
          max-h-[calc(100dvh-132px)]
          md:max-h-[calc(100dvh-152px)]
        "
      >
        {/* ===================================================
            LEFT IMAGE PANEL (desktop only)
        ==================================================== */}

        <motion.div
          variants={imageVariants}
          className="
            hidden
            md:flex
            md:w-1/2
            relative
            overflow-hidden
            min-h-0
            self-stretch
          "
        >
          <img
            src={IMAGE_URL}
            alt="Serian Business and Technology College Campus"
            className="
              absolute
              inset-0
              w-full
              h-full
              object-cover
              transition-transform
              duration-700
              hover:scale-105
            "
          />

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-t
              from-black/80
              via-black/30
              to-black/10
            "
          />

          {/* Top brand tag */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5">
            <div
              className="
                w-7 h-7
                bg-white/15
                backdrop-blur-md
                rounded-md
                flex items-center justify-center
                border border-white/20
              "
            >
              <span className="text-white font-bold text-xs">
                S
              </span>
            </div>
            <span className="text-white text-[11px] font-semibold tracking-wide">
              SBTC
            </span>
          </div>

          {/* Inspirational Quote */}
          <div
            className="
              absolute
              left-5
              right-5
              bottom-5
              z-10
              text-white
            "
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <Sparkles className="w-4 h-4 mb-2 text-amber-300" />

              <p className="text-sm lg:text-[15px] font-semibold leading-snug max-w-[280px]">
                "Start your journey towards excellence today."
              </p>

              <p className="text-[11px] text-white/70 mt-2 tracking-wide">
                — Join our learning community
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* ===================================================
            RIGHT REGISTER PANEL
        ==================================================== */}

        <motion.div
          variants={formVariants}
          className="
            w-full
            md:w-1/2
            flex
            flex-col
            justify-start
            overflow-y-auto
            px-5
            py-5
            sm:px-7
            sm:py-6
            md:px-7
            md:py-6
            lg:px-9
          "
        >
          {/* =================================================
              LOGO + WELCOME HEADER
          ================================================== */}

          <motion.div
            variants={itemVariants}
            className="
              flex
              items-center
              justify-between
              gap-3
              mb-4
            "
          >
            <div className="shrink-0">
              {!logoError ? (
                <img
                  src={LOGO_URL}
                  alt="SBTC Logo"
                  className="
                    h-9
                    sm:h-10
                    w-auto
                    object-contain
                  "
                  onError={handleLogoError}
                />
              ) : (
                <div
                  className="
                    w-10 h-10
                    bg-gradient-to-br
                    from-indigo-500
                    to-sky-500
                    rounded-lg
                    flex items-center justify-center
                    shadow-sm
                    shadow-indigo-200
                  "
                >
                  <span className="text-white font-bold text-base">
                    S
                  </span>
                </div>
              )}
            </div>

            <div className="text-right min-w-0">
              <h1
                className="
                  text-base
                  sm:text-lg
                  font-bold
                  text-slate-800
                  leading-tight
                  tracking-tight
                "
              >
                Create account
              </h1>

              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                Join Serian Institute today
              </p>
            </div>
          </motion.div>

          {/* =================================================
              GOOGLE BUTTON
          ================================================== */}

          <motion.button
            variants={itemVariants}
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || isSubmitting}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            className="
              w-full
              h-9
              flex
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-slate-200
              bg-white
              text-slate-700
              text-[11px]
              sm:text-xs
              font-medium
              shadow-sm
              hover:border-slate-300
              hover:bg-slate-50
              transition-all
              duration-200
              disabled:opacity-60
              disabled:cursor-not-allowed
            "
          >
            {googleLoading ? (
              <div
                className="
                  w-3.5 h-3.5
                  border-2
                  border-indigo-500
                  border-t-transparent
                  rounded-full
                  animate-spin
                "
              />
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
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

            <span>
              {googleLoading
                ? "Connecting..."
                : "Continue with Google"}
            </span>
          </motion.button>

          {/* =================================================
              DIVIDER
          ================================================== */}

          <motion.div
            variants={itemVariants}
            className="relative flex items-center my-3"
          >
            <div className="flex-1 border-t border-slate-200" />

            <span
              className="
                px-2.5
                text-[9px]
                font-semibold
                tracking-widest
                text-slate-400
              "
            >
              OR
            </span>

            <div className="flex-1 border-t border-slate-200" />
          </motion.div>

          {/* =================================================
              REGISTRATION FORM
          ================================================== */}

          <motion.form
            variants={itemVariants}
            onSubmit={onFinish}
            className="space-y-2.5"
          >
            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="
                  block
                  text-[10px]
                  sm:text-[11px]
                  font-semibold
                  text-slate-700
                  mb-1
                "
              >
                Full Name
              </label>

              <div className="relative">
                <User
                  className="
                    absolute
                    left-2.5
                    top-1/2
                    -translate-y-1/2
                    w-3.5 h-3.5
                    text-slate-400
                    pointer-events-none
                  "
                />

                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  autoComplete="name"
                  required
                  className="
                    w-full
                    h-9
                    pl-8
                    pr-3
                    text-xs
                    text-slate-800
                    bg-slate-50
                    border
                    border-slate-200
                    rounded-lg
                    outline-none
                    placeholder:text-slate-400
                    placeholder:text-[11px]
                    focus:bg-white
                    focus:ring-2
                    focus:ring-indigo-400/25
                    focus:border-indigo-400
                    transition-all
                    duration-150
                  "
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="
                  block
                  text-[10px]
                  sm:text-[11px]
                  font-semibold
                  text-slate-700
                  mb-1
                "
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  className="
                    absolute
                    left-2.5
                    top-1/2
                    -translate-y-1/2
                    w-3.5 h-3.5
                    text-slate-400
                    pointer-events-none
                  "
                />

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="
                    w-full
                    h-9
                    pl-8
                    pr-3
                    text-xs
                    text-slate-800
                    bg-slate-50
                    border
                    border-slate-200
                    rounded-lg
                    outline-none
                    placeholder:text-slate-400
                    placeholder:text-[11px]
                    focus:bg-white
                    focus:ring-2
                    focus:ring-indigo-400/25
                    focus:border-indigo-400
                    transition-all
                    duration-150
                  "
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="role"
                className="
                  block
                  text-[10px]
                  sm:text-[11px]
                  font-semibold
                  text-slate-700
                  mb-1
                "
              >
                I am a
              </label>

              <div className="relative">
                <UserPlus
                  className="
                    absolute
                    left-2.5
                    top-1/2
                    -translate-y-1/2
                    w-3.5 h-3.5
                    text-slate-400
                    pointer-events-none
                  "
                />

                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="
                    w-full
                    h-9
                    pl-8
                    pr-8
                    text-xs
                    text-slate-800
                    bg-slate-50
                    border
                    border-slate-200
                    rounded-lg
                    outline-none
                    focus:bg-white
                    focus:ring-2
                    focus:ring-indigo-400/25
                    focus:border-indigo-400
                    transition-all
                    duration-150
                    appearance-none
                    cursor-pointer
                  "
                >
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Administrator</option>
                </select>

                <div
                  className="
                    absolute
                    right-2.5
                    top-1/2
                    -translate-y-1/2
                    pointer-events-none
                  "
                >
                  <svg
                    className="w-3.5 h-3.5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="
                  block
                  text-[10px]
                  sm:text-[11px]
                  font-semibold
                  text-slate-700
                  mb-1
                "
              >
                Password
              </label>

              <div className="relative">
                <Lock
                  className="
                    absolute
                    left-2.5
                    top-1/2
                    -translate-y-1/2
                    w-3.5 h-3.5
                    text-slate-400
                    pointer-events-none
                  "
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  className="
                    w-full
                    h-9
                    pl-8
                    pr-9
                    text-xs
                    text-slate-800
                    bg-slate-50
                    border
                    border-slate-200
                    rounded-lg
                    outline-none
                    placeholder:text-slate-400
                    placeholder:text-[11px]
                    focus:bg-white
                    focus:ring-2
                    focus:ring-indigo-400/25
                    focus:border-indigo-400
                    transition-all
                    duration-150
                  "
                />

                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="
                    absolute
                    right-2.5
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    hover:text-indigo-500
                    transition-colors
                  "
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="
                  block
                  text-[10px]
                  sm:text-[11px]
                  font-semibold
                  text-slate-700
                  mb-1
                "
              >
                Confirm Password
              </label>

              <div className="relative">
                <Lock
                  className="
                    absolute
                    left-2.5
                    top-1/2
                    -translate-y-1/2
                    w-3.5 h-3.5
                    text-slate-400
                    pointer-events-none
                  "
                />

                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                  className="
                    w-full
                    h-9
                    pl-8
                    pr-9
                    text-xs
                    text-slate-800
                    bg-slate-50
                    border
                    border-slate-200
                    rounded-lg
                    outline-none
                    placeholder:text-slate-400
                    placeholder:text-[11px]
                    focus:bg-white
                    focus:ring-2
                    focus:ring-indigo-400/25
                    focus:border-indigo-400
                    transition-all
                    duration-150
                  "
                />

                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="
                    absolute
                    right-2.5
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    hover:text-indigo-500
                    transition-colors
                  "
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {passwordError && (
                <p className="mt-1 text-[10px] text-red-600">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Create Account */}
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={
                !isFormValid ||
                isSubmitting ||
                googleLoading
              }
              className="
                w-full
                h-9
                flex
                items-center
                justify-center
                gap-1.5
                rounded-lg
                bg-gradient-to-r
                from-indigo-600
                to-sky-600
                hover:from-indigo-700
                hover:to-sky-700
                text-white
                text-xs
                font-semibold
                shadow-md
                shadow-indigo-200
                hover:shadow-lg
                hover:shadow-indigo-300
                transition-all
                duration-200
                disabled:opacity-50
                disabled:cursor-not-allowed
                disabled:shadow-none
              "
            >
              {isSubmitting ? (
                <div
                  className="
                    w-3.5 h-3.5
                    border-2
                    border-white
                    border-t-transparent
                    rounded-full
                    animate-spin
                  "
                />
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Create account
                </>
              )}
            </motion.button>
          </motion.form>

          {/* =================================================
              LOGIN LINK
          ================================================== */}

          <motion.div
            variants={itemVariants}
            className="mt-4 text-center"
          >
            <p className="text-[10px] sm:text-[11px] text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="
                  font-semibold
                  text-indigo-600
                  hover:text-indigo-700
                  hover:underline
                "
              >
                Sign in
              </Link>
            </p>
          </motion.div>

          {/* =================================================
              FOOTER
          ================================================== */}

          <motion.p
            variants={itemVariants}
            className="
              text-center
              text-[9px]
              text-slate-400
              mt-3
            "
          >
            © {currentYear} Serian Business and Technology College.
            All rights reserved.
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;