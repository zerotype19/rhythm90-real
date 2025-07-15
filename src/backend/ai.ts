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
// --- New: In-memory store for last Ritual Guide debug log ---
export let lastRitualGuideDebugLog: any = null;

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

Format your response as JSON with these exact field names:
hypothesis, how_to_run_summary, signals_to_watch, owner_role, what_success_looks_like, next_recommendation.

Ensure signals_to_watch and next_recommendation are arrays, even if only one item.
Do NOT include numbers in any section titles or content (e.g., "Timeframe" not "1. Timeframe").
Do NOT include checkmarks (✓) or any special characters in lists.

Incorporate the Additional Context into all sections. Provide category-specific recommendations when possible.

In the How-to-Run Summary, provide timeframe, sample size, and control vs. experiment details where applicable.

In What Success Looks Like, include what we will learn from the results and how that learning can inform future plays.

Tailor your output to the Owner Role if specified.

Important: Always ensure your recommendations are directly tied to the provided idea_prompt and top_signal. Do not suggest generic plays or solutions unrelated to these inputs, even if they match the quarter focus or team type.

Avoid suggesting pricing changes or other strategies unless they are explicitly part of the idea or signal.

⚠️ CRITICAL: Return ONLY raw JSON — no markdown fences, no code blocks, no comments, no explanation text. Do not wrap output like \`\`\`json ... \`\`\`. Return the JSON object directly.`
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
    
    // --- Output Structuring ---
    let backendPayload: any = {};
    let warning = undefined;
    let parseStatus = 'success';
    let userNote = undefined;
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(aiResponse);
      backendPayload = {
        hypothesis: parsed.hypothesis || '',
        how_to_run_summary: parsed.how_to_run_summary || '',
        signals_to_watch: Array.isArray(parsed.signals_to_watch) ? parsed.signals_to_watch : (parsed.signals_to_watch ? [parsed.signals_to_watch] : []),
        owner_role: parsed.owner_role || '',
        what_success_looks_like: parsed.what_success_looks_like || '',
        next_recommendation: Array.isArray(parsed.next_recommendation) ? parsed.next_recommendation : (parsed.next_recommendation ? [parsed.next_recommendation] : [])
      };
    } catch (err) {
      // JSON parsing failed, try minimal regex extraction as safety net
      parseStatus = 'fallback_used';
      let hypothesis = '', how_to_run_summary = '', signals_to_watch: string[] = [], owner_role = '', what_success_looks_like = '', next_recommendation: string[] = [];
      
      // Minimal, safe regex extraction
      const hypothesisMatch = aiResponse.match(/Hypothesis\s*[:\-]?\s*([\s\S]*?)(?=How-to-Run Summary|How to Run Summary|Signals to Watch|Owner Role|What Success Looks Like|Next Recommendation|$)/i);
      if (hypothesisMatch) hypothesis = hypothesisMatch[1].trim();
      
      const summaryMatch = aiResponse.match(/How-to-Run Summary\s*[:\-]?\s*([\s\S]*?)(?=Signals to Watch|Owner Role|What Success Looks Like|Next Recommendation|$)/i);
      if (summaryMatch) how_to_run_summary = summaryMatch[1].trim();
      
      const signalsMatch = aiResponse.match(/Signals to Watch\s*[:\-]?\s*([\s\S]*?)(?=Owner Role|What Success Looks Like|Next Recommendation|$)/i);
      if (signalsMatch) {
        const lines = signalsMatch[1].split(/\n|\*/).map(l => l.replace(/^[-\d.\s]+/, '').trim()).filter(Boolean);
        signals_to_watch = lines;
      }
      
      const ownerMatch = aiResponse.match(/Owner Role\s*[:\-]?\s*([\s\S]*?)(?=What Success Looks Like|Next Recommendation|$)/i);
      if (ownerMatch) owner_role = ownerMatch[1].trim();
      
      const successMatch = aiResponse.match(/What Success Looks Like\s*[:\-]?\s*([\s\S]*?)(?=Next Recommendation|$)/i);
      if (successMatch) what_success_looks_like = successMatch[1].trim();
      
      const nextMatch = aiResponse.match(/Next Recommendation\s*[:\-]?\s*([\s\S]*)/i);
      if (nextMatch) {
        const lines = nextMatch[1].split(/\n|\*/).map(l => l.replace(/^[-\d.\s]+/, '').trim()).filter(Boolean);
        next_recommendation = lines;
      }
      
      // If at least one field was extracted, return structured with warning
      if (hypothesis || how_to_run_summary || signals_to_watch.length || owner_role || what_success_looks_like || next_recommendation.length) {
        backendPayload = {
          hypothesis,
          how_to_run_summary,
          signals_to_watch,
          owner_role,
          what_success_looks_like,
          next_recommendation
        };
        warning = 'AI response was not valid JSON; fields were extracted heuristically.';
        userNote = 'Note: This result is shown as raw text because AI response formatting failed.';
      } else {
        // Complete fallback: return raw response
        parseStatus = 'failed';
        backendPayload = {
          raw_response: aiResponse
        };
        warning = 'AI response could not be parsed; returning raw text only.';
        userNote = 'Note: This result is shown as raw text because AI response formatting failed.';
      }
    }
    
    // Log backend payload
    console.log('[AI DEBUG] PlayBuilder Backend Payload:', JSON.stringify(backendPayload, null, 2));
    // Store last debug log in memory (excluding user emails, account IDs, backend IDs)
    lastPlayBuilderDebugLog = {
      prompt: messages,
      openai_response: aiResponse,
      parse_status: parseStatus,
      backend_payload: backendPayload,
      warning,
      user_note: userNote,
      timestamp: new Date().toISOString()
    };
    // Return structured payload
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

// Global debug log for mini tools
let lastMiniToolDebugLog: any = null;

