import { verifyAuth, getUserFromToken } from './auth';
import { Env } from './types';

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
  const user = await verifyAuth(request, env);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Get user's team_id from team_members table
  const teamMember = await env.DB.prepare(`
    SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1
  `).bind(user.id).first();
  
  if (!teamMember?.team_id) {
    return new Response('User must belong to a team', { status: 400 });
  }
  
  const teamId = teamMember.team_id;
  debugLog(env, 'Dashboard overview requested', { user, teamId });

  // Team stats (last 30d)
  const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const periodEnd = new Date().toISOString().slice(0, 10);

  // Plays, rituals, saved items (team)
  const stats = await env.DB.prepare(`
    SELECT
      SUM(CASE WHEN tool_name = 'Play Builder' THEN 1 ELSE 0 END) as plays_created,
      SUM(CASE WHEN tool_name = 'Ritual Guide' THEN 1 ELSE 0 END) as rituals_completed,
      COUNT(*) as saved_responses
    FROM ai_saved_responses
    WHERE team_id = ?
      AND DATE(created_at) >= ?
      AND DATE(created_at) <= ?
  `).bind(teamId, periodStart, periodEnd).first();

  // Signals logged (from ai_usage_logs) - need to join with team_members to get team_id
  const signals = await env.DB.prepare(`
    SELECT COUNT(*) as signals_logged
    FROM ai_usage_logs aul
    JOIN team_members tm ON aul.user_id = tm.user_id
    WHERE tm.team_id = ?
      AND aul.tool_name = 'Signal Lab'
      AND DATE(aul.timestamp) >= ?
      AND DATE(aul.timestamp) <= ?
  `).bind(teamId, periodStart, periodEnd).first();

  // Personal activity (last 5 actions)
  const personal = await env.DB.prepare(`
    SELECT * FROM ai_usage_logs
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT 5
  `).bind(user.id).all();

  // Team activity (last 5 actions, all team members)
  const team = await env.DB.prepare(`
    SELECT aul.*, u.name as user_name
    FROM ai_usage_logs aul
    JOIN team_members tm ON aul.user_id = tm.user_id
    JOIN users u ON aul.user_id = u.id
    WHERE tm.team_id = ?
    ORDER BY aul.timestamp DESC
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

  debugLog(env, 'Dashboard overview data', { stats, signals, personal, team, announcements });

  return new Response(JSON.stringify({
    stats: {
      totalSavedResponses: stats?.saved_responses || 0,
      totalTeamShared: stats?.saved_responses || 0, // This should be calculated separately
      topTools: [
        { toolName: 'Play Builder', count: stats?.plays_created || 0 },
        { toolName: 'Signal Lab', count: signals?.signals_logged || 0 },
        { toolName: 'Ritual Guide', count: stats?.rituals_completed || 0 }
      ]
    },
    teamActivity: team.results?.map((activity: any) => ({
      id: activity.id || crypto.randomUUID(),
      userName: activity.user_name || 'Unknown User',
      action: 'used',
      toolName: activity.tool_name || 'Unknown Tool',
      timestamp: activity.timestamp,
      responseId: activity.response_id
    })) || [],
    announcements: announcements.results || [],
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
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
  return new Response(JSON.stringify({ announcements: rows.results }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// POST /api/dashboard/announcements
export async function handleCreateAnnouncement(request: Request, env: Env, ctx: any) {
  const user = await verifyAuth(request, env);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (!isKevin(user.email)) {
    debugLog(env, 'Unauthorized announcement create attempt', { user });
    return new Response('Unauthorized', { status: 403 });
  }
  const body = await request.json();
  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO dashboard_announcements (id, title, content, link, created_at, author_email, is_active)
    VALUES (?, ?, ?, ?, datetime('now'), ?, ?)
  `).bind(id, body.title, body.summary || body.body, body.link || null, user.email, body.is_active ? 1 : 0).run();
  debugLog(env, 'Announcement created', { id, ...body });
  return new Response(JSON.stringify({ success: true, id }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// PATCH /api/dashboard/announcements/:id
export async function handleUpdateAnnouncement(request: Request, env: Env, ctx: any, id: string) {
  const user = await verifyAuth(request, env);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (!isKevin(user.email)) {
    debugLog(env, 'Unauthorized announcement update attempt', { user });
    return new Response('Unauthorized', { status: 403 });
  }
  const body = await request.json();
  await env.DB.prepare(`
    UPDATE dashboard_announcements
    SET title = ?, content = ?, link = ?, is_active = ?
    WHERE id = ?
  `).bind(body.title, body.summary || body.body, body.link || null, body.is_active ? 1 : 0, id).run();
  debugLog(env, 'Announcement updated', { id, ...body });
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// DELETE /api/dashboard/announcements/:id
export async function handleDeleteAnnouncement(request: Request, env: Env, ctx: any, id: string) {
  const user = await verifyAuth(request, env);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (!isKevin(user.email)) {
    debugLog(env, 'Unauthorized announcement delete attempt', { user });
    return new Response('Unauthorized', { status: 403 });
  }
  await env.DB.prepare(`
    DELETE FROM dashboard_announcements WHERE id = ?
  `).bind(id).run();
  debugLog(env, 'Announcement deleted', { id });
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
} 