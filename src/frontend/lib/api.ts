const API_BASE = (import.meta as any).env?.VITE_API_URL;

if (!API_BASE) {
  throw new Error('VITE_API_URL is not set. Please configure it in your environment variables.');
}

// Generic API call function
export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Get token from localStorage
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Request failed' };
    }

    return { data };
  } catch (error) {
    console.error('API request failed:', error);
    return { error: 'Network error' };
  }
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: 'Network error' };
    }
  }

  // Authentication
  async googleAuth(code: string, redirectUri: string) {
    return this.request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });
  }

  async getSession() {
    return this.request('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    });
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  }

  // Teams
  async createTeam(name: string, industry: string, focus_areas?: string[], team_description?: string) {
    return this.request('/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name, industry, focus_areas, team_description }),
      credentials: 'include',
    });
  }

  async getTeams() {
    return this.request('/api/teams', {
      credentials: 'include',
    });
  }

  async updateTeam(teamId: string, payload: { name?: string; industry?: string; focus_areas?: string[]; team_description?: string }) {
    return this.request(`/api/teams/${teamId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      credentials: 'include',
    });
  }

  async joinTeam(inviteCode: string) {
    return this.request('/api/teams/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code: inviteCode }),
      credentials: 'include',
    });
  }

  // AI Features
  async generatePlay(payload: any) {
    return this.request('/api/plays/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
      credentials: 'include',
    });
  }

  async interpretSignal(observation: string, context?: string) {
    return this.request('/api/signals/interpret', {
      method: 'POST',
      body: JSON.stringify({ observation, context }),
      credentials: 'include',
    });
  }

  async generateRitualPrompts(payload: any) {
    return this.request('/api/rituals/prompts', {
      method: 'POST',
      body: JSON.stringify(payload),
      credentials: 'include',
    });
  }

  // Mini Tools
  async plainEnglishTranslator(originalText: string) {
    return this.request('/api/mini-tools/plain-english-translator', {
      method: 'POST',
      body: JSON.stringify({ original_text: originalText }),
      credentials: 'include',
    });
  }

  async getToByGenerator(audienceDescription: string, behavioralOrEmotionalInsight: string, brandProductRole: string) {
    return this.request('/api/mini-tools/get-to-by-generator', {
      method: 'POST',
      body: JSON.stringify({ 
        audience_description: audienceDescription,
        behavioral_or_emotional_insight: behavioralOrEmotionalInsight,
        brand_product_role: brandProductRole
      }),
      credentials: 'include',
    });
  }

  async creativeTensionFinder(problemOrStrategySummary: string) {
    return this.request('/api/mini-tools/creative-tension-finder', {
      method: 'POST',
      body: JSON.stringify({ problem_or_strategy_summary: problemOrStrategySummary }),
      credentials: 'include',
    });
  }

  async personaGenerator(audienceSeed: string) {
    return this.request('/api/mini-tools/persona-generator', {
      method: 'POST',
      body: JSON.stringify({ 
        audience_seed: audienceSeed
      }),
      credentials: 'include',
    });
  }

  async personaAsk(question: string) {
    return this.request('/api/mini-tools/persona-ask', {
      method: 'POST',
      body: JSON.stringify({ 
        question: question
      }),
      credentials: 'include',
    });
  }

  async syntheticFocusGroup(topicOrCategory: string, audienceSeedInfo: string, mustIncludeSegments?: string) {
    return this.request('/api/mini-tools/synthetic-focus-group', {
      method: 'POST',
      body: JSON.stringify({ 
        topic_or_category: topicOrCategory,
        audience_seed_info: audienceSeedInfo,
        must_include_segments: mustIncludeSegments
      }),
      credentials: 'include',
    });
  }

  async focusGroupAsk(question: string) {
    return this.request('/api/mini-tools/focus-group-ask', {
      method: 'POST',
      body: JSON.stringify({ 
        question: question
      }),
      credentials: 'include',
    });
  }

  async journeyBuilder(productOrService: string, primaryObjective: string, keyBarrier?: string) {
    return this.request('/api/mini-tools/journey-builder', {
      method: 'POST',
      body: JSON.stringify({ 
        product_or_service: productOrService,
        primary_objective: primaryObjective,
        key_barrier: keyBarrier || ''
      }),
      credentials: 'include',
    });
  }

  async testLearnScale(campaignOrProductContext: string, resourcesOrConstraints?: string) {
    return this.request('/api/mini-tools/test-learn-scale', {
      method: 'POST',
      body: JSON.stringify({ 
        campaign_or_product_context: campaignOrProductContext,
        resources_or_constraints: resourcesOrConstraints || ''
      }),
      credentials: 'include',
    });
  }

  async agileSprintPlanner(challengeStatement: string, timeHorizon: string, teamSizeRoles: string) {
    return this.request('/api/mini-tools/agile-sprint-planner', {
      method: 'POST',
      body: JSON.stringify({ 
        challenge_statement: challengeStatement,
        time_horizon: timeHorizon,
        team_size_roles: teamSizeRoles
      }),
      credentials: 'include',
    });
  }

  async connectedMediaMatrix(audienceSnapshot: string, primaryConversionAction: string, seasonalOrContextualTriggers?: string) {
    return this.request('/api/mini-tools/connected-media-matrix', {
      method: 'POST',
      body: JSON.stringify({ 
        audience_snapshot: audienceSnapshot,
        primary_conversion_action: primaryConversionAction,
        seasonal_or_contextual_triggers: seasonalOrContextualTriggers || ''
      }),
      credentials: 'include',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/api/health');
  }

  // Saved Responses
  /**
   * Save a response (requires summary, tool_name, response_blob, optional team_id and prompt context)
   */
  async saveResponse({ 
    summary, 
    tool_name, 
    response_blob, 
    team_id,
    system_prompt,
    user_input,
    final_prompt,
    raw_response_text
  }: { 
    summary: string; 
    tool_name: string; 
    response_blob: string; 
    team_id?: string;
    system_prompt?: string;
    user_input?: string;
    final_prompt?: string;
    raw_response_text?: string;
  }) {
    return this.request('/api/saved-responses/save', {
      method: 'POST',
      body: JSON.stringify({ 
        summary, 
        tool_name, 
        response_blob, 
        team_id,
        system_prompt,
        user_input,
        final_prompt,
        raw_response_text
      }),
      credentials: 'include',
    });
  }

  /**
   * Toggle favorite on a saved response
   */
  async toggleFavorite(response_id: string, is_favorite: boolean) {
    return this.request('/api/saved-responses/favorite', {
      method: 'POST',
      body: JSON.stringify({ response_id, is_favorite }),
      credentials: 'include',
    });
  }

  /**
   * Set share status (public/team) on a saved response
   */
  async setShareStatus(response_id: string, is_shared_public: boolean, is_shared_team: boolean) {
    return this.request('/api/saved-responses/share', {
      method: 'POST',
      body: JSON.stringify({ response_id, is_shared_public, is_shared_team }),
      credentials: 'include',
    });
  }

  /**
   * Get user history (saved responses)
   */
  async getUserHistory() {
    return this.request('/api/saved-responses/user/me', {
      credentials: 'include',
    });
  }

  /**
   * Get team shared history
   */
  async getTeamSharedHistory() {
    return this.request('/api/saved-responses/team/me', {
      credentials: 'include',
    });
  }

  /**
   * Get team shared history with enhanced filtering and pagination
   */
  async getTeamSharedHistoryEnhanced(options: {
    tool_name?: string;
    date_from?: string;
    date_to?: string;
    favorites_only?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const params = new URLSearchParams();
    
    if (options.tool_name) params.append('tool_name', options.tool_name);
    if (options.date_from) params.append('date_from', options.date_from);
    if (options.date_to) params.append('date_to', options.date_to);
    if (options.favorites_only) params.append('favorites_only', 'true');
    if (options.search) params.append('search', options.search);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    
    const queryString = params.toString();
    const endpoint = `/api/saved-responses/team/me${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint, {
      credentials: 'include',
    });
  }

  /**
   * Get available tool names for filtering
   */
  async getAvailableToolNames() {
    return this.request('/api/saved-responses/tool-names', {
      credentials: 'include',
    });
  }

  /**
   * Get a public shared response by slug
   */
  async getPublicShared(slug: string) {
    return this.request(`/api/saved-responses/public/${slug}`, {
      credentials: 'include',
    });
  }

  /**
   * Get a team shared response by slug
   */
  async getTeamSharedBySlug(slug: string) {
    return this.request(`/api/saved-responses/team-shared/${slug}`, {
      credentials: 'include',
    });
  }

  async deleteAllResponses() {
    return this.request('/api/saved-responses/delete-all', {
      method: 'DELETE',
      credentials: 'include',
    });
  }

  /**
   * Get invite information by invite code
   */
  async getInviteInfo(inviteCode: string) {
    return this.request(`/api/invite/${inviteCode}`, {
      credentials: 'include',
    });
  }

  // Settings API
  async getAccountSettings() {
    return this.request('/api/settings/account', {
      credentials: 'include',
    });
  }

  async updateAccountSettings(payload: { name: string }) {
    return this.request('/api/settings/account', {
      method: 'POST',
      body: JSON.stringify(payload),
      credentials: 'include',
    });
  }

  async getTeamSettings() {
    return this.request('/api/settings/team', {
      credentials: 'include',
    });
  }

  async updateTeamName(payload: { name: string }) {
    return this.request('/api/settings/team', {
      method: 'POST',
      body: JSON.stringify(payload),
      credentials: 'include',
    });
  }

  async updateTeamProfile(payload: { industry: string; focus_areas: string[]; team_description: string }) {
    return this.request('/api/settings/team/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
      credentials: 'include',
    });
  }

  async inviteTeamMember(payload: { email: string }) {
    return this.request('/api/settings/team/invite', {
      method: 'POST',
      body: JSON.stringify(payload),
      credentials: 'include',
    });
  }

  async removeTeamMember(payload: { member_id: string }) {
    return this.request('/api/settings/team/remove', {
      method: 'POST',
      body: JSON.stringify(payload),
      credentials: 'include',
    });
  }

  async setMemberRole(payload: { member_id: string; role: 'owner' | 'member' }) {
    return this.request('/api/settings/team/set-role', {
      method: 'POST',
      body: JSON.stringify(payload),
      credentials: 'include',
    });
  }

  async getBillingInfo() {
    return this.request('/api/settings/billing', {
      credentials: 'include',
    });
  }

  async updateSubscription(payload: { plan: string; seat_count?: number }) {
    return this.request('/api/settings/billing', {
      method: 'POST',
      body: JSON.stringify(payload),
      credentials: 'include',
    });
  }

  async cancelSubscription() {
    return this.request('/api/settings/billing/cancel', {
      method: 'POST',
      credentials: 'include',
    });
  }

  // Billing API
  async getBillingPortalLink() {
    return this.request('/api/billing/portal-link', {
      credentials: 'include',
    });
  }

  async createCheckoutSession(payload: { priceId: string; successUrl?: string; cancelUrl?: string }) {
    return this.request('/api/billing/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify(payload),
      credentials: 'include',
    });
  }

  async getSubscriptionStatus() {
    return this.request('/api/billing/subscription-status', {
      credentials: 'include',
    });
  }

  // Benchmarking API
  async getTeamBenchmarks(period: string = '30d') {
    return this.request(`/api/benchmarking/team?period=${period}`, {
      credentials: 'include',
    });
  }

  async getIndustryBenchmarks(period: string = '30d') {
    return this.request(`/api/benchmarking/industry?period=${period}`, {
      credentials: 'include',
    });
  }

  // Dashboard API
  async getDashboardOverview() {
    return this.request('/api/dashboard/overview', {
      credentials: 'include',
    });
  }

  async getDashboardAnnouncements() {
    return this.request('/api/dashboard/announcements', {
      credentials: 'include',
    });
  }

  async createDashboardAnnouncement(payload: { title: string; summary: string; body?: string; is_active?: boolean }) {
    return this.request('/api/dashboard/announcements', {
      method: 'POST',
      body: JSON.stringify({ ...payload, is_active: payload.is_active ?? true }),
      credentials: 'include',
    });
  }

  async updateDashboardAnnouncement(id: string, payload: { title: string; summary: string; body?: string; is_active?: boolean }) {
    return this.request(`/api/dashboard/announcements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      credentials: 'include',
    });
  }

  async deleteDashboardAnnouncement(id: string) {
    return this.request(`/api/dashboard/announcements/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  }

  // Admin API
  async getAdminSettings() {
    return this.request('/api/admin/settings', {
      credentials: 'include',
    });
  }

  async updateAdminModel(model: string) {
    return this.request('/api/admin/update-model', {
      method: 'POST',
      body: JSON.stringify({ model }),
      credentials: 'include',
    });
  }

  async updateAdminAnnouncement(announcement: string) {
    return this.request('/api/admin/update-announcement', {
      method: 'POST',
      body: JSON.stringify({ announcement }),
      credentials: 'include',
    });
  }

  // System Prompts (Admin only)
  async getSystemPrompts() {
    return this.request('/api/admin/system-prompts', {
      credentials: 'include',
    });
  }

  async updateSystemPrompt(id: string, prompt: {
    prompt_text: string;
    model: string;
    max_tokens: number;
    temperature: number;
    top_p: number;
    frequency_penalty: number;
    presence_penalty: number;
  }) {
    return this.request(`/api/admin/system-prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ id, ...prompt }),
      credentials: 'include',
    });
  }

  async getPlaceholders(toolName: string) {
    return this.request(`/api/admin/system-prompts/placeholders?tool_name=${encodeURIComponent(toolName)}`, {
      method: 'GET',
      credentials: 'include',
    });
  }

  // Planner API methods
  async createPlannerSession(inputs: any) {
    return this.request('/api/planner/sessions', {
      method: 'POST',
      body: JSON.stringify({ inputs }),
      credentials: 'include',
    });
  }

  async getPlannerSessions() {
    return this.request('/api/planner/sessions', {
      credentials: 'include',
    });
  }

  async getPlannerSession(sessionId: string) {
    return this.request(`/api/planner/sessions/${sessionId}`, {
      credentials: 'include',
    });
  }
}

export const apiClient = new ApiClient(API_BASE); 