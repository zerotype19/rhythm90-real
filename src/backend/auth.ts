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