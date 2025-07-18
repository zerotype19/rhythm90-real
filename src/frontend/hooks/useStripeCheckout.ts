import { useCallback } from 'react';
import { apiCall } from '../lib/api';

interface StripeCheckoutReturn {
  createCheckoutSession: (priceId: string) => Promise<string | null>;
  openCustomerPortal: () => Promise<void>;
  handleUpgrade: (plan: 'pro_limited' | 'pro_unlimited') => Promise<void>;
}

// Stripe Price IDs - these should match your Stripe dashboard
const STRIPE_PRICE_IDS = {
  pro_limited: 'price_1RmHyDBItJBWbjkr1R7L8vGF',
  pro_unlimited: 'price_1RmHycBItJBWbjkrxYHNuK87'
};

export const useStripeCheckout = (): StripeCheckoutReturn => {
  const createCheckoutSession = useCallback(async (priceId: string): Promise<string | null> => {
    try {
      const response = await apiCall('/api/billing/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/app/settings?tab=billing&success=true`,
          cancelUrl: `${window.location.origin}/app/settings?tab=billing&canceled=true`
        })
      });

      if (response.data) {
        return response.data.url;
      } else {
        console.error('Failed to create checkout session');
        return null;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return null;
    }
  }, []);

  const openCustomerPortal = useCallback(async (): Promise<void> => {
    try {
      const response = await apiCall('/api/billing/portal-link');
      if (response.data) {
        window.location.href = response.data.url;
      } else {
        console.error('Failed to get portal link');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
    }
  }, []);

  const handleUpgrade = useCallback(async (plan: 'pro_limited' | 'pro_unlimited'): Promise<void> => {
    if (plan === 'pro_limited') {
      // For payment updates, open customer portal
      await openCustomerPortal();
    } else {
      // For upgrades, create checkout session
      const priceId = STRIPE_PRICE_IDS[plan];
      const checkoutUrl = await createCheckoutSession(priceId);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    }
  }, [createCheckoutSession, openCustomerPortal]);

  return {
    createCheckoutSession,
    openCustomerPortal,
    handleUpgrade
  };
}; 