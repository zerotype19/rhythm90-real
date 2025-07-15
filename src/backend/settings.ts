import { Env } from './types';
import { verifyAuth } from './auth';
import { jsonResponse, errorResponse } from './utils';

// Debug logging for settings calls
let lastSettingsDebugLog: any = null;

export function getLastSettingsDebugLog() {
  return lastSettingsDebugLog;
}

// Account Settings
export async function handleGetAccountSettings(request: Request, env: Env) {
  console.log('handleGetAccountSettings: Starting');
  
  const user = await verifyAuth(request, env);
  if (!user) {
    console.log('handleGetAccountSettings: Unauthorized');
    return errorResponse('Unauthorized', 401);
  }

  try {
    console.log('handleGetAccountSettings: Fetching user profile for user_id:', user.id);
    
    const userProfile = await env.DB.prepare(`
      SELECT id, name, email, created_at
      FROM users 
      WHERE id = ?
    `).bind(user.id).first();

    if (!userProfile) {
      console.log('handleGetAccountSettings: User profile not found');
      return errorResponse('User profile not found', 404);
    }

    const result = {
      id: userProfile.id,
      name: userProfile.name,
      email: userProfile.email,
      created_at: userProfile.created_at
    };

    console.log('handleGetAccountSettings: Success - returning user profile');
    lastSettingsDebugLog = {
      endpoint: '/api/settings/account',
      method: 'GET',
      user_id: user.id,
      result: result,
      timestamp: new Date().toISOString()
    };

    return jsonResponse(result);
  } catch (error) {
    console.error('handleGetAccountSettings: Error:', error);
    return errorResponse('Failed to fetch account settings', 500);
  }
}

export async function handleUpdateAccountSettings(request: Request, env: Env) {
  console.log('handleUpdateAccountSettings: Starting');
  
  const user = await verifyAuth(request, env);
  if (!user) {
    console.log('handleUpdateAccountSettings: Unauthorized');
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    console.log('handleUpdateAccountSettings: Request body:', JSON.stringify(body, null, 2));

    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      console.log('handleUpdateAccountSettings: Invalid name provided');
      return errorResponse('Name is required and must be a non-empty string', 400);
    }

    console.log('handleUpdateAccountSettings: Updating user profile for user_id:', user.id);
    
    const result = await env.DB.prepare(`
      UPDATE users 
      SET name = ? 
      WHERE id = ?
    `).bind(name.trim(), user.id).run();

    if (result.changes === 0) {
      console.log('handleUpdateAccountSettings: No user found to update');
      return errorResponse('User not found', 404);
    }

    console.log('handleUpdateAccountSettings: Success - user profile updated');
    lastSettingsDebugLog = {
      endpoint: '/api/settings/account',
      method: 'POST',
      user_id: user.id,
      input: body,
      result: { success: true, changes: result.changes },
      timestamp: new Date().toISOString()
    };

    return jsonResponse({ success: true, message: 'Account settings updated successfully' });
  } catch (error) {
    console.error('handleUpdateAccountSettings: Error:', error);
    return errorResponse('Failed to update account settings', 500);
  }
}

