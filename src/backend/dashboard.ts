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
  const { user, teamId } = await verifyAuth(request, env);
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

  // Signals logged (from ai_usage_logs)
  const signals = await env.DB.prepare(`
    SELECT COUNT(*) as signals_logged
    FROM ai_usage_logs
    WHERE team_id = ?
      AND tool_name = 'Signal Lab'
      AND DATE(created_at) >= ?
      AND DATE(created_at) <= ?
  `).bind(teamId, periodStart, periodEnd).first();

  // Personal activity (last 5 actions)
  const personal = await env.DB.prepare(`
    SELECT * FROM ai_usage_logs
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `).bind(user.user_id).all();

  // Team activity (last 5 actions, all team members)
  const team = await env.DB.prepare(`
    SELECT * FROM ai_usage_logs
    WHERE team_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `).bind(teamId).all();

  // Active dashboard announcements
  const announcements = await env.DB.prepare(`
    SELECT * FROM dashboard_announcements
    WHERE is_active = 1
    ORDER BY created_at DESC
  `).all();

  debugLog(env, 'Dashboard overview data', { stats, signals, personal, team, announcements });

  return new Response(JSON.stringify({
    stats: {
      plays_created: stats?.plays_created || 0,
      rituals_completed: stats?.rituals_completed || 0,
      saved_responses: stats?.saved_responses || 0,
      signals_logged: signals?.signals_logged || 0,
    },
    personal_activity: personal.results || [],
    team_activity: team.results || [],
    announcements: announcements.results || [],
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /api/dashboard/announcements
export async function handleGetAnnouncements(request: Request, env: Env, ctx: any) {
  debugLog(env, 'Get dashboard announcements');
  const rows = await env.DB.prepare(`
    SELECT * FROM dashboard_announcements
    ORDER BY created_at DESC
  `).all();
  return new Response(JSON.stringify({ announcements: rows.results }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// POST /api/dashboard/announcements
export async function handleCreateAnnouncement(request: Request, env: Env, ctx: any) {
  const { user } = await verifyAuth(request, env);
  if (!isKevin(user.email)) {
    debugLog(env, 'Unauthorized announcement create attempt', { user });
    return new Response('Unauthorized', { status: 403 });
  }
  const body = await request.json();
  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO dashboard_announcements (id, title, content, link, created_at, author_email, is_active)
    VALUES (?, ?, ?, ?, datetime('now'), ?, ?)
  `).bind(id, body.title, body.content, body.link || null, user.email, body.is_active ? 1 : 0).run();
  debugLog(env, 'Announcement created', { id, ...body });
  return new Response(JSON.stringify({ success: true, id }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// PATCH /api/dashboard/announcements/:id
export async function handleUpdateAnnouncement(request: Request, env: Env, ctx: any, id: string) {
  const { user } = await verifyAuth(request, env);
  if (!isKevin(user.email)) {
    debugLog(env, 'Unauthorized announcement update attempt', { user });
    return new Response('Unauthorized', { status: 403 });
  }
  const body = await request.json();
  await env.DB.prepare(`
    UPDATE dashboard_announcements
    SET title = ?, content = ?, link = ?, is_active = ?
    WHERE id = ?
  `).bind(body.title, body.content, body.link || null, body.is_active ? 1 : 0, id).run();
  debugLog(env, 'Announcement updated', { id, ...body });
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// DELETE /api/dashboard/announcements/:id
export async function handleDeleteAnnouncement(request: Request, env: Env, ctx: any, id: string) {
  const { user } = await verifyAuth(request, env);
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