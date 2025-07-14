import { Env, GeneratePlayRequest, GeneratePlayResponse, InterpretSignalRequest, InterpretSignalResponse, GenerateRitualPromptsRequest, GenerateRitualPromptsResponse } from './types';
import { callOpenAI, jsonResponse, errorResponse } from './utils';
import { verifyAuth } from './auth';

const SYSTEM_MESSAGE = {
  role: 'system',
  content: `You are an AI assistant trained to help teams use the Rhythm90 system.\n\nRhythm90 is a quarterly operating system designed to help teams work smarter by defining clear plays (hypotheses), capturing meaningful signals (observations), running sharp rituals (team sessions), and learning from Review & Renew moments.\n\nYour job is to help teams shape strong plays, interpret meaningful signals, and run effective rituals — all aligned to the Rhythm90 framework.`
};

const MODULE_CONTEXTS = {
  play: {
    role: 'user',
    content: `Context: Help the team turn rough ideas into sharp, testable plays.\n\nA play should follow this format:\nWe believe [action/idea] for [audience/context] will result in [desired outcome] because [reasoning].\n\nHelp stress-test clarity, specificity, and relevance.`
  },
  signal: {
    role: 'user',
    content: `Context: Help the team turn messy observations or data into clear signals.\n\nFocus on identifying surprises, friction points, and meaningful patterns — not just summarizing data.\n\nExplain why the signal matters and how it might inform plays.`
  },
  ritual: {
    role: 'user',
    content: `Context: Help the team plan, run, and reflect on Rhythm90 rituals like Kickoffs, Pulse Checks, and Review & Renew sessions.\n\nProvide clear agendas, sharp facilitation questions, and prompts that connect to the Rhythm90 system.\n\nAvoid generic business advice — tailor to the team's Rhythm90 journey.`
  }
};

function buildTeamSessionContext(team_type?: string, session_purpose?: string, challenges?: string | string[]): any | null {
  if (!team_type && !session_purpose && !challenges) return null;
  let content = '';
  if (team_type) content += `Team type: ${team_type}. `;
  if (session_purpose) content += `Session purpose: ${session_purpose}. `;
  if (challenges) {
    const ch = Array.isArray(challenges) ? challenges.join(', ') : challenges;
    content += `Known challenges: ${ch}.`;
  }
  return content ? { role: 'user', content: content.trim() } : null;
}

export async function handleGeneratePlay(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  try {
    const user = await verifyAuth(request, env);
    if (!user) return errorResponse('Unauthorized', 401);
    const body: GeneratePlayRequest = await request.json();
    const { idea, context, team_type, session_purpose, challenges } = body;
    if (!idea) return errorResponse('Idea is required', 400);
    const messages = [
      SYSTEM_MESSAGE,
      MODULE_CONTEXTS.play,
    ];
    const teamSessionMsg = buildTeamSessionContext(team_type, session_purpose, challenges);
    if (teamSessionMsg) messages.push(teamSessionMsg);
    // User prompt
    let userPrompt = `Idea: ${idea}`;
    if (context) userPrompt += `\nContext: ${context}`;
    // Specify output format for UI
    userPrompt += `\n\nPlease provide:\n1. A clear, testable hypothesis statement\n2. 3-5 specific suggestions for how to test this hypothesis\n\nFormat your response as JSON with "hypothesis" and "suggestions" fields.`;
    messages.push({ role: 'user', content: userPrompt });
    const aiResponse = await callOpenAI(messages, env);
    try {
      const parsed = JSON.parse(aiResponse);
      const response: GeneratePlayResponse = {
        hypothesis: parsed.hypothesis || 'Failed to generate hypothesis',
        suggestions: parsed.suggestions || ['Try again later']
      };
      return jsonResponse(response);
    } catch (parseError) {
      const response: GeneratePlayResponse = {
        hypothesis: aiResponse,
        suggestions: ['Review and refine the hypothesis', 'Consider different angles', 'Test with your team']
      };
      return jsonResponse(response);
    }
  } catch (error) {
    console.error('Generate play error:', error);
    return errorResponse('Failed to generate play', 500);
  }
}

export async function handleInterpretSignal(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  try {
    const user = await verifyAuth(request, env);
    if (!user) return errorResponse('Unauthorized', 401);
    const body: InterpretSignalRequest = await request.json();
    const { observation, context, team_type, session_purpose, challenges } = body;
    if (!observation) return errorResponse('Observation is required', 400);
    const messages = [
      SYSTEM_MESSAGE,
      MODULE_CONTEXTS.signal,
    ];
    const teamSessionMsg = buildTeamSessionContext(team_type, session_purpose, challenges);
    if (teamSessionMsg) messages.push(teamSessionMsg);
    let userPrompt = `Observation: ${observation}`;
    if (context) userPrompt += `\nContext: ${context}`;
    userPrompt += `\n\nPlease provide:\n1. A clear interpretation of what this observation means\n2. A confidence level (0-100) in your interpretation\n\nFormat your response as JSON with "interpretation" and "confidence" fields.`;
    messages.push({ role: 'user', content: userPrompt });
    const aiResponse = await callOpenAI(messages, env);
    try {
      const parsed = JSON.parse(aiResponse);
      const response: InterpretSignalResponse = {
        interpretation: parsed.interpretation || 'Failed to interpret signal',
        confidence: parsed.confidence || 50
      };
      return jsonResponse(response);
    } catch (parseError) {
      const response: InterpretSignalResponse = {
        interpretation: aiResponse,
        confidence: 50
      };
      return jsonResponse(response);
    }
  } catch (error) {
    console.error('Interpret signal error:', error);
    return errorResponse('Failed to interpret signal', 500);
  }
}

export async function handleGenerateRitualPrompts(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  try {
    const user = await verifyAuth(request, env);
    if (!user) return errorResponse('Unauthorized', 401);
    const body: GenerateRitualPromptsRequest = await request.json();
    const { ritual_type, team_context, team_type, session_purpose, challenges } = body;
    if (!ritual_type) return errorResponse('Ritual type is required', 400);
    const messages = [
      SYSTEM_MESSAGE,
      MODULE_CONTEXTS.ritual,
    ];
    const teamSessionMsg = buildTeamSessionContext(team_type, session_purpose, challenges);
    if (teamSessionMsg) messages.push(teamSessionMsg);
    let userPrompt = `Ritual type: ${ritual_type}`;
    if (team_context) userPrompt += `\nTeam Context: ${team_context}`;
    userPrompt += `\n\nPlease provide:\n1. A structured agenda with 5-7 items\n2. 3-5 engaging prompts to facilitate discussion\n\nFormat your response as JSON with "agenda" and "prompts" fields.`;
    messages.push({ role: 'user', content: userPrompt });
    const aiResponse = await callOpenAI(messages, env);
    try {
      const parsed = JSON.parse(aiResponse);
      const response: GenerateRitualPromptsResponse = {
        agenda: parsed.agenda || ['Welcome and introductions', 'Review objectives', 'Open discussion', 'Action items', 'Next steps'],
        prompts: parsed.prompts || ['What went well this week?', 'What challenges did we face?', 'How can we improve?']
      };
      return jsonResponse(response);
    } catch (parseError) {
      const response: GenerateRitualPromptsResponse = {
        agenda: ['Welcome and introductions', 'Review objectives', 'Open discussion', 'Action items', 'Next steps'],
        prompts: ['What went well this week?', 'What challenges did we face?', 'How can we improve?']
      };
      return jsonResponse(response);
    }
  } catch (error) {
    console.error('Generate ritual prompts error:', error);
    return errorResponse('Failed to generate ritual prompts', 500);
  }
} 