// Team Settings
export async function handleGetTeamSettings(request: Request, env: Env) {
  console.log('handleGetTeamSettings: Starting');
  
  const user = await verifyAuth(request, env);
  if (!user) {
    console.log('handleGetTeamSettings: Unauthorized');
    return errorResponse('Unauthorized', 401);
  }

  try {
    console.log('handleGetTeamSettings: Fetching team info for user_id:', user.id);
    
    // Get user's team membership
    const teamMember = await env.DB.prepare(`
      SELECT tm.team_id, tm.role, t.name as team_name, t.industry, t.created_at
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = ?
      LIMIT 1
    `).bind(user.id).first();

    if (!teamMember) {
      console.log('handleGetTeamSettings: User not part of any team');
      return errorResponse('User must belong to a team', 400);
    }

    // Get all team members
    const teamMembers = await env.DB.prepare(`
      SELECT tm.id, tm.user_id, tm.role, tm.joined_at, u.name, u.email
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
      ORDER BY tm.joined_at ASC
    `).bind(teamMember.team_id).all();

    const result = {
      team: {
        id: teamMember.team_id,
        name: teamMember.team_name,
        industry: teamMember.industry,
        created_at: teamMember.created_at
      },
      user_role: teamMember.role,
      members: teamMembers.results.map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        name: member.name,
        email: member.email,
        role: member.role,
        joined_at: member.joined_at
      }))
    };

    console.log('handleGetTeamSettings: Success - returning team info');
    lastSettingsDebugLog = {
      endpoint: '/api/settings/team',
      method: 'GET',
      user_id: user.id,
      team_id: teamMember.team_id,
      result: result,
      timestamp: new Date().toISOString()
    };

    return jsonResponse(result);
  } catch (error) {
    console.error('handleGetTeamSettings: Error:', error);
    return errorResponse('Failed to fetch team settings', 500);
  }
}

export async function handleUpdateTeamName(request: Request, env: Env) {
  console.log('handleUpdateTeamName: Starting');
  
  const user = await verifyAuth(request, env);
  if (!user) {
    console.log('handleUpdateTeamName: Unauthorized');
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    console.log('handleUpdateTeamName: Request body:', JSON.stringify(body, null, 2));

    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      console.log('handleUpdateTeamName: Invalid name provided');
      return errorResponse('Team name is required and must be a non-empty string', 400);
    }

    // Check if user is team owner
    const teamMember = await env.DB.prepare(`
      SELECT tm.team_id, tm.role
      FROM team_members tm
      WHERE tm.user_id = ?
      LIMIT 1
    `).bind(user.id).first();

    if (!teamMember) {
      console.log('handleUpdateTeamName: User not part of any team');
      return errorResponse('User must belong to a team', 400);
    }

    if (teamMember.role !== 'owner') {
      console.log('handleUpdateTeamName: User is not team owner');
      return errorResponse('Only team owners can update team name', 403);
    }

    console.log('handleUpdateTeamName: Updating team name for team_id:', teamMember.team_id);
    
    const result = await env.DB.prepare(`
      UPDATE teams 
      SET name = ? 
      WHERE id = ?
    `).bind(name.trim(), teamMember.team_id).run();

    if (result.changes === 0) {
      console.log('handleUpdateTeamName: No team found to update');
      return errorResponse('Team not found', 404);
    }

    console.log('handleUpdateTeamName: Success - team name updated');
    lastSettingsDebugLog = {
      endpoint: '/api/settings/team',
      method: 'POST',
      user_id: user.id,
      team_id: teamMember.team_id,
      input: body,
      result: { success: true, changes: result.changes },
      timestamp: new Date().toISOString()
    };

    return jsonResponse({ success: true, message: 'Team name updated successfully' });
  } catch (error) {
    console.error('handleUpdateTeamName: Error:', error);
    return errorResponse('Failed to update team name', 500);
  }
}

