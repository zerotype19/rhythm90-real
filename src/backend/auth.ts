import { Env, AuthRequest, AuthResponse, User } from './types';
import { generateJWT, getUserByGoogleId, createUser, getTeamsByUserId, jsonResponse, errorResponse } from './utils';

export async function handleGoogleAuth(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const body: AuthRequest = await request.json();
    const { code, redirect_uri } = body;

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      return errorResponse('Failed to exchange authorization code', 400);
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      return errorResponse('Failed to get user info from Google', 400);
    }

    const userInfo = await userInfoResponse.json();
    const { id: google_id, name, email } = userInfo;

    // Check if user exists
    let user = await getUserByGoogleId(env.DB, google_id);

    if (!user) {
      // Create new user
      user = await createUser(env.DB, {
        name,
        email,
        google_id,
      });
    }

    // Get user's teams
    const teams = await getTeamsByUserId(env.DB, user.id);

    // Generate JWT token
    const token = generateJWT(
      { 
        user_id: user.id, 
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      }, 
      env.JWT_SECRET
    );

    const response: AuthResponse = {
      user,
      teams,
      access_token: token,
    };

    return jsonResponse(response);
  } catch (error) {
    console.error('Auth error:', error);
    return errorResponse('Authentication failed', 500);
  }
}

export async function verifyAuth(request: Request, env: Env): Promise<User | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    // Get user from database
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(payload.user_id).first();

    return user as User;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
} 

// --- New OAuth callback, session, and logout endpoints ---

function setAuthCookie(token: string): string {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  return `rhythm90_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=${expires}`;
}

function clearAuthCookie(): string {
  return `rhythm90_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export async function handleGoogleCallback(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    if (error || !code) {
      return Response.redirect(`${env.APP_URL}/login?error=oauth_failed`, 302);
    }
    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: 'https://api.rhythm90.io/auth/callback/google',
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenResponse.ok) {
      return Response.redirect(`${env.APP_URL}/login?error=oauth_failed`, 302);
    }
    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;
    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${access_token}` },
    });
    if (!userInfoResponse.ok) {
      return Response.redirect(`${env.APP_URL}/login?error=oauth_failed`, 302);
    }
    const userInfo = await userInfoResponse.json();
    const { id: google_id, name, email } = userInfo;
    // Check if user exists
    let user = await getUserByGoogleId(env.DB, google_id);
    if (!user) {
      user = await createUser(env.DB, { name, email, google_id });
    }
    // Get user's teams
    const teams = await getTeamsByUserId(env.DB, user.id);
    // Generate JWT
    const jwt = generateJWT({ user_id: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 }, env.JWT_SECRET);
    // Set cookie
    const cookie = setAuthCookie(jwt);
    // Redirect based on team membership
    const redirectUrl = teams.length === 0 ? `${env.APP_URL}/app/onboarding` : `${env.APP_URL}/app/dashboard`;
    return new Response(null, { status: 302, headers: { 'Location': redirectUrl, 'Set-Cookie': cookie } });
  } catch (err) {
    return Response.redirect(`${env.APP_URL}/login?error=oauth_failed`, 302);
  }
}

export async function handleGetSession(request: Request, env: Env): Promise<Response> {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/rhythm90_token=([^;]+)/);
  if (!match) {
    return jsonResponse({ user: null, teams: [] });
  }
  try {
    const token = match[1];
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return jsonResponse({ user: null, teams: [] });
    }
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.user_id).first();
    if (!user) return jsonResponse({ user: null, teams: [] });
    const teams = await getTeamsByUserId(env.DB, user.id);
    return jsonResponse({ user, teams });
  } catch (err) {
    return jsonResponse({ user: null, teams: [] });
  }
}

export async function handleLogout(request: Request, env: Env): Promise<Response> {
  const cookie = clearAuthCookie();
  return new Response(null, { status: 302, headers: { 'Location': `${env.APP_URL}/login`, 'Set-Cookie': cookie } });
} 