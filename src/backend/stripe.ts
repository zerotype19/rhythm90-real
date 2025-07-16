import Stripe from 'stripe';

export function getStripeClient(stripeSecretKey: string) {
  return new Stripe(stripeSecretKey, { apiVersion: '2022-11-15' });
} 