export async function handleInviteTeamMember(request: Request, env: Env) {
  console.log('handleInviteTeamMember: Starting');
  
  const user = await verifyAuth(request, env);
  if (!user) {
    console.log('handleInviteTeamMember: Unauthorized');
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    console.log('handleInviteTeamMember: Request body:', JSON.stringify(body, null, 2));

    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.log('handleInviteTeamMember: Invalid email provided');
      return errorResponse('Valid email is required', 400);
    }

    // Check if user is team owner
    const teamMember = await env.DB.prepare(`
      SELECT tm.team_id, tm.role, t.name as team_name
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = ?
      LIMIT 1
    `).bind(user.id).first();

    if (!teamMember) {
      console.log('handleInviteTeamMember: User not part of any team');
      return errorResponse('User must belong to a team', 400);
    }

    if (teamMember.role !== 'owner') {
      console.log('handleInviteTeamMember: User is not team owner');
      return errorResponse('Only team owners can invite members', 403);
    }

    // Check if user already exists
    const existingUser = await env.DB.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(email).first();

    if (existingUser) {
      // Check if user is already a member of this team
      const existingMember = await env.DB.prepare(`
        SELECT id FROM team_members 
        WHERE user_id = ? AND team_id = ?
      `).bind(existingUser.id, teamMember.team_id).first();

      if (existingMember) {
        console.log('handleInviteTeamMember: User already a member of this team');
        return errorResponse('User is already a member of this team', 400);
      }
    }

    // For now, we'll just return a success message
    // In a real implementation, you'd send an email invitation
    console.log('handleInviteTeamMember: Success - invitation would be sent to:', email);
    lastSettingsDebugLog = {
      endpoint: '/api/settings/team/invite',
      method: 'POST',
      user_id: user.id,
      team_id: teamMember.team_id,
      input: body,
      result: { 
        success: true, 
        message: 'Invitation sent successfully',
        invite_link: `${env.APP_URL}/join?team=${teamMember.team_id}&email=${encodeURIComponent(email)}`
      },
      timestamp: new Date().toISOString()
    };

    return jsonResponse({ 
      success: true, 
      message: 'Invitation sent successfully',
      invite_link: `${env.APP_URL}/join?team=${teamMember.team_id}&email=${encodeURIComponent(email)}`
    });
  } catch (error) {
    console.error('handleInviteTeamMember: Error:', error);
    return errorResponse('Failed to send invitation', 500);
  }
}

