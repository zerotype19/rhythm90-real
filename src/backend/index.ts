import { Env } from './types';
import { handleGoogleAuth, handleGoogleCallback, handleGetSession, handleLogout } from './auth';
import { handleCreateTeam, handleGetTeams, handleJoinTeam, handleUpdateTeam } from './teams';
import { handleGeneratePlay, handleInterpretSignal, handleGenerateRitualPrompts, handlePlainEnglishTranslator, handleGetToByGenerator, handleCreativeTensionFinder, handlePersonaGenerator, handlePersonaAsk, handleFocusGroupAsk, handleJourneyBuilder, handleTestLearnScale, handleAgileSprintPlanner, handleConnectedMediaMatrix, handleSyntheticFocusGroup, lastMiniToolDebugLog } from './ai';
import { lastPlayBuilderDebugLog, lastSignalLabDebugLog, lastRitualGuideDebugLog } from './ai';
import { jsonResponse, errorResponse, corsHeaders } from './utils';
import { saveResponse, toggleFavorite, setShareStatus, getUserHistory, getTeamSharedHistory, getTeamSharedHistoryEnhanced, getAvailableToolNames, getPublicShared, getTeamSharedBySlug } from './savedResponses';
import { verifyAuth } from './auth';
import { handleGetAccountSettings, handleUpdateAccountSettings, handleGetTeamSettings, handleUpdateTeamName, handleUpdateTeamProfile, handleInviteTeamMember, handleRemoveTeamMember, handleSetMemberRole, handleGetBillingInfo, handleUpdateSubscription, handleCancelSubscription, getLastSettingsDebugLog } from './settings';
import { handleGetTeamBenchmarks, handleGetIndustryBenchmarks, getLastBenchmarkDebugLog } from './benchmarking';
import { handleDashboardOverview, handleGetAnnouncements, handleCreateAnnouncement, handleUpdateAnnouncement, handleDeleteAnnouncement } from './dashboard';
import { handleGetPortalLink, handleCreateCheckoutSession, handleGetSubscriptionStatus, getLastStripeDebugLog } from './billing';
import { handleUpdateModel, handleUpdateAnnouncement as handleUpdateSystemAnnouncement, handleGetSettings } from './admin';
import { handleGetSystemPrompts, handleUpdateSystemPrompt, handleGetPlaceholders } from './systemPrompts';
import { handleCreatePlannerSession, handleGetPlannerSessions, handleGetPlannerSession } from './planner';
import { handleGetSession as handleGetAssistantSession, handleSendMessage, handleClearConversation } from './assistant';
import { handleGetInviteInfo } from './invites';

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
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

      // Settings routes
      if (path === '/api/settings/account' && request.method === 'GET') {
        return await handleGetAccountSettings(request, env);
      }
      if (path === '/api/settings/account' && request.method === 'POST') {
        return await handleUpdateAccountSettings(request, env);
      }
      if (path === '/api/settings/team' && request.method === 'GET') {
        return await handleGetTeamSettings(request, env);
      }
      if (path === '/api/settings/team' && request.method === 'POST') {
        return await handleUpdateTeamName(request, env);
      }
      if (path === '/api/settings/team/profile' && request.method === 'POST') {
        return await handleUpdateTeamProfile(request, env);
      }
      if (path === '/api/settings/team/invite' && request.method === 'POST') {
        return await handleInviteTeamMember(request, env);
      }
      if (path === '/api/settings/team/remove' && request.method === 'POST') {
        return await handleRemoveTeamMember(request, env);
      }
      if (path === '/api/settings/team/set-role' && request.method === 'POST') {
        return await handleSetMemberRole(request, env);
      }
      if (path === '/api/settings/billing' && request.method === 'GET') {
        return await handleGetBillingInfo(request, env);
      }
      if (path === '/api/settings/billing' && request.method === 'POST') {
        return await handleUpdateSubscription(request, env);
      }
      if (path === '/api/settings/billing/cancel' && request.method === 'POST') {
        return await handleCancelSubscription(request, env);
      }

      // Billing routes
      if (path === '/api/billing/portal-link' && request.method === 'GET') {
        return await handleGetPortalLink(request, env);
      }
      if (path === '/api/billing/create-checkout-session' && request.method === 'POST') {
        return await handleCreateCheckoutSession(request, env);
      }
      if (path === '/api/billing/subscription-status' && request.method === 'GET') {
        return await handleGetSubscriptionStatus(request, env);
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

      // Team update route (PATCH /api/teams/:id)
      if (path.match(/^\/api\/teams\/[^\/]+$/) && request.method === 'PATCH') {
        return await handleUpdateTeam(request, env);
      }

      // Invite routes
      if (path.match(/^\/api\/invite\/[^\/]+$/) && request.method === 'GET') {
        return await handleGetInviteInfo(request, env);
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

      // Settings Debugger: Last settings call
      if (path === '/api/debug/last-settings-call' && request.method === 'GET') {
        const debugLog = getLastSettingsDebugLog();
        if (debugLog) {
          return jsonResponse(debugLog);
        } else {
          return jsonResponse({ error: 'No settings debug log found.' }, 404);
        }
      }

      // Benchmarking routes
      if (path === '/api/benchmarking/team' && request.method === 'GET') {
        return await handleGetTeamBenchmarks(request, env);
      }
      if (path === '/api/benchmarking/industry' && request.method === 'GET') {
        return await handleGetIndustryBenchmarks(request, env);
      }

      // Benchmarking Debugger: Last benchmark call
      if (path === '/api/debug/last-benchmark-call' && request.method === 'GET') {
        const debugLog = getLastBenchmarkDebugLog();
        if (debugLog) {
          return jsonResponse(debugLog);
        } else {
          return jsonResponse({ error: 'No benchmark debug log found.' }, 404);
        }
      }

      // Stripe Debugger: Last Stripe API call
      if (path === '/api/debug/last-stripe-log' && request.method === 'GET') {
        const debugLog = getLastStripeDebugLog();
        if (debugLog) {
          return jsonResponse(debugLog);
        } else {
          return jsonResponse({ error: 'No Stripe debug log found.' }, 404);
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
          response_blob: body.response_blob,
          system_prompt: body.system_prompt,
          user_input: body.user_input,
          final_prompt: body.final_prompt,
          raw_response_text: body.raw_response_text
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

      if (path.startsWith('/api/saved-responses/team-shared/') && request.method === 'GET') {
        const user = await verifyAuth(request, env);
        if (!user) return errorResponse('Unauthorized', 401);
        
        const slug = path.split('/').pop();
        if (!slug) return errorResponse('Missing slug', 400);
        
        // Get user's team_id from team_members table
        const teamMember = await env.DB.prepare(`
          SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1
        `).bind(user.id).first();
        
        if (!teamMember?.team_id) return errorResponse('User must belong to a team', 400);
        
        const result = await getTeamSharedBySlug(env, slug, teamMember.team_id);
        
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

      // Dashboard routes
      if (path === '/api/dashboard/overview' && request.method === 'GET') {
        return await handleDashboardOverview(request, env, ctx);
      }
      if (path === '/api/dashboard/announcements' && request.method === 'GET') {
        return await handleGetAnnouncements(request, env, ctx);
      }
      if (path === '/api/dashboard/announcements' && request.method === 'POST') {
        return await handleCreateAnnouncement(request, env, ctx);
      }
      if (path.startsWith('/api/dashboard/announcements/') && request.method === 'PATCH') {
        const id = path.split('/').pop();
        if (!id) return errorResponse('Missing announcement id', 400);
        return await handleUpdateAnnouncement(request, env, ctx, id);
      }
      if (path.startsWith('/api/dashboard/announcements/') && request.method === 'DELETE') {
        const id = path.split('/').pop();
        if (!id) return errorResponse('Missing announcement id', 400);
        return await handleDeleteAnnouncement(request, env, ctx, id);
      }

      // Admin routes
      if (path === '/api/admin/settings' && request.method === 'GET') {
        return await handleGetSettings(request, env);
      }
      if (path === '/api/admin/update-model' && request.method === 'POST') {
        return await handleUpdateModel(request, env);
      }
      if (path === '/api/admin/update-announcement' && request.method === 'POST') {
        return await handleUpdateSystemAnnouncement(request, env);
      }
      
      // System Prompts routes (admin only)
      if (path === '/api/admin/system-prompts' && request.method === 'GET') {
        return await handleGetSystemPrompts(request, env);
      }
      if (path === '/api/admin/system-prompts' && request.method === 'POST') {
        return await handleUpdateSystemPrompt(request, env);
      }
      if (path.match(/^\/api\/admin\/system-prompts\/[^\/]+$/) && request.method === 'PUT') {
        return await handleUpdateSystemPrompt(request, env);
      }
      if (path === '/api/admin/system-prompts/placeholders' && request.method === 'GET') {
        return await handleGetPlaceholders(request, env);
      }

      // Planner routes
      if (path === '/api/planner/sessions' && request.method === 'POST') {
        return await handleCreatePlannerSession(request, env);
      }
      if (path === '/api/planner/sessions' && request.method === 'GET') {
        return await handleGetPlannerSessions(request, env);
      }
      if (path.startsWith('/api/planner/sessions/') && request.method === 'GET') {
        return await handleGetPlannerSession(request, env);
      }

      // Assistant routes
      if (path === '/api/assistant/sessions' && request.method === 'GET') {
        return await handleGetAssistantSession(request, env);
      }
      if (path === '/api/assistant/sessions/message' && request.method === 'POST') {
        return await handleSendMessage(request, env);
      }
      if (path === '/api/assistant/sessions/clear' && request.method === 'POST') {
        return await handleClearConversation(request, env);
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