export async function handleGenerateRitualPrompts(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  try {
    // Temporarily bypass auth for testing
    // const user = await verifyAuth(request, env);
    // if (!user) return errorResponse('Unauthorized', 401);
    const body: GenerateRitualPromptsRequest = await request.json();
    const { ritual_type, team_type, top_challenges, focus_areas, additional_context } = body;
    if (!ritual_type) return errorResponse('Ritual type is required', 400);

    // Validate ritual type
    const validRitualTypes = ['kickoff', 'pulse_check', 'rr'];
    if (!validRitualTypes.includes(ritual_type)) {
      return errorResponse(`Invalid ritual type. Must be one of: ${validRitualTypes.join(', ')}`, 400);
    }

    // --- Prompt Assembly ---
    const RITUAL_GUIDE_SYSTEM_MESSAGE = {
      role: 'system',
      content: `You are a Rhythm90 Ritual Guide assistant helping teams plan effective quarterly rituals.

The official Rhythm90 rituals are:
- kickoff: To align on 1–3 focused plays, define success outcomes, assign owners, and set the business context for the quarter.
- pulse_check: To review in-flight plays, surface blockers, check early signals, and adjust priorities or support.
- rr: To reflect on what ran, what was learned, and what should happen next, including adjustments to plays or approach.

Your job is to:
- Provide a clear, stepwise agenda tailored to the ritual type.
- Include sharp discussion prompts that surface live signals, help prioritize, and align the team.
- Highlight roles and how they contribute.
- Suggest preparation materials or data.
- Define success in terms of collective team learning, clarity, and forward motion.
- Connect all recommendations to the team type, business context, top challenges, focus areas, or category context if provided.`
    };
    
    // Build context block with all fields, marking missing ones as "None provided"
    let contextBlock = 'Context:';
    contextBlock += `\nRitual Type: ${ritual_type}`;
    contextBlock += `\nTeam Type: ${team_type || 'None provided'}`;
    contextBlock += `\nTop Challenges: ${top_challenges || 'None provided'}`;
    contextBlock += `\nFocus Areas: ${focus_areas || 'None provided'}`;
    contextBlock += `\nAdditional Context: ${additional_context || 'None provided'}`;
    
    const userPrompt = `Help us generate a ritual plan. Please provide:
1. Agenda (detailed, step-by-step, tailored to the ritual type)
2. Discussion Prompts (specific questions to surface signals, align plays, and focus the team)
3. Roles & Contributions (who leads, who supports, who reports back)
4. Preparation Tips (what materials or data teams should prep, including prior signals or plays)
5. Success Definition (what success looks like, emphasizing both team learning and next steps)

Format your response as JSON with these exact field names:
agenda, discussion_prompts, roles_contributions, preparation_tips, success_definition.

Ensure agenda, discussion_prompts, and preparation_tips are arrays, even if only one item.
Explicitly call out signal-related prompts and blockers.
Define success as collective team learning + individual clarity on next actions.
Include domain-specific or category-specific examples when possible.

Additional Refinements:
- For Agenda: Provide step-by-step items without numbers (e.g., "Welcome & Introductions" not "1. Welcome & Introductions"). Each item should be a clear action or topic.

- For Discussion Prompts: Include ritual-type-specific blocker surfacing:
  * Kickoff: Ask about known blockers to anticipate
  * Pulse Check: Ask about in-flight blockers
  * R&R: Ask about blockers that emerged over the quarter
  * Cover both quarterly and recurring blockers

- For Preparation Tips: Format as a concise checklist, aiming for 5-7 items max. Include reference to prior insights: "Review prior insights, including last quarter's key plays and signals." Do NOT include checkmarks (✓) or any special characters.

- For Success Definition: Include how learnings will transfer to next-quarter action. Suggest general guidance like "Consider codifying learnings in a team playbook or onboarding docs" with focus on team-level learning transfer.

⚠️ CRITICAL: Return ONLY raw JSON — no markdown fences, no code blocks, no comments, no explanation text. Do not wrap output like \`\`\`json ... \`\`\`. Return the JSON object directly.`;
    
    const messages = [
      RITUAL_GUIDE_SYSTEM_MESSAGE,
      { role: 'user', content: contextBlock },
      { role: 'user', content: userPrompt }
    ];

    // --- AI Call ---
    let aiResponse: string;
    try {
      aiResponse = await callOpenAI(messages, env);
    } catch (error) {
      console.log('OpenAI call failed:', error);
      throw error; // Re-throw the error instead of using mock response
    }

    // --- Output Structuring ---
    let backendPayload: any = {};
    let warning = undefined;
    let parseStatus = 'success';
    let userNote = undefined;
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(aiResponse);
      backendPayload = {
        agenda: Array.isArray(parsed.agenda) ? parsed.agenda : (parsed.agenda ? [parsed.agenda] : []),
        discussion_prompts: Array.isArray(parsed.discussion_prompts) ? parsed.discussion_prompts : (parsed.discussion_prompts ? [parsed.discussion_prompts] : []),
        roles_contributions: parsed.roles_contributions || '',
        preparation_tips: Array.isArray(parsed.preparation_tips) ? parsed.preparation_tips : (parsed.preparation_tips ? [parsed.preparation_tips] : []),
        success_definition: parsed.success_definition || ''
      };
    } catch (err) {
      // JSON parsing failed, try minimal regex extraction as safety net
      parseStatus = 'fallback_used';
      let agenda: string[] = [], discussion_prompts: string[] = [], roles_contributions = '', preparation_tips = '', success_definition = '';
      
      // Minimal, safe regex extraction
      const agendaMatch = aiResponse.match(/Agenda\s*[:\-]?\s*([\s\S]*?)(?=Discussion Prompts|Roles|Preparation|Success|$)/i);
      if (agendaMatch) {
        const lines = agendaMatch[1].split(/\n|\*/).map(l => l.replace(/^[-\d.\s]+/, '').trim()).filter(Boolean);
        agenda = lines;
      }
      
      const promptsMatch = aiResponse.match(/Discussion Prompts\s*[:\-]?\s*([\s\S]*?)(?=Roles|Preparation|Success|$)/i);
      if (promptsMatch) {
        const lines = promptsMatch[1].split(/\n|\*/).map(l => l.replace(/^[-\d.\s]+/, '').trim()).filter(Boolean);
        discussion_prompts = lines;
      }
      
      const rolesMatch = aiResponse.match(/Roles[^:]*:\s*([\s\S]*?)(?=Preparation|Success|$)/i);
      if (rolesMatch) roles_contributions = rolesMatch[1].trim();
      
      const prepMatch = aiResponse.match(/Preparation[^:]*:\s*([\s\S]*?)(?=Success|$)/i);
      if (prepMatch) preparation_tips = prepMatch[1].trim();
      
      const successMatch = aiResponse.match(/Success[^:]*:\s*([\s\S]*)/i);
      if (successMatch) success_definition = successMatch[1].trim();
      
      // If at least one field was extracted, return structured with warning
      if (agenda.length || discussion_prompts.length || roles_contributions || preparation_tips || success_definition) {
        backendPayload = {
          agenda,
          discussion_prompts,
          roles_contributions,
          preparation_tips,
          success_definition
        };
        warning = 'AI response was not valid JSON; fields were extracted heuristically.';
        userNote = 'Note: This result is shown as raw text because AI response formatting failed.';
      } else {
        // Complete fallback: return raw response
        parseStatus = 'failed';
        backendPayload = {
          raw_response: aiResponse
        };
        warning = 'AI response could not be parsed; returning raw text only.';
        userNote = 'Note: This result is shown as raw text because AI response formatting failed.';
      }
    }

    // --- Debugger Log ---
    lastRitualGuideDebugLog = {
      prompt: messages,
      openai_response: aiResponse,
      parse_status: parseStatus,
      backend_payload: backendPayload,
      warning,
      user_note: userNote,
      timestamp: new Date().toISOString()
    };

    // --- Return structured payload ---
    return jsonResponse(backendPayload);
  } catch (error) {
    console.error('Generate ritual prompts error:', error);
    return errorResponse('Failed to generate ritual prompts', 500);
  }
}

