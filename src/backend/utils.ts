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
  
  // Create team
  await db.prepare(`
    INSERT INTO teams (id, name, industry, owner_id, invite_code)
    VALUES (?, ?, ?, ?, ?)
  `).bind(teamId, team.name, team.industry, ownerId, inviteCode).run();
  
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
  
  // Add user as team member
  const memberId = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO team_members (id, user_id, team_id, role)
    VALUES (?, ?, ?, ?)
  `).bind(memberId, userId, team.id, 'member').run();
  
  return team as Team;
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