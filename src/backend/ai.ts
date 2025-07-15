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

const PLAY_BUILDER_SYSTEM_MESSAGE = {
  role: 'system',
  content: `You are a Rhythm90 Play Builder assistant.\n\nYour job is to help teams turn rough ideas into sharp, testable plays using the Rhythm90 framework.\n\nA Play should:\n- Follow the format: We believe [action] for [audience/context] will result in [outcome] because [reasoning].\n- Be small enough to test inside a quarter, big enough to generate meaningful learning.\n- Be tied to a real signal, not just a business opinion.\n- Assign clear ownership.\n- Include guidance on what signals to watch, not just KPIs.`
};

// In-memory store for last Play Builder debug log
export let lastPlayBuilderDebugLog: any = null;
// --- New: In-memory store for last Signal Lab debug log ---
export let lastSignalLabDebugLog: any = null;

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
    const body: any = await request.json();
    // Log raw request body (excluding PII)
    const { idea_prompt, top_signal, team_type, quarter_focus, owner_role, idea, context } = body;
    console.log('[AI DEBUG] Raw PlayBuilder request body:', JSON.stringify({ idea_prompt, top_signal, team_type, quarter_focus, owner_role, idea, context }, null, 2));
    // Extraction helper
    function extractField(field: any, fieldName: string): string {
      let result = '';
      if (field && typeof field === 'object') {
        if ('value' in field && typeof field.value === 'string') result = field.value;
        else if ('label' in field && typeof field.label === 'string') result = field.label;
        else result = '';
      } else {
        result = typeof field === 'string' ? field : (field ? String(field) : '');
      }
      console.log(`[AI DEBUG] Extracted ${fieldName}:`, result);
      return result;
    }
    // New fields
    let extracted_team_type = extractField(team_type, 'team_type');
    let extracted_quarter_focus = extractField(quarter_focus, 'quarter_focus');
    let extracted_top_signal = extractField(top_signal, 'top_signal');
    let extracted_owner_role = extractField(owner_role, 'owner_role');
    let extracted_idea_prompt = extractField(idea_prompt, 'idea_prompt');
    // Old fields for fallback
    let extracted_idea = extractField(idea, 'idea');
    let extracted_context = extractField(context, 'context');
    let messages = [PLAY_BUILDER_SYSTEM_MESSAGE];
    // If new fields are present, use new prompt structure
    if (extracted_team_type || extracted_quarter_focus || extracted_top_signal || extracted_owner_role || extracted_idea_prompt) {
      let contextMsg = 'Context:';
      if (extracted_team_type) contextMsg += `\nTeam Type: ${extracted_team_type}`;
      if (extracted_quarter_focus) contextMsg += `\nQuarter Focus: ${extracted_quarter_focus}`;
      if (extracted_top_signal) contextMsg += `\nTop Signal: ${extracted_top_signal}`;
      if (extracted_owner_role) contextMsg += `\nOwner Role: ${extracted_owner_role}`;
      if (extracted_context) contextMsg += `\nAdditional Context: ${extracted_context}`;
      // Repeat key fields for emphasis
      if (extracted_idea_prompt) contextMsg += `\n\nThe core idea to address is: ${extracted_idea_prompt}.`;
      if (extracted_top_signal) contextMsg += `\nThe key signal driving this is: ${extracted_top_signal}.`;
      messages.push({ role: 'user', content: contextMsg });
      let ideaMsg = 'Help us shape a Play for this idea:';
      if (extracted_idea_prompt) ideaMsg += ` ${extracted_idea_prompt}`;
      messages.push({ role: 'user', content: ideaMsg });
      // Always instruct the AI to return the six sections, with sharper instructions
      messages.push({
        role: 'user',
        content: `Please return your answer with the following sections:
1. Hypothesis (in Rhythm90 framing)
2. How-to-Run Summary (include timeframe, sample size, control/experiment)
3. Signals to Watch (what surprises or confirms progress)
4. Owner Role (who leads, who contributes)
5. What Success Looks Like (include what we will learn and how it informs future plays)
6. Next Recommendation (Based on what we learn, what should we do next?)

Incorporate the Additional Context into all sections. Provide category-specific recommendations when possible.

In the How-to-Run Summary, provide timeframe, sample size, and control vs. experiment details where applicable.

In What Success Looks Like, include what we will learn from the results and how that learning can inform future plays.

Include a brief recommendation: Based on what we learn, what should we do next?

Tailor your output to the Owner Role if specified.

Important: Always ensure your recommendations are directly tied to the provided idea_prompt and top_signal. Do not suggest generic plays or solutions unrelated to these inputs, even if they match the quarter focus or team type.

Avoid suggesting pricing changes or other strategies unless they are explicitly part of the idea or signal.`
      });
    } else if (extracted_idea) {
      // Fallback to old prompt structure
      let legacyPrompt = `As a business strategy expert, help convert this idea into a testable hypothesis:\n\nIdea: ${extracted_idea}`;
      if (extracted_context) legacyPrompt += `\nContext: ${extracted_context}`;
      // Repeat key fields for emphasis
      legacyPrompt += `\n\nThe core idea to address is: ${extracted_idea}.`;
      legacyPrompt += `\nThe key signal driving this is: ${extracted_context ? extracted_context : 'N/A'}.`;
      legacyPrompt += `\n\nPlease provide:\n1. A clear, testable hypothesis statement\n2. 3-5 specific suggestions for how to test this hypothesis\n\nImportant: Always ensure your recommendations are directly tied to the provided idea and context. Do not suggest generic plays or solutions unrelated to these inputs, even if they match the quarter focus or team type.\n\nAvoid suggesting pricing changes or other strategies unless they are explicitly part of the idea or context.\n\nFormat your response as JSON with "hypothesis" and "suggestions" fields.`;
      messages.push({ role: 'user', content: legacyPrompt });
    } else {
      return errorResponse('Idea or idea_prompt is required', 400);
    }
    // --- AI Debugger Logging ---
    // Log prettified prompt
    console.log('[AI DEBUG] PlayBuilder Final Prompt:', JSON.stringify(messages, null, 2));
    // Call OpenAI
    const aiResponse = await callOpenAI(messages, env);
    // Log full OpenAI response
    console.log('[AI DEBUG] PlayBuilder Raw OpenAI Response:', aiResponse);
    // Prepare backend payload
    const backendPayload = { output: aiResponse };
    // Log backend payload
    console.log('[AI DEBUG] PlayBuilder Backend Payload:', JSON.stringify(backendPayload, null, 2));
    // Store last debug log in memory (excluding user emails, account IDs, backend IDs)
    lastPlayBuilderDebugLog = {
      prompt: messages,
      openai_response: aiResponse,
      backend_payload: backendPayload,
      timestamp: new Date().toISOString()
    };
    // Pass through raw AI output (frontend will structure)
    return jsonResponse(backendPayload);
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
    const { observation, context } = body;
    if (!observation) return errorResponse('Observation is required', 400);

    // --- Prompt Assembly ---
    const SIGNAL_LAB_SYSTEM_MESSAGE = {
      role: 'system',
      content: `You are a Rhythm90 Signal Lab assistant.\n\nYour job is to help teams interpret signals — unexpected outcomes, surprising data, or emerging patterns — using the Rhythm90 framework.\n\nA good signal interpretation should:\n- Describe what the signal might indicate (possible meaning).\n- Suggest 2-3 possible causes or contributing factors.\n- Offer 1-2 suggestions for what the team might explore or test next.\n- Highlight if the signal challenges or confirms existing assumptions.\n- Connect to the team’s business or category context if provided.`
    };
    let contextBlock = `Context:\nObservation: ${observation}`;
    if (context) contextBlock += `\nAdditional Context: ${context}`;
    const userPrompt = `Please return your answer with the following fields:\n1. Possible Meaning (what might this signal indicate?)\n2. Possible Causes (2-3 operational or audience-related drivers)\n3. Challenge or Confirmation (what business assumption does this challenge or confirm?)\n4. Suggested Next Exploration (1-2 ideas for what the team might explore or test next)\n\nFormat your response as JSON with fields: possible_meaning, possible_causes, challenge_or_confirmation, suggested_next_exploration.\n\nIn Possible Causes, include both operational and audience-related factors where applicable.\nIn Challenge or Confirmation, note what business assumption this signal impacts.\nIn Suggested Next Exploration, suggest how the learning might shape future plays.\nIncorporate the Additional Context into all sections. Provide category-specific insights when possible.`;
    const messages = [
      SIGNAL_LAB_SYSTEM_MESSAGE,
      { role: 'user', content: contextBlock },
      { role: 'user', content: userPrompt }
    ];

    // --- AI Call ---
    const aiResponse = await callOpenAI(messages, env);

    // --- Output Structuring ---
    let backendPayload: any = {};
    let warning = undefined;
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(aiResponse);
      backendPayload = {
        possible_meaning: parsed.possible_meaning || '',
        possible_causes: parsed.possible_causes || [],
        challenge_or_confirmation: parsed.challenge_or_confirmation || '',
        suggested_next_exploration: parsed.suggested_next_exploration || []
      };
    } catch (err) {
      // Try to extract sections from text if not JSON
      let possible_meaning = '', challenge_or_confirmation = '', possible_causes: string[] = [], suggested_next_exploration: string[] = [];
      // Use regex or simple splits to extract sections
      const meaningMatch = aiResponse.match(/Possible Meaning\s*[:\-]?\s*([\s\S]*?)(?=Possible Causes|Challenge or Confirmation|Suggested Next Exploration|$)/i);
      if (meaningMatch) possible_meaning = meaningMatch[1].trim();
      const causesMatch = aiResponse.match(/Possible Causes\s*[:\-]?\s*([\s\S]*?)(?=Challenge or Confirmation|Suggested Next Exploration|$)/i);
      if (causesMatch) {
        // Try to split into array
        const lines = causesMatch[1].split(/\n|\*/).map(l => l.replace(/^[-\d.\s]+/, '').trim()).filter(Boolean);
        possible_causes = lines;
      }
      const challengeMatch = aiResponse.match(/Challenge or Confirmation\s*[:\-]?\s*([\s\S]*?)(?=Suggested Next Exploration|$)/i);
      if (challengeMatch) challenge_or_confirmation = challengeMatch[1].trim();
      const nextMatch = aiResponse.match(/Suggested Next Exploration\s*[:\-]?\s*([\s\S]*)/i);
      if (nextMatch) {
        const lines = nextMatch[1].split(/\n|\*/).map(l => l.replace(/^[-\d.\s]+/, '').trim()).filter(Boolean);
        suggested_next_exploration = lines;
      }
      // If at least one field is found, return structured
      if (possible_meaning || possible_causes.length || challenge_or_confirmation || suggested_next_exploration.length) {
        backendPayload = {
          possible_meaning,
          possible_causes,
          challenge_or_confirmation,
          suggested_next_exploration
        };
        warning = 'AI response was not valid JSON; fields were extracted heuristically.';
      } else {
        // Fallback: pass raw response
        backendPayload = {
          possible_meaning: '',
          possible_causes: [],
          challenge_or_confirmation: '',
          suggested_next_exploration: [],
          raw_response: aiResponse
        };
        warning = 'AI response could not be parsed; raw response returned.';
      }
    }

    // --- Debugger Log ---
    lastSignalLabDebugLog = {
      prompt: messages,
      openai_response: aiResponse,
      backend_payload: backendPayload,
      warning,
      timestamp: new Date().toISOString()
    };

    // --- Return structured payload ---
    return jsonResponse(backendPayload);
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