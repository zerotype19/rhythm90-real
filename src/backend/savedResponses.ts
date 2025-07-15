import { Env } from './types';
import { logAIUsage } from './utils';

export interface SaveResponseInput {
  user_id: string;
  team_id?: string;
  tool_name: string;
  summary: string;
  response_blob: string;
}

export async function saveResponse(db: any, input: SaveResponseInput) {
  const id = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO ai_saved_responses (id, user_id, team_id, tool_name, summary, response_blob)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, input.user_id, input.team_id || null, input.tool_name, input.summary, input.response_blob).run();
  await logAIUsage(db, input.user_id, input.tool_name, 'save');
  return id;
}

export async function toggleFavorite(db: any, user_id: string, response_id: string, is_favorite: boolean) {
  await db.prepare(`
    UPDATE ai_saved_responses SET is_favorite = ? WHERE id = ? AND user_id = ?
  `).bind(is_favorite ? 1 : 0, response_id, user_id).run();
  await logAIUsage(db, user_id, 'favorite', is_favorite ? 'favorite' : 'unfavorite');
}

export async function setShareStatus(db: any, user_id: string, response_id: string, is_shared_public: boolean, is_shared_team: boolean) {
  let shared_slug: string | null = null;
  if (is_shared_public) {
    shared_slug = crypto.randomUUID().slice(0, 8);
    // Ensure uniqueness
    let exists = await db.prepare('SELECT 1 FROM ai_saved_responses WHERE shared_slug = ?').bind(shared_slug).first();
    while (exists) {
      shared_slug = crypto.randomUUID().slice(0, 8);
      exists = await db.prepare('SELECT 1 FROM ai_saved_responses WHERE shared_slug = ?').bind(shared_slug).first();
    }
  }
  await db.prepare(`
    UPDATE ai_saved_responses SET is_shared_public = ?, is_shared_team = ?, shared_slug = CASE WHEN ? THEN ? ELSE NULL END
    WHERE id = ? AND user_id = ?
  `).bind(is_shared_public ? 1 : 0, is_shared_team ? 1 : 0, is_shared_public ? 1 : 0, shared_slug, response_id, user_id).run();
  await logAIUsage(db, user_id, 'share', is_shared_public ? 'share_public' : (is_shared_team ? 'share_team' : 'unshare'));
  return shared_slug;
}

export async function getUserHistory(db: any, user_id: string) {
  return await db.prepare(`
    SELECT * FROM ai_saved_responses WHERE user_id = ? ORDER BY created_at DESC
  `).bind(user_id).all();
}

export async function getTeamSharedHistory(db: any, team_id: string) {
  return await db.prepare(`
    SELECT * FROM ai_saved_responses WHERE team_id = ? AND is_shared_team = 1 ORDER BY created_at DESC
  `).bind(team_id).all();
}

export async function getSharedPublic(db: any, shared_slug: string) {
  return await db.prepare(`
    SELECT * FROM ai_saved_responses WHERE shared_slug = ? AND is_shared_public = 1
  `).bind(shared_slug).first();
} 