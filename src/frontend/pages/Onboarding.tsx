import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { apiClient } from '../lib/api';

const Onboarding: React.FC = () => {
  const [step, setStep] = useState<'choose' | 'create' | 'join'>('choose');
  const [teamName, setTeamName] = useState('');
  const [industry, setIndustry] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, refreshSession } = useAuth();

  const industries = [
    { value: '', label: 'Select an industry' },
    { value: 'B2B', label: 'B2B' },
    { value: 'B2C', label: 'B2C' },
    { value: 'SaaS', label: 'SaaS' },
    { value: 'DTC', label: 'DTC' },
    { value: 'Agency', label: 'Agency' },
    { value: 'Other', label: 'Other' }
  ];

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }
    if (!industry) {
      setError('Please select an industry');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.createTeam(teamName, industry);
      
      if (response.error) {
        setError(response.error);
        return;
      }

      // Refresh session to get updated teams
      await refreshSession();
      
      // Redirect to dashboard
      navigate('/app/dashboard');
    } catch (err) {
      setError('Failed to create team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.joinTeam(inviteCode);
      
      if (response.error) {
        setError(response.error);
        return;
      }

      // Refresh session to get updated teams
      await refreshSession();
      
      // Redirect to dashboard
      navigate('/app/dashboard');
    } catch (err) {
      setError('Invalid invite code. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Rhythm90</h1>
          <p className="text-gray-300">Let's get you set up with a team</p>
        </div>

        {step === 'choose' && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('create')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
            >
              Create a New Team
            </button>
            <button
              onClick={() => setStep('join')}
              className="w-full bg-white/20 text-white py-3 px-6 rounded-lg font-semibold hover:bg-white/30 transition-all duration-200 border border-white/30"
            >
              Join an Existing Team
            </button>
          </div>
        )}

        {step === 'create' && (
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label htmlFor="teamName" className="block text-white font-medium mb-2">
                Team Name
              </label>
              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your team name"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="industry" className="block text-white font-medium mb-2">
                Industry
              </label>
              <select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isLoading}
              >
                {industries.map((option) => (
                  <option key={option.value} value={option.value} className="bg-gray-800">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep('choose')}
                className="flex-1 bg-white/10 text-white py-3 px-6 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200 border border-white/30"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </form>
        )}

        {step === 'join' && (
          <form onSubmit={handleJoinTeam} className="space-y-4">
            <div>
              <label htmlFor="inviteCode" className="block text-white font-medium mb-2">
                Invite Code
              </label>
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter invite code"
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep('choose')}
                className="flex-1 bg-white/10 text-white py-3 px-6 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200 border border-white/30"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Joining...' : 'Join Team'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Onboarding; 