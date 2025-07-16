import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { 
  apiVersion: '2022-11-15' 
});

export default stripe; 