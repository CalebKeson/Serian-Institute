// src/components/ScrollToTop.jsx

import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // Find the main content container (not the sidebar)
    // const mainContent = document.querySelector('main');
    // if (mainContent) {
    //   // Only scroll the main content, NOT the sidebar
    //   mainContent.scrollTop = 0;
    // }
    
    // // Also scroll the window if needed
    // // But since the sidebar is sticky, this won't affect it
    // window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;