// Mini Tools Handlers

export async function handlePlainEnglishTranslator(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  try {
    // Temporarily bypass auth for testing
    // const user = await verifyAuth(request, env);
    // if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { original_text } = body;
    if (!original_text) return errorResponse('Original text is required', 400);

    const systemMessage = {
      role: 'system',
      content: 'You are a MadMarketing Plain-English Translator assistant. Rewrite the input text into clear, human language without jargon or buzzwords.'
    };

    const userMessage = {
      role: 'user',
      content: `Original text: ${original_text}\n\nOutput JSON only: { "plain_english_rewrite": "...", "side_by_side_table": [{ "what_it_says": "...", "what_it_really_means": "..." }], "jargon_glossary": ["..."] }\n\nDo not include markdown fences, code blocks, or extra explanation.`
    };

    const messages = [systemMessage, userMessage];
    const aiResponse = await callOpenAI(messages, env);

    // Parse response
    let backendPayload: any = {};
    let warning = undefined;
    let parseStatus = 'success';

    try {
      const parsed = JSON.parse(aiResponse);
      backendPayload = {
        plain_english_rewrite: parsed.plain_english_rewrite || '',
        side_by_side_table: Array.isArray(parsed.side_by_side_table) ? parsed.side_by_side_table : [],
        jargon_glossary: Array.isArray(parsed.jargon_glossary) ? parsed.jargon_glossary : []
      };
    } catch (err) {
      // If JSON parsing failed, try to extract structured data from the raw response
      parseStatus = 'fallback_used';
      let plain_english_rewrite = '', side_by_side_table: any[] = [], jargon_glossary: string[] = [];
      
      // Extract plain English rewrite
      const rewriteMatch = aiResponse.match(/"plain_english_rewrite":\s*"([^"]+)"/);
      if (rewriteMatch) {
        plain_english_rewrite = rewriteMatch[1];
      }
      
      // Extract side by side table
      const tableMatch = aiResponse.match(/"side_by_side_table":\s*\[([\s\S]*?)\]/);
      if (tableMatch) {
        const tableText = tableMatch[1];
        const rowMatches = tableText.match(/\{[^}]+\}/g);
        if (rowMatches) {
          side_by_side_table = rowMatches.map(row => {
            const what_it_says = row.match(/"what_it_says":\s*"([^"]+)"/)?.[1] || '';
            const what_it_really_means = row.match(/"what_it_really_means":\s*"([^"]+)"/)?.[1] || '';
            return { what_it_says, what_it_really_means };
          });
        }
      }
      
      // Extract jargon glossary
      const glossaryMatch = aiResponse.match(/"jargon_glossary":\s*\[([\s\S]*?)\]/);
      if (glossaryMatch) {
        const glossaryText = glossaryMatch[1];
        jargon_glossary = glossaryText.match(/"([^"]+)"/g)?.map(g => g.replace(/"/g, '')) || [];
      }
      
      // If we extracted any data, return it structured
      if (plain_english_rewrite || side_by_side_table.length || jargon_glossary.length) {
        backendPayload = {
          plain_english_rewrite,
          side_by_side_table,
          jargon_glossary
        };
        warning = 'AI response was not valid JSON; fields were extracted heuristically.';
      } else {
        // Complete fallback: return raw response
        parseStatus = 'failed';
        backendPayload = { raw_response: aiResponse };
        warning = 'AI response could not be parsed; returning raw text only.';
      }
    }

    // Debug log
    lastMiniToolDebugLog = {
      tool: 'plain-english-translator',
      input_payload: body,
      prompt: messages,
      openai_response: aiResponse,
      parse_status: parseStatus,
      backend_payload: backendPayload,
      warning,
      timestamp: new Date().toISOString()
    };

    return jsonResponse(backendPayload);
  } catch (error) {
    console.error('Plain-English Translator error:', error);
    return errorResponse('Failed to translate text', 500);
  }
}

export async function handleGetToByGenerator(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  try {
    // Temporarily bypass auth for testing
    // const user = await verifyAuth(request, env);
    // if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { audience_description, behavioral_or_emotional_insight, brand_product_role } = body;
    if (!audience_description || !behavioral_or_emotional_insight || !brand_product_role) {
      return errorResponse('All fields are required', 400);
    }

    const systemMessage = {
      role: 'system',
      content: 'You are a MadMarketing Get/To/By Generator assistant. Generate a sharp Get/To/By statement. Define audience behaviorally, not just demographics. The "by" must reference a real brand action.'
    };

    const userMessage = {
      role: 'user',
      content: `Audience: ${audience_description}\nBehavioral/Emotional Insight: ${behavioral_or_emotional_insight}\nBrand/Product Role: ${brand_product_role}\n\nOutput JSON only: { "get": "...", "to": "...", "by": "..." }\n\nDo not include markdown fences, code blocks, or explanation.`
    };

    const messages = [systemMessage, userMessage];
    const aiResponse = await callOpenAI(messages, env);

    // Parse response
    let backendPayload: any = {};
    let warning = undefined;
    let parseStatus = 'success';

    try {
      const parsed = JSON.parse(aiResponse);
      backendPayload = {
        get: parsed.get || '',
        to: parsed.to || '',
        by: parsed.by || ''
      };
    } catch (err) {
      // If JSON parsing failed, try to extract structured data from the raw response
      parseStatus = 'fallback_used';
      let get = '', to = '', by = '';
      
      // Extract get/to/by fields
      const getMatch = aiResponse.match(/"get":\s*"([^"]+)"/);
      if (getMatch) get = getMatch[1];
      
      const toMatch = aiResponse.match(/"to":\s*"([^"]+)"/);
      if (toMatch) to = toMatch[1];
      
      const byMatch = aiResponse.match(/"by":\s*"([^"]+)"/);
      if (byMatch) by = byMatch[1];
      
      // If we extracted any data, return it structured
      if (get || to || by) {
        backendPayload = { get, to, by };
        warning = 'AI response was not valid JSON; fields were extracted heuristically.';
      } else {
        // Complete fallback: return raw response
        parseStatus = 'failed';
        backendPayload = { raw_response: aiResponse };
        warning = 'AI response could not be parsed; returning raw text only.';
      }
    }

    // Debug log
    lastMiniToolDebugLog = {
      tool: 'get-to-by-generator',
      input_payload: body,
      prompt: messages,
      openai_response: aiResponse,
      parse_status: parseStatus,
      backend_payload: backendPayload,
      warning,
      timestamp: new Date().toISOString()
    };

    return jsonResponse(backendPayload);
  } catch (error) {
    console.error('Get/To/By Generator error:', error);
    return errorResponse('Failed to generate Get/To/By statement', 500);
  }
}

