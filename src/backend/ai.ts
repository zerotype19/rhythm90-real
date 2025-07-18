import { Env, GeneratePlayRequest, GeneratePlayResponse, InterpretSignalRequest, InterpretSignalResponse, GenerateRitualPromptsRequest, GenerateRitualPromptsResponse } from './types';
import { callOpenAI, jsonResponse, errorResponse, logAIUsage } from './utils';
import { verifyAuth } from './auth';
import { buildSystemPrompt } from './systemPrompts';
import { checkUsageLimit, recordUsage } from './usage';

// Function to get team context for AI prompts
async function getTeamContext(db: any, userId: string): Promise<string> {
  try {
    // Get user's primary team (first team they're a member of)
    const teamResult = await db.prepare(`
      SELECT t.* FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ?
      ORDER BY tm.joined_at ASC
      LIMIT 1
    `).bind(userId).first();

    if (!teamResult) {
      return '';
    }

    const team = teamResult as any;
    let context = `This team works in the ${team.industry} vertical`;

    // Add focus areas if available
    if (team.focus_areas && team.focus_areas !== '[]') {
      try {
        const focusAreas = JSON.parse(team.focus_areas);
        if (Array.isArray(focusAreas) && focusAreas.length > 0) {
          context += `, with focus areas including ${focusAreas.join(', ')}`;
        }
      } catch (e) {
        // If JSON parsing fails, skip focus areas
      }
    }

    // Add team description if available
    if (team.team_description && team.team_description.trim()) {
      context += `. Description: ${team.team_description}`;
    } else {
      context += '.';
    }

    context += ' Please tailor your suggestions, examples, and advice to fit this context.';
    return context;
  } catch (error) {
    console.error('Error getting team context:', error);
    return '';
  }
}

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

    // Check usage limits
    const usageCheck = await checkUsageLimit(request, env, 'play_builder');
    if (!usageCheck.allowed) {
      return errorResponse(usageCheck.reason || 'Usage limit exceeded', 429);
    }
    const body: any = await request.json();
    
    // Extract new payload fields
    const { play_idea, observed_signal, target_outcome, signals_to_watch, owner_role, additional_context } = body;
    console.log('[AI DEBUG] Raw PlayBuilder request body:', JSON.stringify({ play_idea, observed_signal, target_outcome, signals_to_watch, owner_role, additional_context }, null, 2));
    
    // Validate required fields
    if (!play_idea || !observed_signal || !target_outcome || !signals_to_watch || !owner_role) {
      return errorResponse('Missing required fields: play_idea, observed_signal, target_outcome, signals_to_watch, owner_role', 400);
    }
    
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
    
    // Extract all fields
    let extracted_play_idea = extractField(play_idea, 'play_idea');
    let extracted_observed_signal = extractField(observed_signal, 'observed_signal');
    let extracted_target_outcome = extractField(target_outcome, 'target_outcome');
    let extracted_signals_to_watch = extractField(signals_to_watch, 'signals_to_watch');
    let extracted_owner_role = extractField(owner_role, 'owner_role');
    let extracted_additional_context = extractField(additional_context, 'additional_context');
    
    // Get system prompt from database
    const systemPromptText = await buildSystemPrompt(env.DB, 'play_builder', {
      play_idea: extracted_play_idea,
      observed_signal: extracted_observed_signal,
      target_outcome: extracted_target_outcome,
      signals_to_watch: extracted_signals_to_watch,
      owner_role: extracted_owner_role,
      additional_context: extracted_additional_context
    });
    
    let messages = [{ role: 'system', content: systemPromptText }];
    
    // Build user message with new field structure
    let contextMsg = 'Context:';
    contextMsg += `\nPlay Idea: ${extracted_play_idea}`;
    contextMsg += `\nWhy This Play: ${extracted_observed_signal}`;
    contextMsg += `\nTarget Outcome: ${extracted_target_outcome}`;
    contextMsg += `\nSignals to Watch: ${extracted_signals_to_watch}`;
    contextMsg += `\nOwner Role: ${extracted_owner_role}`;
    if (extracted_additional_context) {
      contextMsg += `\nAdditional Context: ${extracted_additional_context}`;
    }
    
    messages.push({ role: 'user', content: contextMsg });
    
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

Important: Always ensure your recommendations are directly tied to the provided play_idea and observed_signal. Do not suggest generic plays or solutions unrelated to these inputs.

Avoid suggesting pricing changes or other strategies unless they are explicitly part of the idea or signal.

