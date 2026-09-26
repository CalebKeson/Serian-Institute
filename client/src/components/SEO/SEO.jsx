// src/components/SEO/SEO.jsx
// React 19 native metadata component — no external dependencies needed.
// Tags rendered here are automatically hoisted to <head> by React.

import React from 'react';

const SITE_NAME = 'Serian Business and Technology College';
const BASE_URL = 'https://www.serianinstitute.ac.ke';
const DEFAULT_DESCRIPTION =
  'Serian Business and Technology College offers industry-aligned programs in nursing, driving, technical skills, and computing. Empowering students with practical, career-ready education.';

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = `${BASE_URL}/images/og-default.jpg`,
  url,
  type = 'website',
  twitterCard = 'summary_large_image',
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

  // Build canonical URL: if url passed use it, otherwise current path
  const canonicalUrl =
    url ||
    (typeof window !== 'undefined'
      ? `${BASE_URL}${window.location.pathname}`
      : BASE_URL);

  // React 19 hoists these tags to <head> automatically.
  // No provider, no wrapper, no library needed.
  return (
    <>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook / LinkedIn */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
};

export default SEO;