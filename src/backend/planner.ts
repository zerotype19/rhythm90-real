import { Env, PlannerSession, CreatePlannerSessionRequest } from './types';
import { verifyAuth } from './auth';
import { callOpenAI } from './utils';

const PLANNER_SYSTEM_PROMPT = `You are the Rhythm90 Assistant, a smart but lightweight guide. You help teams shape the quarter ahead by surfacing goals, learning focus, play ideas, and signals to watch. Use their team profile (industry, focus areas, description) and planner inputs to generate relevant, sharp, no-fluff suggestions. Keep it conversational and motivating, not formal or bureaucratic.

Your job is to:
- Provide clear, actionable insights based on their inputs
- Suggest relevant plays or bets they might consider
- Identify key signals they should watch
- Help clarify roles and responsibilities
- Keep suggestions practical and achievable
- Connect recommendations to their business context

Format your response as a clear, structured summary that teams can use to align on their quarter ahead.`;

export async function handleCreatePlannerSession(request: Request, env: Env): Promise<Response> {
  try {
    const user = await verifyAuth(request, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user's team
    const teamMember = await env.DB.prepare(`
      SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1
    `).bind(user.id).first();
    
    if (!teamMember?.team_id) {
      return new Response(JSON.stringify({ error: 'User must belong to a team' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body: CreatePlannerSessionRequest = await request.json();
    const { inputs } = body;

    // Validate required fields
    if (!inputs.bigChallenge || !inputs.learningGoals || !inputs.signalsToWatch) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get team profile for context
        const team = await env.DB.prepare(`
      SELECT industry, focus_areas, team_description
      FROM teams
      WHERE id = ?
    `).bind(teamMember.team_id).first();

    // Generate AI summary
    const teamContext = team ? `
Team Context:
- Industry: ${team.industry}
- Focus Areas: ${team.focus_areas}
- Description: ${team.team_description}
` : '';

    const userInputs = `
Quarterly Planning Inputs:
- Big Challenge: ${inputs.bigChallenge}
- Learning Goals: ${inputs.learningGoals.join(', ')}
- Business Context: ${inputs.businessContext || 'Not specified'}
- Known Plays: ${inputs.knownPlays || 'None specified'}
- Signals to Watch: ${inputs.signalsToWatch.join(', ')}
- Blockers: ${inputs.blockers || 'None identified'}
- Roles: ${JSON.stringify(inputs.roles)}
`;

    const summary = await callOpenAI([
      { role: 'system', content: PLANNER_SYSTEM_PROMPT },
      { role: 'user', content: teamContext + userInputs + '\n\nPlease provide a clear, actionable summary for this team\'s quarterly planning session.' }
    ], env);

    // Create planner session
    const sessionId = crypto.randomUUID();
    const session: PlannerSession = {
      id: sessionId,
      team_id: teamMember.team_id,
      created_by: user.id,
      inputs_json: JSON.stringify(inputs),
      output_summary: summary,
      created_at: new Date().toISOString()
    };

    await env.DB.prepare(`
      INSERT INTO planner_sessions (id, team_id, created_by, inputs_json, output_summary, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      session.id,
      session.team_id,
      session.created_by,
      session.inputs_json,
      session.output_summary,
      session.created_at
    ).run();

    return new Response(JSON.stringify({
      session,
      summary
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create planner session error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function handleGetPlannerSessions(request: Request, env: Env): Promise<Response> {
  try {
    const user = await verifyAuth(request, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user's team
    const teamMember = await env.DB.prepare(`
      SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1
    `).bind(user.id).first();
    
    if (!teamMember?.team_id) {
      return new Response(JSON.stringify({ error: 'User must belong to a team' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sessions = await env.DB.prepare(`
      SELECT id, team_id, created_by, inputs_json, output_summary, created_at
      FROM planner_sessions
      WHERE team_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(teamMember.team_id).all();

    return new Response(JSON.stringify({
      sessions: sessions.results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get planner sessions error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function handleGetPlannerSession(request: Request, env: Env): Promise<Response> {
  try {
    const user = await verifyAuth(request, env);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user's team
    const teamMember = await env.DB.prepare(`
      SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1
    `).bind(user.id).first();
    
    if (!teamMember?.team_id) {
      return new Response(JSON.stringify({ error: 'User must belong to a team' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const sessionId = url.pathname.split('/').pop();

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const session = await env.DB.prepare(`
      SELECT id, team_id, created_by, inputs_json, output_summary, created_at
      FROM planner_sessions
      WHERE id = ? AND team_id = ?
    `).bind(sessionId, teamMember.team_id).first();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ session }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get planner session error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 