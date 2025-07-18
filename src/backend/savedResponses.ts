import { nanoid } from 'nanoid';
import { logAIUsage } from './utils';

export interface SaveResponseParams {
  user_id: string;
  team_id?: string;
  tool_name: string;
  summary: string;
  response_blob: string;
  system_prompt?: string;
  user_input?: string;
  final_prompt?: string;
  raw_response_text?: string;
}

export interface SavedResponse {
  id: string;
  user_id: string;
  team_id?: string;
  tool_name: string;
  summary: string;
  response_blob: string;
  system_prompt?: string;
  user_input?: string;
  final_prompt?: string;
  raw_response_text?: string;
  is_favorite: boolean;
  is_shared_public: boolean;
  shared_slug?: string;
  is_shared_team: boolean;
  created_at: string;
  updated_at?: string; // Optional for backward compatibility
}

// Generate a unique shared slug
const generateSharedSlug = (): string => {
  return nanoid(10); // 10 character slug
};

// Save a new response
export const saveResponse = async (env: any, params: SaveResponseParams): Promise<{ success: boolean; message: string; data?: SavedResponse }> => {
  try {
    const { user_id, team_id, tool_name, summary, response_blob } = params;
    
    // Validate required fields
    if (!user_id || !tool_name || !summary || !response_blob) {
      return { success: false, message: 'Missing required fields' };
    }
    
    if (summary.length > 140) {
      return { success: false, message: 'Summary must be 140 characters or less' };
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Insert the response
    const result = await env.DB.prepare(`
      INSERT INTO ai_saved_responses (
        id, user_id, team_id, tool_name, summary, response_blob, 
        system_prompt, user_input, final_prompt, raw_response_text,
        is_favorite, is_shared_public, is_shared_team, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)
    `).bind(
      id, user_id, team_id || null, tool_name, summary, response_blob,
      params.system_prompt || null, params.user_input || null, params.final_prompt || null, params.raw_response_text || null,
      now, now
    ).run();

    if (result.success) {
      // Log the action
      await logAIUsage(env.DB, user_id, 'save_response');
      
      // Return the created record
      const savedRecord = await env.DB.prepare(`
        SELECT * FROM ai_saved_responses WHERE id = ?
      `).bind(id).first();
      
      // Convert numeric boolean values to actual booleans
      const processedRecord = savedRecord ? {
        ...savedRecord,
        is_favorite: Boolean(savedRecord.is_favorite),
        is_shared_public: Boolean(savedRecord.is_shared_public),
        is_shared_team: Boolean(savedRecord.is_shared_team)
      } : null;
      
      return { 
        success: true, 
        message: 'Response saved successfully',
        data: processedRecord as SavedResponse
      };
    } else {
      return { success: false, message: 'Failed to save response' };
    }
  } catch (error) {
    console.error('Error saving response:', error);
    return { success: false, message: 'Internal server error' };
  }
};

// Toggle favorite status
export const toggleFavorite = async (env: any, responseId: string, userId: string, isFavorite: boolean): Promise<{ success: boolean; message: string; data?: SavedResponse }> => {
  try {
    // First check if the response exists and belongs to the user
    const existing = await env.DB.prepare(`
      SELECT * FROM ai_saved_responses WHERE id = ? AND user_id = ?
    `).bind(responseId, userId).first();

    if (!existing) {
      return { success: false, message: 'Response not found or access denied' };
    }

    const now = new Date().toISOString();
    let sharedSlug = existing.shared_slug;

    // Generate slug if favoriting and no slug exists
    if (isFavorite && !existing.shared_slug) {
      sharedSlug = generateSharedSlug();
      
      // Ensure slug is unique
      let attempts = 0;
      while (attempts < 10) {
        const existingSlug = await env.DB.prepare(`
          SELECT id FROM ai_saved_responses WHERE shared_slug = ?
        `).bind(sharedSlug).first();
        
        if (!existingSlug) break;
        sharedSlug = generateSharedSlug();
        attempts++;
      }
    }

    // Update the favorite status and slug
    const result = await env.DB.prepare(`
      UPDATE ai_saved_responses 
      SET is_favorite = ?, shared_slug = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(isFavorite ? 1 : 0, sharedSlug, now, responseId, userId).run();

    if (result.success) {
      // Log the action
      await logAIUsage(env.DB, userId, 'toggle_favorite');
      
      // Return the updated record
      const updatedRecord = await env.DB.prepare(`
        SELECT * FROM ai_saved_responses WHERE id = ?
      `).bind(responseId).first();
      
      // Convert numeric boolean values to actual booleans
      const processedRecord = updatedRecord ? {
        ...updatedRecord,
        is_favorite: Boolean(updatedRecord.is_favorite),
        is_shared_public: Boolean(updatedRecord.is_shared_public),
        is_shared_team: Boolean(updatedRecord.is_shared_team)
      } : null;
      
      return { 
        success: true, 
        message: isFavorite ? 'Added to favorites' : 'Removed from favorites',
        data: processedRecord as SavedResponse
      };
    } else {
      return { success: false, message: 'Failed to update favorite status' };
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return { success: false, message: 'Internal server error' };
  }
};

// Set share status
export const setShareStatus = async (env: any, responseId: string, userId: string, isSharedPublic: boolean, isSharedTeam: boolean, teamId?: string): Promise<{ success: boolean; message: string; data?: SavedResponse }> => {
  try {
    // First check if the response exists and belongs to the user
    const existing = await env.DB.prepare(`
      SELECT * FROM ai_saved_responses WHERE id = ? AND user_id = ?
    `).bind(responseId, userId).first();

    if (!existing) {
      return { success: false, message: 'Response not found or access denied' };
    }

    // Validate team sharing
    if (isSharedTeam && !teamId) {
      return { success: false, message: 'Team ID required for team sharing' };
    }

    const now = new Date().toISOString();
    let sharedSlug = null;

    // Generate slug if making public OR team shared OR favorited (for dashboard links)
    if (isSharedPublic || isSharedTeam || existing.is_favorite) {
      // If there's already a slug, keep it
      if (existing.shared_slug) {
        sharedSlug = existing.shared_slug;
      } else {
        sharedSlug = generateSharedSlug();
        
        // Ensure slug is unique
        let attempts = 0;
        while (attempts < 10) {
          const existingSlug = await env.DB.prepare(`
            SELECT id FROM ai_saved_responses WHERE shared_slug = ?
          `).bind(sharedSlug).first();
          
          if (!existingSlug) break;
          sharedSlug = generateSharedSlug();
          attempts++;
        }
      }
    }

    // Update the share status
    const result = await env.DB.prepare(`
      UPDATE ai_saved_responses 
      SET is_shared_public = ?, is_shared_team = ?, shared_slug = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(
      isSharedPublic ? 1 : 0, 
      isSharedTeam ? 1 : 0, 
      sharedSlug, 
      now, 
      responseId, 
      userId
    ).run();

    if (result.success) {
      // Log the action
      await logAIUsage(env.DB, userId, 'set_share_status');
      
      // Return the updated record
      const updatedRecord = await env.DB.prepare(`
        SELECT * FROM ai_saved_responses WHERE id = ?
      `).bind(responseId).first();
      
      // Convert numeric boolean values to actual booleans
      const processedRecord = updatedRecord ? {
        ...updatedRecord,
        is_favorite: Boolean(updatedRecord.is_favorite),
        is_shared_public: Boolean(updatedRecord.is_shared_public),
        is_shared_team: Boolean(updatedRecord.is_shared_team)
      } : null;
      
      return { 
        success: true, 
        message: 'Share status updated successfully',
        data: processedRecord as SavedResponse
      };
    } else {
      return { success: false, message: 'Failed to update share status' };
    }
  } catch (error) {
    console.error('Error setting share status:', error);
    return { success: false, message: 'Internal server error' };
  }
};

// Get user's saved responses
export const getUserHistory = async (env: any, userId: string): Promise<{ success: boolean; message: string; data?: SavedResponse[] }> => {
  try {
    const responses = await env.DB.prepare(`
      SELECT * FROM ai_saved_responses 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(userId).all();

    // Convert numeric boolean values to actual booleans
    const processedResults = responses.results.map((row: any) => ({
      ...row,
      is_favorite: Boolean(row.is_favorite),
      is_shared_public: Boolean(row.is_shared_public),
      is_shared_team: Boolean(row.is_shared_team)
    }));

    return { 
      success: true, 
      message: 'User history retrieved successfully',
      data: processedResults as SavedResponse[]
    };
  } catch (error) {
    console.error('Error getting user history:', error);
    return { success: false, message: 'Internal server error' };
  }
};

// Get team shared responses (original function for backward compatibility)
export const getTeamSharedHistory = async (env: any, teamId: string): Promise<{ success: boolean; message: string; data?: SavedResponse[] }> => {
  try {
    const responses = await env.DB.prepare(`
      SELECT * FROM ai_saved_responses 
      WHERE team_id = ? AND is_shared_team = 1
      ORDER BY created_at DESC
    `).bind(teamId).all();

    // Convert numeric boolean values to actual booleans
    const processedResults = responses.results.map((row: any) => ({
      ...row,
      is_favorite: Boolean(row.is_favorite),
      is_shared_public: Boolean(row.is_shared_public),
      is_shared_team: Boolean(row.is_shared_team)
    }));

    return { 
      success: true, 
      message: 'Team shared history retrieved successfully',
      data: processedResults as SavedResponse[]
    };
  } catch (error) {
    console.error('Error getting team shared history:', error);
    return { success: false, message: 'Internal server error' };
  }
};

// Get team shared responses with enhanced filtering and pagination
export const getTeamSharedHistoryEnhanced = async (
  env: any, 
  teamId: string, 
  options: {
    tool_name?: string;
    date_from?: string;
    date_to?: string;
    favorites_only?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ success: boolean; message: string; data?: (SavedResponse & { user_name?: string; user_email?: string })[]; total?: number }> => {
  try {
    const {
      tool_name,
      date_from,
      date_to,
      favorites_only = false,
      search,
      limit = 20,
      offset = 0
    } = options;

    // Build the WHERE clause dynamically
    let whereConditions = ['r.team_id = ?', 'r.is_shared_team = 1'];
    let params: any[] = [teamId];

    if (tool_name) {
      whereConditions.push('r.tool_name = ?');
      params.push(tool_name);
    }

    if (date_from) {
      whereConditions.push('r.created_at >= ?');
      params.push(date_from);
    }

    if (date_to) {
      whereConditions.push('r.created_at <= ?');
      params.push(date_to);
    }

    if (favorites_only) {
      whereConditions.push('r.is_favorite = 1');
    }

    if (search) {
      whereConditions.push('(r.summary LIKE ? OR r.tool_name LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM ai_saved_responses r WHERE ${whereClause}`;
    const countResult = await env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;

    // Get paginated results with user information
    const dataQuery = `
      SELECT r.*, u.name as user_name, u.email as user_email
      FROM ai_saved_responses r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const responses = await env.DB.prepare(dataQuery)
      .bind(...params, limit, offset)
      .all();

    // Convert numeric boolean values to actual booleans
    const processedResults = responses.results.map((row: any) => ({
      ...row,
      is_favorite: Boolean(row.is_favorite),
      is_shared_public: Boolean(row.is_shared_public),
      is_shared_team: Boolean(row.is_shared_team)
    }));

    return { 
      success: true, 
      message: 'Team shared history retrieved successfully',
      data: processedResults as (SavedResponse & { user_name?: string; user_email?: string })[],
      total
    };
  } catch (error) {
    console.error('Error getting team shared history:', error);
    return { success: false, message: 'Internal server error' };
  }
};

// Get available tool names for filtering
export const getAvailableToolNames = async (env: any, teamId: string): Promise<{ success: boolean; message: string; data?: string[] }> => {
  try {
    const result = await env.DB.prepare(`
      SELECT DISTINCT tool_name 
      FROM ai_saved_responses 
      WHERE team_id = ? AND is_shared_team = 1
      ORDER BY tool_name
    `).bind(teamId).all();

    const toolNames = result.results.map((row: any) => row.tool_name);
    
    return { 
      success: true, 
      message: 'Tool names retrieved successfully',
      data: toolNames
    };
  } catch (error) {
    console.error('Error getting tool names:', error);
    return { success: false, message: 'Internal server error' };
  }
};

// Get public shared response by slug
export const getPublicShared = async (env: any, sharedSlug: string): Promise<{ success: boolean; message: string; data?: SavedResponse }> => {
  try {
    const response = await env.DB.prepare(`
      SELECT * FROM ai_saved_responses 
      WHERE shared_slug = ? AND is_shared_public = 1
    `).bind(sharedSlug).first();

    if (!response) {
      return { success: false, message: 'Shared response not found' };
    }

    // Convert numeric boolean values to actual booleans
    const processedResponse = {
      ...response,
      is_favorite: Boolean(response.is_favorite),
      is_shared_public: Boolean(response.is_shared_public),
      is_shared_team: Boolean(response.is_shared_team)
    };

    return { 
      success: true, 
      message: 'Public shared response retrieved successfully',
      data: processedResponse as SavedResponse
    };
  } catch (error) {
    console.error('Error getting public shared response:', error);
    return { success: false, message: 'Internal server error' };
  }
};

// Get team shared response by slug (for team members)
export const getTeamSharedBySlug = async (env: any, sharedSlug: string, teamId: string): Promise<{ success: boolean; message: string; data?: SavedResponse }> => {
  try {
    const response = await env.DB.prepare(`
      SELECT * FROM ai_saved_responses 
      WHERE shared_slug = ? AND team_id = ? AND (is_shared_team = 1 OR is_favorite = 1)
    `).bind(sharedSlug, teamId).first();

    if (!response) {
      return { success: false, message: 'Team shared response not found' };
    }

    // Convert numeric boolean values to actual booleans
    const processedResponse = {
      ...response,
      is_favorite: Boolean(response.is_favorite),
      is_shared_public: Boolean(response.is_shared_public),
      is_shared_team: Boolean(response.is_shared_team)
    };

    return { 
      success: true, 
      message: 'Team shared response retrieved successfully',
      data: processedResponse as SavedResponse
    };
  } catch (error) {
    console.error('Error getting team shared response:', error);
    return { success: false, message: 'Internal server error' };
  }
}; 