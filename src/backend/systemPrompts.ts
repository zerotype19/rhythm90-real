import { Env } from './types';
import { verifyAuth } from './auth';
import { jsonResponse, errorResponse } from './utils';

// Helper function to check if user is admin
async function verifyAdmin(request: Request, env: Env) {
  const user = await verifyAuth(request, env);
  if (!user) {
    return null;
  }
  
  if (!user.is_admin) {
    return null;
  }
  
  return user;
}

// Get system prompt by tool name (returns full prompt object)
export async function getSystemPrompt(db: any, toolName: string): Promise<any | null> {
  try {
    const result = await db.prepare(
      'SELECT id, tool_name, prompt_text, max_tokens, temperature, top_p, frequency_penalty, presence_penalty, updated_at FROM ai_system_prompts WHERE tool_name = ?'
    ).bind(toolName).first();
    
    return result;
  } catch (error) {
    console.error('Error getting system prompt:', error);
    return null;
  }
}

// Get system prompt text only (for backward compatibility)
export async function getSystemPromptText(db: any, toolName: string): Promise<string | null> {
  const prompt = await getSystemPrompt(db, toolName);
  return prompt ? prompt.prompt_text : null;
}

// Replace placeholders in prompt text with form data
export function replacePlaceholders(promptText: string, formData: Record<string, any>): string {
  let result = promptText;
  
  // Replace all placeholders with their values
  for (const [key, value] of Object.entries(formData)) {
    const placeholder = `{{${key}}}`;
    const replacement = value !== null && value !== undefined ? String(value) : '';
    result = result.replace(new RegExp(placeholder, 'g'), replacement);
  }
  
  return result;
}

// Build system prompt with placeholder replacement
export async function buildSystemPrompt(db: any, toolName: string, formData: Record<string, any>): Promise<string> {
  const promptRow = await getSystemPrompt(db, toolName);
  if (!promptRow) {
    throw new Error(`System prompt not found for tool: ${toolName}`);
  }
  
  return replacePlaceholders(promptRow.prompt_text, formData);
}

// Get all system prompts (admin only)
export async function handleGetSystemPrompts(request: Request, env: Env): Promise<Response> {
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const prompts = await env.DB.prepare(
      'SELECT id, tool_name, prompt_text, max_tokens, temperature, top_p, frequency_penalty, presence_penalty, updated_at FROM ai_system_prompts ORDER BY tool_name'
    ).all();
    
    return jsonResponse(prompts.results || []);
  } catch (error) {
    console.error('Error getting system prompts:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Update system prompt (admin only)
export async function handleUpdateSystemPrompt(request: Request, env: Env): Promise<Response> {
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    const { 
      id, 
      prompt_text, 
      max_tokens, 
      temperature, 
      top_p, 
      frequency_penalty, 
      presence_penalty 
    } = body;

    if (!id || !prompt_text) {
      return errorResponse('ID and prompt_text are required', 400);
    }

    // Validate parameter ranges
    if (max_tokens !== undefined && (max_tokens < 1 || max_tokens > 4000)) {
      return errorResponse('max_tokens must be between 1 and 4000', 400);
    }
    if (temperature !== undefined && (temperature < 0 || temperature > 1)) {
      return errorResponse('temperature must be between 0 and 1', 400);
    }
    if (top_p !== undefined && (top_p < 0 || top_p > 1)) {
      return errorResponse('top_p must be between 0 and 1', 400);
    }
    if (frequency_penalty !== undefined && (frequency_penalty < -2 || frequency_penalty > 2)) {
      return errorResponse('frequency_penalty must be between -2 and 2', 400);
    }
    if (presence_penalty !== undefined && (presence_penalty < -2 || presence_penalty > 2)) {
      return errorResponse('presence_penalty must be between -2 and 2', 400);
    }

    // Update the prompt with all parameters
    const result = await env.DB.prepare(
      `UPDATE ai_system_prompts 
       SET prompt_text = ?, 
           max_tokens = COALESCE(?, max_tokens),
           temperature = COALESCE(?, temperature),
           top_p = COALESCE(?, top_p),
           frequency_penalty = COALESCE(?, frequency_penalty),
           presence_penalty = COALESCE(?, presence_penalty),
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(prompt_text, max_tokens, temperature, top_p, frequency_penalty, presence_penalty, id).run();

    if (result.changes === 0) {
      return errorResponse('System prompt not found', 404);
    }

    // Audit log
    console.log(`[ADMIN] User ${admin.email} updated system prompt: ${id}`);

    return jsonResponse({ success: true, id });
  } catch (error) {
    console.error('Error updating system prompt:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Get available placeholders for a tool (admin helper)
export async function handleGetPlaceholders(request: Request, env: Env): Promise<Response> {
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const url = new URL(request.url);
    const toolName = url.searchParams.get('tool_name');
    
    if (!toolName) {
      return errorResponse('tool_name parameter is required', 400);
    }

    const prompt = await getSystemPrompt(env.DB, toolName);
    if (!prompt) {
      return errorResponse('System prompt not found', 404);
    }

    // Extract placeholders from the prompt text
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const placeholders = new Set<string>();
    let match;
    
    while ((match = placeholderRegex.exec(prompt.prompt_text)) !== null) {
      placeholders.add(match[1]);
    }

    return jsonResponse({
      tool_name: toolName,
      placeholders: Array.from(placeholders).sort()
    });
  } catch (error) {
    console.error('Error getting placeholders:', error);
    return errorResponse('Internal server error', 500);
  }
} 