export async function handleCreativeTensionFinder(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  try {
    // Temporarily bypass auth for testing
    // const user = await verifyAuth(request, env);
    // if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { problem_or_strategy_summary } = body;
    if (!problem_or_strategy_summary) return errorResponse('Problem or strategy summary is required', 400);

    const systemMessage = {
      role: 'system',
      content: 'You are a MadMarketing Creative-Tension Finder assistant. Generate 4–6 potent creative tensions and optional platform names. Focus on real human contradictions. Platform name optional, max 5 words.'
    };

    const userMessage = {
      role: 'user',
      content: `Problem/Strategy: ${problem_or_strategy_summary}\n\nOutput JSON only: [{ "tension": "...", "optional_platform_name": "..." }]\n\nDo not include markdown fences, code blocks, or explanation.`
    };

    const messages = [systemMessage, userMessage];
    const aiResponse = await callOpenAI(messages, env);

    // Parse response
    let backendPayload: any = {};
    let warning = undefined;
    let parseStatus = 'success';

    try {
      const parsed = JSON.parse(aiResponse);
      backendPayload = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      // If JSON parsing failed, try to extract structured data from the raw response
      parseStatus = 'fallback_used';
      let tensions: any[] = [];
      
      // Extract tensions from array format
      const tensionsMatch = aiResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (tensionsMatch) {
        const tensionsText = tensionsMatch[0];
        const tensionMatches = tensionsText.match(/\{[^}]+\}/g);
        if (tensionMatches) {
          tensions = tensionMatches.map(tension => {
            const tension_text = tension.match(/"tension":\s*"([^"]+)"/)?.[1] || '';
            const platform_name = tension.match(/"optional_platform_name":\s*"([^"]+)"/)?.[1] || '';
            return { tension: tension_text, optional_platform_name: platform_name };
          });
        }
      }
      
      // If we extracted any data, return it structured
      if (tensions.length > 0) {
        backendPayload = tensions;
        warning = 'AI response was not valid JSON; fields were extracted heuristically.';
      } else {
        // Complete fallback: return raw response
        parseStatus = 'failed';
        backendPayload = { raw_response: aiResponse };
        warning = 'AI response could not be parsed; returning raw text only.';
      }
    }

    // Debug log
    lastMiniToolDebugLog = {
      tool: 'creative-tension-finder',
      input_payload: body,
      prompt: messages,
      openai_response: aiResponse,
      parse_status: parseStatus,
      backend_payload: backendPayload,
      warning,
      timestamp: new Date().toISOString()
    };

    return jsonResponse(backendPayload);
  } catch (error) {
    console.error('Creative-Tension Finder error:', error);
    return errorResponse('Failed to find creative tensions', 500);
  }
}

export async function handlePersonaGenerator(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  try {
    // Temporarily bypass auth for testing
    // const user = await verifyAuth(request, env);
    // if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { audience_seed } = body;
    if (!audience_seed) return errorResponse('Audience seed is required', 400);

    const systemMessage = {
      role: 'system',
      content: 'You are a MadMarketing Persona Generator assistant. Build a synthetic persona sheet and enter Ask Mode.'
    };

    const userMessage = {
      role: 'user',
      content: `Audience Seed: ${audience_seed}

Instructions:
1. Generate a Persona Sheet:
- Name, age, location, quick bio
- Core motivations & values
- Key pain points / objections
- Decision drivers & triggers
- Preferred media/content habits

2. Enter Ask Mode:
Respond: "Persona ready. Ask me anything."

The AI continues answering as the persona until the user says "exit persona."

Response format:
{
  "persona_sheet": { "name": "...", "age": "...", "location": "...", "bio": "...", "motivations": "...", "pain_points": "...", "triggers": "...", "media_habits": "..." },
  "ask_mode_message": "Persona ready. Ask me anything."
}

Return ONLY raw JSON — no markdown, no comments, no code fences.`
    };

    const messages = [systemMessage, userMessage];
    const aiResponse = await callOpenAI(messages, env);

    // Parse response
    let backendPayload: any = {};
    let warning = undefined;
    let parseStatus = 'success';

    try {
      const parsed = JSON.parse(aiResponse);
      backendPayload = {
        persona_sheet: parsed.persona_sheet || {},
        ask_mode_message: parsed.ask_mode_message || 'Persona ready. Ask me anything.'
      };
    } catch (err) {
      // If JSON parsing failed, try to extract structured data from the raw response
      parseStatus = 'fallback_used';
      let persona_sheet: any = {}, ask_mode_message = 'Persona ready. Ask me anything.';
      
      // Extract persona sheet fields
      const nameMatch = aiResponse.match(/"name":\s*"([^"]+)"/);
      if (nameMatch) persona_sheet.name = nameMatch[1];
      
      const ageMatch = aiResponse.match(/"age":\s*"([^"]+)"/);
      if (ageMatch) persona_sheet.age = ageMatch[1];
      
      const locationMatch = aiResponse.match(/"location":\s*"([^"]+)"/);
      if (locationMatch) persona_sheet.location = locationMatch[1];
      
      const bioMatch = aiResponse.match(/"bio":\s*"([^"]+)"/);
      if (bioMatch) persona_sheet.bio = bioMatch[1];
      
      const motivationsMatch = aiResponse.match(/"motivations":\s*"([^"]+)"/);
      if (motivationsMatch) persona_sheet.motivations = motivationsMatch[1];
      
      const painPointsMatch = aiResponse.match(/"pain_points":\s*"([^"]+)"/);
      if (painPointsMatch) persona_sheet.pain_points = painPointsMatch[1];
      
      const triggersMatch = aiResponse.match(/"triggers":\s*"([^"]+)"/);
      if (triggersMatch) persona_sheet.triggers = triggersMatch[1];
      
      const mediaHabitsMatch = aiResponse.match(/"media_habits":\s*"([^"]+)"/);
      if (mediaHabitsMatch) persona_sheet.media_habits = mediaHabitsMatch[1];
      
      // Extract ask mode message
      const askModeMatch = aiResponse.match(/"ask_mode_message":\s*"([^"]+)"/);
      if (askModeMatch) ask_mode_message = askModeMatch[1];
      
      // If we extracted any data, return it structured
      if (Object.keys(persona_sheet).length > 0 || ask_mode_message) {
        backendPayload = { persona_sheet, ask_mode_message };
        warning = 'AI response was not valid JSON; fields were extracted heuristically.';
      } else {
        // Complete fallback: return raw response
        parseStatus = 'failed';
        backendPayload = { raw_response: aiResponse };
        warning = 'AI response could not be parsed; returning raw text only.';
      }
    }

    // Debug log
    lastMiniToolDebugLog = {
      tool: 'persona-generator',
      input_payload: body,
      prompt: messages,
      openai_response: aiResponse,
      parse_status: parseStatus,
      backend_payload: backendPayload,
      warning,
      timestamp: new Date().toISOString()
    };

    return jsonResponse(backendPayload);
  } catch (error) {
    console.error('Persona Generator error:', error);
    return errorResponse('Failed to generate persona', 500);
  }
}

