// src/components/Landing/WhyChooseUsSection.jsx
// 4 reason cards

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Award, Calendar } from 'lucide-react';
import { fadeInUp, staggerContainerSlow } from './animations';

const WhyChooseUsSection = () => {
  const reasons = [
    {
      icon: Users,
      title: 'Expert Instructors',
      description:
        'Learn from industry professionals with years of experience',
    },
    {
      icon: Target,
      title: 'Practical Training',
      description: 'Hands-on learning in modern workshops and labs',
    },
    {
      icon: Award,
      title: 'Industry Certification',
      description:
        'Earn nationally and internationally recognized certificates',
    },
    {
      icon: Calendar,
      title: 'Flexible Schedules',
      description: 'Day and evening classes to fit your lifestyle',
    },
  ];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={fadeInUp}
      className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-gray-900"
          >
            Why Choose{' '}
            <span className="text-purple-600">Serian Institute</span>
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mt-3 text-gray-600 max-w-2xl mx-auto"
          >
            We are committed to providing quality education that transforms lives
            and builds careers.
          </motion.p>
        </div>

        <motion.div
          variants={staggerContainerSlow}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {reasons.map((item, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default WhyChooseUsSection;