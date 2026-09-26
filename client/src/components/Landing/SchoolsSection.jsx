// src/components/Landing/SchoolsSection.jsx
// Grid of the six academic schools, each with an image, title, and short description.

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router';
import {
  Monitor,
  Briefcase,
  Wrench,
  UtensilsCrossed,
  HeartPulse,
  Car,
  ArrowRight,
} from 'lucide-react';
import { fadeInUp, staggerContainerSlow } from './animations';

const SchoolsSection = () => {
  const schools = [
    {
      name: 'SBTC School of Computing & ICT',
      shortName: 'Computing & ICT',
      description:
        'Software development, networking, cybersecurity, and IT support.',
      image: '/images/Computer.jpeg',
      fallbackIcon: Monitor,
      fallbackGradient: 'from-cyan-500 to-blue-600',
      href: '/departments/computing-ict',
    },
    {
      name: 'SBTC School of Business',
      shortName: 'Business',
      description:
        'Accounting, marketing, entrepreneurship, and business management.',
      image:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6i_zyCuaoKq1xs-jOuo-7pKpd5ZPQljXdPIHAakmwHA&s=10',
      fallbackIcon: Briefcase,
      fallbackGradient: 'from-purple-500 to-pink-600',
      href: '/departments/business',
    },
    {
      name: 'SBTC School of Engineering',
      shortName: 'Engineering',
      description:
        'Electrical installation, plumbing, welding, and technical trades.',
      image: '/images/Engineering.jpeg',
      fallbackIcon: Wrench,
      fallbackGradient: 'from-orange-500 to-red-600',
      href: '/departments/engineering',
    },
    {
      name: 'SBTC School of Hospitality',
      shortName: 'Hospitality',
      description:
        'Culinary arts, hotel management, food and beverage service.',
      image:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThX3gqoMpQ5_h6DNckdHfk6YVF6HILBmSe1cFs-aCH5g&s=10',
      fallbackIcon: UtensilsCrossed,
      fallbackGradient: 'from-amber-500 to-orange-600',
      href: '/departments/hospitality',
    },
    {
      name: 'SBTC School of Health',
      shortName: 'Health',
      description:
        'Certified nursing assistant training, first aid, and patient care.',
      image:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFI-8b6TIb82kaofwGXkQBfwHIZUWXszrrcy-VTzcYGQ&s=10',
      fallbackIcon: HeartPulse,
      fallbackGradient: 'from-emerald-500 to-teal-600',
      href: '/departments/health',
    },
    {
      name: 'SBTC School of Driving',
      shortName: 'Driving',
      description:
        'Professional driving instruction and NTSA licensing preparation.',
      image: '/images/DrivingSchool.jpeg',
      fallbackIcon: Car,
      fallbackGradient: 'from-blue-500 to-indigo-600',
      href: '/departments/driving',
    },
  ];

  return (
    <motion.section
      id="schools-section"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={staggerContainerSlow}
      className="relative w-full pt-0 pb-16 sm:pb-20 md:pb-24 lg:pb-28 bg-white overflow-hidden"
    >
      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">

        {/* ============ Section Header ============ */}
        <motion.div
          variants={fadeInUp}
          className="text-center max-w-2xl mx-auto mb-12 md:mb-16"
        >
          {/* Overline */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="block w-10 h-[2px] bg-gradient-to-r from-purple-500 to-blue-600" />
            <span className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-purple-700">
              Academic Schools
            </span>
            <span className="block w-10 h-[2px] bg-gradient-to-r from-blue-600 to-purple-500" />
          </div>

          {/* Title */}
          <h2 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            Our{' '}
            <span className="bg-gradient-to-r from-purple-700 to-blue-800 bg-clip-text text-transparent">
              Schools
            </span>
          </h2>

          {/* Subtitle */}
          <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
            Six specialized schools. One mission — equipping you with the
            practical skills employers are looking for.
          </p>
        </motion.div>

        {/* ============ Cards Grid ============ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
          {schools.map((school, index) => {
            const FallbackIcon = school.fallbackIcon;

            return (
              <motion.div key={index} variants={fadeInUp}>
                <Link
                  to={school.href}
                  className="group block h-full bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-2xl hover:border-purple-200 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* ============ Image Area ============ */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100">
                    {/* Image */}
                    <img
                      src={school.image}
                      alt={school.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />

                    {/* Fallback gradient + icon (behind image) */}
                    <div
                      className={`absolute inset-0 -z-10 bg-gradient-to-br ${school.fallbackGradient} flex items-center justify-center`}
                    >
                      <FallbackIcon className="w-14 h-14 sm:w-16 sm:h-16 text-white/90" />
                    </div>

                    {/* Subtle dark gradient for depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* ============ Content Area ============ */}
                  <div className="p-5 sm:p-6 flex flex-col">
                    {/* Small overline */}
                    <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.15em] uppercase text-purple-600 mb-1.5">
                      SBTC School of
                    </span>

                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug mb-2">
                      {school.shortName}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      {school.description}
                    </p>

                    {/* Learn More */}
                    <div className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-purple-700 group-hover:text-purple-800">
                      <span>Learn More</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

      </div>
    </motion.section>
  );
};

export default SchoolsSection;