export async function handleJourneyBuilder(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  try {
    // Temporarily bypass auth for testing
    // const user = await verifyAuth(request, env);
    // if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { product_or_service, primary_objective, key_barrier } = body;
    if (!product_or_service || !primary_objective) {
      return errorResponse('Product/service and primary objective are required', 400);
    }

    const systemMessage = {
      role: 'system',
      content: 'You are a MadMarketing Journey Builder assistant. Map a customer journey with actionable marketing guidance.'
    };

    const userMessage = {
      role: 'user',
      content: `Product/Service: ${product_or_service}
Primary Objective: ${primary_objective}
Key Barrier: ${key_barrier || 'None specified'}

Instructions:
Return a table:
- Stage (Awareness, Consideration, Conversion, Onboarding, Advocacy)
- Audience Mindset & Need
- Main Barrier or Friction
- Marketing Role (message, content, experience)
- Suggested Channels/Formats
- Success KPI

Response format:
{
  "journey_map": [
    { "stage": "...", "mindset": "...", "barrier": "...", "marketing_role": "...", "channels": "...", "kpi": "..." },
    ...
  ],
  "stuck_stage": "Stage name (if any single stage is most blocked)"
}

Return ONLY raw JSON — no markdown, no comments, no code fences.`
    };

    const messages = [systemMessage, userMessage];
    const aiResponse = await callOpenAI(messages, env);

    // Parse response
    let backendPayload: any = {};
    let warning = undefined;
    let parseStatus = 'success';

    try {
      const parsed = JSON.parse(aiResponse);
      backendPayload = {
        journey_map: Array.isArray(parsed.journey_map) ? parsed.journey_map : [],
        stuck_stage: parsed.stuck_stage || ''
      };
    } catch (err) {
      // If JSON parsing failed, try to extract structured data from the raw response
      parseStatus = 'fallback_used';
      let journey_map: any[] = [], stuck_stage = '';
      
      // Extract journey map
      const mapMatch = aiResponse.match(/"journey_map":\s*\[([\s\S]*?)\]/);
      if (mapMatch) {
        const mapText = mapMatch[1];
        const rowMatches = mapText.match(/\{[^}]+\}/g);
        if (rowMatches) {
          journey_map = rowMatches.map(row => {
            const stage = row.match(/"stage":\s*"([^"]+)"/)?.[1] || '';
            const mindset = row.match(/"mindset":\s*"([^"]+)"/)?.[1] || '';
            const barrier = row.match(/"barrier":\s*"([^"]+)"/)?.[1] || '';
            const marketing_role = row.match(/"marketing_role":\s*"([^"]+)"/)?.[1] || '';
            const channels = row.match(/"channels":\s*"([^"]+)"/)?.[1] || '';
            const kpi = row.match(/"kpi":\s*"([^"]+)"/)?.[1] || '';
            return { stage, mindset, barrier, marketing_role, channels, kpi };
          });
        }
      }
      
      // Extract stuck stage
      const stuckStageMatch = aiResponse.match(/"stuck_stage":\s*"([^"]+)"/);
      if (stuckStageMatch) {
        stuck_stage = stuckStageMatch[1];
      }
      
      // If we extracted any data, return it structured
      if (journey_map.length > 0 || stuck_stage) {
        backendPayload = { journey_map, stuck_stage };
        warning = 'AI response was not valid JSON; fields were extracted heuristically.';
      } else {
        // Complete fallback: return raw response
        parseStatus = 'failed';
        backendPayload = { raw_response: aiResponse };
        warning = 'AI response could not be parsed; returning raw text only.';
      }
    }

    // Debug log
    lastMiniToolDebugLog = {
      tool: 'journey-builder',
      input_payload: body,
      prompt: messages,
      openai_response: aiResponse,
      parse_status: parseStatus,
      backend_payload: backendPayload,
      warning,
      timestamp: new Date().toISOString()
    };

    return jsonResponse(backendPayload);
  } catch (error) {
    console.error('Journey Builder error:', error);
    return errorResponse('Failed to build journey', 500);
  }
}

