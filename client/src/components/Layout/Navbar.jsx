// src/components/Layout/Navbar.jsx - BRAND-FORWARD NAVBAR WITH DRAWER + SEARCH

import React, { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Menu, Search } from 'lucide-react';
import NavDrawer from './NavDrawer';

const Navbar = ({ scrolled = false }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Animation variants
  const navbarVariants = {
    initial: { y: -100, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <>
      <motion.nav
        initial="initial"
        animate="animate"
        variants={navbarVariants}
        className={`fixed left-0 right-0 z-40 w-full transition-all duration-300 ${
          scrolled ? 'top-0' : 'top-11 md:top-12'
        } ${
          scrolled
            ? 'bg-white/98 backdrop-blur-sm shadow-md'
            : 'bg-purple-50/95 backdrop-blur-sm border-b border-purple-100/50'
        }`}
      >
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 md:h-24 gap-4">

            {/* ============ LEFT: Logo + Institution Name ============ */}
            <Link
              to="/"
              className="flex items-center gap-3 min-w-0 flex-shrink"
            >
              {/* Logo */}
              <motion.img
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                src="/images/logo.png"
                alt="Serian Business and Technology College"
                className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 object-contain flex-shrink-0"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.nextSibling;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              {/* Fallback badge if logo fails */}
              <span
                style={{ display: 'none' }}
                className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-xl bg-gradient-to-r from-purple-700 to-blue-800 items-center justify-center text-white font-bold text-lg flex-shrink-0"
              >
                SI
              </span>

              {/* Institution Text — hidden on mobile, shown from md up */}
              <div className="hidden md:flex flex-col min-w-0 leading-tight">
                <span className="text-sm lg:text-base font-bold text-gray-900 truncate">
                  Serian Business and Technology College
                </span>
                <span className="text-[11px] lg:text-xs text-gray-500 truncate mt-0.5">
                  TVETA Registered · Tuala, Ongata-Rongai
                </span>
              </div>
            </Link>

            {/* ============ RIGHT: Search + Drawer Toggle ============ */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

              {/* Search Box — full input on md+, icon-only button on mobile */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    className="w-40 lg:w-56 xl:w-64 pl-9 pr-3 py-2 text-sm bg-gray-100/80 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-purple-400 rounded-full outline-none focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Mobile search icon-only button */}
              <button
                type="button"
                aria-label="Search"
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-purple-700 hover:bg-purple-100 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Drawer Toggle */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                className="p-2 sm:p-2.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ============ Drawer ============ */}
      <NavDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};

export default Navbar;