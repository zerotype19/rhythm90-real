import { Env } from './types';
import { handleGoogleAuth, handleGoogleCallback, handleGetSession, handleLogout } from './auth';
import { handleCreateTeam, handleGetTeams, handleJoinTeam } from './teams';
import { handleGeneratePlay, handleInterpretSignal, handleGenerateRitualPrompts } from './ai';
import { jsonResponse, errorResponse } from './utils';

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    try {
      // Authentication routes
      if (path === '/api/auth/google' && request.method === 'POST') {
        return await handleGoogleAuth(request, env);
      }
      if (path === '/api/auth/callback/google' && request.method === 'GET') {
        return await handleGoogleCallback(request, env);
      }
      if (path === '/api/auth/me' && request.method === 'GET') {
        return await handleGetSession(request, env);
      }
      if (path === '/api/auth/logout' && request.method === 'POST') {
        return await handleLogout(request, env);
      }

      // Team routes
      if (path === '/api/teams' && request.method === 'POST') {
        return await handleCreateTeam(request, env);
      }

      if (path === '/api/teams' && request.method === 'GET') {
        return await handleGetTeams(request, env);
      }

      if (path === '/api/teams/join' && request.method === 'POST') {
        return await handleJoinTeam(request, env);
      }

      // AI routes
      if (path === '/api/plays/generate' && request.method === 'POST') {
        return await handleGeneratePlay(request, env);
      }

      if (path === '/api/signals/interpret' && request.method === 'POST') {
        return await handleInterpretSignal(request, env);
      }

      if (path === '/api/rituals/prompts' && request.method === 'POST') {
        return await handleGenerateRitualPrompts(request, env);
      }

      // Health check
      if (path === '/api/health' && request.method === 'GET') {
        return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
      }

      // 404 for unknown routes
      return errorResponse('Not found', 404);
    } catch (error) {
      console.error('Request error:', error);
      return errorResponse('Internal server error', 500);
    }
  },
}; 