export async function handleTestLearnScale(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  try {
    // Temporarily bypass auth for testing
    // const user = await verifyAuth(request, env);
    // if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { campaign_or_product_context, resources_or_constraints } = body;
    if (!campaign_or_product_context) {
      return errorResponse('Campaign or product context is required', 400);
    }

    const systemMessage = {
      role: 'system',
      content: 'You are a MadMarketing Test-Learn-Scale assistant. Design an experimentation plan.'
    };

    const userMessage = {
      role: 'user',
      content: `Campaign/Product Context: ${campaign_or_product_context}
Resources/Constraints: ${resources_or_constraints || 'None specified'}

Instructions:
Return a JSON object with these exact fields:
- core_hypotheses: Array of hypothesis strings
- test_design_table: Array of test objects with fields: hypothesis, tactic, target_sample (number), primary_kpi, success_threshold, timeframe
- learning_application: String describing how learnings scale into always-on
- risk_mitigation_tips: Array of tip strings

IMPORTANT: target_sample must be a number, not a string. Example: "target_sample": 5000 not "target_sample": "5000"

Response format:
{
  "core_hypotheses": ["hypothesis 1", "hypothesis 2"],
  "test_design_table": [
    {
      "hypothesis": "test hypothesis",
      "tactic": "test tactic", 
      "target_sample": 5000,
      "primary_kpi": "kpi name",
      "success_threshold": "threshold description",
      "timeframe": "timeframe description"
    }
  ],
  "learning_application": "how learnings scale",
  "risk_mitigation_tips": ["tip 1", "tip 2"]
}

Return ONLY raw JSON — no markdown, no comments, no code fences.`
    };

    const messages = [systemMessage, userMessage];
    const aiResponse = await callOpenAI(messages, env);

    // Parse response
    let backendPayload: any = {};
    let warning = undefined;
    let parseStatus = 'success';

    try {
      // Try to fix common AI JSON formatting issues
      let cleanedResponse = aiResponse;
      
      // Fix quoted numbers in target_sample fields
      cleanedResponse = cleanedResponse.replace(/"target_sample":\s*"(\d+)"/g, '"target_sample": $1');
      
      // Fix other common numeric field issues
      cleanedResponse = cleanedResponse.replace(/"timeframe":\s*"(\d+)\s*months?"/g, '"timeframe": "$1 months"');
      cleanedResponse = cleanedResponse.replace(/"timeframe":\s*"(\d+)\s*weeks?"/g, '"timeframe": "$1 weeks"');
      
      const parsed = JSON.parse(cleanedResponse);
      backendPayload = {
        core_hypotheses: Array.isArray(parsed.core_hypotheses) ? parsed.core_hypotheses : [],
        test_design_table: Array.isArray(parsed.test_design_table) ? parsed.test_design_table : [],
        learning_application: parsed.learning_application || '',
        risk_mitigation_tips: Array.isArray(parsed.risk_mitigation_tips) ? parsed.risk_mitigation_tips : []
      };
    } catch (err) {
      // If cleaning didn't work, try to extract structured data from the raw response
      parseStatus = 'fallback_used';
      let core_hypotheses: string[] = [], test_design_table: any[] = [], learning_application = '', risk_mitigation_tips: string[] = [];
      
      // Extract core hypotheses
      const hypothesesMatch = aiResponse.match(/"core_hypotheses":\s*\[([\s\S]*?)\]/);
      if (hypothesesMatch) {
        const hypothesesText = hypothesesMatch[1];
        core_hypotheses = hypothesesText.match(/"([^"]+)"/g)?.map(h => h.replace(/"/g, '')) || [];
      }
      
      // Extract test design table
      const tableMatch = aiResponse.match(/"test_design_table":\s*\[([\s\S]*?)\]/);
      if (tableMatch) {
        const tableText = tableMatch[1];
        // Simple extraction of table rows
        const rowMatches = tableText.match(/\{[^}]+\}/g);
        if (rowMatches) {
          test_design_table = rowMatches.map(row => {
            const hypothesis = row.match(/"hypothesis":\s*"([^"]+)"/)?.[1] || '';
            const tactic = row.match(/"tactic":\s*"([^"]+)"/)?.[1] || '';
            const target_sample = row.match(/"target_sample":\s*"?(\d+)"?/)?.[1] || '';
            const primary_kpi = row.match(/"primary_kpi":\s*"([^"]+)"/)?.[1] || '';
            const success_threshold = row.match(/"success_threshold":\s*"([^"]+)"/)?.[1] || '';
            const timeframe = row.match(/"timeframe":\s*"([^"]+)"/)?.[1] || '';
            return { hypothesis, tactic, target_sample, primary_kpi, success_threshold, timeframe };
          });
        }
      }
      
      // Extract learning application
      const learningMatch = aiResponse.match(/"learning_application":\s*"([^"]+)"/);
      if (learningMatch) {
        learning_application = learningMatch[1];
      }
      
      // Extract risk mitigation tips
      const tipsMatch = aiResponse.match(/"risk_mitigation_tips":\s*\[([\s\S]*?)\]/);
      if (tipsMatch) {
        const tipsText = tipsMatch[1];
        risk_mitigation_tips = tipsText.match(/"([^"]+)"/g)?.map(t => t.replace(/"/g, '')) || [];
      }
      
      // If we extracted any data, return it structured
      if (core_hypotheses.length || test_design_table.length || learning_application || risk_mitigation_tips.length) {
        backendPayload = {
          core_hypotheses,
          test_design_table,
          learning_application,
          risk_mitigation_tips
        };
        warning = 'AI response was not valid JSON; fields were extracted heuristically.';
      } else {
        // Complete fallback: return raw response
        parseStatus = 'failed';
        backendPayload = { raw_response: aiResponse };
        warning = 'AI response could not be parsed; returning raw text only.';
      }
    }

    // Debug log
    lastMiniToolDebugLog = {
      tool: 'test-learn-scale',
      input_payload: body,
      prompt: messages,
      openai_response: aiResponse,
      parse_status: parseStatus,
      backend_payload: backendPayload,
      warning,
      timestamp: new Date().toISOString()
    };

    return jsonResponse(backendPayload);
  } catch (error) {
    console.error('Test-Learn-Scale error:', error);
    return errorResponse('Failed to generate roadmap', 500);
  }
}

