// src/components/Landing/EnquirySection.jsx
// Enquiry form section with error banner

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import EnquiryForm from '../Enquiry/EnquiryForm';

const EnquirySection = ({ onSubmit, loading, error }) => {
  return (
    <section
      id="enquiry-section"
      className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-purple-50/30"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-gray-900"
          >
            Get In <span className="text-purple-600">Touch</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-gray-600 max-w-2xl mx-auto"
          >
            Fill in the form below and our team will get back to you as soon as
            possible
          </motion.p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
                <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <EnquiryForm
              onSubmit={onSubmit}
              loading={loading}
              showTitle={false}
              compact={true}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnquirySection;