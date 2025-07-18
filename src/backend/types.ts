// Database types
export interface User {
  id: string;
  name: string;
  email: string;
  google_id: string;
  is_admin: boolean;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  industry: string;
  focus_areas: string; // JSON string array
  team_description: string;
  owner_id: string;
  invite_code: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: 'owner' | 'member';
  is_admin: boolean;
  joined_at: string;
}

export interface Subscription {
  id: string;
  team_id: string;
  plan: string;
  status: string;
  seat_count: number;
  billing_info: string | null;
  created_at: string;
}

export interface Play {
  id: string;
  team_id: string;
  title: string;
  hypothesis: string;
  status: string;
  created_at: string;
}

export interface Signal {
  id: string;
  team_id: string;
  play_id: string | null;
  observation: string;
  interpretation: string;
  created_at: string;
}

export interface PlannerSession {
  id: string;
  team_id: string;
  created_by: string;
  inputs_json: string; // JSON string containing all planner inputs
  output_summary: string | null;
  created_at: string;
}

// API Request/Response types
export interface AuthRequest {
  code: string;
  redirect_uri: string;
}

export interface AuthResponse {
  user: User;
  teams: Team[];
  access_token: string;
}

export interface CreateTeamRequest {
  name: string;
  industry: string;
  focus_areas?: string[];
  team_description?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  industry?: string;
  focus_areas?: string[];
  team_description?: string;
}

export interface JoinTeamRequest {
  invite_code: string;
}

export interface InviteTeamMemberRequest {
  email: string;
}

export interface InviteTeamMemberResponse {
  success: boolean;
  message: string;
  warning?: string;
}

export interface GetInviteInfoRequest {
  invite_code: string;
}

export interface GetInviteInfoResponse {
  team: Team;
  valid: boolean;
}

export interface GeneratePlayRequest {
  idea: string;
  context?: string;
  team_type?: string;
  session_purpose?: string;
  challenges?: string | string[];
}

export interface GeneratePlayResponse {
  hypothesis: string;
  suggestions: string[];
}

export interface InterpretSignalRequest {
  observation: string;
  context?: string;
  team_type?: string;
  session_purpose?: string;
  challenges?: string | string[];
}

export interface InterpretSignalResponse {
  interpretation: string;
  confidence: number;
}

export interface GenerateRitualPromptsRequest {
  ritual_type: 'kickoff' | 'pulse_check' | 'rr';
  team_type?: string;
  top_challenges?: string;
  focus_areas?: string;
  additional_context?: string;
}

export interface GenerateRitualPromptsResponse {
  agenda: string[];
  prompts: string[];
}

// Quarterly Planner types
export interface PlannerInputs {
  bigChallenge: string;
  learningGoals: string[];
  businessContext?: string;
  knownPlays?: string;
  signalsToWatch: string[];
  blockers?: string;
  roles: {
    rhythm90Lead?: string;
    strategicLeads?: string[];
    executionalLeads?: string[];
    signalOwner?: string;
  };
}

export interface CreatePlannerSessionRequest {
  inputs: PlannerInputs;
}

export interface CreatePlannerSessionResponse {
  session: PlannerSession;
  summary: string;
}

export interface GetPlannerSessionsResponse {
  sessions: PlannerSession[];
}

// System Settings types
export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUpdateModelRequest {
  model: string;
}

export interface AdminUpdateAnnouncementRequest {
  announcement: string;
}

// System Prompt types
export interface SystemPrompt {
  id: string;
  tool_name: string;
  prompt_text: string;
  max_tokens: number;
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  updated_at: string;
}

// Environment variables
export interface Env {
  DB: any; // D1Database type from Cloudflare Workers
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  OPENAI_API_KEY: string;
  JWT_SECRET: string;
  APP_URL: string;
  ENVIRONMENT: string;
  MAILERSEND_API_KEY: string;
  MAILERSEND_FROM_EMAIL: string;
  MAILERSEND_FROM_NAME: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRO_LIMITED_PRICE_ID: string;
  STRIPE_PRO_UNLIMITED_PRICE_ID: string;
} 