export async function handleAgileSprintPlanner(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  try {
    // Temporarily bypass auth for testing
    // const user = await verifyAuth(request, env);
    // if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { challenge_statement, time_horizon, team_size_roles } = body;
    if (!challenge_statement || !time_horizon || !team_size_roles) {
      return errorResponse('Challenge statement, time horizon, and team size/roles are required', 400);
    }

    const systemMessage = {
      role: 'system',
      content: 'You are a MadMarketing Agile Sprint Planner assistant. Outline an agile sprint plan for a marketing challenge.'
    };

    const userMessage = {
      role: 'user',
      content: `Challenge Statement: ${challenge_statement}
Time Horizon: ${time_horizon}
Team Size/Roles: ${team_size_roles}

Instructions:
Return:
- sprint_objective
- team_roster_and_responsibilities
- sprint_cadence
- rituals_and_artifacts (daily stand-up agenda, end-of-sprint retro, etc.)
- deliverables_per_sprint
- rapid_testing_validation_methods
- definition_of_done (DoD) checklist

Response format:
{
  "sprint_objective": "...",
  "team_roster_and_responsibilities": "...",
  "sprint_cadence": "...",
  "rituals_and_artifacts": "...",
  "deliverables_per_sprint": "...",
  "rapid_testing_validation_methods": "...",
  "definition_of_done": [ ... ]
}

Return ONLY raw JSON — no markdown, no comments, no code fences.`
    };

    const messages = [systemMessage, userMessage];
    const aiResponse = await callOpenAI(messages, env);

    // Parse response
    let backendPayload: any = {};
    let warning = undefined;
    let parseStatus = 'success';

    try {
      const parsed = JSON.parse(aiResponse);
      backendPayload = {
        sprint_objective: parsed.sprint_objective || '',
        team_roster_and_responsibilities: parsed.team_roster_and_responsibilities || '',
        sprint_cadence: parsed.sprint_cadence || '',
        rituals_and_artifacts: parsed.rituals_and_artifacts || '',
        deliverables_per_sprint: parsed.deliverables_per_sprint || '',
        rapid_testing_validation_methods: parsed.rapid_testing_validation_methods || '',
        definition_of_done: Array.isArray(parsed.definition_of_done) ? parsed.definition_of_done : []
      };
    } catch (err) {
      // If JSON parsing failed, try to extract structured data from the raw response
      parseStatus = 'fallback_used';
      let sprint_objective = '', team_roster_and_responsibilities = '', sprint_cadence = '', rituals_and_artifacts = '', deliverables_per_sprint = '', rapid_testing_validation_methods = '', definition_of_done: string[] = [];
      
      // Extract fields
      const objectiveMatch = aiResponse.match(/"sprint_objective":\s*"([^"]+)"/);
      if (objectiveMatch) sprint_objective = objectiveMatch[1];
      
      const rosterMatch = aiResponse.match(/"team_roster_and_responsibilities":\s*"([^"]+)"/);
      if (rosterMatch) team_roster_and_responsibilities = rosterMatch[1];
      
      const cadenceMatch = aiResponse.match(/"sprint_cadence":\s*"([^"]+)"/);
      if (cadenceMatch) sprint_cadence = cadenceMatch[1];
      
      const ritualsMatch = aiResponse.match(/"rituals_and_artifacts":\s*"([^"]+)"/);
      if (ritualsMatch) rituals_and_artifacts = ritualsMatch[1];
      
      const deliverablesMatch = aiResponse.match(/"deliverables_per_sprint":\s*"([^"]+)"/);
      if (deliverablesMatch) deliverables_per_sprint = deliverablesMatch[1];
      
      const testingMatch = aiResponse.match(/"rapid_testing_validation_methods":\s*"([^"]+)"/);
      if (testingMatch) rapid_testing_validation_methods = testingMatch[1];
      
      // Extract definition of done
      const dodMatch = aiResponse.match(/"definition_of_done":\s*\[([\s\S]*?)\]/);
      if (dodMatch) {
        const dodText = dodMatch[1];
        definition_of_done = dodText.match(/"([^"]+)"/g)?.map(d => d.replace(/"/g, '')) || [];
      }
      
      // If we extracted any data, return it structured
      if (sprint_objective || team_roster_and_responsibilities || sprint_cadence || rituals_and_artifacts || deliverables_per_sprint || rapid_testing_validation_methods || definition_of_done.length) {
        backendPayload = {
          sprint_objective,
          team_roster_and_responsibilities,
          sprint_cadence,
          rituals_and_artifacts,
          deliverables_per_sprint,
          rapid_testing_validation_methods,
          definition_of_done
        };
        warning = 'AI response was not valid JSON; fields were extracted heuristically.';
      } else {
        // Complete fallback: return raw response
        parseStatus = 'failed';
        backendPayload = { raw_response: aiResponse };
        warning = 'AI response could not be parsed; returning raw text only.';
      }
    }

    // Debug log
    lastMiniToolDebugLog = {
      tool: 'agile-sprint-planner',
      input_payload: body,
      prompt: messages,
      openai_response: aiResponse,
      parse_status: parseStatus,
      backend_payload: backendPayload,
      warning,
      timestamp: new Date().toISOString()
    };

    return jsonResponse(backendPayload);
  } catch (error) {
    console.error('Agile Sprint Planner error:', error);
    return errorResponse('Failed to generate sprint plan', 500);
  }
}

export async function handleConnectedMediaMatrix(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  try {
    // Temporarily bypass auth for testing
    // const user = await verifyAuth(request, env);
    // if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { audience_snapshot, primary_conversion_action, seasonal_or_contextual_triggers } = body;
    if (!audience_snapshot || !primary_conversion_action) {
      return errorResponse('Audience snapshot and primary conversion action are required', 400);
    }

    const systemMessage = {
      role: 'system',
      content: 'You are a MadMarketing Connected-Media Moment Matrix assistant. Create a moment-based media plan.'
    };

    const userMessage = {
      role: 'user',
      content: `Audience Snapshot: ${audience_snapshot}
Primary Conversion Action: ${primary_conversion_action}
Seasonal/Contextual Triggers: ${seasonal_or_contextual_triggers || 'None specified'}

Instructions:
Return a table:
- moment_or_trigger
- audience_mindset
- channel_format_ranked
- creative_or_offer_cue
- primary_kpi
- measurement_approach

Response format:
{
  "moment_matrix": [
    { "moment_or_trigger": "...", "audience_mindset": "...", "channel_format_ranked": "...", "creative_or_offer_cue": "...", "primary_kpi": "...", "measurement_approach": "..." },
    ...
  ]
}

Return ONLY raw JSON — no markdown, no comments, no code fences.`
    };

    const messages = [systemMessage, userMessage];
    const aiResponse = await callOpenAI(messages, env);

    // Parse response
    let backendPayload: any = {};
    let warning = undefined;
    let parseStatus = 'success';

    try {
      const parsed = JSON.parse(aiResponse);
      backendPayload = {
        moment_matrix: Array.isArray(parsed.moment_matrix) ? parsed.moment_matrix : []
      };
    } catch (err) {
      // If JSON parsing failed, try to extract structured data from the raw response
      parseStatus = 'fallback_used';
      let moment_matrix: any[] = [];
      
      // Extract moment matrix
      const matrixMatch = aiResponse.match(/"moment_matrix":\s*\[([\s\S]*?)\]/);
      if (matrixMatch) {
        const matrixText = matrixMatch[1];
        const rowMatches = matrixText.match(/\{[^}]+\}/g);
        if (rowMatches) {
          moment_matrix = rowMatches.map(row => {
            const moment_or_trigger = row.match(/"moment_or_trigger":\s*"([^"]+)"/)?.[1] || '';
            const audience_mindset = row.match(/"audience_mindset":\s*"([^"]+)"/)?.[1] || '';
            const channel_format_ranked = row.match(/"channel_format_ranked":\s*"([^"]+)"/)?.[1] || '';
            const creative_or_offer_cue = row.match(/"creative_or_offer_cue":\s*"([^"]+)"/)?.[1] || '';
            const primary_kpi = row.match(/"primary_kpi":\s*"([^"]+)"/)?.[1] || '';
            const measurement_approach = row.match(/"measurement_approach":\s*"([^"]+)"/)?.[1] || '';
            return { moment_or_trigger, audience_mindset, channel_format_ranked, creative_or_offer_cue, primary_kpi, measurement_approach };
          });
        }
      }
      
      // If we extracted any data, return it structured
      if (moment_matrix.length > 0) {
        backendPayload = { moment_matrix };
        warning = 'AI response was not valid JSON; fields were extracted heuristically.';
      } else {
        // Complete fallback: return raw response
        parseStatus = 'failed';
        backendPayload = { raw_response: aiResponse };
        warning = 'AI response could not be parsed; returning raw text only.';
      }
    }

    // Debug log
    lastMiniToolDebugLog = {
      tool: 'connected-media-matrix',
      input_payload: body,
      prompt: messages,
      openai_response: aiResponse,
      parse_status: parseStatus,
      backend_payload: backendPayload,
      warning,
      timestamp: new Date().toISOString()
    };

    return jsonResponse(backendPayload);
  } catch (error) {
    console.error('Connected Media Matrix error:', error);
    return errorResponse('Failed to generate media matrix', 500);
  }
}

