// src/components/Layout/TopBar.jsx
// Top utility bar shown above the navbar on all public pages.
// Slides up out of view when the user scrolls down, letting the navbar stick to the top.

import React from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Phone, Mail, LogIn, ArrowRight } from 'lucide-react';

const TopBar = ({ scrolled = false }) => {
  return (
    <motion.div
      initial={false}
      animate={{
        y: scrolled ? '-100%' : '0%',
      }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 h-11 md:h-12 bg-gradient-to-r from-purple-800 via-purple-700 to-blue-900 text-white"
    >
      <div className="w-full max-w-[1440px] mx-auto h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full gap-2">

          {/* ============ LEFT — Contact Info ============ */}
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            {/* Phone */}
            <a
              href="tel:+254116882211"
              className="flex items-center gap-2 text-xs sm:text-sm font-medium text-white/90 hover:text-white transition-colors whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>0116882211</span>
            </a>

            {/* Divider (hidden on very small screens) */}
            <span className="hidden sm:block w-px h-4 bg-white/25" />

            {/* Email (hidden below sm to avoid crowding) */}
            <a
              href="mailto:info@serianinstitute.ac.ke"
              className="hidden sm:flex items-center gap-2 text-xs sm:text-sm font-medium text-white/90 hover:text-white transition-colors min-w-0"
            >
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">info@serianinstitute.ac.ke</span>
            </a>
          </div>

          {/* ============ RIGHT — Actions ============ */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Apply Now */}
            <Link
              to="/admissions"
              className="group flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-xs sm:text-sm font-semibold text-white transition-all duration-200"
            >
              <span className="hidden xs:inline sm:inline">Apply Now</span>
              <span className="xs:hidden sm:hidden">Apply</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Login */}
            <Link
              to="/login"
              className="group flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-white text-purple-800 hover:bg-purple-50 text-xs sm:text-sm font-semibold transition-all duration-200"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TopBar;