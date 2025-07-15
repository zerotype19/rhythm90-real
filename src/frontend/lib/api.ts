const API_BASE = (import.meta as any).env?.VITE_API_URL;

if (!API_BASE) {
  throw new Error('VITE_API_URL is not set. Please configure it in your environment variables.');
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
  async createTeam(name: string, industry: string) {
    return this.request('/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name, industry }),
      credentials: 'include',
    });
  }

  async getTeams() {
    return this.request('/api/teams', {
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

  // Health check
  async healthCheck() {
    return this.request('/api/health');
  }
}

export const apiClient = new ApiClient(API_BASE); 