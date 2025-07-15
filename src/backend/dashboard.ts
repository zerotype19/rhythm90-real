import { verifyAuth, getUserFromToken } from './auth';
import { Env } from './types';
import { jsonResponse, errorResponse } from './utils';

// Utility: Only allow Kevin as admin
function isKevin(email: string) {
  return email === 'kevin.mcgovern@gmail.com';
}

// Debug log helper
function debugLog(env: Env, msg: string, meta?: any) {
  if (env && env.DEBUG) {
    // eslint-disable-next-line no-console
    console.log(`[dashboard] ${msg}`, meta || '');
  }
}

// GET /api/dashboard/overview
export async function handleDashboardOverview(request: Request, env: Env, ctx: any) {
  try {
    const user = await verifyAuth(request, env);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }
    
    // Get user's team_id from team_members table
    const teamMember = await env.DB.prepare(`
      SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1
    `).bind(user.id).first();
    
    if (!teamMember?.team_id) {
      return errorResponse('User must belong to a team', 400);
    }
    
    const teamId = teamMember.team_id;
    debugLog(env, 'Dashboard overview requested', { user, teamId });

  // Team stats (last 30d)
  const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const periodEnd = new Date().toISOString().slice(0, 10);

  // Get tool usage from ai_usage_logs (team-wide, last 30d)
  const toolUsage = await env.DB.prepare(`
    SELECT 
      SUM(CASE WHEN tool_name = 'play_builder' THEN 1 ELSE 0 END) as plays_created,
      SUM(CASE WHEN tool_name = 'ritual_guide' THEN 1 ELSE 0 END) as rituals_completed,
      SUM(CASE WHEN tool_name = 'signal_lab' THEN 1 ELSE 0 END) as signals_logged
    FROM ai_usage_logs aul
    JOIN team_members tm ON aul.user_id = tm.user_id
    WHERE tm.team_id = ?
      AND DATE(aul.timestamp) >= ?
      AND DATE(aul.timestamp) <= ?
  `).bind(teamId, periodStart, periodEnd).first();

  // Get saved responses count (user-specific, last 30d)
  const savedResponses = await env.DB.prepare(`
    SELECT COUNT(*) as saved_responses
    FROM ai_saved_responses
    WHERE user_id = ?
      AND DATE(created_at) >= ?
      AND DATE(created_at) <= ?
  `).bind(user.id, periodStart, periodEnd).first();

  // Get team shared count (team-wide, last 30d)
  const teamShared = await env.DB.prepare(`
    SELECT COUNT(*) as team_shared
    FROM ai_saved_responses
    WHERE team_id = ?
      AND is_shared_team = 1
      AND DATE(created_at) >= ?
      AND DATE(created_at) <= ?
  `).bind(teamId, periodStart, periodEnd).first();



  // Personal activity (last 5 actions)
  const personal = await env.DB.prepare(`
    SELECT * FROM ai_usage_logs
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT 5
  `).bind(user.id).all();

  // Team activity (last 5 shared or favorited items, all team members)
  const team = await env.DB.prepare(`
    SELECT 
      asr.id,
      asr.tool_name,
      asr.summary,
      asr.shared_slug,
      asr.is_favorite,
      asr.is_shared_team,
      asr.created_at as timestamp,
      u.name as user_name,
      u.id as user_id
    FROM ai_saved_responses asr
    JOIN team_members tm ON asr.user_id = tm.user_id
    JOIN users u ON asr.user_id = u.id
    WHERE tm.team_id = ?
      AND (asr.is_shared_team = 1 OR asr.is_favorite = 1)
    ORDER BY asr.created_at DESC
    LIMIT 5
  `).bind(teamId).all();

  // Active dashboard announcements
  const announcements = await env.DB.prepare(`
    SELECT 
      id,
      title,
      content as summary,
      content as body,
      link,
      created_at,
      author_email,
      is_active,
      created_at as updated_at
    FROM dashboard_announcements
    WHERE is_active = 1
    ORDER BY created_at DESC
  `).all();

  debugLog(env, 'Dashboard overview data', { toolUsage, savedResponses, teamShared, personal, team, announcements });

  return jsonResponse({
    stats: {
      totalSavedResponses: savedResponses?.saved_responses || 0,
      totalTeamShared: teamShared?.team_shared || 0,
      topTools: [
        { toolName: 'Play Builder', count: toolUsage?.plays_created || 0 },
        { toolName: 'Signal Lab', count: toolUsage?.signals_logged || 0 },
        { toolName: 'Ritual Guide', count: toolUsage?.rituals_completed || 0 }
      ]
    },
    teamActivity: team.results?.map((activity: any) => ({
      id: activity.id || crypto.randomUUID(),
      userName: activity.user_name || 'Unknown User',
      action: activity.is_shared_team ? 'shared' : 'favorited',
      toolName: activity.tool_name || 'Unknown Tool',
      summary: activity.summary || '',
      sharedSlug: activity.shared_slug || '',
      timestamp: activity.timestamp,
      responseId: activity.id
    })) || [],
    announcements: announcements.results || [],
  });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// GET /api/dashboard/announcements
export async function handleGetAnnouncements(request: Request, env: Env, ctx: any) {
  debugLog(env, 'Get dashboard announcements');
  const rows = await env.DB.prepare(`
    SELECT 
      id,
      title,
      content as summary,
      content as body,
      link,
      created_at,
      author_email,
      is_active,
      created_at as updated_at
    FROM dashboard_announcements
    ORDER BY created_at DESC
  `).all();
  return jsonResponse({ announcements: rows.results });
}

// POST /api/dashboard/announcements
export async function handleCreateAnnouncement(request: Request, env: Env, ctx: any) {
  const user = await verifyAuth(request, env);
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }
  if (!isKevin(user.email)) {
    debugLog(env, 'Unauthorized announcement create attempt', { user });
    return errorResponse('Unauthorized', 403);
  }
  const body = await request.json();
  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO dashboard_announcements (id, title, content, link, created_at, author_email, is_active)
    VALUES (?, ?, ?, ?, datetime('now'), ?, ?)
  `).bind(id, body.title, body.summary || body.body, body.link || null, user.email, body.is_active ? 1 : 0).run();
  debugLog(env, 'Announcement created', { id, ...body });
  return jsonResponse({ success: true, id });
}

// PATCH /api/dashboard/announcements/:id
export async function handleUpdateAnnouncement(request: Request, env: Env, ctx: any, id: string) {
  const user = await verifyAuth(request, env);
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }
  if (!isKevin(user.email)) {
    debugLog(env, 'Unauthorized announcement update attempt', { user });
    return errorResponse('Unauthorized', 403);
  }
  const body = await request.json();
  await env.DB.prepare(`
    UPDATE dashboard_announcements
    SET title = ?, content = ?, link = ?, is_active = ?
    WHERE id = ?
  `).bind(body.title, body.summary || body.body, body.link || null, body.is_active ? 1 : 0, id).run();
  debugLog(env, 'Announcement updated', { id, ...body });
  return jsonResponse({ success: true });
}

// DELETE /api/dashboard/announcements/:id
export async function handleDeleteAnnouncement(request: Request, env: Env, ctx: any, id: string) {
  const user = await verifyAuth(request, env);
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }
  if (!isKevin(user.email)) {
    debugLog(env, 'Unauthorized announcement delete attempt', { user });
    return errorResponse('Unauthorized', 403);
  }
  await env.DB.prepare(`
    DELETE FROM dashboard_announcements WHERE id = ?
  `).bind(id).run();
  debugLog(env, 'Announcement deleted', { id });
  return jsonResponse({ success: true });
} 