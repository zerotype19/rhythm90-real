declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Track user sign up
export const trackSignUp = (method: string = 'google') => {
  if (window.gtag) {
    window.gtag('event', 'sign_up', {
      method: method
    });
  }
};

// Track user login
export const trackLogin = (method: string = 'google') => {
  if (window.gtag) {
    window.gtag('event', 'login', {
      method: method
    });
  }
};

// Track tool usage
export const trackToolUsage = (toolName: string) => {
  if (window.gtag) {
    window.gtag('event', 'tool_usage', {
      event_category: 'engagement',
      event_label: toolName
    });
  }
};

// Track AI generation
export const trackAIGeneration = (toolName: string) => {
  if (window.gtag) {
    window.gtag('event', 'ai_generation', {
      event_category: 'engagement',
      event_label: toolName
    });
  }
};

// Track subscription events
export const trackSubscription = (plan: string, action: 'view' | 'start' | 'complete') => {
  if (window.gtag) {
    window.gtag('event', 'subscription', {
      event_category: 'ecommerce',
      event_label: `${plan}_${action}`
    });
  }
};

// Track page view manually (if needed)
export const trackPageView = (path: string, title?: string) => {
  if (window.gtag) {
    window.gtag('config', 'G-Y8CS0Y7214', {
      page_path: path,
      page_title: title || document.title
    });
  }
};

// Track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
}; 