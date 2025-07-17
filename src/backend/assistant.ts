import { Env } from './types';
import { jsonResponse, errorResponse, callOpenAI } from './utils';
import { verifyAuth } from './auth';

// Quick prompts for the assistant
const QUICK_PROMPTS = [
  "Help us shape this quarter's objectives",
  "Suggest 3 smart plays",
  "What signals should we watch?",
  "Help summarize what we've learned",
  "We're stuck — what should we prioritize next?"
];

// Get or create a session for a team
async function getOrCreateSession(env: Env, teamId: string) {
  console.log('getOrCreateSession: Starting with teamId:', teamId);
  
  // Check if team has an active session
  const existingSession = await env.DB.prepare(`
    SELECT id, created_at, updated_at 
    FROM assistant_chat_sessions 
    WHERE team_id = ? 
    ORDER BY updated_at DESC 
    LIMIT 1
  `).bind(teamId).first();

  console.log('getOrCreateSession: Existing session:', existingSession);

  if (existingSession) {
    console.log('getOrCreateSession: Returning existing session:', existingSession.id);
    return existingSession;
  }

  // Create new session with explicit ID and timestamps
  const sessionId = crypto.randomUUID();
  const now = new Date().toISOString();
  
  console.log('getOrCreateSession: Creating new session with ID:', sessionId);
  
  try {
    await env.DB.prepare(`
      INSERT INTO assistant_chat_sessions (id, team_id, created_at, updated_at) 
      VALUES (?, ?, ?, ?)
    `).bind(sessionId, teamId, now, now).run();
    
    console.log('getOrCreateSession: Successfully inserted session');
  } catch (error) {
    console.error('getOrCreateSession: Error inserting session:', error);
    throw error;
  }

  // Return the session we just created
  const newSession = {
    id: sessionId,
    created_at: now,
    updated_at: now
  };
  
  console.log('getOrCreateSession: Returning new session:', newSession);
  return newSession;
}

// Get team context for AI
async function getTeamContext(env: Env, teamId: string) {
  const team = await env.DB.prepare(`
    SELECT 
      name,
      industry,
      focus_areas,
      team_description
    FROM teams 
    WHERE id = ?
  `).bind(teamId).first();

  if (!team) {
    return null;
  }

  // Get current quarter info if available
  const currentQuarter = await env.DB.prepare(`
    SELECT 
      inputs_json,
      output_summary
    FROM planner_sessions 
    WHERE team_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `).bind(teamId).first();

  let quarterInfo = null;
  if (currentQuarter && currentQuarter.inputs_json) {
    try {
      const inputs = JSON.parse(currentQuarter.inputs_json);
      quarterInfo = {
        quarter_name: inputs.quarterName || inputs.quarter_name || 'current quarter',
        quarter_goals: inputs.goals || inputs.quarter_goals || '',
        quarter_challenges: inputs.challenges || inputs.quarter_challenges || ''
      };
    } catch (error) {
      console.log('Error parsing planner inputs:', error);
      quarterInfo = {
        quarter_name: 'current quarter',
        quarter_goals: '',
        quarter_challenges: ''
      };
    }
  }

  return {
    team_name: team.name || 'Your team',
    industry: team.industry || 'your industry',
    focus_areas: team.focus_areas || 'your focus areas',
    team_description: team.team_description || '',
    quarter_name: quarterInfo?.quarter_name || 'current quarter',
    quarter_goals: quarterInfo?.quarter_goals || '',
    quarter_challenges: quarterInfo?.quarter_challenges || ''
  };
}

// Get recent messages for context (last 10)
async function getRecentMessages(env: Env, sessionId: string) {
  const messages = await env.DB.prepare(`
    SELECT role, content, created_at
    FROM assistant_chat_messages 
    WHERE session_id = ? 
    ORDER BY created_at DESC 
    LIMIT 10
  `).bind(sessionId).all();

  return messages.results.reverse(); // Return in chronological order
}

