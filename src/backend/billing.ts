import { Env } from './types';
import { verifyAuth } from './auth';
import { jsonResponse, errorResponse } from './utils';
import { getStripeClient } from './stripe';

// Debug logging for Stripe API calls
let lastStripeDebugLog: any = null;

function logStripeCall(endpoint: string, payload: any, response: any, error?: any) {
  lastStripeDebugLog = {
    timestamp: new Date().toISOString(),
    endpoint,
    payload: payload ? JSON.stringify(payload, null, 2) : null,
    response: response ? JSON.stringify(response, null, 2) : null,
    error: error ? error.message : null
  };
  console.log('Stripe API Call:', lastStripeDebugLog);
}

export function getLastStripeDebugLog() {
  return lastStripeDebugLog;
}

export async function handleGetPortalLink(request: Request, env: Env): Promise<Response> {
  try {
    console.log('handleGetPortalLink: Starting');
    
    const authResult = await verifyAuth(request, env);
    if (!authResult.success) {
      console.log('handleGetPortalLink: Unauthorized');
      return errorResponse('Unauthorized', 401);
    }

    const { user } = authResult;
    console.log('handleGetPortalLink: User authenticated:', user.id);

    // Get user's Stripe customer ID
    const userResult = await env.DB.prepare(
      'SELECT stripe_customer_id FROM users WHERE id = ?'
    ).bind(user.id).first<{ stripe_customer_id: string | null }>();

    if (!userResult) {
      console.log('handleGetPortalLink: User not found');
      return errorResponse('User not found', 404);
    }

    let customerId = userResult.stripe_customer_id;

    // If no customer ID exists, create a new Stripe customer
    if (!customerId) {
      console.log('handleGetPortalLink: Creating new Stripe customer');
      
      const customerPayload = {
        email: user.email,
        name: user.name,
        metadata: {
          user_id: user.id
        }
      };

      try {
        const customer = await getStripeClient(env.STRIPE_SECRET_KEY).customers.create(customerPayload);
        logStripeCall('customers.create', customerPayload, customer);
        
        customerId = customer.id;
        
        // Store the customer ID in the database
        await env.DB.prepare(
          'UPDATE users SET stripe_customer_id = ? WHERE id = ?'
        ).bind(customerId, user.id).run();
        
        console.log('handleGetPortalLink: Created and stored customer ID:', customerId);
      } catch (error) {
        console.error('handleGetPortalLink: Failed to create Stripe customer:', error);
        logStripeCall('customers.create', customerPayload, null, error);
        return errorResponse('Failed to create billing account', 500);
      }
    }

    // Create portal session
    const portalPayload = {
      customer: customerId,
      return_url: `${env.APP_URL}/app/settings?tab=billing`
    };

    try {
      const session = await getStripeClient(env.STRIPE_SECRET_KEY).billingPortal.sessions.create(portalPayload);
      logStripeCall('billingPortal.sessions.create', portalPayload, session);
      
      console.log('handleGetPortalLink: Created portal session');
      return jsonResponse({ url: session.url });
    } catch (error) {
      console.error('handleGetPortalLink: Failed to create portal session:', error);
      logStripeCall('billingPortal.sessions.create', portalPayload, null, error);
      return errorResponse('Failed to create billing portal session', 500);
    }
  } catch (error) {
    console.error('handleGetPortalLink: Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function handleCreateCheckoutSession(request: Request, env: Env): Promise<Response> {
  try {
    console.log('handleCreateCheckoutSession: Starting');
    
    const authResult = await verifyAuth(request, env);
    if (!authResult.success) {
      console.log('handleCreateCheckoutSession: Unauthorized');
      return errorResponse('Unauthorized', 401);
    }

    const { user } = authResult;
    console.log('handleCreateCheckoutSession: User authenticated:', user.id);

    const body = await request.json();
    const { priceId, successUrl, cancelUrl } = body;

    if (!priceId) {
      return errorResponse('Price ID is required', 400);
    }

    // Get user's Stripe customer ID
    const userResult = await env.DB.prepare(
      'SELECT stripe_customer_id FROM users WHERE id = ?'
    ).bind(user.id).first<{ stripe_customer_id: string | null }>();

    if (!userResult) {
      console.log('handleCreateCheckoutSession: User not found');
      return errorResponse('User not found', 404);
    }

    let customerId = userResult.stripe_customer_id;

    // If no customer ID exists, create a new Stripe customer
    if (!customerId) {
      console.log('handleCreateCheckoutSession: Creating new Stripe customer');
      
      const customerPayload = {
        email: user.email,
        name: user.name,
        metadata: {
          user_id: user.id
        }
      };

      try {
        const customer = await getStripeClient(env.STRIPE_SECRET_KEY).customers.create(customerPayload);
        logStripeCall('customers.create', customerPayload, customer);
        
        customerId = customer.id;
        
        // Store the customer ID in the database
        await env.DB.prepare(
          'UPDATE users SET stripe_customer_id = ? WHERE id = ?'
        ).bind(customerId, user.id).run();
        
        console.log('handleCreateCheckoutSession: Created and stored customer ID:', customerId);
      } catch (error) {
        console.error('handleCreateCheckoutSession: Failed to create Stripe customer:', error);
        logStripeCall('customers.create', customerPayload, null, error);
        return errorResponse('Failed to create billing account', 500);
      }
    }

    // Create checkout session
    const checkoutPayload = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${env.APP_URL}/app/settings?tab=billing&success=true`,
      cancel_url: cancelUrl || `${env.APP_URL}/app/settings?tab=billing&canceled=true`,
      metadata: {
        user_id: user.id
      }
    };

    try {
      const session = await getStripeClient(env.STRIPE_SECRET_KEY).checkout.sessions.create(checkoutPayload);
      logStripeCall('checkout.sessions.create', checkoutPayload, session);
      
      console.log('handleCreateCheckoutSession: Created checkout session');
      return jsonResponse({ 
        url: session.url,
        sessionId: session.id 
      });
    } catch (error) {
      console.error('handleCreateCheckoutSession: Failed to create checkout session:', error);
      logStripeCall('checkout.sessions.create', checkoutPayload, null, error);
      return errorResponse('Failed to create checkout session', 500);
    }
  } catch (error) {
    console.error('handleCreateCheckoutSession: Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function handleGetSubscriptionStatus(request: Request, env: Env): Promise<Response> {
  try {
    console.log('handleGetSubscriptionStatus: Starting');
    
    const authResult = await verifyAuth(request, env);
    if (!authResult.success) {
      console.log('handleGetSubscriptionStatus: Unauthorized');
      return errorResponse('Unauthorized', 401);
    }

    const { user } = authResult;
    console.log('handleGetSubscriptionStatus: User authenticated:', user.id);

    // Get user's Stripe customer ID
    const userResult = await env.DB.prepare(
      'SELECT stripe_customer_id FROM users WHERE id = ?'
    ).bind(user.id).first<{ stripe_customer_id: string | null }>();

    if (!userResult || !userResult.stripe_customer_id) {
      console.log('handleGetSubscriptionStatus: No Stripe customer found');
      return jsonResponse({
        status: 'no_subscription',
        plan: 'free',
        customerId: null
      });
    }

    const customerId = userResult.stripe_customer_id;

    try {
      // Get customer's subscriptions
      const subscriptions = await getStripeClient(env.STRIPE_SECRET_KEY).subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 1
      });
      
      logStripeCall('subscriptions.list', { customer: customerId }, subscriptions);

      if (subscriptions.data.length === 0) {
        console.log('handleGetSubscriptionStatus: No subscriptions found');
        return jsonResponse({
          status: 'no_subscription',
          plan: 'free',
          customerId
        });
      }

      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0]?.price.id;
      
      // Map price ID to plan name (you'll need to configure this based on your Stripe products)
      let plan = 'unknown';
      if (priceId) {
        // This is a simplified mapping - you should configure this based on your actual Stripe price IDs
        if (priceId.includes('pro')) {
          plan = 'pro';
        } else if (priceId.includes('enterprise')) {
          plan = 'enterprise';
        } else if (priceId.includes('team')) {
          plan = 'team';
        }
      }

      console.log('handleGetSubscriptionStatus: Found subscription:', subscription.status, plan);
      
      return jsonResponse({
        status: subscription.status,
        plan,
        customerId,
        subscriptionId: subscription.id,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      });
    } catch (error) {
      console.error('handleGetSubscriptionStatus: Failed to get subscriptions:', error);
      logStripeCall('subscriptions.list', { customer: customerId }, null, error);
      return errorResponse('Failed to get subscription status', 500);
    }
  } catch (error) {
    console.error('handleGetSubscriptionStatus: Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
} 