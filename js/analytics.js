// Google Analytics placeholder
// Replace 'GA_MEASUREMENT_ID' with your actual Google Analytics 4 measurement ID

(function() {
  'use strict';

  // Google Analytics 4 setup
  const GA_ID = 'GA_MEASUREMENT_ID'; // TODO: Replace with actual measurement ID

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag('js', new Date());
  gtag('config', GA_ID);

  // Expose gtag globally for custom event tracking
  window.gtag = gtag;

  // Custom event helpers
  window.trackEvent = (eventName, eventParams = {}) => {
    if (typeof gtag === 'function') {
      gtag('event', eventName, eventParams);
    }
  };

  // Track page views on SPA-like navigation
  window.trackPageView = (pagePath) => {
    if (typeof gtag === 'function') {
      gtag('config', GA_ID, {
        page_path: pagePath
      });
    }
  };

  console.log('Analytics initialized (placeholder - add your GA ID)');
})();