export async function handleSyntheticFocusGroup(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  try {
    // Temporarily bypass auth for testing
    // const user = await verifyAuth(request, env);
    // if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { topic_or_category, audience_seed_info, must_include_segments } = body;
    if (!topic_or_category || !audience_seed_info) {
      return errorResponse('Topic/category and audience seed info are required', 400);
    }

    const systemMessage = {
      role: 'system',
      content: 'You are a MadMarketing Synthetic Focus Group assistant. Create a synthetic focus group of five personas and enter Ask Mode.'
    };

    const userMessage = {
      role: 'user',
      content: `Topic/Category: ${topic_or_category}
Audience Seed Info: ${audience_seed_info}
Must Include Segments: ${must_include_segments || 'None specified'}

Instructions:
Section A – Persona Line-Up:
For each persona:
- name, age, location, quick bio
- core_motivations_values
- pain_points_objections
- decision_drivers_triggers
- media_content_habits

Section B – Ask Mode:
Respond:
"All five personas are present. Address your question to a name (e.g., 'Karen, why…?') or to 'the group.' When finished, say 'exit group.'"

Response format:
{
  "persona_lineup": [ { "name": "...", "age": "...", "location": "...", "bio": "...", "motivations": "...", "pain_points": "...", "triggers": "...", "media_habits": "..." }, ... ],
  "ask_mode_message": "All five personas are present. Address your question to a name or to 'the group.' When finished, say 'exit group.'"
}

Return ONLY raw JSON — no markdown, no comments, no code fences.`
    };

    const messages = [systemMessage, userMessage];
    const aiResponse = await callOpenAI(messages, env);

    // Parse response
    let backendPayload: any = {};
    let warning = undefined;
    let parseStatus = 'success';

    try {
      const parsed = JSON.parse(aiResponse);
      backendPayload = {
        persona_lineup: Array.isArray(parsed.persona_lineup) ? parsed.persona_lineup : [],
        ask_mode_message: parsed.ask_mode_message || 'All five personas are present. Address your question to a name or to \'the group.\' When finished, say \'exit group.\''
      };
    } catch (err) {
      // If JSON parsing failed, try to extract structured data from the raw response
      parseStatus = 'fallback_used';
      let persona_lineup: any[] = [], ask_mode_message = 'All five personas are present. Address your question to a name or to \'the group.\' When finished, say \'exit group.\'';
      
      // Extract persona lineup
      const lineupMatch = aiResponse.match(/"persona_lineup":\s*\[([\s\S]*?)\]/);
      if (lineupMatch) {
        const lineupText = lineupMatch[1];
        const personaMatches = lineupText.match(/\{[^}]+\}/g);
        if (personaMatches) {
          persona_lineup = personaMatches.map(persona => {
            const name = persona.match(/"name":\s*"([^"]+)"/)?.[1] || '';
            const age = persona.match(/"age":\s*"([^"]+)"/)?.[1] || '';
            const location = persona.match(/"location":\s*"([^"]+)"/)?.[1] || '';
            const bio = persona.match(/"bio":\s*"([^"]+)"/)?.[1] || '';
            const motivations = persona.match(/"motivations":\s*"([^"]+)"/)?.[1] || '';
            const pain_points = persona.match(/"pain_points":\s*"([^"]+)"/)?.[1] || '';
            const triggers = persona.match(/"triggers":\s*"([^"]+)"/)?.[1] || '';
            const media_habits = persona.match(/"media_habits":\s*"([^"]+)"/)?.[1] || '';
            return { name, age, location, bio, motivations, pain_points, triggers, media_habits };
          });
        }
      }
      
      // Extract ask mode message
      const askModeMatch = aiResponse.match(/"ask_mode_message":\s*"([^"]+)"/);
      if (askModeMatch) {
        ask_mode_message = askModeMatch[1];
      }
      
      // If we extracted any data, return it structured
      if (persona_lineup.length > 0 || ask_mode_message) {
        backendPayload = { persona_lineup, ask_mode_message };
        warning = 'AI response was not valid JSON; fields were extracted heuristically.';
      } else {
        // Complete fallback: return raw response
        parseStatus = 'failed';
        backendPayload = { raw_response: aiResponse };
        warning = 'AI response could not be parsed; returning raw text only.';
      }
    }

    // Debug log
    lastMiniToolDebugLog = {
      tool: 'synthetic-focus-group',
      input_payload: body,
      prompt: messages,
      openai_response: aiResponse,
      parse_status: parseStatus,
      backend_payload: backendPayload,
      warning,
      timestamp: new Date().toISOString()
    };

    return jsonResponse(backendPayload);
  } catch (error) {
    console.error('Synthetic Focus Group error:', error);
    return errorResponse('Failed to generate focus group', 500);
  }
}

export { lastMiniToolDebugLog }; 