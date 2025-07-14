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
    INSERT INTO users (id, name, email, google_id)
    VALUES (?, ?, ?, ?)
    RETURNING *
  `).bind(id, user.name, user.email, user.google_id).first();
  
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

export async function createTeam(db: any, team: Omit<Team, 'id' | 'created_at'>, ownerId: string): Promise<Team> {
  const teamId = crypto.randomUUID();
  const memberId = crypto.randomUUID();
  
  // Create team
  await db.prepare(`
    INSERT INTO teams (id, name, industry, owner_id)
    VALUES (?, ?, ?, ?)
  `).bind(teamId, team.name, team.industry, ownerId).run();
  
  // Add owner as team member
  await db.prepare(`
    INSERT INTO team_members (id, user_id, team_id, role)
    VALUES (?, ?, ?, ?)
  `).bind(memberId, ownerId, teamId, 'owner').run();
  
  // Create default subscription
  const subscriptionId = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO subscriptions (id, team_id, plan, status, seat_count)
    VALUES (?, ?, ?, ?, ?)
  `).bind(subscriptionId, teamId, 'free', 'active', 1).run();
  
  const result = await db.prepare('SELECT * FROM teams WHERE id = ?').bind(teamId).first();
  return result as Team;
}

// OpenAI integration
export async function callOpenAI(prompt: string, env: Env): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response from AI';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('AI service is currently unavailable — please try again later or continue manually.');
  }
}

// CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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