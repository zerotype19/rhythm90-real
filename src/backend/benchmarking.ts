import { Env } from './types';
import { jsonResponse, errorResponse } from './utils';
import { verifyAuth } from './auth';

interface BenchmarkMetric {
  id: string;
  team_id: string;
  metric_name: string;
  metric_value: number;
  period_start: string;
  period_end: string;
  updated_at: string;
}

interface TeamBenchmarks {
  team_metrics: BenchmarkMetric[];
  industry_metrics: {
    metric_name: string;
    average_value: number;
    min_value: number;
    max_value: number;
    team_count: number;
  }[];
}

let lastBenchmarkDebugLog: any = null;

export const getLastBenchmarkDebugLog = () => lastBenchmarkDebugLog;

// Calculate team metrics for a given period
export const calculateTeamMetrics = async (env: Env, teamId: string, periodStart: string, periodEnd: string): Promise<BenchmarkMetric[]> => {
  console.log(`calculateTeamMetrics: Starting calculation for team ${teamId}, period ${periodStart} to ${periodEnd}`);
  
  const metrics: BenchmarkMetric[] = [];
  
  try {
    // 1. Plays created (count)
    const playsResult = await env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM ai_saved_responses 
      WHERE team_id = ? 
      AND tool_name = 'Play Builder'
      AND DATE(created_at) >= ? 
      AND DATE(created_at) <= ?
    `).bind(teamId, periodStart, periodEnd).first();
    
    const playsCount = playsResult?.count || 0;
    metrics.push({
      id: crypto.randomUUID(),
      team_id: teamId,
      metric_name: 'plays_created',
      metric_value: playsCount,
      period_start: periodStart,
      period_end: periodEnd,
      updated_at: new Date().toISOString()
    });
    
    // 2. Signals logged (count)
    const signalsResult = await env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM ai_saved_responses 
      WHERE team_id = ? 
      AND tool_name = 'Signal Lab'
      AND DATE(created_at) >= ? 
      AND DATE(created_at) <= ?
    `).bind(teamId, periodStart, periodEnd).first();
    
    const signalsCount = signalsResult?.count || 0;
    metrics.push({
      id: crypto.randomUUID(),
      team_id: teamId,
      metric_name: 'signals_logged',
      metric_value: signalsCount,
      period_start: periodStart,
      period_end: periodEnd,
      updated_at: new Date().toISOString()
    });
    
    // 3. Rituals completed (count)
    const ritualsResult = await env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM ai_saved_responses 
      WHERE team_id = ? 
      AND tool_name = 'Ritual Guide'
      AND DATE(created_at) >= ? 
      AND DATE(created_at) <= ?
    `).bind(teamId, periodStart, periodEnd).first();
    
    const ritualsCount = ritualsResult?.count || 0;
    metrics.push({
      id: crypto.randomUUID(),
      team_id: teamId,
      metric_name: 'rituals_completed',
      metric_value: ritualsCount,
      period_start: periodStart,
      period_end: periodEnd,
      updated_at: new Date().toISOString()
    });
    
    // 4. Shared responses (count)
    const sharedResult = await env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM ai_saved_responses 
      WHERE team_id = ? 
      AND (is_shared_team = 1 OR is_shared_public = 1)
      AND DATE(created_at) >= ? 
      AND DATE(created_at) <= ?
    `).bind(teamId, periodStart, periodEnd).first();
    
    const sharedCount = sharedResult?.count || 0;
    metrics.push({
      id: crypto.randomUUID(),
      team_id: teamId,
      metric_name: 'shared_responses',
      metric_value: sharedCount,
      period_start: periodStart,
      period_end: periodEnd,
      updated_at: new Date().toISOString()
    });
    
    // 5. Team engagement (unique users active)
    const engagementResult = await env.DB.prepare(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM ai_saved_responses 
      WHERE team_id = ? 
      AND DATE(created_at) >= ? 
      AND DATE(created_at) <= ?
    `).bind(teamId, periodStart, periodEnd).first();
    
    const engagementCount = engagementResult?.count || 0;
    metrics.push({
      id: crypto.randomUUID(),
      team_id: teamId,
      metric_name: 'team_engagement',
      metric_value: engagementCount,
      period_start: periodStart,
      period_end: periodEnd,
      updated_at: new Date().toISOString()
    });
    
    console.log(`calculateTeamMetrics: Calculated ${metrics.length} metrics for team ${teamId}`);
    return metrics;
    
  } catch (error) {
    console.error('calculateTeamMetrics: Error calculating metrics:', error);
    throw error;
  }
};

// Save metrics to database
export const saveTeamMetrics = async (env: Env, metrics: BenchmarkMetric[]): Promise<void> => {
  console.log(`saveTeamMetrics: Saving ${metrics.length} metrics to database`);
  
  try {
    const stmt = env.DB.prepare(`
      INSERT OR REPLACE INTO team_benchmarks 
      (id, team_id, metric_name, metric_value, period_start, period_end, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const batch = metrics.map(metric => 
      stmt.bind(
        metric.id,
        metric.team_id,
        metric.metric_name,
        metric.metric_value,
        metric.period_start,
        metric.period_end,
        metric.updated_at
      )
    );
    
    await env.DB.batch(batch);
    console.log(`saveTeamMetrics: Successfully saved ${metrics.length} metrics`);
    
  } catch (error) {
    console.error('saveTeamMetrics: Error saving metrics:', error);
    throw error;
  }
};

