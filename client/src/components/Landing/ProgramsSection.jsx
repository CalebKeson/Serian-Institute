// src/components/Landing/ProgramsSection.jsx
// 6 program cards

import React from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Briefcase,
  Building2,
  Monitor,
  BookOpen,
  Award,
  CheckCircle,
} from 'lucide-react';
import { fadeInUp, staggerContainerSlow } from './animations';

const ProgramsSection = () => {
  const programs = [
    {
      icon: GraduationCap,
      title: 'CNA Program',
      description:
        'Certified Nursing Assistant - Comprehensive healthcare training',
      color: 'from-blue-500 to-indigo-600',
      features: ['Practical Training', 'Clinical Experience', 'State Certification'],
    },
    {
      icon: Briefcase,
      title: 'Driving Classes',
      description: 'Professional driving education with NTSA certification',
      color: 'from-emerald-500 to-teal-600',
      features: ['Defensive Driving', 'NTSA License', 'Road Safety'],
    },
    {
      icon: Building2,
      title: 'Technical Courses',
      description:
        'Hands-on training in plumbing, electrical, and computer skills',
      color: 'from-purple-500 to-pink-600',
      features: ['Practical Skills', 'Workshop Training', 'Industry Certification'],
    },
    {
      icon: Monitor,
      title: 'Computer Packages',
      description: 'Comprehensive computer training from basics to advanced',
      color: 'from-cyan-500 to-blue-600',
      features: ['MS Office', 'Web Design', 'Programming Basics'],
    },
    {
      icon: BookOpen,
      title: 'E-Learning',
      description: 'Flexible online courses accessible anytime, anywhere',
      color: 'from-orange-500 to-red-600',
      features: ['Self-Paced', 'Video Lectures', 'Online Assessments'],
    },
    {
      icon: Award,
      title: 'Professional Development',
      description:
        'Short courses for career advancement and skill enhancement',
      color: 'from-pink-500 to-rose-600',
      features: ['Flexible Schedule', 'Industry Experts', 'Certificate'],
    },
  ];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={fadeInUp}
      className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50/30 to-white"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-gray-900"
          >
            Our <span className="text-purple-600">Programs</span>
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mt-3 text-gray-600 max-w-2xl mx-auto"
          >
            Choose from our comprehensive range of professional programs designed
            to equip you with industry-relevant skills.
          </motion.p>
        </div>

        <motion.div
          variants={staggerContainerSlow}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {programs.map((program, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${program.color} flex items-center justify-center mb-4`}
              >
                <program.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {program.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {program.description}
              </p>
              <ul className="mt-4 space-y-1.5">
                {program.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default ProgramsSection;