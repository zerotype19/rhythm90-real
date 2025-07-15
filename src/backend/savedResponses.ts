import { nanoid } from 'nanoid';
import { logAIUsage } from './utils';

export interface SaveResponseParams {
  user_id: string;
  team_id?: string;
  tool_name: string;
  summary: string;
  response_blob: string;
}

export interface SavedResponse {
  id: string;
  user_id: string;
  team_id?: string;
  tool_name: string;
  summary: string;
  response_blob: string;
  is_favorite: boolean;
  is_shared_public: boolean;
  shared_slug?: string;
  is_shared_team: boolean;
  created_at: string;
  updated_at: string;
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
        is_favorite, is_shared_public, is_shared_team, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)
    `).bind(id, user_id, team_id || null, tool_name, summary, response_blob, now, now).run();

    if (result.success) {
      // Log the action
      await logAIUsage(env, user_id, 'save_response', { tool_name, summary });
      
      // Return the created record
      const savedRecord = await env.DB.prepare(`
        SELECT * FROM ai_saved_responses WHERE id = ?
      `).bind(id).first();
      
      return { 
        success: true, 
        message: 'Response saved successfully',
        data: savedRecord as SavedResponse
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

    // Update the favorite status
    const result = await env.DB.prepare(`
      UPDATE ai_saved_responses 
      SET is_favorite = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).bind(isFavorite ? 1 : 0, now, responseId, userId).run();

    if (result.success) {
      // Log the action
      await logAIUsage(env, userId, 'toggle_favorite', { 
        tool_name: existing.tool_name, 
        is_favorite: isFavorite 
      });
      
      // Return the updated record
      const updatedRecord = await env.DB.prepare(`
        SELECT * FROM ai_saved_responses WHERE id = ?
      `).bind(responseId).first();
      
      return { 
        success: true, 
        message: isFavorite ? 'Added to favorites' : 'Removed from favorites',
        data: updatedRecord as SavedResponse
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

    // Generate slug if making public
    if (isSharedPublic) {
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
      await logAIUsage(env, userId, 'set_share_status', { 
        tool_name: existing.tool_name, 
        is_shared_public: isSharedPublic,
        is_shared_team: isSharedTeam,
        shared_slug: sharedSlug
      });
      
      // Return the updated record
      const updatedRecord = await env.DB.prepare(`
        SELECT * FROM ai_saved_responses WHERE id = ?
      `).bind(responseId).first();
      
      return { 
        success: true, 
        message: 'Share status updated successfully',
        data: updatedRecord as SavedResponse
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

    return { 
      success: true, 
      message: 'User history retrieved successfully',
      data: responses.results as SavedResponse[]
    };
  } catch (error) {
    console.error('Error getting user history:', error);
    return { success: false, message: 'Internal server error' };
  }
};

// Get team shared responses
export const getTeamSharedHistory = async (env: any, teamId: string): Promise<{ success: boolean; message: string; data?: SavedResponse[] }> => {
  try {
    const responses = await env.DB.prepare(`
      SELECT * FROM ai_saved_responses 
      WHERE team_id = ? AND is_shared_team = 1
      ORDER BY created_at DESC
    `).bind(teamId).all();

    return { 
      success: true, 
      message: 'Team shared history retrieved successfully',
      data: responses.results as SavedResponse[]
    };
  } catch (error) {
    console.error('Error getting team shared history:', error);
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

    return { 
      success: true, 
      message: 'Public shared response retrieved successfully',
      data: response as SavedResponse
    };
  } catch (error) {
    console.error('Error getting public shared response:', error);
    return { success: false, message: 'Internal server error' };
  }
}; 