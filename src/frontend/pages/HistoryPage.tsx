import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, MagnifyingGlassIcon, StarIcon, GlobeAltIcon, UserGroupIcon, EyeIcon, ShareIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { api } from '../lib/api';
import { SavedResponseActions } from '../components/SavedResponseActions';
import AppLayout from '../components/AppLayout';

interface SavedResponse {
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
  updated_at?: string;
}

interface ToolIcon {
  [key: string]: React.ComponentType<{ className?: string }>;
}

const toolIcons: ToolIcon = {
  'Plain English Translator': () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
    </svg>
  ),
  'Get-To-By Generator': () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'Creative Tension Finder': () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
    </svg>
  ),
  'Persona Generator': () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  ),
  'Persona Ask': () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  ),
  'Focus Group Ask': () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
    </svg>
  ),
  'Journey Builder': () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
    </svg>
  ),
  'Test Learn Scale': () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  'Agile Sprint Planner': () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
  ),
  'Connected Media Matrix': () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
    </svg>
  ),
  'Synthetic Focus Group': () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
    </svg>
  ),
  'default': () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
    </svg>
  )
};

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [responses, setResponses] = useState<SavedResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<SavedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTool, setSelectedTool] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showSharedOnly, setShowSharedOnly] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<SavedResponse | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [availableTools, setAvailableTools] = useState<string[]>([]);

  // Fetch user's saved responses
  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setLoading(true);
        const response = await api.getUserHistory();
        
        if (response.data?.data) {
          const userResponses = response.data.data;
          setResponses(userResponses);
          
          // Extract unique tool names
          const tools = [...new Set(userResponses.map(r => r.tool_name))];
          setAvailableTools(tools);
        } else {
          setError('Failed to load responses');
        }
      } catch (err) {
        console.error('Error fetching responses:', err);
        setError('Failed to load responses');
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, []);

  // Filter responses based on search and filters
  useEffect(() => {
    let filtered = responses;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(response =>
        response.summary.toLowerCase().includes(term) ||
        response.tool_name.toLowerCase().includes(term)
      );
    }

    // Tool filter
    if (selectedTool !== 'all') {
      filtered = filtered.filter(response => response.tool_name === selectedTool);
    }

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(response => response.is_favorite);
    }

    // Shared filter
    if (showSharedOnly) {
      filtered = filtered.filter(response => response.is_shared_public || response.is_shared_team);
    }

    setFilteredResponses(filtered);
  }, [responses, searchTerm, selectedTool, showFavoritesOnly, showSharedOnly]);

  // Handle favorite toggle
  const handleFavoriteToggle = async (responseId: string, isFavorite: boolean) => {
    try {
      const response = await api.toggleFavorite(responseId, isFavorite);
      if (response.data?.data) {
        setResponses(prev => prev.map(r => 
          r.id === responseId ? { ...r, is_favorite: isFavorite } : r
        ));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Handle share toggle
  const handleShareToggle = async (responseId: string, isSharedPublic: boolean, isSharedTeam: boolean) => {
    try {
      const response = await api.setShareStatus(responseId, isSharedPublic, isSharedTeam);
      if (response.data?.data) {
        setResponses(prev => prev.map(r => 
          r.id === responseId ? { 
            ...r, 
            is_shared_public: isSharedPublic, 
            is_shared_team: isSharedTeam,
            shared_slug: response.data.data.shared_slug
          } : r
        ));
      }
    } catch (err) {
      console.error('Error toggling share:', err);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get tool icon
  const getToolIcon = (toolName: string) => {
    const IconComponent = toolIcons[toolName] || toolIcons.default;
    return <IconComponent className="w-4 h-4" />;
  };

  // Truncate summary
  const truncateSummary = (summary: string, maxLength: number = 140) => {
    if (summary.length <= maxLength) return summary;
    return summary.substring(0, maxLength) + '...';
  };

  return (
    <AppLayout>
      <div className="md:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Loading State */}
          {loading && (
            <div className="min-h-screen bg-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="bg-white p-6 rounded-lg shadow">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="min-h-screen bg-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">
                  <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          {!loading && !error && (
            <>
              {/* Header */}
              <div className="mb-8">
                <button
                  onClick={() => navigate('/app')}
                  className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                >
                  <ChevronLeftIcon className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </button>
                <h1 className="text-3xl font-bold text-gray-900">My Saved Responses</h1>
              </div>

              {/* Search and Filters */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search responses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Tool Filter */}
                  <select
                    value={selectedTool}
                    onChange={(e) => setSelectedTool(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Tools</option>
                    {availableTools.map(tool => (
                      <option key={tool} value={tool}>{tool}</option>
                    ))}
                  </select>

                  {/* Favorites Filter */}
                  <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`flex items-center justify-center px-4 py-2 rounded-lg border ${
                      showFavoritesOnly
                        ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <StarIcon className="w-4 h-4 mr-2" />
                    Favorites Only
                  </button>

                  {/* Shared Filter */}
                  <button
                    onClick={() => setShowSharedOnly(!showSharedOnly)}
                    className={`flex items-center justify-center px-4 py-2 rounded-lg border ${
                      showSharedOnly
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ShareIcon className="w-4 h-4 mr-2" />
                    Shared Only
                  </button>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-4">
                {filteredResponses.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="text-gray-500 text-lg mb-2">
                      {responses.length === 0 ? 'No saved responses yet' : 'No responses match your filters'}
                    </div>
                    <div className="text-gray-400">
                      {responses.length === 0 
                        ? 'Start using AI tools to save your first response'
                        : 'Try adjusting your search or filters'
                      }
                    </div>
                  </div>
                ) : (
                  filteredResponses.map((response) => (
                    <div key={response.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-center mb-3">
                            <div className="flex items-center text-gray-600 mr-3">
                              {getToolIcon(response.tool_name)}
                              <span className="ml-2 text-sm font-medium">{response.tool_name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {response.is_favorite && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <StarIconSolid className="w-3 h-3 mr-1" />
                                  Favorite
                                </span>
                              )}
                              {response.is_shared_public && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <GlobeAltIcon className="w-3 h-3 mr-1" />
                                  Public
                                </span>
                              )}
                              {response.is_shared_team && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <UserGroupIcon className="w-3 h-3 mr-1" />
                                  Team
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Summary */}
                          <p className="text-gray-900 mb-3">
                            {truncateSummary(response.summary)}
                          </p>

                          {/* Date */}
                          <div className="text-sm text-gray-500">
                            Saved on {formatDate(response.created_at)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setSelectedResponse(response);
                              setShowViewModal(true);
                            }}
                            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View
                          </button>
                          
                          <SavedResponseActions
                            responseId={response.id}
                            toolName={response.tool_name}
                            responseBlob={response.response_blob}
                            currentTeamId={response.team_id}
                            onStatusChange={() => {
                              // Refresh the responses list
                              window.location.reload();
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* View Modal */}
              {showViewModal && selectedResponse && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b">
                      <div className="flex items-center">
                        {getToolIcon(selectedResponse.tool_name)}
                        <h3 className="ml-2 text-lg font-medium">{selectedResponse.tool_name}</h3>
                      </div>
                      <button
                        onClick={() => setShowViewModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                      <div className="prose max-w-none">
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Summary</h4>
                          <p className="text-gray-900">{selectedResponse.summary}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Full Response</h4>
                          <div 
                            className="text-gray-900 whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: selectedResponse.response_blob }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default HistoryPage; 