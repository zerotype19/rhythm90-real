import { Env } from './types';
import { handleGoogleAuth, handleGoogleCallback, handleGetSession, handleLogout } from './auth';
import { handleCreateTeam, handleGetTeams, handleJoinTeam } from './teams';
import { handleGeneratePlay, handleInterpretSignal, handleGenerateRitualPrompts, handlePlainEnglishTranslator, handleGetToByGenerator, handleCreativeTensionFinder, handlePersonaGenerator, handleJourneyBuilder, handleTestLearnScale, handleAgileSprintPlanner, handleConnectedMediaMatrix, handleSyntheticFocusGroup, lastMiniToolDebugLog } from './ai';
import { lastPlayBuilderDebugLog, lastSignalLabDebugLog, lastRitualGuideDebugLog } from './ai';
import { jsonResponse, errorResponse, corsHeaders } from './utils';

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    try {
      // Authentication routes
      if (path === '/api/auth/google' && request.method === 'POST') {
        return await handleGoogleAuth(request, env);
      }
      if ((path === '/api/auth/callback/google' || path === '/auth/callback/google') && request.method === 'GET') {
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

      // Mini Tools routes
      if (path === '/api/mini-tools/plain-english-translator' && request.method === 'POST') {
        return await handlePlainEnglishTranslator(request, env);
      }

      if (path === '/api/mini-tools/get-to-by-generator' && request.method === 'POST') {
        return await handleGetToByGenerator(request, env);
      }

      if (path === '/api/mini-tools/creative-tension-finder' && request.method === 'POST') {
        return await handleCreativeTensionFinder(request, env);
      }

      if (path === '/api/mini-tools/persona-generator' && request.method === 'POST') {
        return await handlePersonaGenerator(request, env);
      }

      if (path === '/api/mini-tools/journey-builder' && request.method === 'POST') {
        return await handleJourneyBuilder(request, env);
      }

      if (path === '/api/mini-tools/test-learn-scale' && request.method === 'POST') {
        return await handleTestLearnScale(request, env);
      }

      if (path === '/api/mini-tools/agile-sprint-planner' && request.method === 'POST') {
        return await handleAgileSprintPlanner(request, env);
      }

      if (path === '/api/mini-tools/connected-media-matrix' && request.method === 'POST') {
        return await handleConnectedMediaMatrix(request, env);
      }

      if (path === '/api/mini-tools/synthetic-focus-group' && request.method === 'POST') {
        return await handleSyntheticFocusGroup(request, env);
      }

      // AI Debugger: Play Builder last log
      if (path === '/api/debug/last-play' && request.method === 'GET') {
        if (typeof lastPlayBuilderDebugLog !== 'undefined' && lastPlayBuilderDebugLog) {
          return jsonResponse(lastPlayBuilderDebugLog);
        } else {
          return jsonResponse({ error: 'No Play Builder debug log found.' }, 404);
        }
      }
      // AI Debugger: Signal Lab last log
      if (path === '/api/debug/last-signal' && request.method === 'GET') {
        if (typeof lastSignalLabDebugLog !== 'undefined' && lastSignalLabDebugLog) {
          return jsonResponse(lastSignalLabDebugLog);
        } else {
          return jsonResponse({ error: 'No Signal Lab debug log found.' }, 404);
        }
      }
      // AI Debugger: Ritual Guide last log
      if (path === '/api/debug/last-ritual' && request.method === 'GET') {
        if (typeof lastRitualGuideDebugLog !== 'undefined' && lastRitualGuideDebugLog) {
          return jsonResponse(lastRitualGuideDebugLog);
        } else {
          return jsonResponse({ error: 'No Ritual Guide debug log found.' }, 404);
        }
      }

      // AI Debugger: Mini Tools last log
      if (path === '/api/debug/last-mini-tool' && request.method === 'GET') {
        if (typeof lastMiniToolDebugLog !== 'undefined' && lastMiniToolDebugLog) {
          return jsonResponse(lastMiniToolDebugLog);
        } else {
          return jsonResponse({ error: 'No Mini Tool debug log found.' }, 404);
        }
      }

      // Health check
      if (path === '/api/health' && request.method === 'GET') {
        return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Request error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
}; 