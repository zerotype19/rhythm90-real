import { Env } from './types';
import { handleGoogleAuth, handleGoogleCallback, handleGetSession, handleLogout } from './auth';
import { handleCreateTeam, handleGetTeams, handleJoinTeam } from './teams';
import { handleGeneratePlay, handleInterpretSignal, handleGenerateRitualPrompts, handlePlainEnglishTranslator, handleGetToByGenerator, handleCreativeTensionFinder, handlePersonaGenerator, handlePersonaAsk, handleFocusGroupAsk, handleJourneyBuilder, handleTestLearnScale, handleAgileSprintPlanner, handleConnectedMediaMatrix, handleSyntheticFocusGroup, lastMiniToolDebugLog } from './ai';
import { lastPlayBuilderDebugLog, lastSignalLabDebugLog, lastRitualGuideDebugLog } from './ai';
import { jsonResponse, errorResponse, corsHeaders } from './utils';
import { saveResponse, toggleFavorite, setShareStatus, getUserHistory, getTeamSharedHistory, getTeamSharedHistoryEnhanced, getAvailableToolNames, getPublicShared } from './savedResponses';
import { verifyAuth } from './auth';

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

      if (path === '/api/mini-tools/persona-ask' && request.method === 'POST') {
        return await handlePersonaAsk(request, env);
      }

      if (path === '/api/mini-tools/focus-group-ask' && request.method === 'POST') {
        return await handleFocusGroupAsk(request, env);
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

      // Saved Responses API
      if (path === '/api/saved-responses/save' && request.method === 'POST') {
        const user = await verifyAuth(request, env);
        if (!user) return errorResponse('Unauthorized', 401);
        const body = await request.json();
        console.log('Save request body:', JSON.stringify(body, null, 2));
        console.log('Required fields check:', {
          hasSummary: !!body.summary,
          summaryType: typeof body.summary,
          summaryLength: body.summary?.length,
          hasResponseBlob: !!body.response_blob,
          hasToolName: !!body.tool_name
        });
        if (!body.summary || typeof body.summary !== 'string' || body.summary.length > 140) {
          return errorResponse('Summary is required and must be <= 140 chars', 400);
        }
        if (!body.response_blob || !body.tool_name) {
          return errorResponse('Missing required fields', 400);
        }
        
        const result = await saveResponse(env, {
          user_id: user.id,
          team_id: body.team_id,
          tool_name: body.tool_name,
          summary: body.summary,
          response_blob: body.response_blob
        });
        
        if (result.success) {
          return jsonResponse(result);
        } else {
          return errorResponse(result.message, 400);
        }
      }

      if (path === '/api/saved-responses/favorite' && request.method === 'POST') {
        const user = await verifyAuth(request, env);
        if (!user) return errorResponse('Unauthorized', 401);
        const body = await request.json();
        
        if (!body.response_id || typeof body.is_favorite !== 'boolean') {
          return errorResponse('Missing required fields', 400);
        }
        
        const result = await toggleFavorite(env, body.response_id, user.id, body.is_favorite);
        
        if (result.success) {
          return jsonResponse(result);
        } else {
          return errorResponse(result.message, 400);
        }
      }

      if (path === '/api/saved-responses/share' && request.method === 'POST') {
        const user = await verifyAuth(request, env);
        if (!user) return errorResponse('Unauthorized', 401);
        const body = await request.json();
        
        if (!body.response_id || typeof body.is_shared_public !== 'boolean' || typeof body.is_shared_team !== 'boolean') {
          return errorResponse('Missing required fields', 400);
        }
        
        // Get user's team_id from team_members table
        const teamMember = await env.DB.prepare(`
          SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1
        `).bind(user.id).first();
        
        const result = await setShareStatus(env, body.response_id, user.id, body.is_shared_public, body.is_shared_team, teamMember?.team_id);
        
        if (result.success) {
          return jsonResponse(result);
        } else {
          return errorResponse(result.message, 400);
        }
      }

      if (path.startsWith('/api/saved-responses/user/') && request.method === 'GET') {
        const user = await verifyAuth(request, env);
        if (!user) return errorResponse('Unauthorized', 401);
        
        const result = await getUserHistory(env, user.id);
        
        if (result.success) {
          return jsonResponse(result);
        } else {
          return errorResponse(result.message, 400);
        }
      }

      if (path.startsWith('/api/saved-responses/team/') && request.method === 'GET') {
        const user = await verifyAuth(request, env);
        if (!user) return errorResponse('Unauthorized', 401);
        // Get user's team_id from team_members table
        const teamMember = await env.DB.prepare(`
          SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1
        `).bind(user.id).first();
        
        if (!teamMember?.team_id) return errorResponse('User must belong to a team', 400);
        
        // Check if this is an enhanced request with query parameters
        const url = new URL(request.url);
        const hasFilters = url.searchParams.has('tool_name') || 
                          url.searchParams.has('date_from') || 
                          url.searchParams.has('date_to') || 
                          url.searchParams.has('favorites_only') || 
                          url.searchParams.has('search') || 
                          url.searchParams.has('limit') || 
                          url.searchParams.has('offset');
        
        if (hasFilters) {
          // Enhanced request with filtering
          const options = {
            tool_name: url.searchParams.get('tool_name') || undefined,
            date_from: url.searchParams.get('date_from') || undefined,
            date_to: url.searchParams.get('date_to') || undefined,
            favorites_only: url.searchParams.get('favorites_only') === 'true',
            search: url.searchParams.get('search') || undefined,
            limit: parseInt(url.searchParams.get('limit') || '20'),
            offset: parseInt(url.searchParams.get('offset') || '0')
          };
          
          const result = await getTeamSharedHistoryEnhanced(env, teamMember.team_id, options);
          
          if (result.success) {
            return jsonResponse(result);
          } else {
            return errorResponse(result.message, 400);
          }
        } else {
          // Original simple request
          const result = await getTeamSharedHistory(env, teamMember.team_id);
          
          if (result.success) {
            return jsonResponse(result);
          } else {
            return errorResponse(result.message, 400);
          }
        }
      }

      if (path.startsWith('/api/saved-responses/public/') && request.method === 'GET') {
        const slug = path.split('/').pop();
        if (!slug) return errorResponse('Missing slug', 400);
        
        const result = await getPublicShared(env, slug);
        
        if (result.success) {
          return jsonResponse(result);
        } else {
          return errorResponse(result.message, 404);
        }
      }

      if (path === '/api/saved-responses/tool-names' && request.method === 'GET') {
        const user = await verifyAuth(request, env);
        if (!user) return errorResponse('Unauthorized', 401);
        
        // Get user's team_id from team_members table
        const teamMember = await env.DB.prepare(`
          SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1
        `).bind(user.id).first();
        
        if (!teamMember?.team_id) return errorResponse('User must belong to a team', 400);
        
        const result = await getAvailableToolNames(env, teamMember.team_id);
        
        if (result.success) {
          return jsonResponse(result);
        } else {
          return errorResponse(result.message, 400);
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