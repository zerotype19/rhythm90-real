import { Env, SystemSetting, AdminUpdateModelRequest, AdminUpdateAnnouncementRequest } from './types';
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

// Get system setting by key
async function getSystemSetting(db: any, key: string): Promise<string | null> {
  try {
    const result = await db.prepare(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?'
    ).bind(key).first();
    
    return result ? result.setting_value : null;
  } catch (error) {
    console.error('Error getting system setting:', error);
    return null;
  }
}

// Update system setting
async function updateSystemSetting(db: any, key: string, value: string): Promise<boolean> {
  try {
    await db.prepare(
      'UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?'
    ).bind(value, key).run();
    
    return true;
  } catch (error) {
    console.error('Error updating system setting:', error);
    return false;
  }
}

// Get current OpenAI model
export async function getCurrentModel(db: any): Promise<string> {
  const model = await getSystemSetting(db, 'openai_model');
  return model || 'gpt-3.5-turbo'; // fallback
}

// Get current system announcement
export async function getSystemAnnouncement(db: any): Promise<string> {
  const announcement = await getSystemSetting(db, 'system_announcement');
  return announcement || '';
}

// Admin: Update OpenAI model
export async function handleUpdateModel(request: Request, env: Env) {
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body: AdminUpdateModelRequest = await request.json();
    const { model } = body;

    if (!model) {
      return errorResponse('Model is required', 400);
    }

    // Validate model name
    const validModels = ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    if (!validModels.includes(model)) {
      return errorResponse('Invalid model name', 400);
    }

    const success = await updateSystemSetting(env.DB, 'openai_model', model);
    if (!success) {
      return errorResponse('Failed to update model', 500);
    }

    // Audit log
    console.log(`[ADMIN] User ${admin.email} updated OpenAI model to: ${model}`);

    return jsonResponse({ success: true, model });
  } catch (error) {
    console.error('Error updating model:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Admin: Update system announcement
export async function handleUpdateAnnouncement(request: Request, env: Env) {
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body: AdminUpdateAnnouncementRequest = await request.json();
    const { announcement } = body;

    if (announcement === undefined) {
      return errorResponse('Announcement is required', 400);
    }

    const success = await updateSystemSetting(env.DB, 'system_announcement', announcement);
    if (!success) {
      return errorResponse('Failed to update announcement', 500);
    }

    // Audit log
    console.log(`[ADMIN] User ${admin.email} updated system announcement to: "${announcement}"`);

    return jsonResponse({ success: true, announcement });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Admin: Get current settings
export async function handleGetSettings(request: Request, env: Env) {
  const admin = await verifyAdmin(request, env);
  if (!admin) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const model = await getCurrentModel(env.DB);
    const announcement = await getSystemAnnouncement(env.DB);

    return jsonResponse({
      model,
      announcement
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    return errorResponse('Internal server error', 500);
  }
} 