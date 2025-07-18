import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const useGoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view when location changes
    if (window.gtag) {
      window.gtag('config', 'G-Y8CS0Y7214', {
        page_path: location.pathname + location.search,
        page_title: document.title
      });
    }
  }, [location]);

  // Helper function to track custom events
  const trackEvent = (action: string, category: string, label?: string, value?: number) => {
    if (window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value
      });
    }
  };

  return { trackEvent };
}; 