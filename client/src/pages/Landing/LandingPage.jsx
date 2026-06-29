// pages/Landing/LandingPage.jsx - COMPLETE WITH SPLIT HERO LAYOUT

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import {
  GraduationCap,
  Award,
  Users,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Clock,
  Star,
  Sparkles,
  Shield,
  Globe,
  Briefcase,
  Calendar,
  Target,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  ChevronRight,
  PlayCircle,
  Eye,
  Heart,
  Building2,
  Monitor,
  DollarSign,
  MessageSquare,
  Send
} from 'lucide-react';
import Navbar from '../../components/Layout/Navbar';
import SourceTracker from '../../components/Enquiry/SourceTracker';
import EnquiryForm from '../../components/Enquiry/EnquiryForm';
import EnquirySuccess from '../../components/Enquiry/EnquirySuccess';
import { useEnquiryStore } from '../../stores/enquiryStore';
import toast from 'react-hot-toast';

const LandingPage = () => {
  const navigate = useNavigate();
  const { submitEnquiry, loading } = useEnquiryStore();
  const [submitted, setSubmitted] = useState(false);
  const [enquiryData, setEnquiryData] = useState(null);
  const [error, setError] = useState(null);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const fadeInDown = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
  };

  const fadeInLeft = {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
  };

  const fadeInRight = {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const staggerContainerSlow = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const handleSubmit = async (formData) => {
    setError(null);
    const result = await submitEnquiry(formData);
    
    if (result.success) {
      setSubmitted(true);
      setEnquiryData(result.data);
      toast.success(result.message || 'Enquiry submitted successfully!');
    } else {
      setError(result.message || 'Failed to submit enquiry. Please try again.');
      toast.error(result.message || 'Failed to submit enquiry');
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setEnquiryData(null);
    setError(null);
  };

  const scrollToEnquiry = () => {
    document.getElementById('enquiry-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // If enquiry is submitted, show success page
  if (submitted) {
    return (
      <SourceTracker pageTitle="Enquiry Success - Serian Institute">
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 flex items-center justify-center px-4 py-12 pt-28">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <EnquirySuccess 
              enquiryData={enquiryData} 
              onReset={handleReset}
            />
          </motion.div>
        </div>
      </SourceTracker>
    );
  }

  return (
    <SourceTracker pageTitle="Serian Institute - Home">
      <Navbar />
      
      <div className="min-h-screen overflow-x-hidden">
        
        {/* ============================================================ */}
        {/* HERO SECTION - FULL WIDTH WITH SPLIT LAYOUT */}
        {/* ============================================================ */}
        <section className="relative h-screen min-h-[600px] md:min-h-[700px] w-full overflow-hidden">
          
          {/* Background Image - Full Width */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src="/images/hero.png"
              alt="Serian Institute - Campus Life"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/1920x1080/7c3aed/ffffff?text=Serian+Institute';
              }}
            />
            {/* Dark Overlay for better text visibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
            {/* Purple/Blue Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 via-transparent to-blue-900/10" />
          </div>

          {/* Content - Split Left/Right */}
          <div className="relative z-10 flex items-center w-full h-full pt-16 md:pt-20">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                
                {/* ============ LEFT COLUMN - Main Content ============ */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  className="space-y-5"
                >
                  {/* Badge */}
                  <motion.div
                    variants={fadeInLeft}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-medium text-white">Enroll Now for 2026 Intake</span>
                  </motion.div>

                  {/* Main Heading - Short and punchy */}
                  <motion.h1 
                    variants={fadeInLeft}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
                  >
                    Unlock Your Future at{' '}
                    <span className="bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                      Serian College
                    </span>
                  </motion.h1>

                  {/* Description */}
                  <motion.p 
                    variants={fadeInLeft}
                    className="text-base sm:text-lg text-white/90 leading-relaxed max-w-lg"
                  >
                    Empowering the next generation of professionals with quality education, 
                    practical skills, and industry-aligned training programs.
                  </motion.p>

                  {/* CTA Buttons */}
                  <motion.div
                    variants={fadeInLeft}
                    className="flex flex-wrap items-center gap-4 pt-2"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={scrollToEnquiry}
                      className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-blue-700 text-white text-base font-semibold rounded-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                      Enquire Now
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/about')}
                      className="px-6 py-3.5 bg-white/20 backdrop-blur-sm text-white border border-white/30 text-base font-semibold rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center gap-2"
                    >
                      Learn More
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </motion.div>

                  {/* Social Media Icons */}
                  <motion.div
                    variants={fadeInLeft}
                    className="flex items-center gap-4 pt-2"
                  >
                    <span className="text-sm text-white/70 font-medium">Follow us:</span>
                    <div className="flex gap-2">
                      {[
                        { icon: Facebook, href: '#', color: 'hover:bg-blue-600' },
                        { icon: Twitter, href: '#', color: 'hover:bg-blue-400' },
                        { icon: Instagram, href: '#', color: 'hover:bg-pink-600' },
                        { icon: Linkedin, href: '#', color: 'hover:bg-blue-700' },
                        { icon: Youtube, href: '#', color: 'hover:bg-red-600' }
                      ].map((social, index) => {
                        const Icon = social.icon;
                        return (
                          <motion.a
                            key={index}
                            whileHover={{ y: -3, scale: 1.1 }}
                            href={social.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:text-white hover:shadow-lg transition-all duration-200 ${social.color}`}
                          >
                            <Icon className="w-4 h-4" />
                          </motion.a>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Trust Badges */}
                  <motion.div
                    variants={fadeInLeft}
                    className="flex flex-wrap items-center gap-4 pt-2"
                  >
                    {[
                      { icon: Shield, label: 'Licensed by TVET' },
                      { icon: Award, label: 'NITA Accredited' },
                      { icon: Star, label: '4.8/5 Rating' }
                    ].map((badge, index) => (
                      <div key={index} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                        <badge.icon className="w-3.5 h-3.5 text-yellow-300" />
                        <span className="text-xs font-medium text-white">{badge.label}</span>
                      </div>
                    ))}
                  </motion.div>
                </motion.div>

                {/* ============ RIGHT COLUMN - Stats Cards ============ */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  className="space-y-4"
                >
                  {/* Stats Cards - Vertically stacked on right */}
                  <motion.div
                    variants={fadeInRight}
                    className="grid grid-cols-1 gap-4 max-w-sm ml-auto"
                  >
                    {[
                      { 
                        value: '500+', 
                        label: 'Students Enrolled', 
                        icon: Users,
                        description: 'Join our growing community'
                      },
                      { 
                        value: '10+', 
                        label: 'Professional Courses', 
                        icon: BookOpen,
                        description: 'Industry-aligned programs'
                      },
                      { 
                        value: '95%', 
                        label: 'Success Rate', 
                        icon: Award,
                        description: 'Graduate employment rate'
                      }
                    ].map((stat, index) => (
                      <motion.div
                        key={index}
                        variants={fadeInRight}
                        whileHover={{ x: 5, transition: { duration: 0.2 } }}
                        className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/30 transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                            <stat.icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                            <p className="text-sm font-medium text-white/80">{stat.label}</p>
                            <p className="text-xs text-white/60">{stat.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Additional Info Card */}
                  <motion.div
                    variants={fadeInRight}
                    className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/20 max-w-sm ml-auto"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Limited Spots Available</p>
                        <p className="text-xs text-white/70">Apply now for 2026 intake</p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-6 h-10 rounded-full border-2 border-white/50 flex items-center justify-center"
            >
              <div className="w-1 h-3 rounded-full bg-white/70" />
            </motion.div>
          </motion.div>
        </section>

        {/* ============================================================ */}
        {/* ENQUIRY FORM SECTION */}
        {/* ============================================================ */}
        <section id="enquiry-section" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-purple-50/30">
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
                Fill in the form below and our team will get back to you as soon as possible
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
                  onSubmit={handleSubmit}
                  loading={loading}
                  showTitle={false}
                  compact={true}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* ABOUT US SECTION */}
        {/* ============================================================ */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <motion.h2 
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-gray-900"
              >
                Welcome to <span className="text-purple-600">Serian Institute</span>
              </motion.h2>
              <motion.p 
                variants={fadeInUp}
                className="mt-3 text-gray-600 max-w-3xl mx-auto"
              >
                At Serian Institute, we are committed to providing world-class education 
                that empowers students to achieve their full potential and build successful careers.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Target,
                  title: 'Our Mission',
                  description: 'To provide accessible, quality education that equips students with practical skills and knowledge for the modern workforce.'
                },
                {
                  icon: Eye,
                  title: 'Our Vision',
                  description: 'To be a leading institution of excellence, producing globally competitive professionals who drive positive change.'
                },
                {
                  icon: Heart,
                  title: 'Our Values',
                  description: 'Excellence, Integrity, Innovation, and Community. We believe in nurturing holistic growth and lifelong learning.'
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mb-4">
                    <item.icon className="w-7 h-7 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-2">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ============================================================ */}
        {/* PROGRAMS / DEPARTMENTS SECTION */}
        {/* ============================================================ */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
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
                Choose from our comprehensive range of professional programs designed to 
                equip you with industry-relevant skills.
              </motion.p>
            </div>

            <motion.div 
              variants={staggerContainerSlow}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[
                {
                  icon: GraduationCap,
                  title: 'CNA Program',
                  description: 'Certified Nursing Assistant - Comprehensive healthcare training',
                  color: 'from-blue-500 to-indigo-600',
                  features: ['Practical Training', 'Clinical Experience', 'State Certification']
                },
                {
                  icon: Briefcase,
                  title: 'Driving Classes',
                  description: 'Professional driving education with NTSA certification',
                  color: 'from-emerald-500 to-teal-600',
                  features: ['Defensive Driving', 'NTSA License', 'Road Safety']
                },
                {
                  icon: Building2,
                  title: 'Technical Courses',
                  description: 'Hands-on training in plumbing, electrical, and computer skills',
                  color: 'from-purple-500 to-pink-600',
                  features: ['Practical Skills', 'Workshop Training', 'Industry Certification']
                },
                {
                  icon: Monitor,
                  title: 'Computer Packages',
                  description: 'Comprehensive computer training from basics to advanced',
                  color: 'from-cyan-500 to-blue-600',
                  features: ['MS Office', 'Web Design', 'Programming Basics']
                },
                {
                  icon: BookOpen,
                  title: 'E-Learning',
                  description: 'Flexible online courses accessible anytime, anywhere',
                  color: 'from-orange-500 to-red-600',
                  features: ['Self-Paced', 'Video Lectures', 'Online Assessments']
                },
                {
                  icon: Award,
                  title: 'Professional Development',
                  description: 'Short courses for career advancement and skill enhancement',
                  color: 'from-pink-500 to-rose-600',
                  features: ['Flexible Schedule', 'Industry Experts', 'Certificate']
                }
              ].map((program, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${program.color} flex items-center justify-center mb-4`}>
                    <program.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{program.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{program.description}</p>
                  <ul className="mt-4 space-y-1.5">
                    {program.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
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

        {/* ============================================================ */}
        {/* WHY CHOOSE US SECTION */}
        {/* ============================================================ */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <motion.h2 
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-gray-900"
              >
                Why Choose <span className="text-purple-600">Serian Institute</span>
              </motion.h2>
              <motion.p 
                variants={fadeInUp}
                className="mt-3 text-gray-600 max-w-2xl mx-auto"
              >
                We are committed to providing quality education that transforms lives and builds careers.
              </motion.p>
            </div>

            <motion.div 
              variants={staggerContainerSlow}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[
                {
                  icon: Users,
                  title: 'Expert Instructors',
                  description: 'Learn from industry professionals with years of experience'
                },
                {
                  icon: Target,
                  title: 'Practical Training',
                  description: 'Hands-on learning in modern workshops and labs'
                },
                {
                  icon: Award,
                  title: 'Industry Certification',
                  description: 'Earn nationally and internationally recognized certificates'
                },
                {
                  icon: Calendar,
                  title: 'Flexible Schedules',
                  description: 'Day and evening classes to fit your lifestyle'
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* ============================================================ */}
        {/* CTA SECTION */}
        {/* ============================================================ */}
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
              Join thousands of successful graduates who have transformed their careers 
              through our programs.
            </motion.p>
            <motion.div 
              variants={fadeInUp}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollToEnquiry}
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

        {/* ============================================================ */}
        {/* FOOTER */}
        {/* ============================================================ */}
        <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* About */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-6 h-6 text-purple-400" />
                  <span className="text-lg font-bold text-white">Serian Institute</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Empowering the next generation of professionals with quality education, 
                  practical skills, and industry-aligned training.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                  <li><a href="/departments" className="text-gray-400 hover:text-white transition-colors">Programs</a></li>
                  <li><a href="/e-learning" className="text-gray-400 hover:text-white transition-colors">E-Learning</a></li>
                  <li><a href="/fees-structure" className="text-gray-400 hover:text-white transition-colors">Fee Structure</a></li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-4">Contact Us</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">Nairobi, Kenya</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">+254 712 345 678</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">info@serian.ac.ke</span>
                  </li>
                </ul>
              </div>

              {/* Social */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-4">Follow Us</h4>
                <div className="flex gap-3">
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
              <p>&copy; {new Date().getFullYear()} Serian Institute. All rights reserved.</p>
            </div>
          </div>
        </footer>

      </div>
    </SourceTracker>
  );
};

export default LandingPage; 