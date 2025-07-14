import { Env, GeneratePlayRequest, GeneratePlayResponse, InterpretSignalRequest, InterpretSignalResponse, GenerateRitualPromptsRequest, GenerateRitualPromptsResponse } from './types';
import { callOpenAI, jsonResponse, errorResponse } from './utils';
import { verifyAuth } from './auth';

export async function handleGeneratePlay(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    // Verify authentication
    const user = await verifyAuth(request, env);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const body: GeneratePlayRequest = await request.json();
    const { idea, context } = body;

    if (!idea) {
      return errorResponse('Idea is required', 400);
    }

    const prompt = `As a business strategy expert, help convert this idea into a testable hypothesis:

Idea: ${idea}
${context ? `Context: ${context}` : ''}

Please provide:
1. A clear, testable hypothesis statement
2. 3-5 specific suggestions for how to test this hypothesis

Format your response as JSON with "hypothesis" and "suggestions" fields.`;

    const aiResponse = await callOpenAI(prompt, env);
    
    try {
      const parsed = JSON.parse(aiResponse);
      const response: GeneratePlayResponse = {
        hypothesis: parsed.hypothesis || 'Failed to generate hypothesis',
        suggestions: parsed.suggestions || ['Try again later']
      };
      return jsonResponse(response);
    } catch (parseError) {
      // Fallback if AI response isn't valid JSON
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
    // Verify authentication
    const user = await verifyAuth(request, env);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const body: InterpretSignalRequest = await request.json();
    const { observation, context } = body;

    if (!observation) {
      return errorResponse('Observation is required', 400);
    }

    const prompt = `As a business analyst, interpret this observation and provide insights:

Observation: ${observation}
${context ? `Context: ${context}` : ''}

Please provide:
1. A clear interpretation of what this observation means
2. A confidence level (0-100) in your interpretation

Format your response as JSON with "interpretation" and "confidence" fields.`;

    const aiResponse = await callOpenAI(prompt, env);
    
    try {
      const parsed = JSON.parse(aiResponse);
      const response: InterpretSignalResponse = {
        interpretation: parsed.interpretation || 'Failed to interpret signal',
        confidence: parsed.confidence || 50
      };
      return jsonResponse(response);
    } catch (parseError) {
      // Fallback if AI response isn't valid JSON
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
    // Verify authentication
    const user = await verifyAuth(request, env);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const body: GenerateRitualPromptsRequest = await request.json();
    const { ritual_type, team_context } = body;

    console.log('handleGenerateRitualPrompts: Request from user:', user.id, 'ritual_type:', ritual_type);

    if (!ritual_type) {
      return errorResponse('Ritual type is required', 400);
    }

    const ritualPrompts = {
      kickoff: 'Generate a kickoff meeting agenda and prompts for a team',
      pulse_check: 'Generate pulse check meeting prompts for a team',
      rr: 'Generate retrospective and planning meeting prompts for a team'
    };

    const prompt = `As a team facilitator, create ${ritualPrompts[ritual_type as keyof typeof ritualPrompts]}:

${team_context ? `Team Context: ${team_context}` : ''}

Please provide:
1. A structured agenda with 5-7 items
2. 3-5 engaging prompts to facilitate discussion

Format your response as JSON with "agenda" and "prompts" fields.`;

    const aiResponse = await callOpenAI(prompt, env);
    
    try {
      const parsed = JSON.parse(aiResponse);
      console.log('handleGenerateRitualPrompts: Successfully parsed AI response');
      const response: GenerateRitualPromptsResponse = {
        agenda: parsed.agenda || ['Welcome and introductions', 'Review objectives', 'Open discussion', 'Action items', 'Next steps'],
        prompts: parsed.prompts || ['What went well this week?', 'What challenges did we face?', 'How can we improve?']
      };
      return jsonResponse(response);
    } catch (parseError) {
      console.log('handleGenerateRitualPrompts: Failed to parse AI response, using fallback');
      // Fallback if AI response isn't valid JSON
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