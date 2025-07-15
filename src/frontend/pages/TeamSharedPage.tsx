import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { FaSearch, FaStar, FaShare, FaHeart, FaArrowLeft, FaUsers } from 'react-icons/fa';
import { apiClient } from '../lib/api';

interface SavedResponse {
  id: string;
  user_id: string;
  tool_name: string;
  summary: string;
  response_blob: string;
  is_favorite: boolean;
  is_shared_public: boolean;
  is_shared_team: boolean;
  shared_slug?: string;
  created_at: string;
}

function TeamSharedPage() {
  const [responses, setResponses] = useState<SavedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTeamShared();
  }, []);

  const loadTeamShared = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getTeamSharedHistory();
      setResponses(response.data || []);
    } catch (err: any) {
      setError('Failed to load team shared responses');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (responseId: string, currentFavorite: boolean) => {
    try {
      await apiClient.toggleFavorite(responseId, !currentFavorite);
      // Update local state
      setResponses(prev => prev.map(r => 
        r.id === responseId ? { ...r, is_favorite: !currentFavorite } : r
      ));
    } catch (err) {
      // Handle error silently or show toast
    }
  };

  const filteredResponses = responses.filter(response => {
    return response.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
           response.tool_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getToolIcon = (toolName: string) => {
    const icons: { [key: string]: string } = {
      'Plain English Translator': '🔤',
      'Persona Generator': '👤',
      'Synthetic Focus Group': '👥',
      'Ritual Guide': '📅',
      'Play Builder': '🎯',
      'Signal Lab': '📊'
    };
    return icons[toolName] || '🛠️';
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/app"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center">
            <FaUsers className="w-8 h-8 text-blue-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Team Shared Responses</h1>
          </div>
          <p className="text-gray-600 mt-2">AI responses shared with your team</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search team shared responses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading team shared responses...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredResponses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No matching team shared responses' : 'No team shared responses yet'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Team members can share AI responses with the team to see them here'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredResponses.map((response) => {
              const responseData = JSON.parse(response.response_blob);
              return (
                <div key={response.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getToolIcon(response.tool_name)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{response.tool_name}</h3>
                        <p className="text-sm text-gray-500">{formatDate(response.created_at)}</p>
                        <p className="text-xs text-gray-400">Shared by team member</p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleFavorite(response.id, response.is_favorite)}
                        className={`p-2 rounded-md transition-colors ${
                          response.is_favorite 
                            ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50' 
                            : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                        }`}
                        title={response.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <FaHeart className={`w-4 h-4 ${response.is_favorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-gray-700 mb-4">{response.summary}</p>

                  {/* Badges */}
                  <div className="flex gap-2 mb-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <FaShare className="w-3 h-3 mr-1" />
                      Team Shared
                    </span>
                    {response.is_favorite && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <FaStar className="w-3 h-3 mr-1" />
                        Favorite
                      </span>
                    )}
                  </div>

                  {/* Preview */}
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {responseData.plain_english_rewrite || 
                       responseData.persona || 
                       responseData.summary || 
                       'Response preview not available'}
                    </p>
                  </div>

                  {/* View Details Link */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                      to={`/shared/${response.id}`}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      View full response →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default TeamSharedPage; 