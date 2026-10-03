// src/pages/Auth/Login.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "../../stores/authStore";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
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

  const currentYear = new Date().getFullYear();

  const IMAGE_URL =
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80";

  const LOGO_URL = "/images/logo.png";

  /* =========================================================
     FORM VALIDATION
  ========================================================= */

  useEffect(() => {
    const { email, password } = formData;

    setIsFormValid(
      Boolean(email && password && password.length >= 6)
    );
  }, [formData]);

  /* =========================================================
     REMEMBERED EMAIL / REDIRECT
  ========================================================= */

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");

    if (savedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: savedEmail,
      }));

      setRememberMe(true);
    }

    if (localStorage.getItem("token")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  /* =========================================================
     HANDLERS
  ========================================================= */

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLogoError = () => {
    setLogoError(true);
  };

  /* =========================================================
     GOOGLE SIGN IN
  ========================================================= */

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();

    if (result.success) {
      toast.success("Signed in with Google successfully!");
      navigate("/dashboard");
    } else {
      toast.error(result.message || "Google sign-in failed");
    }
  };

  /* =========================================================
     NORMAL LOGIN
  ========================================================= */

  const onFinish = async (e) => {
    e.preventDefault();

    if (!isFormValid || isSubmitting) {
      toast.error("Please fill in all fields correctly");
      return;
    }

    if (rememberMe) {
      localStorage.setItem(
        "rememberedEmail",
        formData.email
      );
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    setIsSubmitting(true);

    try {
      const result = await login(
        formData.email,
        formData.password
      );

      if (result.success) {
        toast.success("Welcome back! Login successful.");
        navigate("/dashboard");
      } else {
        toast.error(
          result.message || "Login failed. Please try again."
        );
      }
    } catch (error) {
      toast.error(
        "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
        staggerChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.28, ease: "easeOut" },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.45, ease: "easeOut" },
    },
  };

  const formVariants = {
    hidden: { opacity: 0, x: 12 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.45,
        ease: "easeOut",
        delay: 0.04,
      },
    },
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
          MAIN LOGIN CARD
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
                "Education is the most powerful weapon which
                you can use to change the world."
              </p>

              <p className="text-[11px] text-white/70 mt-2 tracking-wide">
                — Nelson Mandela
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* ===================================================
            RIGHT LOGIN PANEL
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
                Welcome back
              </h1>

              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                Sign in to continue
              </p>
            </div>
          </motion.div>

          {/* =================================================
              GOOGLE BUTTON
          ================================================== */}

          <motion.button
            variants={itemVariants}
            type="button"
            onClick={handleGoogleSignIn}
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
              LOGIN FORM
          ================================================== */}

          <motion.form
            variants={itemVariants}
            onSubmit={onFinish}
            className="space-y-2.5"
          >
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
                  placeholder="Enter your password"
                  autoComplete="current-password"
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

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between gap-3 pt-0.5">
              <label className="flex items-center gap-1.5 cursor-pointer min-w-0">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                  className="
                    w-3 h-3
                    shrink-0
                    rounded
                    border-slate-300
                    text-indigo-600
                    focus:ring-indigo-500
                    cursor-pointer
                  "
                />

                <span className="text-[10px] sm:text-[11px] text-slate-600 whitespace-nowrap">
                  Remember me
                </span>
              </label>

              <Link
                to="/forgot-password"
                className="
                  text-[10px]
                  sm:text-[11px]
                  font-semibold
                  text-indigo-600
                  hover:text-indigo-700
                  hover:underline
                  whitespace-nowrap
                "
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In */}
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
                  <LogIn className="w-3.5 h-3.5" />
                  Sign in
                </>
              )}
            </motion.button>
          </motion.form>

          {/* =================================================
              REGISTER
          ================================================== */}

          <motion.div
            variants={itemVariants}
            className="mt-4 text-center"
          >
            <p className="text-[10px] sm:text-[11px] text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="
                  font-semibold
                  text-indigo-600
                  hover:text-indigo-700
                  hover:underline
                "
              >
                Create account
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

export default Login;