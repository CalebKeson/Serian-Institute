// src/components/Landing/CTASection.jsx
// "Ready to Start Your Journey?" banner

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Phone } from 'lucide-react';
import { fadeInUp } from './animations';

const CTASection = ({ onEnquire }) => {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
      className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-blue-700 text-white"
    >
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          variants={fadeInUp}
          className="text-3xl md:text-4xl font-bold"
        >
          Ready to Start Your Journey?
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="mt-4 text-blue-100 text-lg max-w-2xl mx-auto"
        >
          Join thousands of successful graduates who have transformed their
          careers through our programs.
        </motion.p>
        <motion.div
          variants={fadeInUp}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEnquire}
            className="px-8 py-3 bg-white text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            Enquire Now
            <ArrowRight className="w-4 h-4" />
          </motion.button>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="tel:+254712345678"
            className="px-8 py-3 bg-transparent border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            Call Us
          </motion.a>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default CTASection;