// src/pages/Landing/LandingPage.jsx
// Slim orchestrator — composes the landing page from section components

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import Footer from '../../components/Layout/Footer';
import SourceTracker from '../../components/Enquiry/SourceTracker';
import EnquirySuccess from '../../components/Enquiry/EnquirySuccess';
import SEO from '../../components/SEO/SEO';
import { useEnquiryStore } from '../../stores/enquiryStore';
import toast from 'react-hot-toast';

import HeroSection from '../../components/Landing/HeroSection';
import AboutSection from '../../components/Landing/AboutSection';
import SchoolsSection from '../../components/Landing/SchoolsSection';
import EnquirySection from '../../components/Landing/EnquirySection';
import ProgramsSection from '../../components/Landing/ProgramsSection';
import WhyChooseUsSection from '../../components/Landing/WhyChooseUsSection';
import CTASection from '../../components/Landing/CTASection';

const LandingPage = () => {
  const navigate = useNavigate();
  const { submitEnquiry, loading } = useEnquiryStore();
  const [submitted, setSubmitted] = useState(false);
  const [enquiryData, setEnquiryData] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    setError(null);
    const result = await submitEnquiry(formData);

    if (result.success) {
      setSubmitted(true);
      setEnquiryData(result.data);
      toast.success(result.message || 'Enquiry submitted successfully!');
    } else {
      setError(
        result.message || 'Failed to submit enquiry. Please try again.'
      );
      toast.error(result.message || 'Failed to submit enquiry');
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setEnquiryData(null);
    setError(null);
  };

  const scrollToEnquiry = () => {
    document
      .getElementById('enquiry-section')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPrograms = () => {
    document
      .getElementById('programs-section')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  // If enquiry is submitted, show success page
  if (submitted) {
    return (
      <SourceTracker pageTitle="Enquiry Success - Serian Institute">
        <SEO
          title="Enquiry Submitted"
          description="Thank you for contacting Serian Business and Technology College. Our admissions team in Tuala, Ongata-Rongai will get back to you shortly."
          url="https://www.serianinstitute.ac.ke/"
        />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <EnquirySuccess enquiryData={enquiryData} onReset={handleReset} />
          </motion.div>
        </div>
      </SourceTracker>
    );
  }

  return (
    <SourceTracker pageTitle="Serian Institute - Home">
      <SEO
        title="Quality Education in Ongata-Rongai"
        description="Serian Business and Technology College in Tuala, Ongata-Rongai offers industry-aligned programs in nursing, driving, technical skills, and computing."
        image="https://www.serianinstitute.ac.ke/images/og-landing.jpg"
        url="https://www.serianinstitute.ac.ke/"
      />

      <div className="min-h-screen overflow-x-hidden">
        <HeroSection
          onEnquire={scrollToEnquiry}
          onLearnMore={() => navigate('/about')}
        />
        <AboutSection
          onExplorePrograms={scrollToPrograms}
          onLearnMore={() => navigate('/about')}
        />
        <SchoolsSection />
        <EnquirySection
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />
        <ProgramsSection />
        <WhyChooseUsSection />
        <CTASection onEnquire={scrollToEnquiry} />
        <Footer />
      </div>
    </SourceTracker>
  );
};

export default LandingPage;