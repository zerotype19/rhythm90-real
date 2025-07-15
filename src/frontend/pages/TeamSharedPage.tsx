import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { 
  FaSearch, 
  FaStar, 
  FaShare, 
  FaHeart, 
  FaArrowLeft, 
  FaUsers, 
  FaFilter,
  FaCopy,
  FaEye,
  FaCalendar,
  FaChevronLeft,
  FaChevronRight,
  FaTimes
} from 'react-icons/fa';
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
  user_name?: string;
  user_email?: string;
}

interface FilterOptions {
  search: string;
  tool_name: string;
  favorites_only: boolean;
  date_from: string;
  date_to: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Parse AI response to hide prompts and show only the user-facing content
const parseAIResponse = (responseBlob: string): string => {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(responseBlob);
    
    // If it's a structured response, extract the main content
    if (parsed.content) {
      return parsed.content;
    }
    
    if (parsed.response) {
      return parsed.response;
    }
    
    if (parsed.result) {
      return parsed.result;
    }
    
    // If it's an array, join the content
    if (Array.isArray(parsed)) {
      return parsed.map(item => {
        if (typeof item === 'string') return item;
        if (item.content) return item.content;
        if (item.response) return item.response;
        return JSON.stringify(item);
      }).join('\n\n');
    }
    
    // If it's an object with text fields, extract them
    const textFields = Object.entries(parsed)
      .filter(([key, value]) => 
        typeof value === 'string' && 
        !key.toLowerCase().includes('prompt') &&
        !key.toLowerCase().includes('input') &&
        !key.toLowerCase().includes('context')
      )
      .map(([_, value]) => value as string);
    
    if (textFields.length > 0) {
      return textFields.join('\n\n');
    }
    
    // Fallback to stringified version - ensure full content is shown
    return JSON.stringify(parsed, null, 2);
  } catch {
    // If not JSON, treat as plain text - ensure full content is shown
    const lines = responseBlob.split('\n');
    
    // Remove lines that look like prompts or system messages
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('System:') &&
             !trimmed.startsWith('User:') &&
             !trimmed.startsWith('Assistant:') &&
             !trimmed.startsWith('Human:') &&
             !trimmed.startsWith('AI:') &&
             !trimmed.startsWith('Prompt:') &&
             !trimmed.startsWith('Context:') &&
             !trimmed.startsWith('Input:') &&
             trimmed.length > 0;
    });
    
    // If no lines were filtered out, return the original content
    if (filteredLines.length === 0) {
      return responseBlob;
    }
    
    return filteredLines.join('\n');
  }
};

