// src/components/Layout/PublicLayout.jsx
// Wraps all public routes with TopBar + Navbar.
// Owns the scroll state so TopBar and Navbar stay perfectly in sync.

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import TopBar from './TopBar';
import Navbar from './Navbar';

const PublicLayout = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Hide topbar once the user scrolls past its height (~48px).
      setScrolled(window.scrollY > 50);
    };

    // Set initial state in case the page loads mid-scroll
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top utility bar — slides up when scrolled */}
      <TopBar scrolled={scrolled} />

      {/* Main navbar — sits below topbar initially, sticks to top when scrolled */}
      <Navbar scrolled={scrolled} />

      {/* Page content — offset by the combined height of TopBar + Navbar */}
      <main className="pt-32 md:pt-36">
        <Outlet />
      </main>
    </>
  );
};

export default PublicLayout;