export async function handleRemoveTeamMember(request: Request, env: Env) {
  console.log('handleRemoveTeamMember: Starting');
  
  const user = await verifyAuth(request, env);
  if (!user) {
    console.log('handleRemoveTeamMember: Unauthorized');
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    console.log('handleRemoveTeamMember: Request body:', JSON.stringify(body, null, 2));

    const { member_id } = body;

    if (!member_id || typeof member_id !== 'string') {
      console.log('handleRemoveTeamMember: Invalid member_id provided');
      return errorResponse('Member ID is required', 400);
    }

    // Check if user is team owner
    const teamMember = await env.DB.prepare(`
      SELECT tm.team_id, tm.role
      FROM team_members tm
      WHERE tm.user_id = ?
      LIMIT 1
    `).bind(user.id).first();

    if (!teamMember) {
      console.log('handleRemoveTeamMember: User not part of any team');
      return errorResponse('User must belong to a team', 400);
    }

    if (teamMember.role !== 'owner') {
      console.log('handleRemoveTeamMember: User is not team owner');
      return errorResponse('Only team owners can remove members', 403);
    }

    // Check if member exists and belongs to the same team
    const memberToRemove = await env.DB.prepare(`
      SELECT tm.id, tm.user_id, tm.role, u.name
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.id = ? AND tm.team_id = ?
    `).bind(member_id, teamMember.team_id).first();

    if (!memberToRemove) {
      console.log('handleRemoveTeamMember: Member not found or not in same team');
      return errorResponse('Member not found', 404);
    }

    if (memberToRemove.role === 'owner') {
      console.log('handleRemoveTeamMember: Cannot remove team owner');
      return errorResponse('Cannot remove team owner', 400);
    }

    console.log('handleRemoveTeamMember: Removing member:', memberToRemove.name);
    
    const result = await env.DB.prepare(`
      DELETE FROM team_members 
      WHERE id = ?
    `).bind(member_id).run();

    if (result.changes === 0) {
      console.log('handleRemoveTeamMember: No member found to remove');
      return errorResponse('Member not found', 404);
    }

    console.log('handleRemoveTeamMember: Success - member removed');
    lastSettingsDebugLog = {
      endpoint: '/api/settings/team/remove',
      method: 'POST',
      user_id: user.id,
      team_id: teamMember.team_id,
      input: body,
      result: { success: true, changes: result.changes },
      timestamp: new Date().toISOString()
    };

    return jsonResponse({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error('handleRemoveTeamMember: Error:', error);
    return errorResponse('Failed to remove member', 500);
  }
}

export async function handleSetMemberRole(request: Request, env: Env) {
  console.log('handleSetMemberRole: Starting');
  
  const user = await verifyAuth(request, env);
  if (!user) {
    console.log('handleSetMemberRole: Unauthorized');
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    console.log('handleSetMemberRole: Request body:', JSON.stringify(body, null, 2));

    const { member_id, role } = body;

    if (!member_id || typeof member_id !== 'string') {
      console.log('handleSetMemberRole: Invalid member_id provided');
      return errorResponse('Member ID is required', 400);
    }

    if (!role || !['owner', 'member'].includes(role)) {
      console.log('handleSetMemberRole: Invalid role provided');
      return errorResponse('Role must be either "owner" or "member"', 400);
    }

    // Check if user is team owner
    const teamMember = await env.DB.prepare(`
      SELECT tm.team_id, tm.role
      FROM team_members tm
      WHERE tm.user_id = ?
      LIMIT 1
    `).bind(user.id).first();

    if (!teamMember) {
      console.log('handleSetMemberRole: User not part of any team');
      return errorResponse('User must belong to a team', 400);
    }

    if (teamMember.role !== 'owner') {
      console.log('handleSetMemberRole: User is not team owner');
      return errorResponse('Only team owners can change member roles', 403);
    }

    // Check if member exists and belongs to the same team
    const memberToUpdate = await env.DB.prepare(`
      SELECT tm.id, tm.user_id, tm.role, u.name
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.id = ? AND tm.team_id = ?
    `).bind(member_id, teamMember.team_id).first();

    if (!memberToUpdate) {
      console.log('handleSetMemberRole: Member not found or not in same team');
      return errorResponse('Member not found', 404);
    }

    console.log('handleSetMemberRole: Updating role for member:', memberToUpdate.name);
    
    const result = await env.DB.prepare(`
      UPDATE team_members 
      SET role = ? 
      WHERE id = ?
    `).bind(role, member_id).run();

    if (result.changes === 0) {
      console.log('handleSetMemberRole: No member found to update');
      return errorResponse('Member not found', 404);
    }

    console.log('handleSetMemberRole: Success - member role updated');
    lastSettingsDebugLog = {
      endpoint: '/api/settings/team/set-role',
      method: 'POST',
      user_id: user.id,
      team_id: teamMember.team_id,
      input: body,
      result: { success: true, changes: result.changes },
      timestamp: new Date().toISOString()
    };

    return jsonResponse({ success: true, message: 'Member role updated successfully' });
  } catch (error) {
    console.error('handleSetMemberRole: Error:', error);
    return errorResponse('Failed to update member role', 500);
  }
}

// Billing Settings
export async function handleGetBillingInfo(request: Request, env: Env) {
  console.log('handleGetBillingInfo: Starting');
  
  const user = await verifyAuth(request, env);
  if (!user) {
    console.log('handleGetBillingInfo: Unauthorized');
    return errorResponse('Unauthorized', 401);
  }

  try {
    console.log('handleGetBillingInfo: Fetching billing info for user_id:', user.id);
    
    // Get user's team
    const teamMember = await env.DB.prepare(`
      SELECT tm.team_id
      FROM team_members tm
      WHERE tm.user_id = ?
      LIMIT 1
    `).bind(user.id).first();

    if (!teamMember) {
      console.log('handleGetBillingInfo: User not part of any team');
      return errorResponse('User must belong to a team', 400);
    }

    // Get subscription info
    const subscription = await env.DB.prepare(`
      SELECT id, plan, status, seat_count, billing_info, created_at
      FROM subscriptions 
      WHERE team_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(teamMember.team_id).first();

    const result = {
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        seat_count: subscription.seat_count,
        billing_info: subscription.billing_info,
        created_at: subscription.created_at
      } : null
    };

    console.log('handleGetBillingInfo: Success - returning billing info');
    lastSettingsDebugLog = {
      endpoint: '/api/settings/billing',
      method: 'GET',
      user_id: user.id,
      team_id: teamMember.team_id,
      result: result,
      timestamp: new Date().toISOString()
    };

    return jsonResponse(result);
  } catch (error) {
    console.error('handleGetBillingInfo: Error:', error);
    return errorResponse('Failed to fetch billing info', 500);
  }
}

export async function handleUpdateSubscription(request: Request, env: Env) {
  console.log('handleUpdateSubscription: Starting');
  
  const user = await verifyAuth(request, env);
  if (!user) {
    console.log('handleUpdateSubscription: Unauthorized');
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    console.log('handleUpdateSubscription: Request body:', JSON.stringify(body, null, 2));

    const { plan, seat_count } = body;

    if (!plan || typeof plan !== 'string' || !['free', 'pro', 'enterprise'].includes(plan)) {
      console.log('handleUpdateSubscription: Invalid plan provided');
      return errorResponse('Plan must be "free", "pro", or "enterprise"', 400);
    }

    if (seat_count && (typeof seat_count !== 'number' || seat_count < 1)) {
      console.log('handleUpdateSubscription: Invalid seat_count provided');
      return errorResponse('Seat count must be a positive number', 400);
    }

    // Check if user is team owner
    const teamMember = await env.DB.prepare(`
      SELECT tm.team_id, tm.role
      FROM team_members tm
      WHERE tm.user_id = ?
      LIMIT 1
    `).bind(user.id).first();

    if (!teamMember) {
      console.log('handleUpdateSubscription: User not part of any team');
      return errorResponse('User must belong to a team', 400);
    }

    if (teamMember.role !== 'owner') {
      console.log('handleUpdateSubscription: User is not team owner');
      return errorResponse('Only team owners can update subscription', 403);
    }

    console.log('handleUpdateSubscription: Updating subscription for team_id:', teamMember.team_id);
    
    // For now, we'll just return a success message
    // In a real implementation, you'd integrate with a payment processor
    console.log('handleUpdateSubscription: Success - subscription would be updated');
    lastSettingsDebugLog = {
      endpoint: '/api/settings/billing',
      method: 'POST',
      user_id: user.id,
      team_id: teamMember.team_id,
      input: body,
      result: { 
        success: true, 
        message: 'Subscription updated successfully',
        plan: plan,
        seat_count: seat_count || 1
      },
      timestamp: new Date().toISOString()
    };

    return jsonResponse({ 
      success: true, 
      message: 'Subscription updated successfully',
      plan: plan,
      seat_count: seat_count || 1
    });
  } catch (error) {
    console.error('handleUpdateSubscription: Error:', error);
    return errorResponse('Failed to update subscription', 500);
  }
}

export async function handleCancelSubscription(request: Request, env: Env) {
  console.log('handleCancelSubscription: Starting');
  
  const user = await verifyAuth(request, env);
  if (!user) {
    console.log('handleCancelSubscription: Unauthorized');
    return errorResponse('Unauthorized', 401);
  }

  try {
    // Check if user is team owner
    const teamMember = await env.DB.prepare(`
      SELECT tm.team_id, tm.role
      FROM team_members tm
      WHERE tm.user_id = ?
      LIMIT 1
    `).bind(user.id).first();

    if (!teamMember) {
      console.log('handleCancelSubscription: User not part of any team');
      return errorResponse('User must belong to a team', 400);
    }

    if (teamMember.role !== 'owner') {
      console.log('handleCancelSubscription: User is not team owner');
      return errorResponse('Only team owners can cancel subscription', 403);
    }

    console.log('handleCancelSubscription: Cancelling subscription for team_id:', teamMember.team_id);
    
    // For now, we'll just return a success message
    // In a real implementation, you'd integrate with a payment processor
    console.log('handleCancelSubscription: Success - subscription would be cancelled');
    lastSettingsDebugLog = {
      endpoint: '/api/settings/billing/cancel',
      method: 'POST',
      user_id: user.id,
      team_id: teamMember.team_id,
      result: { 
        success: true, 
        message: 'Subscription cancelled successfully'
      },
      timestamp: new Date().toISOString()
    };

    return jsonResponse({ 
      success: true, 
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('handleCancelSubscription: Error:', error);
    return errorResponse('Failed to cancel subscription', 500);
  }
} 