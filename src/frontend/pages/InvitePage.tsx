import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { apiClient } from '../lib/api';

interface Team {
  id: string;
  name: string;
  industry: string;
  team_description: string;
}

const InvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('code');
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();
  const { user, refreshSession } = useAuth();

  useEffect(() => {
    if (!inviteCode) {
      setError('Invalid invite link');
      setLoading(false);
      return;
    }

    // Check if user is already authenticated
    if (user) {
      // User is logged in, try to join the team directly
      handleJoinTeam();
    } else {
      // User is not logged in, get team info and show login/signup
      fetchTeamInfo();
    }
  }, [inviteCode, user]);

  const fetchTeamInfo = async () => {
    try {
      const response = await apiClient.get(`/api/invite/${inviteCode}`);
      if (response.valid) {
        setTeam(response.team);
      } else {
        setError('Invalid or expired invite link');
      }
    } catch (err) {
      setError('Failed to load invite information');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!inviteCode || !user) return;

    setIsJoining(true);
    try {
      await apiClient.post('/api/teams/join', { invite_code: inviteCode });
      await refreshSession(); // Refresh to get updated team list
      navigate('/app/dashboard');
    } catch (err: any) {
      if (err.message?.includes('already a member')) {
        // User is already a member, redirect to dashboard
        navigate('/app/dashboard');
      } else {
        setError(err.message || 'Failed to join team');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleSignIn = () => {
    // Redirect to login with return URL
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `/login?returnUrl=${returnUrl}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Invite</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!team) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="text-green-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're Invited!</h2>
          <p className="text-gray-600">Join the team on Rhythm90</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-2">{team.name}</h3>
          <p className="text-sm text-gray-600 mb-2">Industry: {team.industry}</p>
          {team.team_description && (
            <p className="text-sm text-gray-600">{team.team_description}</p>
          )}
        </div>

        {user ? (
          // User is logged in, show join button
          <div className="space-y-4">
            <p className="text-center text-gray-600">
              Welcome back, {user.name}! Click below to join the team.
            </p>
            <button
              onClick={handleJoinTeam}
              disabled={isJoining}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? 'Joining...' : 'Join Team'}
            </button>
          </div>
        ) : (
          // User is not logged in, show sign in button
          <div className="space-y-4">
            <p className="text-center text-gray-600">
              Sign in with your Google account to join the team.
            </p>
            <button
              onClick={handleSignIn}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition-colors"
            >
              Sign In with Google
            </button>
            <p className="text-xs text-center text-gray-500">
              Don't have an account? Sign in to create one automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitePage; 