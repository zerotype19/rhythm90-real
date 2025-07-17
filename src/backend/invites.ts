import { Env, InviteTeamMemberRequest, InviteTeamMemberResponse, GetInviteInfoResponse, Team } from './types';
import { verifyAuth } from './auth';
import { jsonResponse, errorResponse } from './utils';

// Helper function to send invite email using MailerSend HTTP API
export async function sendTeamInviteEmail(
  env: Env,
  inviteeEmail: string,
  teamName: string,
  inviteCode: string
): Promise<void> {
  // Check if MailerSend is properly configured
  if (!env.MAILERSEND_API_KEY || env.MAILERSEND_API_KEY === '') {
    throw new Error('MailerSend API key is not configured. Please add MAILERSEND_API_KEY to environment variables.');
  }

  if (!env.MAILERSEND_FROM_EMAIL || !env.MAILERSEND_FROM_NAME) {
    throw new Error('MailerSend from email/name is not configured');
  }

  const inviteLink = `https://rhythm90.io/invite?code=${inviteCode}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">You're invited to join Rhythm90!</h2>
      <p>Hi there,</p>
      <p>You've been invited to join the team <strong>${teamName}</strong> on Rhythm90.</p>
      <p>Rhythm90 is a team performance platform that helps teams work smarter together.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" 
           style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Accept Invitation & Set Up Account
        </a>
      </div>
      <p>Click the button above to accept the invitation and set up your account.</p>
      <p>If you have any questions, feel free to reach out to the team.</p>
      <p>Best regards,<br>The Rhythm90 Team</p>
    </div>
  `;
  const text = `
You're invited to join Rhythm90!

Hi there,

You've been invited to join the team ${teamName} on Rhythm90.

Rhythm90 is a team performance platform that helps teams work smarter together.

Click here to accept the invitation and set up your account:
${inviteLink}

If you have any questions, feel free to reach out to the team.

Best regards,
The Rhythm90 Team
  `;

  const payload = {
    from: {
      email: env.MAILERSEND_FROM_EMAIL,
      name: env.MAILERSEND_FROM_NAME
    },
    to: [
      {
        email: inviteeEmail
      }
    ],
    subject: `You're invited to join the Rhythm90 team ${teamName}`,
    html,
    text
  };

  console.log('Sending MailerSend email with payload:', JSON.stringify(payload, null, 2));

  const response = await fetch('https://api.mailersend.com/v1/email', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.MAILERSEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('MailerSend API error response:', errorText);
    
    // Handle trial account limitations
    if (response.status === 422) {
      const errorData = JSON.parse(errorText);
      if (errorData.message && errorData.message.includes('Trial accounts can only send emails to the administrator')) {
        throw new Error('Email service is in trial mode and can only send to verified addresses. Please contact support to upgrade the account.');
      }
    }
    
    throw new Error(`MailerSend API error: ${response.status} ${errorText}`);
  }

  console.log('MailerSend email sent successfully');
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Handle sending team member invite
export async function handleInviteTeamMember(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    // Verify authentication
    const user = await verifyAuth(request, env);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const body: InviteTeamMemberRequest = await request.json();
    const { email } = body;

    // Validate email format
    if (!email || !isValidEmail(email)) {
      return errorResponse('Please provide a valid email address', 400);
    }

    // Get team ID from URL
    const url = new URL(request.url);
    const teamId = url.pathname.split('/').pop();

    if (!teamId) {
      return errorResponse('Team ID is required', 400);
    }

    // Verify user is admin of the team
    const teamMember = await env.DB.prepare(`
      SELECT tm.*, t.name as team_name, t.invite_code 
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.team_id = ? AND tm.user_id = ? AND tm.is_admin = TRUE
    `).bind(teamId, user.id).first();

    if (!teamMember) {
      return errorResponse('You must be an admin of this team to send invites', 403);
    }

    // Send invite email
    try {
      await sendTeamInviteEmail(env, email, teamMember.team_name, teamMember.invite_code);
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
      
      // Handle trial account limitations gracefully
      if (emailError.message.includes('trial mode')) {
        // For trial accounts, we'll still return success but with a warning
        const response: InviteTeamMemberResponse = {
          success: true,
          message: `Invitation created successfully for ${email}. Note: Email delivery is limited in trial mode - please share the invite link manually: https://rhythm90.io/invite?code=${teamMember.invite_code}`,
          warning: 'Email service is in trial mode. Please upgrade to send emails automatically.'
        };
        return jsonResponse(response);
      }
      
      // Provide specific error messages for other issues
      if (emailError.message.includes('not configured')) {
        return errorResponse('Email service is not configured. Please contact support to set up the MailerSend API key.', 500);
      } else {
        return errorResponse('Failed to send invite email. Please try again later.', 500);
      }
    }

    const response: InviteTeamMemberResponse = {
      success: true,
      message: `Invitation sent successfully to ${email}`
    };

    return jsonResponse(response);
  } catch (error) {
    console.error('Invite team member error:', error);
    return errorResponse('Failed to send invitation', 500);
  }
}

// Handle getting invite information
export async function handleGetInviteInfo(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    // Get invite code from URL
    const url = new URL(request.url);
    const inviteCode = url.pathname.split('/').pop();

    if (!inviteCode) {
      return errorResponse('Invite code is required', 400);
    }

    // Look up team by invite code
    const team = await env.DB.prepare(`
      SELECT * FROM teams WHERE invite_code = ?
    `).bind(inviteCode).first();

    if (!team) {
      const response: GetInviteInfoResponse = {
        team: null as any,
        valid: false
      };
      return jsonResponse(response);
    }

    const response: GetInviteInfoResponse = {
      team: team as Team,
      valid: true
    };

    return jsonResponse(response);
  } catch (error) {
    console.error('Get invite info error:', error);
    return errorResponse('Failed to get invite information', 500);
  }
} 