function TeamSharedPage() {
  const [responses, setResponses] = useState<SavedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [availableTools, setAvailableTools] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<SavedResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    tool_name: '',
    favorites_only: false,
    date_from: '',
    date_to: ''
  });

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadAvailableTools();
    loadTeamShared();
  }, []);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
    loadTeamShared();
  }, [filters]);

  const loadAvailableTools = async () => {
    try {
      const response = await apiClient.getAvailableToolNames();
      const typedResponse = response as ApiResponse<{ data: string[] }>;
      if (typedResponse.data && Array.isArray(typedResponse.data.data)) {
        setAvailableTools(typedResponse.data.data);
      }
    } catch (err) {
      console.error('Failed to load available tools:', err);
    }
  };

  const loadTeamShared = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      
      const response = await apiClient.getTeamSharedHistoryEnhanced({
        ...filters,
        limit: ITEMS_PER_PAGE,
        offset
      });
      
      const typedResponse = response as ApiResponse<{ 
        data: SavedResponse[]; 
        total: number; 
      }>;
      
      if (typedResponse.data && Array.isArray(typedResponse.data.data)) {
        console.log('Team shared responses:', typedResponse.data.data);
        // Log each response object to see all fields
        typedResponse.data.data.forEach((response, index) => {
          console.log(`Response ${index}:`, {
            id: response.id,
            tool_name: response.tool_name,
            summary: response.summary,
            is_favorite: response.is_favorite,
            is_shared_public: response.is_shared_public,
            is_shared_team: response.is_shared_team,
            user_email: response.user_email,
            user_name: response.user_name,
            created_at: response.created_at,
            // Log all other fields
            allFields: Object.keys(response),
            allValues: Object.values(response)
          });
        });
        setResponses(typedResponse.data.data);
        setTotalCount(typedResponse.data.total || 0);
      } else {
        setError('Failed to load team shared responses');
      }
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
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleCopyPublicLink = async (sharedSlug: string) => {
    try {
      const publicUrl = `${window.location.origin}/shared/${sharedSlug}`;
      await navigator.clipboard.writeText(publicUrl);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      tool_name: '',
      favorites_only: false,
      date_from: '',
      date_to: ''
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaUsers className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Team Shared Responses</h1>
                <p className="text-gray-600 mt-1">AI responses shared with your team</p>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FaFilter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search responses..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Tool Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tool</label>
                <select
                  value={filters.tool_name}
                  onChange={(e) => handleFilterChange('tool_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">All Tools</option>
                  {availableTools.map(tool => (
                    <option key={tool} value={tool}>{tool}</option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Favorites Toggle */}
            <div className="mt-4 flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.favorites_only}
                  onChange={(e) => handleFilterChange('favorites_only', e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700">Favorites only</span>
              </label>

              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <FaTimes className="w-3 h-3 mr-1" />
                Clear filters
              </button>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {loading ? 'Loading...' : `${totalCount} response${totalCount !== 1 ? 's' : ''} found`}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <FaChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
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
        ) : responses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {Object.values(filters).some(v => v !== '' && v !== false) 
                ? 'No matching team shared responses' 
                : 'No team shared responses yet'
              }
            </h3>
            <p className="text-gray-600">
              {Object.values(filters).some(v => v !== '' && v !== false)
                ? 'Try adjusting your filters'
                : 'Team members can share AI responses with the team to see them here'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {responses.map((response) => (
              <div key={response.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                {/* Title and Badges Row */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {response.tool_name}
                  </h3>
                  
                  {/* Badges - Right Aligned */}
                  <div className="flex items-center gap-2">
                    {response.is_shared_public && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <FaShare className="w-3 h-3 mr-1" />
                        Public
                      </span>
                    )}
                    {response.is_favorite && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <FaStar className="w-3 h-3 mr-1" />
                        Favorite
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Summary */}
                <p className="text-gray-700 mb-3">
                  {response.summary}
                </p>
                
                {/* Date, User, and Action Buttons Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-gray-500">
                    <FaCalendar className="w-3 h-3 mr-1" />
                    {formatDate(response.created_at)}
                    {response.user_email && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Shared by {response.user_email}</span>
                      </>
                    )}
                  </div>
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* Favorite Button */}
                    <button
                      onClick={() => handleToggleFavorite(response.id, response.is_favorite)}
                      className={`inline-flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                        response.is_favorite 
                          ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200' 
                          : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <FaHeart className={`w-3 h-3 mr-1 ${response.is_favorite ? 'fill-current' : ''}`} />
                      {response.is_favorite ? 'Favorited' : 'Favorite'}
                    </button>
                    {/* View Button */}
                    <button
                      onClick={() => {
                        setSelectedResponse(response);
                        setShowModal(true);
                      }}
                      className="inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <FaEye className="w-3 h-3 mr-1" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      page === currentPage
                        ? 'bg-red-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Response Details Modal */}
        {showModal && selectedResponse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedResponse.tool_name}</h2>
                    <p className="text-sm text-gray-500">{formatDate(selectedResponse.created_at)}</p>
                    {selectedResponse.user_email && (
                      <p className="text-sm text-gray-500">Shared by {selectedResponse.user_email}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Full Response</h3>
                  <div className="bg-gray-50 rounded-md p-4 overflow-x-auto max-h-[60vh] overflow-y-auto">
                    <div 
                      className="text-sm text-gray-700 whitespace-pre-wrap break-words"
                      dangerouslySetInnerHTML={{ __html: parseAIResponse(selectedResponse.response_blob) }}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  {selectedResponse.is_shared_public && selectedResponse.shared_slug && (
                    <button
                      onClick={() => handleCopyPublicLink(selectedResponse.shared_slug!)}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <FaCopy className="w-4 h-4 mr-2" />
                      Copy Public Link
                    </button>
                  )}
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default TeamSharedPage; 