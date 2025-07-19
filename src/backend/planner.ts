import { Env, PlannerSession, CreatePlannerSessionRequest } from './types';
import { verifyAuth } from './auth';
import { callOpenAI, jsonResponse, errorResponse } from './utils';
import { buildSystemPrompt } from './systemPrompts';

const PLANNER_SYSTEM_PROMPT = `You are the Rhythm90 Assistant, a smart but lightweight guide. You help teams shape the quarter ahead by surfacing goals, learning focus, play ideas, and signals to watch. Use their team profile (industry, focus areas, description) and planner inputs to generate relevant, sharp, no-fluff suggestions. Keep it conversational and motivating, not formal or bureaucratic.

Your job is to:
- Provide clear, actionable insights based on their inputs
- Suggest relevant plays or bets they might consider
- Identify key signals they should watch
- Help clarify roles and responsibilities
- Keep suggestions practical and achievable
- Connect recommendations to their business context

Format your response as a structured JSON object with these exact fields:
{
  "title": "Quarterly Planning Summary for [Team Name]",
  "objective": "Clear statement of the main challenge/goal",
  "keyFocusAreas": ["Area 1", "Area 2", "Area 3"],
  "plays": [
    {
      "title": "Play Name",
      "description": "Clear description of what this play involves",
      "leads": ["Person 1", "Person 2"],
      "expectedOutcome": "What success looks like"
    }
  ],
  "learningGoals": ["Goal 1", "Goal 2"],
  "signalsToWatch": ["Signal 1", "Signal 2", "Signal 3"],
  "nextSteps": ["Step 1", "Step 2", "Step 3"]
}

Keep each section concise but comprehensive. Focus on actionable insights that will help the team align and execute effectively.`;

export async function handleCreatePlannerSession(request: Request, env: Env): Promise<Response> {
  try {
    const user = await verifyAuth(request, env);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    // Get user's team
    const teamMember = await env.DB.prepare(`
      SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1
    `).bind(user.id).first();
    
    if (!teamMember?.team_id) {
      return errorResponse('User must belong to a team', 400);
    }

    const body: CreatePlannerSessionRequest = await request.json();
    const { inputs } = body;

    // Validate required fields
    if (!inputs.bigChallenge || !inputs.learningGoals || !inputs.signalsToWatch) {
      return errorResponse('Missing required fields', 400);
    }

    // Get team profile for context
    const team = await env.DB.prepare(`
      SELECT industry, focus_areas, team_description
      FROM teams
      WHERE id = ?
    `).bind(teamMember.team_id).first();

    // Get system prompt from database with team context
    const systemPromptText = await buildSystemPrompt(env.DB, 'quarterly_planner', {
      big_challenge: inputs.bigChallenge,
      learning_goals: inputs.learningGoals.join(', '),
      business_context: inputs.businessContext || '',
      known_plays: inputs.knownPlays || '',
      signals_to_watch: inputs.signalsToWatch.join(', '),
      blockers: inputs.blockers || '',
      roles: JSON.stringify(inputs.roles),
      team_industry: team?.industry || '',
      focus_areas: team?.focus_areas || '',
      team_description: team?.team_description || ''
    });

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

    console.log('Generating AI summary for planner session...');
    const messages = [
      { role: 'system', content: systemPromptText },
      { role: 'user', content: teamContext + userInputs + '\n\nPlease provide a clear, actionable summary for this team\'s quarterly planning session. Return ONLY a JSON object with the exact structure specified in the system prompt. Do not include markdown formatting, headers, or any other text outside the JSON object.' }
    ];
    const summary = await callOpenAI(messages, env);
    console.log('AI summary generated successfully, length:', summary.length);
    console.log('AI summary content:', summary);

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

    // Extract prompt context for saving
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const userMessages = messages.filter(msg => msg.role === 'user');
    
    const systemPrompt = systemMessages.map(msg => msg.content).join('\n\n');
    const userInput = userMessages.map(msg => msg.content).join('\n\n');
    const finalPrompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
    
    return jsonResponse({
      session,
      summary,
      _promptContext: {
        system_prompt: systemPrompt,
        user_input: userInput,
        final_prompt: finalPrompt,
        raw_response_text: summary
      }
    }, 201);

  } catch (error) {
    console.error('Create planner session error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function handleGetPlannerSessions(request: Request, env: Env): Promise<Response> {
  try {
    const user = await verifyAuth(request, env);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    // Get user's team
    const teamMember = await env.DB.prepare(`
      SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1
    `).bind(user.id).first();
    
    if (!teamMember?.team_id) {
      return errorResponse('User must belong to a team', 400);
    }

    const sessions = await env.DB.prepare(`
      SELECT id, team_id, created_by, inputs_json, output_summary, created_at
      FROM planner_sessions
      WHERE team_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(teamMember.team_id).all();

    return jsonResponse({
      sessions: sessions.results
    });

  } catch (error) {
    console.error('Get planner sessions error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function handleGetPlannerSession(request: Request, env: Env): Promise<Response> {
  try {
    const user = await verifyAuth(request, env);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    // Get user's team
    const teamMember = await env.DB.prepare(`
      SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1
    `).bind(user.id).first();
    
    if (!teamMember?.team_id) {
      return errorResponse('User must belong to a team', 400);
    }

    const url = new URL(request.url);
    const sessionId = url.pathname.split('/').pop();

    if (!sessionId) {
      return errorResponse('Session ID required', 400);
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
    return errorResponse('Internal server error', 500);
  }
} 