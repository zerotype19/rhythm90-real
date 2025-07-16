import { Env, CreateTeamRequest, UpdateTeamRequest, Team, User } from './types';
import { createTeam, joinTeam, jsonResponse, errorResponse } from './utils';
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
    const { name, industry, focus_areas, team_description } = body;

    if (!name || !industry) {
      return errorResponse('Team name and industry are required', 400);
    }

    // Check if team name already exists
    const existingTeam = await env.DB.prepare('SELECT id FROM teams WHERE name = ?').bind(name).first();
    if (existingTeam) {
      return errorResponse('Team name is already taken.', 409);
    }

    // Prepare focus_areas as JSON string
    const focusAreasJson = focus_areas ? JSON.stringify(focus_areas) : '[]';
    const description = team_description || '';

    // Create team
    const team = await createTeam(env.DB, { 
      name, 
      industry, 
      focus_areas: focusAreasJson,
      team_description: description,
      owner_id: user.id 
    }, user.id);

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

export async function handleUpdateTeam(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    // Verify authentication
    const user = await verifyAuth(request, env);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const body: UpdateTeamRequest = await request.json();
    const { name, industry, focus_areas, team_description } = body;

    // Get team ID from URL
    const url = new URL(request.url);
    const teamId = url.pathname.split('/').pop();

    if (!teamId) {
      return errorResponse('Team ID is required', 400);
    }

    // Verify user is team owner
    const teamCheck = await env.DB.prepare(`
      SELECT t.* FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE t.id = ? AND tm.user_id = ? AND tm.role = 'owner'
    `).bind(teamId, user.id).first();

    if (!teamCheck) {
      return errorResponse('Unauthorized - must be team owner', 403);
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }

    if (industry !== undefined) {
      updates.push('industry = ?');
      values.push(industry);
    }

    if (focus_areas !== undefined) {
      updates.push('focus_areas = ?');
      values.push(JSON.stringify(focus_areas));
    }

    if (team_description !== undefined) {
      updates.push('team_description = ?');
      values.push(team_description);
    }

    if (updates.length === 0) {
      return errorResponse('No fields to update', 400);
    }

    // Check if team name already exists (if updating name)
    if (name && name !== teamCheck.name) {
      const existingTeam = await env.DB.prepare('SELECT id FROM teams WHERE name = ? AND id != ?').bind(name, teamId).first();
      if (existingTeam) {
        return errorResponse('Team name is already taken.', 409);
      }
    }

    // Update team
    const query = `UPDATE teams SET ${updates.join(', ')} WHERE id = ?`;
    values.push(teamId);

    await env.DB.prepare(query).bind(...values).run();

    // Get updated team
    const updatedTeam = await env.DB.prepare('SELECT * FROM teams WHERE id = ?').bind(teamId).first() as Team;

    return jsonResponse({ team: updatedTeam });
  } catch (error) {
    console.error('Update team error:', error);
    return errorResponse('Failed to update team', 500);
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

    // Join team
    const team = await joinTeam(env.DB, invite_code, user.id);

    return jsonResponse({ team });
  } catch (error) {
    console.error('Join team error:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message === 'Invalid invite code') {
        return errorResponse('Invalid invite code.', 400);
      }
      if (error.message === 'User already a member of this team') {
        return errorResponse('You\'re already a member of this team.', 409);
      }
    }
    
    return errorResponse('Failed to join team', 500);
  }
} 