// Store a message
async function storeMessage(env: Env, sessionId: string, role: 'user' | 'assistant', content: string) {
  console.log('storeMessage: Starting with sessionId:', sessionId, 'role:', role);
  
  const messageId = crypto.randomUUID();
  const now = new Date().toISOString();
  
  console.log('storeMessage: Generated messageId:', messageId);
  
  // Insert message
  try {
    await env.DB.prepare(`
      INSERT INTO assistant_chat_messages (id, session_id, role, content, created_at) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(messageId, sessionId, role, content, now).run();
    
    console.log('storeMessage: Successfully inserted message');
  } catch (error) {
    console.error('storeMessage: Error inserting message:', error);
    throw error;
  }

  // Update session timestamp
  await env.DB.prepare(`
    UPDATE assistant_chat_sessions 
    SET updated_at = ? 
    WHERE id = ?
  `).bind(now, sessionId).run();

  const message = {
    id: messageId,
    role,
    content,
    created_at: now
  };
  
  console.log('storeMessage: Returning message:', message);
  return message;
}

// Clean up old messages if over limit (500)
async function cleanupOldMessages(env: Env, sessionId: string) {
  const messageCount = await env.DB.prepare(`
    SELECT COUNT(*) as count 
    FROM assistant_chat_messages 
    WHERE session_id = ?
  `).bind(sessionId).first();

  if (messageCount && messageCount.count > 500) {
    // Delete oldest messages, keeping the last 500
    await env.DB.prepare(`
      DELETE FROM assistant_chat_messages 
      WHERE session_id = ? 
      AND id NOT IN (
        SELECT id FROM assistant_chat_messages 
        WHERE session_id = ? 
        ORDER BY created_at DESC 
        LIMIT 500
      )
    `).bind(sessionId, sessionId).run();
  }
}

// Get system prompt for rhythm90_assistant
async function getSystemPrompt(env: Env) {
  const prompt = await env.DB.prepare(`
    SELECT prompt_text, max_tokens, temperature, top_p, frequency_penalty, presence_penalty
    FROM ai_system_prompts 
    WHERE tool_name = 'rhythm90_assistant'
  `).first();

  return prompt;
}

// Handle getting session and messages
export async function handleGetSession(request: Request, env: Env) {
  try {
    const user = await verifyAuth(request, env);
    if (!user) return errorResponse('Unauthorized', 401);

    // Get user's team
    const teamMember = await env.DB.prepare(`
      SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1
    `).bind(user.id).first();

    if (!teamMember?.team_id) {
      return errorResponse('User must belong to a team', 400);
    }

    const teamId = teamMember.team_id;

    // Get or create session
    const session = await getOrCreateSession(env, teamId);
    if (!session) {
      return errorResponse('Failed to create session', 500);
    }

    // Get messages
    const messages = await env.DB.prepare(`
      SELECT id, role, content, created_at
      FROM assistant_chat_messages 
      WHERE session_id = ? 
      ORDER BY created_at ASC
    `).bind(session.id).all();

    return jsonResponse({
      session: {
        id: session.id,
        created_at: session.created_at,
        updated_at: session.updated_at
      },
      messages: messages.results,
      quick_prompts: QUICK_PROMPTS
    });

  } catch (error) {
    console.error('Error getting session:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Handle sending a message
export async function handleSendMessage(request: Request, env: Env) {
  try {
    const user = await verifyAuth(request, env);
    if (!user) return errorResponse('Unauthorized', 401);

    const body = await request.json();
    if (!body.message || typeof body.message !== 'string') {
      return errorResponse('Message is required', 400);
    }

    // Get user's team
    const teamMember = await env.DB.prepare(`
      SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1
    `).bind(user.id).first();

    if (!teamMember?.team_id) {
      return errorResponse('User must belong to a team', 400);
    }

    const teamId = teamMember.team_id;

    // Get or create session
    const session = await getOrCreateSession(env, teamId);
    if (!session) {
      return errorResponse('Failed to create session', 500);
    }

    console.log('handleSendMessage: Session created/retrieved:', session);
    console.log('handleSendMessage: Session ID:', session.id);

    // Store user message
    const userMessage = await storeMessage(env, session.id, 'user', body.message);
    if (!userMessage) {
      return errorResponse('Failed to store user message', 500);
    }

    // Get team context
    const teamContext = await getTeamContext(env, teamId);
    if (!teamContext) {
      return errorResponse('Failed to get team context', 500);
    }

    // Get system prompt
    const systemPrompt = await getSystemPrompt(env);
    if (!systemPrompt) {
      return errorResponse('System prompt not found', 500);
    }

    // Get recent messages for context
    const recentMessages = await getRecentMessages(env, session.id);

    // Prepare conversation history for AI
    const conversationHistory = recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add the new user message
    conversationHistory.push({
      role: 'user',
      content: body.message
    });

    // Replace placeholders in system prompt
    let processedPrompt = systemPrompt.prompt_text
      .replace(/\{\{team_name\}\}/g, teamContext.team_name)
      .replace(/\{\{industry\}\}/g, teamContext.industry)
      .replace(/\{\{focus_areas\}\}/g, teamContext.focus_areas)
      .replace(/\{\{quarter_challenges\}\}/g, teamContext.quarter_challenges);

    // Call OpenAI
    let assistantResponse: string;
    try {
      const messages = [
        { role: 'system', content: processedPrompt },
        ...conversationHistory
      ];
      
      assistantResponse = await callOpenAI(messages, env, 'rhythm90_assistant');
    } catch (aiError) {
      console.error('AI call failed:', aiError);
      assistantResponse = "The Assistant is currently unavailable. Please try again shortly.";
    }

    // Store assistant response
    const assistantMessage = await storeMessage(env, session.id, 'assistant', assistantResponse);
    if (!assistantMessage) {
      return errorResponse('Failed to store assistant message', 500);
    }

    // Clean up old messages if needed
    await cleanupOldMessages(env, session.id);

    return jsonResponse({
      new_message: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        created_at: assistantMessage.created_at
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Handle clearing conversation
export async function handleClearConversation(request: Request, env: Env) {
  try {
    const user = await verifyAuth(request, env);
    if (!user) return errorResponse('Unauthorized', 401);

    // Get user's team
    const teamMember = await env.DB.prepare(`
      SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1
    `).bind(user.id).first();

    if (!teamMember?.team_id) {
      return errorResponse('User must belong to a team', 400);
    }

    const teamId = teamMember.team_id;

    // Archive current session (soft delete by updating team_id to null)
    await env.DB.prepare(`
      UPDATE assistant_chat_sessions 
      SET team_id = NULL 
      WHERE team_id = ?
    `).bind(teamId).run();

    // Create new session
    const newSession = await getOrCreateSession(env, teamId);
    if (!newSession) {
      return errorResponse('Failed to create new session', 500);
    }

    return jsonResponse({
      session: {
        id: newSession.id,
        created_at: newSession.created_at,
        updated_at: newSession.updated_at
      },
      messages: [],
      quick_prompts: QUICK_PROMPTS
    });

  } catch (error) {
    console.error('Error clearing conversation:', error);
    return errorResponse('Internal server error', 500);
  }
} 