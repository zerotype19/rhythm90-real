import { Env } from './types';
import { verifyAuth } from './auth';
import { jsonResponse, errorResponse } from './utils';

export async function checkUsageLimit(request: Request, env: Env, toolName: string): Promise<{ allowed: boolean; reason?: string; usage?: any }> {
  try {
    const authResult = await verifyAuth(request, env);
    if (!authResult.success) {
      return { allowed: false, reason: 'Unauthorized' };
    }

    const { user } = authResult;

    // Get user's current plan and trial status
    const userResult = await env.DB.prepare(`
      SELECT plan_tier, trial_end_date, created_at 
      FROM users 
      WHERE id = ?
    `).bind(user.id).first<{
      plan_tier: string;
      trial_end_date: string | null;
      created_at: string;
    }>();

    if (!userResult) {
      return { allowed: false, reason: 'User not found' };
    }

    const { plan_tier, trial_end_date, created_at } = userResult;
    const now = new Date();
    const accountCreated = new Date(created_at);
    const trialEnd = trial_end_date ? new Date(trial_end_date) : null;

    // Check if user is in trial period
    const isInTrial = trialEnd && now < trialEnd;

    // Check if user is within 15 days of account creation (free tier limit)
    const daysSinceCreation = Math.floor((now.getTime() - accountCreated.getTime()) / (1000 * 60 * 60 * 24));
    const isWithinFreePeriod = daysSinceCreation < 15;

    // Free tier: check both time and usage limits
    if (plan_tier === 'free') {
      if (!isInTrial && !isWithinFreePeriod) {
        return { 
          allowed: false, 
          reason: 'Free trial expired. Please upgrade to continue using this tool.' 
        };
      }

      // Check usage for free tier (0 uses allowed)
      const usage = await getCurrentUsage(user.id, toolName, env);
      if (usage.count > 0) {
        return { 
          allowed: false, 
          reason: 'Free tier usage limit reached. Please upgrade to continue using this tool.',
          usage 
        };
      }
    }

    // Pro Limited tier: check usage limits
    if (plan_tier === 'pro_limited') {
      const usage = await getCurrentUsage(user.id, toolName, env);
      if (usage.count >= 100) {
        return { 
          allowed: false, 
          reason: 'Monthly usage limit reached. Please upgrade to Pro Unlimited for unlimited usage.',
          usage 
        };
      }
    }

    // Pro Unlimited tier: no limits
    if (plan_tier === 'pro_unlimited') {
      return { allowed: true };
    }

    return { allowed: true };
  } catch (error) {
    console.error('checkUsageLimit: Error:', error);
    return { allowed: false, reason: 'Error checking usage limits' };
  }
}

export async function recordUsage(request: Request, env: Env, toolName: string): Promise<Response> {
  try {
    const authResult = await verifyAuth(request, env);
    if (!authResult.success) {
      return errorResponse('Unauthorized', 401);
    }

    const { user } = authResult;
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month

    // Check if usage record exists for this period
    const existingUsage = await env.DB.prepare(`
      SELECT id, usage_count 
      FROM usage_logs 
      WHERE user_id = ? AND tool_name = ? AND period_start = ? AND period_end = ?
    `).bind(user.id, toolName, periodStart.toISOString(), periodEnd.toISOString()).first<{
      id: string;
      usage_count: number;
    }>();

    if (existingUsage) {
      // Update existing usage record
      await env.DB.prepare(`
        UPDATE usage_logs 
        SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(existingUsage.id).run();
    } else {
      // Create new usage record
      const usageId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO usage_logs (id, user_id, tool_name, usage_count, period_start, period_end)
        VALUES (?, ?, ?, 1, ?, ?)
      `).bind(usageId, user.id, toolName, periodStart.toISOString(), periodEnd.toISOString()).run();
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('recordUsage: Error:', error);
    return errorResponse('Failed to record usage', 500);
  }
}

export async function getCurrentUsage(userId: string, toolName: string, env: Env): Promise<{ count: number; period_start: string; period_end: string }> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const usage = await env.DB.prepare(`
    SELECT usage_count, period_start, period_end
    FROM usage_logs 
    WHERE user_id = ? AND tool_name = ? AND period_start = ? AND period_end = ?
  `).bind(userId, toolName, periodStart.toISOString(), periodEnd.toISOString()).first<{
    usage_count: number;
    period_start: string;
    period_end: string;
  }>();

  return usage || { count: 0, period_start: periodStart.toISOString(), period_end: periodEnd.toISOString() };
}

export async function getUserUsageSummary(request: Request, env: Env): Promise<Response> {
  try {
    const authResult = await verifyAuth(request, env);
    if (!authResult.success) {
      return errorResponse('Unauthorized', 401);
    }

    const { user } = authResult;
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all usage for current month
    const usage = await env.DB.prepare(`
      SELECT tool_name, usage_count
      FROM usage_logs 
      WHERE user_id = ? AND period_start = ? AND period_end = ?
      ORDER BY tool_name
    `).bind(user.id, periodStart.toISOString(), periodEnd.toISOString()).all<{
      tool_name: string;
      usage_count: number;
    }>();

    // Get user's plan info
    const userResult = await env.DB.prepare(`
      SELECT plan_tier, trial_end_date
      FROM users 
      WHERE id = ?
    `).bind(user.id).first<{
      plan_tier: string;
      trial_end_date: string | null;
    }>();

    return jsonResponse({
      usage: usage.results,
      plan_tier: userResult?.plan_tier || 'free',
      trial_end_date: userResult?.trial_end_date,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString()
    });
  } catch (error) {
    console.error('getUserUsageSummary: Error:', error);
    return errorResponse('Failed to get usage summary', 500);
  }
} 