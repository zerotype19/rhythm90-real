import { Env, User, Team, TeamMember } from './types';

// JWT utilities
export function generateJWT(payload: any, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa(secret); // Simplified for demo - use proper HMAC in production
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJWT(token: string, secret: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Database utilities
export async function getUserByGoogleId(db: any, googleId: string): Promise<User | null> {
  const result = await db.prepare(
    'SELECT * FROM users WHERE google_id = ?'
  ).bind(googleId).first();
  
  return result as User | null;
}

export async function createUser(db: any, user: Omit<User, 'id' | 'created_at'>): Promise<User> {
  const id = crypto.randomUUID();
  const result = await db.prepare(`
    INSERT INTO users (id, name, email, google_id, is_admin)
    VALUES (?, ?, ?, ?, ?)
    RETURNING *
  `).bind(id, user.name, user.email, user.google_id, false).first();
  
  return result as User;
}

export async function getTeamsByUserId(db: any, userId: string): Promise<Team[]> {
  const result = await db.prepare(`
    SELECT t.* FROM teams t
    JOIN team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = ?
  `).bind(userId).all();
  
  return result.results as Team[];
}

// Generate a unique 6-character alphanumeric invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate a unique invite code that doesn't exist in the database
async function generateUniqueInviteCode(db: any): Promise<string> {
  let inviteCode: string;
  let attempts = 0;
  const maxAttempts = 10;
  let existing: any;
  
  do {
    inviteCode = generateInviteCode();
    existing = await db.prepare('SELECT id FROM teams WHERE invite_code = ?').bind(inviteCode).first();
    attempts++;
    
    if (attempts > maxAttempts) {
      throw new Error('Failed to generate unique invite code after maximum attempts');
    }
  } while (existing);
  
  return inviteCode;
}

export async function createTeam(db: any, team: Omit<Team, 'id' | 'created_at' | 'invite_code'>, ownerId: string): Promise<Team> {
  const teamId = crypto.randomUUID();
  const memberId = crypto.randomUUID();
  const inviteCode = await generateUniqueInviteCode(db);
  
  // Create team with new profile fields
  await db.prepare(`
    INSERT INTO teams (id, name, industry, focus_areas, team_description, owner_id, invite_code)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(teamId, team.name, team.industry, team.focus_areas || '[]', team.team_description || '', ownerId, inviteCode).run();
  
  // Add owner as team member (with admin privileges)
  await db.prepare(`
    INSERT INTO team_members (id, user_id, team_id, role, is_admin)
    VALUES (?, ?, ?, ?, ?)
  `).bind(memberId, ownerId, teamId, 'owner', true).run();
  
  // Create default subscription
  const subscriptionId = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO subscriptions (id, team_id, plan, status, seat_count)
    VALUES (?, ?, ?, ?, ?)
  `).bind(subscriptionId, teamId, 'free', 'active', 1).run();
  
  const result = await db.prepare('SELECT * FROM teams WHERE id = ?').bind(teamId).first();
  return result as Team;
}

export async function joinTeam(db: any, inviteCode: string, userId: string): Promise<Team> {
  // Find team by invite code
  const team = await db.prepare('SELECT * FROM teams WHERE invite_code = ?').bind(inviteCode).first();
  if (!team) {
    throw new Error('Invalid invite code');
  }
  
  // Check if user is already a member
  const existingMember = await db.prepare(`
    SELECT id FROM team_members 
    WHERE user_id = ? AND team_id = ?
  `).bind(userId, team.id).first();
  
  if (existingMember) {
    throw new Error('User already a member of this team');
  }
  
  // Add user as team member (not admin by default)
  const memberId = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO team_members (id, user_id, team_id, role, is_admin)
    VALUES (?, ?, ?, ?, ?)
  `).bind(memberId, userId, team.id, 'member', false).run();
  
  return team as Team;
}

// OpenAI integration
/**
 * If any sensitive user data is added later, consider redacting logs.
 */
export async function callOpenAI(messages: any[], env: Env, toolName?: string): Promise<string> {
  try {
    console.log('callOpenAI: Final messages array:', JSON.stringify(messages, null, 2));
    
    // Get system prompt parameters and model if toolName is provided
    let maxTokens = 1000;
    let temperature = 0.7;
    let topP = 1.0;
    let frequencyPenalty = 0.0;
    let presencePenalty = 0.0;
    let model = 'gpt-4-turbo'; // Default fallback
    
    if (toolName) {
      try {
        const { getSystemPrompt } = await import('./systemPrompts');
        const systemPrompt = await getSystemPrompt(env.DB, toolName);
        if (systemPrompt) {
          maxTokens = systemPrompt.max_tokens || 1000;
          temperature = systemPrompt.temperature || 0.7;
          topP = systemPrompt.top_p || 1.0;
          frequencyPenalty = systemPrompt.frequency_penalty || 0.0;
          presencePenalty = systemPrompt.presence_penalty || 0.0;
          model = systemPrompt.model || 'gpt-4-turbo';
        }
      } catch (error) {
        console.warn(`Failed to get system prompt parameters for ${toolName}, using defaults:`, error);
      }
    } else {
      // Fallback to system settings for backward compatibility
      const modelResult = await env.DB.prepare(
        'SELECT setting_value FROM system_settings WHERE setting_key = ?'
      ).bind('openai_model').first();
      model = modelResult?.setting_value || 'gpt-4-turbo';
    }
    
    const startTime = Date.now();
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    console.log('callOpenAI: Model used:', model, '| Response time:', duration, 'ms');
    if (!response.ok) {
      const errorText = await response.text();
      console.error('callOpenAI: OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'No response from AI';
    console.log('callOpenAI: Response length:', content.length);
    return content;
  } catch (error) {
    console.error('callOpenAI: Error:', error);
    if (error.name === 'AbortError') {
      throw new Error('AI request timed out — please try again.');
    }
    throw new Error('AI service is currently unavailable — please try again later or continue manually.');
  }
}

// CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://rhythm90.io',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// AI Usage Logging
export async function logAIUsage(db: any, userId: string, toolName: string): Promise<void> {
  try {
    const logId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO ai_usage_logs (id, user_id, tool_name, timestamp)
      VALUES (?, ?, ?, ?)
    `).bind(logId, userId, toolName, timestamp).run();
    
    console.log(`[AI_USAGE_LOG] Logged usage: ${toolName} for user ${userId}`);
  } catch (error) {
    // Don't block the main flow if logging fails
    console.error('[AI_USAGE_LOG] Failed to log AI usage:', error);
  }
}

