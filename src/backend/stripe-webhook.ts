import { Env } from './types';
import { jsonResponse, errorResponse } from './utils';
import { getStripeClient } from './stripe';

// Plan tier mapping based on Stripe price IDs
const PLAN_TIER_MAPPING: { [key: string]: string } = {
  // These will be set via environment variables
  // 'price_pro_limited': 'pro_limited',
  // 'price_pro_unlimited': 'pro_unlimited'
};

export async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  try {
    console.log('handleStripeWebhook: Starting');
    
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('handleStripeWebhook: No signature found');
      return errorResponse('No signature found', 400);
    }

    let event;
    try {
      event = getStripeClient(env.STRIPE_SECRET_KEY).webhooks.constructEvent(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('handleStripeWebhook: Invalid signature:', err);
      return errorResponse('Invalid signature', 400);
    }

    console.log('handleStripeWebhook: Processing event:', event.type);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object, env);
          break;
        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object, env);
          break;
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object, env);
          break;
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object, env);
          break;
        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object, env);
          break;
        default:
          console.log('handleStripeWebhook: Unhandled event type:', event.type);
      }
    } catch (error) {
      console.error('handleStripeWebhook: Error processing event:', error);
      // Return 200 to prevent Stripe retries, but log the error
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error('handleStripeWebhook: Unexpected error:', error);
    // Return 200 to prevent Stripe retries
    return jsonResponse({ received: true });
  }
}

async function handleCheckoutSessionCompleted(session: any, env: Env) {
  console.log('handleCheckoutSessionCompleted: Processing session:', session.id);
  
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error('handleCheckoutSessionCompleted: No user_id in metadata');
    return;
  }

  // Update user with subscription info
  await env.DB.prepare(`
    UPDATE users 
    SET stripe_subscription_id = ?, 
        plan_tier = ?,
        trial_end_date = ?
    WHERE id = ?
  `).bind(
    session.subscription,
    getPlanTierFromPriceId(session.line_items?.data?.[0]?.price?.id),
    session.subscription ? null : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days trial
  ).run();

  console.log('handleCheckoutSessionCompleted: Updated user subscription');
}

async function handleSubscriptionCreated(subscription: any, env: Env) {
  console.log('handleSubscriptionCreated: Processing subscription:', subscription.id);
  
  // Find user by customer ID
  const userResult = await env.DB.prepare(
    'SELECT id FROM users WHERE stripe_customer_id = ?'
  ).bind(subscription.customer).first<{ id: string }>();

  if (!userResult) {
    console.error('handleSubscriptionCreated: No user found for customer:', subscription.customer);
    return;
  }

  const planTier = getPlanTierFromPriceId(subscription.items.data[0]?.price?.id);
  
  await env.DB.prepare(`
    UPDATE users 
    SET stripe_subscription_id = ?, 
        plan_tier = ?,
        trial_end_date = ?
    WHERE id = ?
  `).bind(
    subscription.id,
    planTier,
    subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
  ).run();

  console.log('handleSubscriptionCreated: Updated user subscription');
}

async function handleSubscriptionUpdated(subscription: any, env: Env) {
  console.log('handleSubscriptionUpdated: Processing subscription:', subscription.id);
  
  const userResult = await env.DB.prepare(
    'SELECT id FROM users WHERE stripe_customer_id = ?'
  ).bind(subscription.customer).first<{ id: string }>();

  if (!userResult) {
    console.error('handleSubscriptionUpdated: No user found for customer:', subscription.customer);
    return;
  }

  const planTier = getPlanTierFromPriceId(subscription.items.data[0]?.price?.id);
  
  await env.DB.prepare(`
    UPDATE users 
    SET plan_tier = ?,
        trial_end_date = ?
    WHERE id = ?
  `).bind(
    planTier,
    subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
  ).run();

  console.log('handleSubscriptionUpdated: Updated user subscription');
}

async function handleSubscriptionDeleted(subscription: any, env: Env) {
  console.log('handleSubscriptionDeleted: Processing subscription:', subscription.id);
  
  const userResult = await env.DB.prepare(
    'SELECT id FROM users WHERE stripe_customer_id = ?'
  ).bind(subscription.customer).first<{ id: string }>();

  if (!userResult) {
    console.error('handleSubscriptionDeleted: No user found for customer:', subscription.customer);
    return;
  }

  // Downgrade to free tier
  await env.DB.prepare(`
    UPDATE users 
    SET stripe_subscription_id = NULL, 
        plan_tier = 'free',
        trial_end_date = NULL
    WHERE id = ?
  `).bind(userResult.id).run();

  console.log('handleSubscriptionDeleted: Downgraded user to free tier');
}

async function handlePaymentFailed(invoice: any, env: Env) {
  console.log('handlePaymentFailed: Processing invoice:', invoice.id);
  
  const userResult = await env.DB.prepare(
    'SELECT id FROM users WHERE stripe_customer_id = ?'
  ).bind(invoice.customer).first<{ id: string }>();

  if (!userResult) {
    console.error('handlePaymentFailed: No user found for customer:', invoice.customer);
    return;
  }

  // For now, just log the payment failure
  // In the future, you might want to send notifications or implement retry logic
  console.log('handlePaymentFailed: Payment failed for user:', userResult.id);
}

function getPlanTierFromPriceId(priceId: string): string {
  // This will be populated from environment variables
  const planTier = PLAN_TIER_MAPPING[priceId];
  return planTier || 'free';
}

// Function to initialize plan tier mapping from environment variables
export function initializePlanTierMapping(env: Env) {
  if (env.STRIPE_PRO_LIMITED_PRICE_ID) {
    PLAN_TIER_MAPPING[env.STRIPE_PRO_LIMITED_PRICE_ID] = 'pro_limited';
  }
  if (env.STRIPE_PRO_UNLIMITED_PRICE_ID) {
    PLAN_TIER_MAPPING[env.STRIPE_PRO_UNLIMITED_PRICE_ID] = 'pro_unlimited';
  }
  console.log('Plan tier mapping initialized:', PLAN_TIER_MAPPING);
} 