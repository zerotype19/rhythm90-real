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

// Get system prompt by tool name
export async function getSystemPrompt(db: any, toolName: string): Promise<string | null> {
  try {
    const result = await db.prepare(
      'SELECT prompt_text FROM ai_system_prompts WHERE tool_name = ?'
    ).bind(toolName).first();
    
    return result ? result.prompt_text : null;
  } catch (error) {
    console.error('Error getting system prompt:', error);
    return null;
  }
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
  
  return replacePlaceholders(promptRow, formData);
}

// Get all system prompts (admin only)
export async function handleGetSystemPrompts(request: Request, env: Env): Promise<Response> {
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const prompts = await env.DB.prepare(
      'SELECT id, tool_name, prompt_text, updated_at FROM ai_system_prompts ORDER BY tool_name'
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
    const { id, prompt_text } = body;

    if (!id || !prompt_text) {
      return errorResponse('ID and prompt_text are required', 400);
    }

    // Update the prompt
    const result = await env.DB.prepare(
      'UPDATE ai_system_prompts SET prompt_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(prompt_text, id).run();

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
    
    while ((match = placeholderRegex.exec(prompt)) !== null) {
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