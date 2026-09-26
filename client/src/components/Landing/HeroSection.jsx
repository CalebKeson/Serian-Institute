// src/components/Landing/HeroSection.jsx
// Full-width split hero — left content, right stats + accreditations

import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ChevronRight,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Shield,
  Award,
  Star,
  Users,
  BookOpen,
} from 'lucide-react';
import {
  fadeInLeft,
  fadeInRight,
  staggerContainer,
} from './animations';

const HeroSection = ({ onEnquire, onLearnMore }) => {
  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image - Full Width */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/images/hero.png"
          alt="Serian Institute - Campus Life"
          className="w-full h-full object-cover object-[75%_center]"
          onError={(e) => {
            e.target.src =
              'https://via.placeholder.com/1920x1080/7c3aed/ffffff?text=Serian+Institute';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 via-transparent to-blue-900/10" />
      </div>

      {/* Content — anchored toward the top, padded bottom for scroll indicator */}
      <div className="relative z-10 flex items-start w-full min-h-screen pt-6 sm:pt-8 md:pt-6 pb-20 md:pb-24">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-16 items-start">

            {/* ============ LEFT COLUMN - Main Content ============ */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-3.5 sm:space-y-4 md:space-y-5 w-full"
            >
              {/* Badge */}
              <motion.div
                variants={fadeInLeft}
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300" />
                <span className="text-xs sm:text-sm font-medium text-white">
                  Enroll Now for 2026 Intake
                </span>
              </motion.div>

              {/* Main Heading — two-line hierarchy */}
              <motion.h1
                variants={fadeInLeft}
                className="font-bold text-white leading-snug md:leading-tight space-y-1.5"
              >
                <span className="block text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl pb-1">
                  Practical Skills. Real Careers.
                </span>
                <span className="block text-lg sm:text-xl md:text-xl lg:text-3xl xl:text-4xl font-semibold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent pb-1">
                  — at Serian College
                </span>
              </motion.h1>

              {/* Description */}
              <motion.p
                variants={fadeInLeft}
                className="text-sm sm:text-base md:text-base lg:text-lg text-white/90 leading-relaxed max-w-lg"
              >
                Empowering the next generation of professionals with quality
                education, practical skills, and industry-aligned training programs.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={fadeInLeft}
                className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onEnquire}
                  className="px-5 sm:px-6 md:px-6 lg:px-8 py-2.5 sm:py-3 md:py-3 lg:py-3.5 bg-gradient-to-r from-purple-600 to-blue-700 text-white text-sm sm:text-base md:text-sm lg:text-base font-semibold rounded-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                  Enquire Now
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onLearnMore}
                  className="px-4 sm:px-5 md:px-5 lg:px-6 py-2.5 sm:py-3 md:py-3 lg:py-3.5 bg-white/20 backdrop-blur-sm text-white border border-white/30 text-sm sm:text-base md:text-sm lg:text-base font-semibold rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center gap-2"
                >
                  Learn More
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </motion.div>

              {/* Social Media Icons */}
              <motion.div
                variants={fadeInLeft}
                className="flex items-center gap-3 sm:gap-4 pt-1"
              >
                <span className="text-xs sm:text-sm text-white/70 font-medium">
                  Follow us:
                </span>
                <div className="flex gap-1.5 sm:gap-2">
                  {[
                    { icon: Facebook, href: '#', color: 'hover:bg-blue-600' },
                    { icon: Twitter, href: '#', color: 'hover:bg-blue-400' },
                    { icon: Instagram, href: '#', color: 'hover:bg-pink-600' },
                    { icon: Linkedin, href: '#', color: 'hover:bg-blue-700' },
                    { icon: Youtube, href: '#', color: 'hover:bg-red-600' },
                  ].map((social, index) => {
                    const Icon = social.icon;
                    return (
                      <motion.a
                        key={index}
                        whileHover={{ y: -3, scale: 1.1 }}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-8 h-8 sm:w-9 sm:h-9 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:text-white hover:shadow-lg transition-all duration-200 ${social.color}`}
                      >
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </motion.a>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>

            {/* ============ RIGHT COLUMN - Stats + Accreditations ============ */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-3 sm:space-y-3.5 w-full"
            >
              {/* 3 Stat cards — direct children of orchestrator for uniform cascade */}
              {[
                {
                  value: '500+',
                  label: 'Students Enrolled',
                  icon: Users,
                  description: 'Join our growing community',
                },
                {
                  value: '10+',
                  label: 'Professional Courses',
                  icon: BookOpen,
                  description: 'Industry-aligned programs',
                },
                {
                  value: '95%',
                  label: 'Success Rate',
                  icon: Award,
                  description: 'Graduate employment rate',
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  variants={fadeInRight}
                  whileHover={{ x: 5, transition: { duration: 0.2 } }}
                  className="bg-white/20 backdrop-blur-md rounded-xl p-3 sm:p-3.5 border border-white/20 hover:bg-white/30 transition-all duration-300 w-full"
                >
                  <div className="flex items-center gap-3 sm:gap-3.5">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xl sm:text-2xl font-bold text-white">
                        {stat.value}
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-white/80">
                        {stat.label}
                      </p>
                      <p className="text-[11px] sm:text-xs text-white/60">
                        {stat.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Additional Info Card */}
              <motion.div
                variants={fadeInRight}
                className="bg-white/20 backdrop-blur-md rounded-xl p-3 sm:p-3.5 border border-white/20 w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-white">
                      Limited Spots Available
                    </p>
                    <p className="text-[11px] sm:text-xs text-white/70">
                      Apply now for 2026 intake
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* ============ Trust Badges ============ */}
              <motion.div
                variants={fadeInRight}
                className="w-full"
              >
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 whitespace-nowrap">
                  {[
                    { icon: Shield, label: 'Licensed by TVET' },
                    { icon: Award, label: 'NITA Accredited' },
                    { icon: Star, label: '4.8/5 Rating' },
                  ].map((badge, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full border border-white/20 flex-shrink-0"
                    >
                      <badge.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-300 flex-shrink-0" />
                      <span className="text-[10px] sm:text-[11px] md:text-xs font-medium text-white">
                        {badge.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator — hidden on very short screens */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 hidden sm:block"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-white/50 flex items-center justify-center"
        >
          <div className="w-1 h-3 rounded-full bg-white/70" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;