⚠️ CRITICAL: Return ONLY raw JSON — no markdown fences, no code blocks, no comments, no explanation text. Do not wrap output like \`\`\`json ... \`\`\`. Return the JSON object directly.`
    });
    
    // --- AI Debugger Logging ---
    // Log prettified prompt
    console.log('[AI DEBUG] PlayBuilder Final Prompt:', JSON.stringify(messages, null, 2));
    // Call OpenAI
    const aiResponse = await callOpenAI(messages, env, 'play_builder');
    // Log full OpenAI response
    console.log('[AI DEBUG] PlayBuilder Raw OpenAI Response:', aiResponse);
    
    // Log AI usage
    await logAIUsage(env.DB, user.id, 'play_builder');

    // Record usage for billing
    await recordUsage(request, env, 'play_builder');

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
      const hypothesisMatch = aiResponse.match(/Hypothesis:\s*([\s\S]*?)(?=How-to-Run Summary:|How to Run Summary:|Signals to Watch:|Owner Role:|What Success Looks Like:|Next Recommendation:|$)/i);
      if (hypothesisMatch) hypothesis = hypothesisMatch[1].trim();
      
      const summaryMatch = aiResponse.match(/How-to-Run Summary:\s*([\s\S]*?)(?=Signals to Watch:|Owner Role:|What Success Looks Like:|Next Recommendation:|$)/i);
      if (summaryMatch) how_to_run_summary = summaryMatch[1].trim();
      
      const signalsMatch = aiResponse.match(/Signals to Watch:\s*([\s\S]*?)(?=Owner Role:|What Success Looks Like:|Next Recommendation:|$)/i);
      if (signalsMatch) {
        const lines = signalsMatch[1].split(/\n|\*/).map(l => l.replace(/^[-\d.\s]+/, '').trim()).filter(Boolean);
        signals_to_watch = lines;
      }
      
      const ownerMatch = aiResponse.match(/Owner Role:\s*([\s\S]*?)(?=What Success Looks Like:|Next Recommendation:|$)/i);
      if (ownerMatch) owner_role = ownerMatch[1].trim();
      
      const successMatch = aiResponse.match(/What Success Looks Like:\s*([\s\S]*?)(?=Next Recommendation:|$)/i);
      if (successMatch) what_success_looks_like = successMatch[1].trim();
      
      const nextMatch = aiResponse.match(/Next Recommendation:\s*([\s\S]*)/i);
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
    
    // Extract prompt context for saving
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const userMessages = messages.filter(msg => msg.role === 'user');
    
    const systemPrompt = systemMessages.map(msg => msg.content).join('\n\n');
    const userInput = userMessages.map(msg => msg.content).join('\n\n');
    const finalPrompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
    
    // Return structured payload with prompt context
    return jsonResponse({
      ...backendPayload,
      _promptContext: {
        system_prompt: systemPrompt,
        user_input: userInput,
        final_prompt: finalPrompt,
        raw_response_text: aiResponse
      },
      user_note: userNote,
      warning
    });
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

    // Check usage limits
    const usageCheck = await checkUsageLimit(request, env, 'signal_lab');
    if (!usageCheck.allowed) {
      return errorResponse(usageCheck.reason || 'Usage limit exceeded', 429);
    }
    const body: InterpretSignalRequest = await request.json();
    const { observation, context } = body;
    if (!observation) return errorResponse('Observation is required', 400);

    // Get team data for placeholder replacement
    let teamData = { industry: '', focus_areas: '', team_description: '' };
    try {
      const teamResult = await env.DB.prepare(`
        SELECT t.* FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = ?
        ORDER BY tm.joined_at ASC
        LIMIT 1
      `).bind(user.id).first();
      
      if (teamResult) {
        const team = teamResult as any;
        teamData.industry = team.industry || '';
        teamData.focus_areas = team.focus_areas || '';
        teamData.team_description = team.team_description || '';
      }
    } catch (error) {
      console.error('Error getting team data for placeholders:', error);
    }

    // --- Prompt Assembly ---
    // Get system prompt from database with new structure
    const systemPromptText = await buildSystemPrompt(env.DB, 'signal_lab', {
      observation,
      context: context || '',
      team_industry: teamData.industry,
      focus_areas: teamData.focus_areas,
      team_description: teamData.team_description
    });
    
    let messages = [{ role: 'system', content: systemPromptText }];
    
    let contextBlock = `Observation: ${observation}`;
    if (context) contextBlock += `\nContext: ${context}`;
    
    messages.push({ role: 'user', content: contextBlock });

    // --- AI Call ---
    const aiResponse = await callOpenAI(messages, env, 'signal_lab');
    
    // Log AI usage
    await logAIUsage(env.DB, user.id, 'signal_lab');

    // Record usage for billing
    await recordUsage(request, env, 'signal_lab');

    // --- Output Structuring ---
    let backendPayload: any = {};
    let warning = undefined;
    console.log('AI Response for Signal Lab:', aiResponse); // Debug log
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(aiResponse);
      console.log('Parsed JSON:', parsed); // Debug log
      backendPayload = {
        signal_summary: parsed.signal_summary || '',
        why_it_matters: parsed.why_it_matters || '',
        possible_next_step: parsed.possible_next_step || ''
      };
      console.log('Backend payload (JSON):', backendPayload); // Debug log
    } catch (err) {
      console.log('JSON parsing failed, trying text extraction'); // Debug log
      // Try to extract sections from text if not JSON
      let signal_summary = '', why_it_matters = '', possible_next_step = '';
      
      // Extract sections based on new system prompt structure
      console.log('[AI DEBUG] Raw AI response length:', aiResponse.length);
      console.log('[AI DEBUG] Raw AI response:', JSON.stringify(aiResponse));
      
      const summaryMatch = aiResponse.match(/\*\*Signal Summary\*\*:\s*([\s\S]*?)(?=\*\*Why It Matters\*\*:|$)/i);
      console.log('[AI DEBUG] Summary match:', summaryMatch);
      if (summaryMatch) signal_summary = summaryMatch[1].trim();
      
      const whyMatch = aiResponse.match(/\*\*Why It Matters\*\*:\s*([\s\S]*?)(?=\*\*Possible Next Step\*\*:|$)/i);
      console.log('[AI DEBUG] Why match:', whyMatch);
      if (whyMatch) why_it_matters = whyMatch[1].trim();
      
      const nextMatch = aiResponse.match(/\*\*Possible Next Step\*\*:\s*([\s\S]*)/i);
      console.log('[AI DEBUG] Next match:', nextMatch);
      if (nextMatch) possible_next_step = nextMatch[1].trim();
      
      console.log('Extracted fields:', { signal_summary, why_it_matters, possible_next_step }); // Debug log
      
      // If regex extraction failed, try alternative parsing
      if (!signal_summary && !why_it_matters && !possible_next_step) {
        console.log('[AI DEBUG] Regex extraction failed, trying alternative parsing');
        
        // Split by lines and look for the headers
        const lines = aiResponse.split('\n');
        let currentSection = '';
        let currentContent: string[] = [];
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('**Signal Summary:**')) {
            currentSection = 'summary';
            currentContent = [trimmedLine.replace('**Signal Summary:**', '').trim()];
          } else if (trimmedLine.startsWith('**Why It Matters:**')) {
            if (currentSection === 'summary' && currentContent.length > 0) {
              signal_summary = currentContent.join('\n').trim();
            }
            currentSection = 'why';
            currentContent = [trimmedLine.replace('**Why It Matters:**', '').trim()];
          } else if (trimmedLine.startsWith('**Possible Next Step:**')) {
            if (currentSection === 'why' && currentContent.length > 0) {
              why_it_matters = currentContent.join('\n').trim();
            }
            currentSection = 'next';
            currentContent = [trimmedLine.replace('**Possible Next Step:**', '').trim()];
          } else if (trimmedLine && currentSection) {
            currentContent.push(trimmedLine);
          }
        }
        
        // Set the last section
        if (currentSection === 'next' && currentContent.length > 0) {
          possible_next_step = currentContent.join('\n').trim();
        }
        
        console.log('[AI DEBUG] Alternative parsing results:', { signal_summary, why_it_matters, possible_next_step });
      }
      
      // If at least one field is found, return structured
      if (signal_summary || why_it_matters || possible_next_step) {
        backendPayload = {
          signal_summary,
          why_it_matters,
          possible_next_step
        };
        warning = 'AI response was not valid JSON; fields were extracted heuristically.';
        console.log('Backend payload (extracted):', backendPayload); // Debug log
      } else {
        // Fallback: pass raw response
        backendPayload = {
          signal_summary: '',
          why_it_matters: '',
          possible_next_step: '',
          raw_response: aiResponse
        };
        warning = 'AI response could not be parsed; raw response returned.';
        console.log('Backend payload (fallback):', backendPayload); // Debug log
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

    // Extract prompt context for saving
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const userMessages = messages.filter(msg => msg.role === 'user');
    
    const systemPrompt = systemMessages.map(msg => msg.content).join('\n\n');
    const userInput = userMessages.map(msg => msg.content).join('\n\n');
    const finalPrompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
    
    // Return structured payload with prompt context
    return jsonResponse({
      ...backendPayload,
      _promptContext: {
        system_prompt: systemPrompt,
        user_input: userInput,
        final_prompt: finalPrompt,
        raw_response_text: aiResponse
      }
    });
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
    const user = await verifyAuth(request, env);
    if (!user) return errorResponse('Unauthorized', 401);

    // Check usage limits
    const usageCheck = await checkUsageLimit(request, env, 'ritual_guide');
    if (!usageCheck.allowed) {
      return errorResponse(usageCheck.reason || 'Usage limit exceeded', 429);
    }
    const body: GenerateRitualPromptsRequest = await request.json();
    const { ritual_type, team_type, top_challenges, focus_areas, additional_context } = body;
    if (!ritual_type) return errorResponse('Ritual type is required', 400);

    // Validate ritual type
    const validRitualTypes = ['kickoff', 'pulse_check', 'rr'];
    if (!validRitualTypes.includes(ritual_type)) {
      return errorResponse(`Invalid ritual type. Must be one of: ${validRitualTypes.join(', ')}`, 400);
    }

    // Get team context for AI prompt injection
    const teamContext = await getTeamContext(env.DB, user.id);
    
    // Get team data for placeholder replacement
    let teamData = { industry: '', focus_areas: '', team_description: '' };
    try {
      const teamResult = await env.DB.prepare(`
        SELECT t.* FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = ?
        ORDER BY tm.joined_at ASC
        LIMIT 1
      `).bind(user.id).first();
      
      if (teamResult) {
        const team = teamResult as any;
        teamData.industry = team.industry || '';
        teamData.focus_areas = team.focus_areas || '';
        teamData.team_description = team.team_description || '';
      }
    } catch (error) {
      console.error('Error getting team data for placeholders:', error);
    }

    // --- Prompt Assembly ---
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
    
    // Get system prompt from database with team context
    const systemPromptText = await buildSystemPrompt(env.DB, 'ritual_guide', {
      ritual_type,
      team_type,
      top_challenges,
      focus_areas,
      additional_context,
      team_industry: teamData.industry,
      team_focus_areas: teamData.focus_areas,
      team_description: teamData.team_description
    });
    
    const messages = [
      { role: 'system', content: systemPromptText },
      { role: 'user', content: contextBlock },
      { role: 'user', content: userPrompt }
    ];

    // --- AI Call ---
    let aiResponse: string;
    try {
      aiResponse = await callOpenAI(messages, env, 'ritual_guide');
    } catch (error) {
      console.log('OpenAI call failed:', error);
      throw error; // Re-throw the error instead of using mock response
    }
    
    // Log AI usage
    await logAIUsage(env.DB, user.id, 'ritual_guide');

    // Record usage for billing
    await recordUsage(request, env, 'ritual_guide');

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
      const agendaMatch = aiResponse.match(/Agenda:\s*([\s\S]*?)(?=Discussion Prompts:|Roles:|Preparation:|Success:|$)/i);
      if (agendaMatch) {
        const lines = agendaMatch[1].split(/\n|\*/).map(l => l.replace(/^[-\d.\s]+/, '').trim()).filter(Boolean);
        agenda = lines;
      }
      
      const promptsMatch = aiResponse.match(/Discussion Prompts:\s*([\s\S]*?)(?=Roles:|Preparation:|Success:|$)/i);
      if (promptsMatch) {
        const lines = promptsMatch[1].split(/\n|\*/).map(l => l.replace(/^[-\d.\s]+/, '').trim()).filter(Boolean);
        discussion_prompts = lines;
      }
      
      const rolesMatch = aiResponse.match(/Roles:\s*([\s\S]*?)(?=Preparation:|Success:|$)/i);
      if (rolesMatch) roles_contributions = rolesMatch[1].trim();
      
      const prepMatch = aiResponse.match(/Preparation:\s*([\s\S]*?)(?=Success:|$)/i);
      if (prepMatch) preparation_tips = prepMatch[1].trim();
      
      const successMatch = aiResponse.match(/Success:\s*([\s\S]*)/i);
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

    // Extract prompt context for saving
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const userMessages = messages.filter(msg => msg.role === 'user');
    
    const systemPrompt = systemMessages.map(msg => msg.content).join('\n\n');
    const userInput = userMessages.map(msg => msg.content).join('\n\n');
    const finalPrompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
    
    // Return structured payload with prompt context
    return jsonResponse({
      ...backendPayload,
      _promptContext: {
        system_prompt: systemPrompt,
        user_input: userInput,
        final_prompt: finalPrompt,
        raw_response_text: aiResponse
      }
    });
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
    const user = await verifyAuth(request, env);
    if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { original_text } = body;
    if (!original_text) return errorResponse('Original text is required', 400);

    // Get team data for placeholder replacement
    let teamData = { industry: '', focus_areas: '', team_description: '' };
    try {
      const teamResult = await env.DB.prepare(`
        SELECT t.* FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = ?
        ORDER BY tm.joined_at ASC
        LIMIT 1
      `).bind(user.id).first();
      
      if (teamResult) {
        const team = teamResult as any;
        teamData.industry = team.industry || '';
        teamData.focus_areas = team.focus_areas || '';
        teamData.team_description = team.team_description || '';
      }
    } catch (error) {
      console.error('Error getting team data for placeholders:', error);
    }

    // Get system prompt from database with team context
    const systemPromptText = await buildSystemPrompt(env.DB, 'plain_english_translator', {
      original_text,
      team_industry: teamData.industry,
      focus_areas: teamData.focus_areas,
      team_description: teamData.team_description
    });
    
    const systemMessage = {
      role: 'system',
      content: systemPromptText
    };

    const userMessage = {
      role: 'user',
      content: `Original text: ${original_text}

Analyze this text and provide:

1. A plain English rewrite that removes all jargon and buzzwords
2. A side-by-side table that breaks down specific jargon phrases found in the text, showing what each phrase says vs what it really means
3. A jargon glossary with definitions

For the side_by_side_table, identify at least 3-5 specific jargon phrases from the text and explain what each one actually means in simple terms.

Output JSON only:
{
  "plain_english_rewrite": "Clear, jargon-free version of the text",
  "side_by_side_table": [
    {
      "what_it_says": "exact jargon phrase from text",
      "what_it_really_means": "simple explanation of what this actually means"
    }
  ],
  "jargon_glossary": [
    "jargon term - simple definition",
    "another term - simple definition"
  ]
}

Do not include markdown fences, code blocks, or extra explanation.`
    };

    const messages = [systemMessage, userMessage];
    const aiResponse = await callOpenAI(messages, env, 'plain_english_translator');
    
    // Log AI usage
    await logAIUsage(env.DB, user.id, 'mini_tool_plain_english_translator');

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

    // Extract prompt context for saving
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const userMessages = messages.filter(msg => msg.role === 'user');
    
    const systemPrompt = systemMessages.map(msg => msg.content).join('\n\n');
    const userInput = userMessages.map(msg => msg.content).join('\n\n');
    const finalPrompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
    
    // Return structured payload with prompt context
    return jsonResponse({
      ...backendPayload,
      _promptContext: {
        system_prompt: systemPrompt,
        user_input: userInput,
        final_prompt: finalPrompt,
        raw_response_text: aiResponse
      }
    });
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
    const user = await verifyAuth(request, env);
    if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { audience_description, behavioral_or_emotional_insight, brand_product_role } = body;
    if (!audience_description || !behavioral_or_emotional_insight || !brand_product_role) {
      return errorResponse('All fields are required', 400);
    }

    // Get team data for placeholder replacement
    let teamData = { industry: '', focus_areas: '', team_description: '' };
    try {
      const teamResult = await env.DB.prepare(`
        SELECT t.* FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = ?
        ORDER BY tm.joined_at ASC
        LIMIT 1
      `).bind(user.id).first();
      
      if (teamResult) {
        const team = teamResult as any;
        teamData.industry = team.industry || '';
        teamData.focus_areas = team.focus_areas || '';
        teamData.team_description = team.team_description || '';
      }
    } catch (error) {
      console.error('Error getting team data for placeholders:', error);
    }

    // Get system prompt from database with team context
    const systemPromptText = await buildSystemPrompt(env.DB, 'get_to_by_generator', {
      audience_description,
      behavioral_or_emotional_insight,
      brand_product_role,
      team_industry: teamData.industry,
      focus_areas: teamData.focus_areas,
      team_description: teamData.team_description
    });
    
    const systemMessage = {
      role: 'system',
      content: systemPromptText
    };

    const userMessage = {
      role: 'user',
      content: `Audience: ${audience_description}\nBehavioral/Emotional Insight: ${behavioral_or_emotional_insight}\nBrand/Product Role: ${brand_product_role}\n\nOutput JSON only: { "get": "...", "to": "...", "by": "..." }\n\nDo not include markdown fences, code blocks, or explanation.`
    };

    const messages = [systemMessage, userMessage];
    const aiResponse = await callOpenAI(messages, env, 'get_to_by_generator');
    
    // Log AI usage
    await logAIUsage(env.DB, user.id, 'mini_tool_get_to_by_generator');

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

    // Extract prompt context for saving
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const userMessages = messages.filter(msg => msg.role === 'user');
    
    const systemPrompt = systemMessages.map(msg => msg.content).join('\n\n');
    const userInput = userMessages.map(msg => msg.content).join('\n\n');
    const finalPrompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
    
    // Return structured payload with prompt context
    return jsonResponse({
      ...backendPayload,
      _promptContext: {
        system_prompt: systemPrompt,
        user_input: userInput,
        final_prompt: finalPrompt,
        raw_response_text: aiResponse
      }
    });
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
    console.log('[AI DEBUG] Creative Tension Finder: Starting');
    const user = await verifyAuth(request, env);
    if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { problem_or_strategy_summary } = body;
    console.log('[AI DEBUG] Creative Tension Finder: Input received:', { problem_or_strategy_summary });
    if (!problem_or_strategy_summary) return errorResponse('Problem or strategy summary is required', 400);

    // Get team data for placeholder replacement
    let teamData = { industry: '', focus_areas: '', team_description: '' };
    try {
      const teamResult = await env.DB.prepare(`
        SELECT t.* FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = ?
        ORDER BY tm.joined_at ASC
        LIMIT 1
      `).bind(user.id).first();
      
      if (teamResult) {
        const team = teamResult as any;
        teamData.industry = team.industry || '';
        teamData.focus_areas = team.focus_areas || '';
        teamData.team_description = team.team_description || '';
      }
    } catch (error) {
      console.error('Error getting team data for placeholders:', error);
    }

    // Get system prompt from database with team context
    const systemPromptText = await buildSystemPrompt(env.DB, 'creative_tension_finder', {
      problem_or_strategy_summary,
      team_industry: teamData.industry,
      focus_areas: teamData.focus_areas,
      team_description: teamData.team_description
    });
    
    const systemMessage = {
      role: 'system',
      content: systemPromptText
    };

    const userMessage = {
      role: 'user',
      content: `Problem/Strategy: ${problem_or_strategy_summary}\n\nReturn ONLY a JSON array with 4-6 creative tensions in this exact format:\n[{ "tension": "Wanting control vs. craving surprise", "optional_platform_name": "Control Chaos" }]\n\nDo not include markdown fences, code blocks, or any explanation text.`
    };

    const messages = [systemMessage, userMessage];
    console.log('[AI DEBUG] Creative Tension Finder: Calling OpenAI with messages:', messages);
    const aiResponse = await callOpenAI(messages, env, 'creative_tension_finder');
    console.log('[AI DEBUG] Creative Tension Finder: OpenAI response received:', aiResponse);
    
    // Log AI usage
    await logAIUsage(env.DB, user.id, 'mini_tool_creative_tension_finder');

    // Parse response
    let backendPayload: any = {};
    let warning = undefined;
    let parseStatus = 'success';

    try {
      console.log('[AI DEBUG] Creative Tension Finder: Attempting JSON parse');
      const parsed = JSON.parse(aiResponse);
      
      // Handle different response formats
      if (Array.isArray(parsed)) {
        // Direct array format
        backendPayload = parsed;
        console.log('[AI DEBUG] Creative Tension Finder: Direct array format, payload:', backendPayload);
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Object with numbered keys format (like {"0": {...}, "1": {...}})
        console.log('[AI DEBUG] Creative Tension Finder: Object format detected, converting to array');
        const tensionsArray = [];
        const keys = Object.keys(parsed).filter(key => /^\d+$/.test(key)).sort((a, b) => parseInt(a) - parseInt(b));
        
        for (const key of keys) {
          const tension = parsed[key];
          if (tension && typeof tension === 'object' && tension.tension) {
            tensionsArray.push(tension);
          }
        }
        
        backendPayload = tensionsArray;
        console.log('[AI DEBUG] Creative Tension Finder: Converted object to array, payload:', backendPayload);
      } else {
        // Fallback to empty array
        backendPayload = [];
        console.log('[AI DEBUG] Creative Tension Finder: Invalid format, using empty array');
      }
    } catch (err) {
      console.log('[AI DEBUG] Creative Tension Finder: JSON parse failed, trying fallback parsing');
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
      
      // If no JSON array found, try to extract tensions from natural language
      if (tensions.length === 0) {
        console.log('[AI DEBUG] Creative Tension Finder: No JSON array found, trying natural language extraction');
        
        // Split by lines and look for tension patterns
        const lines = aiResponse.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          // Look for patterns like "1. Wanting control vs. craving surprise" or "• Wanting control vs. craving surprise"
          const tensionMatch = trimmedLine.match(/^[\d\-\•\*]\s*(.+?)(?:\s*[-–—]\s*(.+))?$/);
          if (tensionMatch) {
            const tension = tensionMatch[1].trim();
            const platform = tensionMatch[2] ? tensionMatch[2].trim() : '';
            tensions.push({ 
              tension, 
              optional_platform_name: platform 
            });
          }
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

    // Extract prompt context for saving
    const promptContext = {
      tool_name: 'Creative Tension Finder',
      user_input: problem_or_strategy_summary,
      system_prompt: systemPromptText,
      user_message: userMessage.content,
      ai_response: aiResponse
    };

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

    console.log('[AI DEBUG] Creative Tension Finder: Final response payload:', backendPayload);
    
    // Return the array as the main response with prompt_context as a separate field
    if (Array.isArray(backendPayload)) {
      // For arrays, return them as the main response with prompt_context as a property
      return jsonResponse({
        tensions: backendPayload,
        prompt_context: promptContext
      });
    } else {
      // If backendPayload is not an array, return it as is with prompt_context
      return jsonResponse({
        ...backendPayload,
        prompt_context: promptContext
      });
    }
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
    const user = await verifyAuth(request, env);
    if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { audience_seed } = body;
    console.log(`[DEBUG] PersonaGenerator called with user_id: ${user.id}`);
    if (!audience_seed) return errorResponse('Audience seed is required', 400);

    // Get team data for placeholder replacement
    let teamData = { industry: '', focus_areas: '', team_description: '' };
    try {
      const teamResult = await env.DB.prepare(`
        SELECT t.* FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = ?
        ORDER BY tm.joined_at ASC
        LIMIT 1
      `).bind(user.id).first();
      
      if (teamResult) {
        const team = teamResult as any;
        teamData.industry = team.industry || '';
        teamData.focus_areas = team.focus_areas || '';
        teamData.team_description = team.team_description || '';
      }
    } catch (error) {
      console.error('Error getting team data for placeholders:', error);
    }

    // Get system prompt from database with team context
    const systemPromptText = await buildSystemPrompt(env.DB, 'persona_generator', {
      audience_seed,
      team_industry: teamData.industry,
      focus_areas: teamData.focus_areas,
      team_description: teamData.team_description
    });
    
    const systemMessage = {
      role: 'system',
      content: systemPromptText
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
    const aiResponse = await callOpenAI(messages, env, 'persona_generator');
    
    // Log AI usage
    await logAIUsage(env.DB, user.id, 'mini_tool_persona_generator');

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
      
      // Store persona in session for Ask Mode
      if (parsed.persona_sheet && Object.keys(parsed.persona_sheet).length > 0) {
        console.log(`[DEBUG] Storing persona for user ${user.id}:`, parsed.persona_sheet.name);
        // We'll store the persona in the response
      } else {
        console.log(`[DEBUG] No persona sheet to store for user ${user.id}`);
      }
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
        
        // Store persona in session for Ask Mode (even if extracted via fallback)
        if (Object.keys(persona_sheet).length > 0) {
          console.log(`[DEBUG] Storing fallback persona for user ${user.id}:`, persona_sheet.name);
          // We'll store the persona in the response
        } else {
          console.log(`[DEBUG] No fallback persona to store for user ${user.id}`);
        }
      } else {
        // Complete fallback: return raw response
        parseStatus = 'failed';
        backendPayload = { raw_response: aiResponse };
        warning = 'AI response could not be parsed; returning raw text only.';
      }
    }

    // Extract prompt context for saving
    const promptContext = {
      tool_name: 'Persona Generator',
      user_input: audience_seed,
      system_prompt: systemPromptText,
      user_message: userMessage.content,
      ai_response: aiResponse
    };

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

    // Store persona in cookie if we have one
    let response = jsonResponse({
      ...backendPayload,
      prompt_context: promptContext
    });
    if (backendPayload.persona_sheet && Object.keys(backendPayload.persona_sheet).length > 0) {
      response = storePersonaSession(user.id, backendPayload.persona_sheet, response);
    }
    return response;
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
    const user = await verifyAuth(request, env);
    if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { product_or_service, primary_objective, key_barrier } = body;
    if (!product_or_service || !primary_objective) {
      return errorResponse('Product/service and primary objective are required', 400);
    }

    // Get system prompt from database
    const systemPromptText = await buildSystemPrompt(env.DB, 'journey_builder', {
      product_or_service,
      primary_objective,
      key_barrier
    });
    
    const systemMessage = {
      role: 'system',
      content: systemPromptText
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
    const aiResponse = await callOpenAI(messages, env, 'journey_builder');
    
    // Log AI usage
    await logAIUsage(env.DB, user.id, 'mini_tool_journey_builder');

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

    // Extract prompt context for saving
    const promptContext = {
      tool_name: 'Journey Builder',
      user_input: `Product/Service: ${product_or_service}\nPrimary Objective: ${primary_objective}\nKey Barrier: ${key_barrier || 'None specified'}`,
      system_prompt: systemPromptText,
      user_message: userMessage.content,
      ai_response: aiResponse
    };

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

    return jsonResponse({
      ...backendPayload,
      prompt_context: promptContext
    });
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
    const user = await verifyAuth(request, env);
    if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { campaign_or_product_context, resources_or_constraints } = body;
    if (!campaign_or_product_context) {
      return errorResponse('Campaign or product context is required', 400);
    }

    // Get system prompt from database
    const systemPromptText = await buildSystemPrompt(env.DB, 'test_learn_scale', {
      campaign_or_product_context,
      resources_or_constraints
    });
    
    const systemMessage = {
      role: 'system',
      content: systemPromptText
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
    const aiResponse = await callOpenAI(messages, env, 'test_learn_scale');
    
    // Log AI usage
    await logAIUsage(env.DB, user.id, 'mini_tool_test_learn_scale');

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

    // Extract prompt context for saving
    const promptContext = {
      tool_name: 'Test Learn Scale',
      user_input: `Campaign/Product Context: ${campaign_or_product_context}\nResources/Constraints: ${resources_or_constraints || 'None specified'}`,
      system_prompt: systemPromptText,
      user_message: userMessage.content,
      ai_response: aiResponse
    };

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

    return jsonResponse({
      ...backendPayload,
      prompt_context: promptContext
    });
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
    const user = await verifyAuth(request, env);
    if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { challenge_statement, time_horizon, team_size_roles } = body;
    if (!challenge_statement || !time_horizon || !team_size_roles) {
      return errorResponse('Challenge statement, time horizon, and team size/roles are required', 400);
    }

    // Get system prompt from database
    const systemPromptText = await buildSystemPrompt(env.DB, 'agile_sprint_planner', {
      challenge_statement,
      time_horizon,
      team_size_roles
    });
    
    const systemMessage = {
      role: 'system',
      content: systemPromptText
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
    console.log('[AI DEBUG] Agile Sprint Planner: Calling OpenAI with messages:', messages);
    const aiResponse = await callOpenAI(messages, env, 'agile_sprint_planner');
    console.log('[AI DEBUG] Agile Sprint Planner: OpenAI response received:', aiResponse);
    
    // Log AI usage
    await logAIUsage(env.DB, user.id, 'mini_tool_agile_sprint_planner');

    // Parse response
    let backendPayload: any = {};
    let warning = undefined;
    let parseStatus = 'success';

    try {
      console.log('[AI DEBUG] Agile Sprint Planner: Attempting JSON parse');
      const parsed = JSON.parse(aiResponse);
      console.log('[AI DEBUG] Agile Sprint Planner: JSON parse successful, parsed:', parsed);
      backendPayload = {
        sprint_objective: parsed.sprint_objective || '',
        team_roster_and_responsibilities: parsed.team_roster_and_responsibilities || '',
        sprint_cadence: parsed.sprint_cadence || '',
        rituals_and_artifacts: parsed.rituals_and_artifacts || '',
        deliverables_per_sprint: parsed.deliverables_per_sprint || '',
        rapid_testing_validation_methods: parsed.rapid_testing_validation_methods || '',
        definition_of_done: Array.isArray(parsed.definition_of_done) ? parsed.definition_of_done : []
      };
      console.log('[AI DEBUG] Agile Sprint Planner: Backend payload created:', backendPayload);
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

    // Extract prompt context for saving
    const promptContext = {
      tool_name: 'Agile Sprint Planner',
      user_input: `Challenge Statement: ${challenge_statement}\nTime Horizon: ${time_horizon}\nTeam Size/Roles: ${team_size_roles}`,
      system_prompt: systemPromptText,
      user_message: userMessage.content,
      ai_response: aiResponse
    };

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

    return jsonResponse({
      ...backendPayload,
      prompt_context: promptContext
    });
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
    const user = await verifyAuth(request, env);
    if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { audience_snapshot, primary_conversion_action, seasonal_or_contextual_triggers } = body;
    if (!audience_snapshot || !primary_conversion_action) {
      return errorResponse('Audience snapshot and primary conversion action are required', 400);
    }

    // Get system prompt from database
    const systemPromptText = await buildSystemPrompt(env.DB, 'connected_media_matrix', {
      audience_snapshot,
      primary_conversion_action,
      seasonal_or_contextual_triggers
    });
    
    const systemMessage = {
      role: 'system',
      content: systemPromptText
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
    const aiResponse = await callOpenAI(messages, env, 'connected_media_matrix');
    
    // Log AI usage
    await logAIUsage(env.DB, user.id, 'mini_tool_connected_media_matrix');

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

    // Extract prompt context for saving
    const promptContext = {
      tool_name: 'Connected Media Matrix',
      user_input: `Audience Snapshot: ${audience_snapshot}\nPrimary Conversion Action: ${primary_conversion_action}\nSeasonal/Contextual Triggers: ${seasonal_or_contextual_triggers || 'None specified'}`,
      system_prompt: systemPromptText,
      user_message: userMessage.content,
      ai_response: aiResponse
    };

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

    return jsonResponse({
      ...backendPayload,
      prompt_context: promptContext
    });
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
    const user = await verifyAuth(request, env);
    if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { topic_or_category, audience_seed_info, must_include_segments } = body;
    if (!topic_or_category || !audience_seed_info) {
      return errorResponse('Topic/category and audience seed info are required', 400);
    }

    // Get system prompt from database
    const systemPromptText = await buildSystemPrompt(env.DB, 'synthetic_focus_group', {
      topic_or_category,
      audience_seed_info,
      must_include_segments
    });
    
    const systemMessage = {
      role: 'system',
      content: systemPromptText
    };

    const userMessage = {
      role: 'user',
      content: `Create a focus group of EXACTLY 5 diverse personas for: ${topic_or_category}

Target audience: ${audience_seed_info}
Required segments: ${must_include_segments || 'None'}

You MUST create exactly 5 personas. No more, no less. Each persona needs:
- name (unique first name)
- age (realistic age)
- location (city, state)
- bio (2-3 sentences about their background)
- motivations (what drives them)
- pain_points (their challenges/concerns)
- triggers (what influences their decisions)
- media_habits (how they consume information)

Return this exact JSON structure with all 5 personas filled in:
{"persona_lineup":[{"name":"Persona1","age":"Age1","location":"Location1","bio":"Bio1","motivations":"Motivations1","pain_points":"PainPoints1","triggers":"Triggers1","media_habits":"MediaHabits1"},{"name":"Persona2","age":"Age2","location":"Location2","bio":"Bio2","motivations":"Motivations2","pain_points":"PainPoints2","triggers":"Triggers2","media_habits":"MediaHabits2"},{"name":"Persona3","age":"Age3","location":"Location3","bio":"Bio3","motivations":"Motivations3","pain_points":"PainPoints3","triggers":"Triggers3","media_habits":"MediaHabits3"},{"name":"Persona4","age":"Age4","location":"Location4","bio":"Bio4","motivations":"Motivations4","pain_points":"PainPoints4","triggers":"Triggers4","media_habits":"MediaHabits4"},{"name":"Persona5","age":"Age5","location":"Location5","bio":"Bio5","motivations":"Motivations5","pain_points":"PainPoints5","triggers":"Triggers5","media_habits":"MediaHabits5"}],"ask_mode_message":"All five personas are present. Address your question to a name or to 'the group.' When finished, say 'exit group.'"}

Replace Persona1, Age1, etc. with real values. Return ONLY raw JSON.`
    };

    const messages = [systemMessage, userMessage];
    const aiResponse = await callOpenAI(messages, env, 'synthetic_focus_group');
    
    // Log AI usage
    await logAIUsage(env.DB, user.id, 'mini_tool_synthetic_focus_group');

    // Parse response
    let backendPayload: any = {};
    let warning = undefined;
    let parseStatus = 'success';

    try {
      const parsed = JSON.parse(aiResponse);
      const persona_lineup = Array.isArray(parsed.persona_lineup) ? parsed.persona_lineup : [];
      
      // Check if we got all 5 personas
      if (persona_lineup.length < 5) {
        warning = `Expected 5 personas but received ${persona_lineup.length}. AI response may have been truncated.`;
      }
      
      backendPayload = {
        persona_lineup,
        ask_mode_message: parsed.ask_mode_message || 'All five personas are present. Address your question to a name or to \'the group.\' When finished, say \'exit group.\''
      };
    } catch (err) {
      // If JSON parsing failed, try to extract structured data from the raw response
      parseStatus = 'fallback_used';
      let persona_lineup: any[] = [], ask_mode_message = 'All five personas are present. Address your question to a name or to \'the group.\' When finished, say \'exit group.\'';
      
      // More robust extraction for truncated responses
      const personaMatches = aiResponse.match(/\{[^}]*"name":\s*"[^"]+"[^}]*\}/g);
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
        }).filter(p => p.name); // Only include personas with names
      }
      
      // Extract ask mode message
      const askModeMatch = aiResponse.match(/"ask_mode_message":\s*"([^"]+)"/);
      if (askModeMatch) {
        ask_mode_message = askModeMatch[1];
      }
      
      // If we extracted any data, return it structured
      if (persona_lineup.length > 0 || ask_mode_message) {
        backendPayload = { persona_lineup, ask_mode_message };
        warning = `AI response was not valid JSON; extracted ${persona_lineup.length} personas heuristically. Expected 5.`;
      } else {
        // Complete fallback: return raw response
        parseStatus = 'failed';
        backendPayload = { raw_response: aiResponse };
        warning = 'AI response could not be parsed; returning raw text only.';
      }
    }

    // Extract prompt context for saving
    const promptContext = {
      tool_name: 'Synthetic Focus Group',
      user_input: `Topic/Category: ${topic_or_category}\nTarget Audience: ${audience_seed_info}\nRequired Segments: ${must_include_segments || 'None'}`,
      system_prompt: systemPromptText,
      user_message: userMessage.content,
      ai_response: aiResponse
    };

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

    // Store focus group in cookie if we have one
    let response = jsonResponse({
      ...backendPayload,
      prompt_context: promptContext
    });
    if (backendPayload.persona_lineup && Array.isArray(backendPayload.persona_lineup) && backendPayload.persona_lineup.length > 0) {
      response = storeFocusGroupSession(user.id, backendPayload, response);
    }
    return response;
  } catch (error) {
    console.error('Synthetic Focus Group error:', error);
    return errorResponse('Failed to generate focus group', 500);
  }
}

// Cookie-based session store for persona context (works across stateless worker instances)
const PERSONA_COOKIE_NAME = 'rhythm90_persona';
const FOCUS_GROUP_COOKIE_NAME = 'rhythm90_focus_group';
const COOKIE_MAX_AGE = 60 * 60; // 1 hour in seconds

// Store persona in session using cookies
function storePersonaSession(userId: string, persona: any, response: Response): Response {
  const personaData = {
    userId,
    persona,
    timestamp: Date.now()
  };
  
  const cookieValue = encodeURIComponent(JSON.stringify(personaData));
  const cookie = `${PERSONA_COOKIE_NAME}=${cookieValue}; Max-Age=${COOKIE_MAX_AGE}; Path=/; HttpOnly; SameSite=Strict; Secure`;
  
  response.headers.set('Set-Cookie', cookie);
  console.log(`[DEBUG] Stored persona for user ${userId}:`, persona.name);
  return response;
}

// Get persona from session using cookies
function getPersonaSession(userId: string, request: Request): any | null {
  const cookies = request.headers.get('cookie');
  if (!cookies) {
    console.log(`[DEBUG] No cookies found for user ${userId}`);
    return null;
  }
  
  const personaCookie = cookies.split(';')
    .find(cookie => cookie.trim().startsWith(`${PERSONA_COOKIE_NAME}=`));
  
  if (!personaCookie) {
    console.log(`[DEBUG] No persona cookie found for user ${userId}`);
    return null;
  }
  
  try {
    const cookieValue = personaCookie.split('=')[1];
    const personaData = JSON.parse(decodeURIComponent(cookieValue));
    
    // Check if cookie is for the right user and not expired
    if (personaData.userId !== userId) {
      console.log(`[DEBUG] Cookie user ID mismatch: expected ${userId}, got ${personaData.userId}`);
      return null;
    }
    
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    if (now - personaData.timestamp > oneHour) {
      console.log(`[DEBUG] Persona cookie expired for user ${userId}`);
      return null;
    }
    
    console.log(`[DEBUG] Found persona for user ${userId}:`, personaData.persona.name);
    return personaData.persona;
  } catch (error) {
    console.log(`[DEBUG] Error parsing persona cookie for user ${userId}:`, error);
    return null;
  }
}

// Store focus group in session using cookies
function storeFocusGroupSession(userId: string, focusGroup: any, response: Response): Response {
  const focusGroupData = {
    userId,
    focusGroup,
    timestamp: Date.now()
  };
  
  const cookieValue = encodeURIComponent(JSON.stringify(focusGroupData));
  const cookie = `${FOCUS_GROUP_COOKIE_NAME}=${cookieValue}; Max-Age=${COOKIE_MAX_AGE}; Path=/; HttpOnly; SameSite=Strict; Secure`;
  
  response.headers.set('Set-Cookie', cookie);
  console.log(`[DEBUG] Stored focus group for user ${userId}:`, focusGroup.persona_lineup?.length || 0, 'personas');
  return response;
}

// Get focus group from session using cookies
function getFocusGroupSession(userId: string, request: Request): any | null {
  const cookies = request.headers.get('cookie');
  if (!cookies) {
    console.log(`[DEBUG] No cookies found for user ${userId}`);
    return null;
  }
  
  const focusGroupCookie = cookies.split(';')
    .find(cookie => cookie.trim().startsWith(`${FOCUS_GROUP_COOKIE_NAME}=`));
  
  if (!focusGroupCookie) {
    console.log(`[DEBUG] No focus group cookie found for user ${userId}`);
    return null;
  }
  
  try {
    const cookieValue = focusGroupCookie.split('=')[1];
    const focusGroupData = JSON.parse(decodeURIComponent(cookieValue));
    
    // Check if cookie is for the right user and not expired
    if (focusGroupData.userId !== userId) {
      console.log(`[DEBUG] Cookie user ID mismatch: expected ${userId}, got ${focusGroupData.userId}`);
      return null;
    }
    
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    if (now - focusGroupData.timestamp > oneHour) {
      console.log(`[DEBUG] Focus group cookie expired for user ${userId}`);
      return null;
    }
    
    console.log(`[DEBUG] Found focus group for user ${userId}:`, focusGroupData.focusGroup.persona_lineup?.length || 0, 'personas');
    return focusGroupData.focusGroup;
  } catch (error) {
    console.log(`[DEBUG] Error parsing focus group cookie for user ${userId}:`, error);
    return null;
  }
}

export async function handleFocusGroupAsk(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  try {
    console.log('[AI DEBUG] Focus Group Ask: Starting');
    const user = await verifyAuth(request, env);
    if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { question } = body;
    console.log('[AI DEBUG] Focus Group Ask: Question received:', question);
    if (!question) {
      return errorResponse('Question is required', 400);
    }

    // Get focus group from session
    console.log(`[AI DEBUG] Focus Group Ask: Getting focus group for user_id: ${user.id}`);
    const focusGroup = getFocusGroupSession(user.id, request);
    if (!focusGroup) {
      console.log(`[AI DEBUG] Focus Group Ask: No focus group found for user ${user.id}`);
      return errorResponse('No focus group found for this session. Please generate a focus group first.', 400);
    }
    console.log(`[AI DEBUG] Focus Group Ask: Found focus group with ${focusGroup.persona_lineup?.length || 0} personas`);

    // Build system message with all personas
    const personas = focusGroup.persona_lineup || [];
    const personaDescriptions = personas.map(persona => 
      `${persona.name} (${persona.age}, ${persona.location}): ${persona.bio}. Motivations: ${persona.motivations}. Pain points: ${persona.pain_points}. Decision drivers: ${persona.triggers}. Media habits: ${persona.media_habits}`
    ).join('\n\n');

    const systemMessage = {
      role: 'system',
      content: `You are facilitating a focus group with these participants:

${personaDescriptions}

When a question is asked:
- If addressed to a specific person (e.g., "Karen, what do you think?"), respond as that person only
- If addressed to "the group", have 3-4 relevant personas respond
- If no specific person is mentioned, have 2-3 most relevant personas respond
- Keep responses authentic to each persona's background and characteristics
- Format responses clearly with each person's name on a new line

For group responses, format like this:
**Maria:** [Maria's response]

**David:** [David's response]

**Sarah:** [Sarah's response]

Keep responses concise (1-2 sentences each) and conversational.`
    };

    const userMessage = {
      role: 'user',
      content: `Question: ${question}`
    };

    const messages = [systemMessage, userMessage];
    console.log('[AI DEBUG] Focus Group Ask: Calling OpenAI with messages:', messages);
    const aiResponse = await callOpenAI(messages, env);
    console.log('[AI DEBUG] Focus Group Ask: OpenAI response received:', aiResponse);
    
    // Log AI usage
    await logAIUsage(env.DB, user.id, 'mini_tool_focus_group_ask');

    // Parse response
    let backendPayload: any = {};
    let warning = undefined;
    let parseStatus = 'success';

    try {
      // For Ask Mode, we expect a simple text response, not JSON
      console.log('[AI DEBUG] Focus Group Ask: Processing response');
      backendPayload = {
        answer: aiResponse.trim(),
        focus_group_size: personas.length,
        persona_names: personas.map(p => p.name)
      };
      console.log('[AI DEBUG] Focus Group Ask: Final payload:', backendPayload);
    } catch (err) {
      parseStatus = 'failed';
      backendPayload = { 
        answer: aiResponse.trim(),
        focus_group_size: personas.length,
        persona_names: personas.map(p => p.name),
        raw_response: aiResponse 
      };
      warning = 'Response parsing failed; returning raw text.';
    }

    // Debug log
    lastMiniToolDebugLog = {
      tool: 'focus-group-ask',
      input_payload: body,
      last_focus_group_snapshot: focusGroup,
      prompt: messages,
      openai_response: aiResponse,
      parse_status: parseStatus,
      backend_payload: backendPayload,
      warning,
      timestamp: new Date().toISOString()
    };

    return jsonResponse(backendPayload);
  } catch (error) {
    console.error('Focus Group Ask error:', error);
    return errorResponse('Failed to get focus group response', 500);
  }
}

export async function handlePersonaAsk(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  try {
    console.log('[AI DEBUG] Persona Ask: Starting');
    const user = await verifyAuth(request, env);
    if (!user) return errorResponse('Unauthorized', 401);
    const body = await request.json();
    const { question } = body;
    console.log('[AI DEBUG] Persona Ask: Question received:', question);
    if (!question) {
      return errorResponse('Question is required', 400);
    }

    // Get persona from session
    console.log(`[AI DEBUG] Persona Ask: Getting persona for user_id: ${user.id}`);
    const persona = getPersonaSession(user.id, request);
    if (!persona) {
      console.log(`[AI DEBUG] Persona Ask: No persona found for user ${user.id}`);
      return errorResponse('No persona found for this session. Please generate a persona first.', 400);
    }
    console.log(`[AI DEBUG] Persona Ask: Found persona: ${persona.name}`);

    const systemMessage = {
      role: 'system',
      content: `You are ${persona.name}, ${persona.age}, from ${persona.location}. 

Bio: ${persona.bio}
Motivations: ${persona.motivations}
Pain Points: ${persona.pain_points}
Decision Drivers: ${persona.triggers}
Media Habits: ${persona.media_habits}

Answer the following question as ${persona.name}, staying in character and true to your persona. Be authentic and specific to your background, motivations, and experiences.`
    };

    const userMessage = {
      role: 'user',
      content: `Question: ${question}`
    };

    const messages = [systemMessage, userMessage];
    console.log('[AI DEBUG] Persona Ask: Calling OpenAI with messages:', messages);
    const aiResponse = await callOpenAI(messages, env);
    console.log('[AI DEBUG] Persona Ask: OpenAI response received:', aiResponse);
    
    // Log AI usage
    await logAIUsage(env.DB, user.id, 'mini_tool_persona_ask');

    // Parse response
    let backendPayload: any = {};
    let warning = undefined;
    let parseStatus = 'success';

    try {
      // For Ask Mode, we expect a simple text response, not JSON
      console.log('[AI DEBUG] Persona Ask: Processing response');
      backendPayload = {
        answer: aiResponse.trim(),
        persona_name: persona.name
      };
      console.log('[AI DEBUG] Persona Ask: Final payload:', backendPayload);
    } catch (err) {
      console.log('[AI DEBUG] Persona Ask: Error processing response:', err);
      parseStatus = 'failed';
      backendPayload = { 
        answer: aiResponse.trim(),
        persona_name: persona.name,
        raw_response: aiResponse 
      };
      warning = 'Response parsing failed; returning raw text.';
    }

    // Debug log
    lastMiniToolDebugLog = {
      tool: 'persona-ask',
      input_payload: body,
      last_persona_snapshot: persona,
      prompt: messages,
      openai_response: aiResponse,
      parse_status: parseStatus,
      backend_payload: backendPayload,
      warning,
      timestamp: new Date().toISOString()
    };

    return jsonResponse(backendPayload);
  } catch (error) {
    console.error('Persona Ask error:', error);
    return errorResponse('Failed to get persona response', 500);
  }
}

export { lastMiniToolDebugLog }; 