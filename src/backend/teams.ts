import { Env, CreateTeamRequest, Team, User } from './types';
import { createTeam, jsonResponse, errorResponse } from './utils';
import { verifyAuth } from './auth';

export async function handleCreateTeam(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    // Verify authentication
    const user = await verifyAuth(request, env);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const body: CreateTeamRequest = await request.json();
    const { name, industry } = body;

    if (!name || !industry) {
      return errorResponse('Team name and industry are required', 400);
    }

    // Create team
    const team = await createTeam(env.DB, { name, industry, owner_id: user.id }, user.id);

    return jsonResponse({ team });
  } catch (error) {
    console.error('Create team error:', error);
    return errorResponse('Failed to create team', 500);
  }
}

export async function handleGetTeams(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    // Verify authentication
    const user = await verifyAuth(request, env);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    // Get user's teams
    const result = await env.DB.prepare(`
      SELECT t.* FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ?
      ORDER BY t.created_at DESC
    `).bind(user.id).all();

    const teams = result.results as Team[];

    return jsonResponse({ teams });
  } catch (error) {
    console.error('Get teams error:', error);
    return errorResponse('Failed to get teams', 500);
  }
}

export async function handleJoinTeam(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    // Verify authentication
    const user = await verifyAuth(request, env);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { invite_code } = body;

    if (!invite_code) {
      return errorResponse('Invite code is required', 400);
    }

    // For now, return a placeholder response
    // TODO: Implement invite code logic
    return jsonResponse({ 
      message: 'Join team functionality coming soon',
      invite_code 
    });
  } catch (error) {
    console.error('Join team error:', error);
    return errorResponse('Failed to join team', 500);
  }
} 