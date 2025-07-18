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
    
    const user = await verifyAuth(request, env);
    if (!user) {
      console.log('handleGetPortalLink: Unauthorized');
      return errorResponse('Unauthorized', 401);
    }
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
    
    const user = await verifyAuth(request, env);
    if (!user) {
      console.log('handleCreateCheckoutSession: Unauthorized');
      return errorResponse('Unauthorized', 401);
    }
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

    // Create checkout session with trial
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
      subscription_data: {
        trial_period_days: 15,
        metadata: {
          user_id: user.id
        }
      },
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
    
    const user = await verifyAuth(request, env);
    if (!user) {
      console.log('handleGetSubscriptionStatus: Unauthorized');
      return errorResponse('Unauthorized', 401);
    }
    console.log('handleGetSubscriptionStatus: User authenticated:', user.id);

    // Get user's subscription and payment status
    const userResult = await env.DB.prepare(
      'SELECT plan_tier, payment_status, trial_end_date, stripe_customer_id FROM users WHERE id = ?'
    ).bind(user.id).first<{ 
      plan_tier: string | null, 
      payment_status: string, 
      trial_end_date: string | null,
      stripe_customer_id: string | null 
    }>();

    if (!userResult) {
      console.log('handleGetSubscriptionStatus: User not found');
      return errorResponse('User not found', 404);
    }

    const { plan_tier, payment_status, trial_end_date, stripe_customer_id } = userResult;

    // If no Stripe customer, return free plan status
    if (!stripe_customer_id) {
      console.log('handleGetSubscriptionStatus: No Stripe customer found');
      return jsonResponse({
        status: payment_status,
        plan: plan_tier || 'free',
        customerId: null,
        trialEndDate: trial_end_date
      });
    }

    try {
      // Get customer's subscriptions
      const subscriptions = await getStripeClient(env.STRIPE_SECRET_KEY).subscriptions.list({
        customer: stripe_customer_id,
        status: 'all',
        limit: 1
      });
      
      logStripeCall('subscriptions.list', { customer: stripe_customer_id }, subscriptions);

      if (subscriptions.data.length === 0) {
        console.log('handleGetSubscriptionStatus: No subscriptions found');
        return jsonResponse({
          status: payment_status,
          plan: plan_tier || 'free',
          customerId: stripe_customer_id,
          trialEndDate: trial_end_date
        });
      }

      const subscription = subscriptions.data[0];
      
      console.log('handleGetSubscriptionStatus: Found subscription:', subscription.status, plan_tier);
      
      return jsonResponse({
        status: subscription.status,
        plan: plan_tier || 'free',
        customerId: stripe_customer_id,
        subscriptionId: subscription.id,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEndDate: trial_end_date
      });
    } catch (error) {
      console.error('handleGetSubscriptionStatus: Failed to get subscriptions:', error);
      logStripeCall('subscriptions.list', { customer: stripe_customer_id }, null, error);
      return errorResponse('Failed to get subscription status', 500);
    }
  } catch (error) {
    console.error('handleGetSubscriptionStatus: Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Usage tracking functions
export async function handleGetUsageSummary(request: Request, env: Env): Promise<Response> {
  try {
    console.log('handleGetUsageSummary: Starting');
    
    const user = await verifyAuth(request, env);
    if (!user) {
      console.log('handleGetUsageSummary: Unauthorized');
      return errorResponse('Unauthorized', 401);
    }
    console.log('handleGetUsageSummary: User authenticated:', user.id);

    // Get user's plan tier
    const userResult = await env.DB.prepare(
      'SELECT plan_tier FROM users WHERE id = ?'
    ).bind(user.id).first<{ plan_tier: string | null }>();

    if (!userResult) {
      return errorResponse('User not found', 404);
    }

    const planTier = userResult.plan_tier || 'free';
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Get usage for current month
    const usageResult = await env.DB.prepare(`
      SELECT tool_name, COUNT(*) as used
      FROM ai_usage_logs 
      WHERE user_id = ? 
      AND timestamp >= ? 
      AND timestamp < ?
      GROUP BY tool_name
    `).bind(user.id, `${currentMonth}-01 00:00:00`, `${currentMonth}-32 00:00:00`).all<{ tool_name: string, used: number }>();

    // Initialize usage summary
    const usageSummary = {
      play_builder: { used: 0, limit: planTier === 'pro_unlimited' ? -1 : 100 },
      signal_lab: { used: 0, limit: planTier === 'pro_unlimited' ? -1 : 100 },
      ritual_guide: { used: 0, limit: planTier === 'pro_unlimited' ? -1 : 100 }
    };

    // Populate with actual usage
    usageResult.results.forEach(row => {
      if (row.tool_name in usageSummary) {
        usageSummary[row.tool_name as keyof typeof usageSummary].used = row.used;
      }
    });

    console.log('handleGetUsageSummary: Returning usage summary for plan:', planTier);
    return jsonResponse({
      planTier,
      usageSummary,
      currentMonth
    });
  } catch (error) {
    console.error('handleGetUsageSummary: Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function handleLogUsage(request: Request, env: Env): Promise<Response> {
  try {
    console.log('handleLogUsage: Starting');
    
    const user = await verifyAuth(request, env);
    if (!user) {
      console.log('handleLogUsage: Unauthorized');
      return errorResponse('Unauthorized', 401);
    }
    const body = await request.json();
    const { toolName } = body;

    if (!toolName || !['play_builder', 'signal_lab', 'ritual_guide'].includes(toolName)) {
      return errorResponse('Invalid tool name', 400);
    }

    // Check usage limits before logging
    const usageCheck = await checkUsageLimit(user.id, toolName, env);
    if (usageCheck.status === 'over_limit') {
      return jsonResponse({
        success: false,
        status: 'over_limit',
        message: 'Usage limit reached'
      });
    }

    // Log the usage
    await env.DB.prepare(`
      INSERT INTO ai_usage_logs (user_id, tool_name, timestamp)
      VALUES (?, ?, datetime('now'))
    `).bind(user.id, toolName).run();

    console.log('handleLogUsage: Logged usage for tool:', toolName);
    return jsonResponse({
      success: true,
      status: usageCheck.status
    });
  } catch (error) {
    console.error('handleLogUsage: Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function checkUsageLimit(userId: string, toolName: string, env: Env): Promise<{
  status: 'ok' | 'near_limit' | 'over_limit';
  used: number;
  limit: number;
}> {
  try {
    // Get user's plan tier
    const userResult = await env.DB.prepare(
      'SELECT plan_tier FROM users WHERE id = ?'
    ).bind(userId).first<{ plan_tier: string | null }>();

    if (!userResult) {
      throw new Error('User not found');
    }

    const planTier = userResult.plan_tier || 'free';
    
    // Free tier has no usage after trial
    if (planTier === 'free') {
      return { status: 'over_limit', used: 0, limit: 0 };
    }

    // Pro Unlimited has no limits
    if (planTier === 'pro_unlimited') {
      return { status: 'ok', used: 0, limit: -1 };
    }

    // Pro Limited has 100 uses per tool per month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usageResult = await env.DB.prepare(`
      SELECT COUNT(*) as used
      FROM ai_usage_logs 
      WHERE user_id = ? 
      AND tool_name = ?
      AND timestamp >= ? 
      AND timestamp < ?
    `).bind(userId, toolName, `${currentMonth}-01 00:00:00`, `${currentMonth}-32 00:00:00`).first<{ used: number }>();

    const used = usageResult?.used || 0;
    const limit = 100;

    if (used >= limit) {
      return { status: 'over_limit', used, limit };
    } else if (used >= limit * 0.8) { // 80% threshold
      return { status: 'near_limit', used, limit };
    } else {
      return { status: 'ok', used, limit };
    }
  } catch (error) {
    console.error('checkUsageLimit: Error:', error);
    return { status: 'ok', used: 0, limit: 100 }; // Default to allowing usage on error
  }
} 