// Get team benchmarks for a specific period
export const getTeamBenchmarks = async (env: Env, teamId: string, periodStart: string, periodEnd: string): Promise<BenchmarkMetric[]> => {
  console.log(`getTeamBenchmarks: Fetching benchmarks for team ${teamId}, period ${periodStart} to ${periodEnd}`);
  
  try {
    const result = await env.DB.prepare(`
      SELECT id, team_id, metric_name, metric_value, period_start, period_end, updated_at
      FROM team_benchmarks 
      WHERE team_id = ? 
      AND period_start = ? 
      AND period_end = ?
      ORDER BY metric_name
    `).bind(teamId, periodStart, periodEnd).all();
    
    const benchmarks = result.results as BenchmarkMetric[];
    console.log(`getTeamBenchmarks: Found ${benchmarks.length} benchmarks for team ${teamId}`);
    return benchmarks;
    
  } catch (error) {
    console.error('getTeamBenchmarks: Error fetching benchmarks:', error);
    throw error;
  }
};

// Get industry benchmarks (anonymized, aggregated)
export const getIndustryBenchmarks = async (env: Env, periodStart: string, periodEnd: string): Promise<any[]> => {
  console.log(`getIndustryBenchmarks: Fetching industry benchmarks for period ${periodStart} to ${periodEnd}`);
  
  try {
    const result = await env.DB.prepare(`
      SELECT 
        metric_name,
        AVG(metric_value) as average_value,
        MIN(metric_value) as min_value,
        MAX(metric_value) as max_value,
        COUNT(DISTINCT team_id) as team_count
      FROM team_benchmarks 
      WHERE period_start = ? 
      AND period_end = ?
      GROUP BY metric_name
      ORDER BY metric_name
    `).bind(periodStart, periodEnd).all();
    
    const benchmarks = result.results;
    console.log(`getIndustryBenchmarks: Found ${benchmarks.length} industry benchmark categories`);
    return benchmarks;
    
  } catch (error) {
    console.error('getIndustryBenchmarks: Error fetching industry benchmarks:', error);
    throw error;
  }
};

// API Handlers
export const handleGetTeamBenchmarks = async (request: Request, env: Env): Promise<Response> => {
  console.log('handleGetTeamBenchmarks: Starting');
  lastBenchmarkDebugLog = { endpoint: '/api/benchmarking/team', timestamp: new Date().toISOString() };
  
  try {
    // Verify authentication
    const user = await verifyAuth(request, env);
    if (!user) {
      console.log('handleGetTeamBenchmarks: Unauthorized');
      return errorResponse('Unauthorized', 401);
    }
    
    // Get user's team
    const teamResult = await env.DB.prepare(`
      SELECT team_id FROM team_members WHERE user_id = ?
    `).bind(user.id).first();
    
    if (!teamResult?.team_id) {
      console.log('handleGetTeamBenchmarks: User not in team');
      return errorResponse('User not in team', 400);
    }
    
    const teamId = teamResult.team_id;
    
    // Parse query parameters
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '30d'; // Default to 30 days
    
    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'all':
        startDate = new Date('2020-01-01'); // Far back date for "all time"
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    const periodStart = startDate.toISOString().split('T')[0];
    const periodEnd = endDate.toISOString().split('T')[0];
    
    console.log(`handleGetTeamBenchmarks: Period ${period}, range ${periodStart} to ${periodEnd}`);
    
    // Get existing benchmarks or calculate new ones
    let teamMetrics = await getTeamBenchmarks(env, teamId, periodStart, periodEnd);
    
    // If no benchmarks exist for this period, calculate them
    if (teamMetrics.length === 0) {
      console.log('handleGetTeamBenchmarks: No existing benchmarks, calculating new ones');
      teamMetrics = await calculateTeamMetrics(env, teamId, periodStart, periodEnd);
      await saveTeamMetrics(env, teamMetrics);
    }
    
    // Get industry benchmarks
    const industryMetrics = await getIndustryBenchmarks(env, periodStart, periodEnd);
    
    const response: TeamBenchmarks = {
      team_metrics: teamMetrics,
      industry_metrics: industryMetrics
    };
    
    lastBenchmarkDebugLog = {
      ...lastBenchmarkDebugLog,
      team_id: teamId,
      period,
      period_start: periodStart,
      period_end: periodEnd,
      team_metrics_count: teamMetrics.length,
      industry_metrics_count: industryMetrics.length,
      success: true
    };
    
    console.log('handleGetTeamBenchmarks: Success');
    return jsonResponse(response);
    
  } catch (error) {
    console.error('handleGetTeamBenchmarks: Error:', error);
    lastBenchmarkDebugLog = {
      ...lastBenchmarkDebugLog,
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    };
    return errorResponse('Failed to fetch team benchmarks', 500);
  }
};

export const handleGetIndustryBenchmarks = async (request: Request, env: Env): Promise<Response> => {
  console.log('handleGetIndustryBenchmarks: Starting');
  lastBenchmarkDebugLog = { endpoint: '/api/benchmarking/industry', timestamp: new Date().toISOString() };
  
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '30d';
    
    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    const periodStart = startDate.toISOString().split('T')[0];
    const periodEnd = endDate.toISOString().split('T')[0];
    
    console.log(`handleGetIndustryBenchmarks: Period ${period}, range ${periodStart} to ${periodEnd}`);
    
    // Get industry benchmarks
    const industryMetrics = await getIndustryBenchmarks(env, periodStart, periodEnd);
    
    lastBenchmarkDebugLog = {
      ...lastBenchmarkDebugLog,
      period,
      period_start: periodStart,
      period_end: periodEnd,
      industry_metrics_count: industryMetrics.length,
      success: true
    };
    
    console.log('handleGetIndustryBenchmarks: Success');
    return jsonResponse({ industry_metrics: industryMetrics });
    
  } catch (error) {
    console.error('handleGetIndustryBenchmarks: Error:', error);
    lastBenchmarkDebugLog = {
      ...lastBenchmarkDebugLog,
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    };
    return errorResponse('Failed to fetch industry benchmarks', 500);
  }
}; 