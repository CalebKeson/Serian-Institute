// src/components/Layout/Navbar.jsx - UPDATED WITH LARGER LOGO & BETTER BACKGROUND

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  GraduationCap,
  Home,
  Info,
  Building2,
  DollarSign,
  Phone,
  LogIn,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Users,
  Award,
  Calendar,
  Mail,
  Monitor,
  Laptop
} from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Close mobile menu on route change
  const handleNavClick = () => {
    setIsOpen(false);
    setActiveDropdown(null);
  };

  // Toggle dropdown on click
  const toggleDropdown = (name) => {
    if (activeDropdown === name) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(name);
    }
  };

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { 
      name: 'About Us', 
      href: '/about', 
      icon: Info,
      subItems: [
        { name: 'Our Story', href: '/about#story' },
        { name: 'Mission & Vision', href: '/about#mission' },
        { name: 'Leadership', href: '/about#leadership' },
      ]
    },
    { 
      name: 'Departments', 
      href: '/departments', 
      icon: Building2,
      subItems: [
        { name: 'CNA Program', href: '/departments#cna' },
        { name: 'Driving School', href: '/departments#driving' },
        { name: 'Technical Courses', href: '/departments#technical' },
        { name: 'Computer Packages', href: '/departments#computer' },
      ]
    },
    { name: 'E-Learning', href: '/e-learning', icon: Monitor },
    { name: 'Fee Structure', href: '/fees-structure', icon: DollarSign },
    { name: 'Contact Us', href: '/contact', icon: Phone },
  ];

  // Animation variants
  const navbarVariants = {
    initial: { 
      y: -100,
      opacity: 0
    },
    animate: { 
      y: 0,
      opacity: 1,
      transition: { 
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    scroll: {
      y: 0,
      backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(237, 233, 254, 0.95)',
      boxShadow: scrolled ? '0 4px 30px rgba(0, 0, 0, 0.08)' : '0 2px 20px rgba(139, 92, 246, 0.08)',
      transition: { duration: 0.3 }
    }
  };

  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
    },
    open: {
      opacity: 1,
      height: 'auto',
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const dropdownVariants = {
    closed: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.2 }
    },
    open: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.3 }
    })
  };

  return (
    <motion.nav
      initial="initial"
      animate="animate"
      variants={navbarVariants}
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? 'bg-white/98 backdrop-blur-sm shadow-md' 
          : 'bg-purple-50/95 backdrop-blur-sm border-b border-purple-100/50'
      }`}
    >
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 md:h-28">
          
          {/* ============ LOGO - MUCH LARGER ============ */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <Link to="/" onClick={handleNavClick} className="flex items-center">
              <img 
                src="/images/logo.png" 
                alt="Serian Institute" 
                className="h-20 w-20 md:h-28 md:w-28 lg:h-32 lg:w-32 object-contain"
                onError={(e) => {
                  // Fallback if logo fails to load
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-700 to-blue-800 bg-clip-text text-transparent">SI</span>';
                }}
              />
            </Link>
          </motion.div>

          {/* ============ DESKTOP NAVIGATION ============ */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item, index) => (
              <motion.div
                key={item.name}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={itemVariants}
                className="relative"
              >
                {item.subItems ? (
                  // Dropdown item - Click to toggle
                  <button
                    onClick={() => toggleDropdown(item.name)}
                    className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeDropdown === item.name
                        ? 'text-purple-700 bg-purple-100/80'
                        : 'text-gray-700 hover:text-purple-700 hover:bg-purple-100/60'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                    <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${
                      activeDropdown === item.name ? 'rotate-180' : ''
                    }`} />
                  </button>
                ) : (
                  // Regular link
                  <Link
                    to={item.href}
                    onClick={handleNavClick}
                    className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover:text-purple-700 hover:bg-purple-100/60 ${
                      window.location.pathname === item.href
                        ? 'text-purple-700 bg-purple-100/80'
                        : 'text-gray-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                )}

                {/* Dropdown Menu */}
                {item.subItems && (
                  <AnimatePresence>
                    {activeDropdown === item.name && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-purple-100/50 overflow-hidden"
                      >
                        <div className="py-2">
                          {item.subItems.map((subItem) => (
                            <Link
                              key={subItem.name}
                              to={subItem.href}
                              onClick={handleNavClick}
                              className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-3" />
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </motion.div>
            ))}
          </div>

          {/* ============ RIGHT SIDE - LOGIN BUTTON (DESKTOP) ============ */}
          <div className="hidden lg:flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </motion.button>
          </div>

          {/* ============ MOBILE MENU BUTTON ============ */}
          <div className="lg:hidden flex items-center">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* ============ MOBILE NAVIGATION ============ */}
        <motion.div
          variants={mobileMenuVariants}
          initial="closed"
          animate={isOpen ? "open" : "closed"}
          className="lg:hidden overflow-hidden"
        >
          <div className="py-4 border-t border-purple-100/50 space-y-1">
            {navItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial="hidden"
                animate={isOpen ? "visible" : "hidden"}
                variants={itemVariants}
                custom={index}
              >
                {item.subItems ? (
                  // Mobile dropdown - Click to toggle
                  <div>
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center">
                        <item.icon className="w-4 h-4 mr-3 text-purple-600" />
                        {item.name}
                      </div>
                      {activeDropdown === item.name ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    
                    {activeDropdown === item.name && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="ml-8 space-y-1 border-l-2 border-purple-200 pl-4"
                      >
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.name}
                            to={subItem.href}
                            onClick={handleNavClick}
                            className="block px-3 py-2 text-sm text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ) : (
                  // Regular mobile link
                  <Link
                    to={item.href}
                    onClick={handleNavClick}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      window.location.pathname === item.href
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-gray-700 hover:bg-purple-50'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-3 text-purple-600" />
                    {item.name}
                  </Link>
                )}
              </motion.div>
            ))}

            {/* Mobile Login Button */}
            <div className="pt-3 mt-3 border-t border-purple-100/50">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  handleNavClick();
                  navigate('/login');
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-700 text-white text-sm font-medium rounded-lg flex items-center justify-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
};

export default Navbar;