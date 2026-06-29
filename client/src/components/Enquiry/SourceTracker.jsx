// components/Enquiry/SourceTracker.jsx - COMPLETE NEW FILE

import React, { useEffect, useRef } from 'react';
import { analyticsAPI } from '../../services/analyticsAPI';

const SourceTracker = ({ children, pageTitle = 'Landing Page' }) => {
  const trackedRef = useRef(false);

  useEffect(() => {
    // Only track once per page load
    if (trackedRef.current) return;
    
    const trackSource = async () => {
      try {
        // Generate or get visitor ID
        let visitorId = localStorage.getItem('visitorId');
        if (!visitorId) {
          visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('visitorId', visitorId);
        }

        // Get or generate session ID
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
          sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          sessionStorage.setItem('sessionId', sessionId);
        }

        // Parse UTM parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const utmSource = urlParams.get('utm_source');
        const utmMedium = urlParams.get('utm_medium');
        const utmCampaign = urlParams.get('utm_campaign');
        const utmTerm = urlParams.get('utm_term');
        const utmContent = urlParams.get('utm_content');

        // Determine source
        let source = 'direct';
        let sourceUrl = window.location.href;
        let referrer = document.referrer || null;

        // Check UTM source first
        if (utmSource) {
          source = utmSource.toLowerCase();
        } 
        // Then check referrer
        else if (referrer) {
          const referrerDomain = new URL(referrer).hostname;
          if (referrerDomain.includes('google')) source = 'google';
          else if (referrerDomain.includes('facebook')) source = 'facebook';
          else if (referrerDomain.includes('instagram')) source = 'instagram';
          else if (referrerDomain.includes('linkedin')) source = 'linkedin';
          else if (referrerDomain.includes('tiktok')) source = 'tiktok';
          else if (referrerDomain.includes('twitter')) source = 'twitter';
          else if (referrerDomain.includes('youtube')) source = 'youtube';
          else source = 'referral';
        }

        // Store source in localStorage for the form to use
        localStorage.setItem('visitorSource', source);
        if (utmSource) localStorage.setItem('utmSource', utmSource);
        if (utmMedium) localStorage.setItem('utmMedium', utmMedium);
        if (utmCampaign) localStorage.setItem('utmCampaign', utmCampaign);

        // Get device info
        const device = getDeviceType();
        const browser = getBrowserName();
        const os = getOSName();
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // Track page view
        await analyticsAPI.trackPageView({
          visitorId,
          sessionId,
          source,
          sourceUrl,
          referrer,
          utmSource,
          utmMedium,
          utmCampaign,
          utmTerm,
          utmContent,
          page: window.location.pathname,
          pageTitle: pageTitle || document.title,
          path: window.location.pathname + window.location.search,
          device,
          browser,
          os,
          screenWidth,
          screenHeight
        });

        trackedRef.current = true;
        console.log('📊 Page view tracked:', { source, visitorId, sessionId });
        
      } catch (error) {
        console.error('Error tracking source:', error);
      }
    };

    // Store visitorId and source in localStorage before tracking
    const visitorId = localStorage.getItem('visitorId') || 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    if (!localStorage.getItem('visitorId')) {
      localStorage.setItem('visitorId', visitorId);
    }

    // Also store the source immediately for form use
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    if (utmSource) {
      localStorage.setItem('visitorSource', utmSource.toLowerCase());
      localStorage.setItem('utmSource', utmSource);
      localStorage.setItem('utmMedium', urlParams.get('utm_medium') || '');
      localStorage.setItem('utmCampaign', urlParams.get('utm_campaign') || '');
    } else if (document.referrer) {
      const referrer = document.referrer;
      const referrerDomain = new URL(referrer).hostname;
      let source = 'direct';
      if (referrerDomain.includes('google')) source = 'google';
      else if (referrerDomain.includes('facebook')) source = 'facebook';
      else if (referrerDomain.includes('instagram')) source = 'instagram';
      else if (referrerDomain.includes('linkedin')) source = 'linkedin';
      else if (referrerDomain.includes('tiktok')) source = 'tiktok';
      else if (referrerDomain.includes('twitter')) source = 'twitter';
      else if (referrerDomain.includes('youtube')) source = 'youtube';
      else source = 'referral';
      localStorage.setItem('visitorSource', source);
    }

    trackSource();
  }, [pageTitle]);

  // Helper: Get device type
  const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua)) return 'tablet';
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
    return 'desktop';
  };

  // Helper: Get browser name
  const getBrowserName = () => {
    const ua = navigator.userAgent;
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    if (ua.indexOf('Opera') > -1) return 'Opera';
    return 'Other';
  };

  // Helper: Get OS name
  const getOSName = () => {
    const ua = navigator.userAgent;
    if (ua.indexOf('Windows') > -1) return 'Windows';
    if (ua.indexOf('Mac OS') > -1) return 'macOS';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) return 'iOS';
    return 'Other';
  };

  // This component doesn't render anything visible
  return <>{children}</>;
};

export default SourceTracker;