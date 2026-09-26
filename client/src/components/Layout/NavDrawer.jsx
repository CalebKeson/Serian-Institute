// src/components/Layout/NavDrawer.jsx
// Right-side sliding drawer with a wave-like staggered entrance for the links.

import React from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, ArrowRight } from 'lucide-react';

const NavDrawer = ({ isOpen, onClose }) => {
  // ============================================================
  // Navigation structure
  // ============================================================
  const primaryLinks = [
    { name: 'Home', href: '/' },
  ];

  const groups = [
    {
      title: 'About Us',
      links: [
        { name: 'Overview', href: '/about' },
        { name: "Chairman's Message", href: '/about/chairman-message' },
        { name: "Principal's Message", href: '/about/principal-message' },
        { name: 'TVETA Accreditation', href: '/about/tveta-accreditation' },
        { name: 'Leadership', href: '/about/leadership' },
        { name: 'Campus & Facilities', href: '/about/campus-facilities' },
      ],
    },
    {
      title: 'Academic Departments',
      links: [
        { name: 'SBTC School of Computing & ICT', href: '/departments/computing-ict' },
        { name: 'SBTC School of Business', href: '/departments/business' },
        { name: 'SBTC School of Engineering', href: '/departments/engineering' },
        { name: 'SBTC School of Hospitality', href: '/departments/hospitality' },
        { name: 'SBTC School of Health', href: '/departments/health' },
        { name: 'SBTC School of Driving', href: '/departments/driving' },
      ],
    },
    {
      title: 'Admissions',
      links: [
        { name: 'Entry Requirements', href: '/admissions/entry-requirements' },
        { name: 'Fees Guidelines & Structure', href: '/admissions/fees-guidelines' },
        { name: 'How to Apply', href: '/admissions/how-to-apply' },
        { name: 'Online Enrollment Form', href: '/admissions/enroll' },
      ],
    },
  ];

  const standaloneLinks = [
    { name: 'E-Learning', href: '/e-learning' },
    { name: 'Contact Us', href: '/contact' },
  ];

  // ============================================================
  // Animation variants
  // ============================================================

  // Body orchestrator — controls the wave timing
  const bodyVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.09,   // 90ms between each block — visible wave
        delayChildren: 0.2,      // wait for drawer to mostly arrive
      },
    },
  };

  // Each animated block — longer, more graceful motion
  const itemVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  // Header — slightly faster, anchors the eye
  const headerVariants = {
    hidden: { opacity: 0, y: -8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ============ Overlay ============ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px]"
          />

          {/* ============ Drawer Panel ============ */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 right-0 z-[70] h-full w-full max-w-sm bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={headerVariants}
              className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0"
            >
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900 truncate">
                  Menu
                </h2>
                <p className="text-xs text-gray-500 truncate">
                  Serian Business and Technology College
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>

            {/* Scrollable Body — orchestrates the wave */}
            <motion.nav
              initial="hidden"
              animate="visible"
              variants={bodyVariants}
              className="flex-1 overflow-y-auto px-3 py-4"
            >
              {/* ============ Home ============ */}
              <motion.ul variants={itemVariants} className="space-y-1">
                {primaryLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      onClick={onClose}
                      className="block px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide text-gray-900 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </motion.ul>

              {/* ============ Groups ============ */}
              {groups.map((group, groupIndex) => (
                <motion.div key={group.title} variants={itemVariants}>
                  <div
                    className={`border-t border-gray-100 ${
                      groupIndex === 0 ? 'mt-3' : 'mt-5'
                    } mb-2`}
                  />

                  <p className="px-4 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    {group.title}
                  </p>

                  <ul className="space-y-0.5">
                    {group.links.map((link) => (
                      <li key={link.name}>
                        <Link
                          to={link.href}
                          onClick={onClose}
                          className="flex items-start gap-2.5 px-4 py-2 rounded-lg text-sm text-gray-700 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                        >
                          <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-purple-300 flex-shrink-0" />
                          <span className="leading-snug">{link.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}

              {/* ============ Standalone links ============ */}
              <motion.div variants={itemVariants}>
                <div className="border-t border-gray-100 mt-5 mb-2" />
                <ul className="space-y-1">
                  {standaloneLinks.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        onClick={onClose}
                        className="block px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide text-gray-900 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* ============ Footer CTAs ============ */}
              <motion.div
                variants={itemVariants}
                className="border-t border-gray-100 mt-5 pt-5 space-y-2.5 pb-2"
              >
                <Link
                  to="/admissions"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/login"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-purple-200 text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-50 transition-all duration-200"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              </motion.div>
            </motion.nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default NavDrawer;