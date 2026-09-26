// src/components/Landing/AboutSection.jsx
// "Welcome / Who We Are" section — split layout, sits below hero.

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  GraduationCap,
  BadgeCheck,
  MapPin,
  Info,
} from 'lucide-react';
import { fadeInLeft, fadeInRight, staggerContainer } from './animations';

const AboutSection = ({ onExplorePrograms, onLearnMore }) => {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={staggerContainer}
      className="relative w-full py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-b from-purple-50/40 via-white to-white overflow-hidden"
    >
      {/* Decorative background blur (subtle) */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-purple-200/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-blue-200/20 blur-3xl" />

      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">

        {/* ============ TOP: Split Layout (Name + Description) ============ */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 lg:gap-16 items-start">

          {/* LEFT — Institution Name + Accent */}
          <motion.div
            variants={fadeInLeft}
            className="md:col-span-5 space-y-5"
          >
            {/* Overline */}
            <div className="flex items-center gap-3">
              <span className="block w-10 h-[2px] bg-gradient-to-r from-purple-500 to-blue-600" />
              <span className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-purple-700">
                Who We Are
              </span>
            </div>

            {/* Institution Name */}
            <h2 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold leading-[1.1] text-gray-900">
              Serian{' '}
              <span className="bg-gradient-to-r from-purple-700 to-blue-800 bg-clip-text text-transparent">
                Business
              </span>{' '}
              and{' '}
              <span className="bg-gradient-to-r from-purple-700 to-blue-800 bg-clip-text text-transparent">
                Technology
              </span>{' '}
              College
            </h2>

            {/* Small accent under name */}
            <div className="w-24 h-1 rounded-full bg-gradient-to-r from-purple-500 to-blue-600" />
          </motion.div>

          {/* Vertical Divider (desktop only) */}
          <div className="hidden md:block md:col-span-1 self-stretch">
            <div className="h-full w-px bg-gradient-to-b from-transparent via-purple-200 to-transparent mx-auto" />
          </div>

          {/* RIGHT — Description + CTAs */}
          <motion.div
            variants={fadeInRight}
            className="md:col-span-6 space-y-6"
          >
            <p className="text-base sm:text-lg md:text-lg lg:text-xl text-gray-700 leading-relaxed">
              Where ambition meets practical education. At Serian Business and
              Technology College, we train the next generation of professionals
              with hands-on skills, real industry exposure, and the confidence
              to build meaningful careers.
            </p>

            <p className="text-sm sm:text-base text-gray-500 leading-relaxed max-w-xl">
              Located in Tuala, Ongata-Rongai, our programs are designed with
              industry input — so what you learn in class is exactly what
              employers are looking for.
            </p>

            {/* CTAs — side by side on all devices */}
            <div className="flex flex-row items-center gap-2 sm:gap-3 md:gap-4 pt-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onExplorePrograms}
                className="group inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 md:px-6 py-2 sm:py-3 text-xs sm:text-sm md:text-base bg-gradient-to-r from-purple-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap"
              >
                <span className="sm:hidden">Explore Programs</span>
                <span className="hidden sm:inline">Explore Our Programs</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onLearnMore}
                className="group inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 md:px-6 py-2 sm:py-3 text-xs sm:text-sm md:text-base bg-transparent border-2 border-purple-200 text-purple-700 font-semibold rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 whitespace-nowrap"
              >
                <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="sm:hidden">Learn More</span>
                <span className="hidden sm:inline">Learn More About Us</span>
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* ============ BOTTOM: Credibility Row (one line on all devices) ============ */}
        <motion.div
          variants={fadeInLeft}
          className="mt-12 md:mt-14 pt-8 border-t border-purple-100"
        >
          <div className="flex flex-row items-center justify-center gap-3 sm:gap-0 sm:divide-x sm:divide-purple-200">
            {/* Item 1 — Programs */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm text-gray-600 sm:px-8 whitespace-nowrap">
              <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
              <span className="font-medium">10+ Programs</span>
            </div>

            {/* Item 2 — Accreditation */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm text-gray-600 sm:px-8 whitespace-nowrap">
              <BadgeCheck className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
              <span className="font-medium">TVETA Registered</span>
            </div>

            {/* Item 3 — Location */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm text-gray-600 sm:px-8 whitespace-nowrap">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
              <span className="font-medium">Tuala, Ongata-Rongai</span>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.section>
  );
};

export default AboutSection;