// Helper function to save AI response with full prompt context
export async function saveAIResponseWithContext(
  env: any,
  userId: string,
  teamId: string | null,
  toolName: string,
  summary: string,
  responseBlob: string,
  messages: any[],
  aiResponse: string
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // Extract system prompt and user input from messages
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const userMessages = messages.filter(msg => msg.role === 'user');
    
    const systemPrompt = systemMessages.map(msg => msg.content).join('\n\n');
    const userInput = userMessages.map(msg => msg.content).join('\n\n');
    const finalPrompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
    
    // Import saveResponse function
    const { saveResponse } = await import('./savedResponses');
    
    const result = await saveResponse(env, {
      user_id: userId,
      team_id: teamId,
      tool_name: toolName,
      summary,
      response_blob: responseBlob,
      system_prompt: systemPrompt,
      user_input: userInput,
      final_prompt: finalPrompt,
      raw_response_text: aiResponse
    });
    
    return result;
  } catch (error) {
    console.error('Error saving AI response with context:', error);
    return { success: false, message: 'Failed to save response with context' };
  }
}

// Response helpers
export function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

export function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ error: message }, status);
} 

// Parse AI response to hide prompts and show only the user-facing content
export const parseAIResponse = (responseBlob: string): string => {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(responseBlob);
    
    // If it's a structured response, extract the main content
    if (parsed.content) {
      return parsed.content;
    }
    
    if (parsed.response) {
      return parsed.response;
    }
    
    if (parsed.result) {
      return parsed.result;
    }
    
    // If it's an array, join the content
    if (Array.isArray(parsed)) {
      return parsed.map(item => {
        if (typeof item === 'string') return item;
        if (item.content) return item.content;
        if (item.response) return item.response;
        return JSON.stringify(item);
      }).join('\n\n');
    }
    
    // If it's an object with text fields, extract them
    const textFields = Object.entries(parsed)
      .filter(([key, value]) => 
        typeof value === 'string' && 
        !key.toLowerCase().includes('prompt') &&
        !key.toLowerCase().includes('input') &&
        !key.toLowerCase().includes('context')
      )
      .map(([_, value]) => value as string);
    
    if (textFields.length > 0) {
      return textFields.join('\n\n');
    }
    
    // Fallback to stringified version
    return JSON.stringify(parsed, null, 2);
  } catch {
    // If not JSON, treat as plain text
    const lines = responseBlob.split('\n');
    
    // Remove lines that look like prompts or system messages
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('System:') &&
             !trimmed.startsWith('User:') &&
             !trimmed.startsWith('Assistant:') &&
             !trimmed.startsWith('Human:') &&
             !trimmed.startsWith('AI:') &&
             !trimmed.startsWith('Prompt:') &&
             !trimmed.startsWith('Context:') &&
             !trimmed.startsWith('Input:') &&
             trimmed.length > 0;
    });
    
    return filteredLines.join('\n');
  }
}; 