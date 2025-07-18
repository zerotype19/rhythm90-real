import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
  FaTimes,
  FaCheck,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { apiClient } from '../lib/api';

interface SavedResponse {
  id: string;
  user_id: string;
  tool_name: string;
  summary: string;
  response_blob: string;
  system_prompt?: string;
  user_input?: string;
  final_prompt?: string;
  raw_response_text?: string;
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
    console.log('Parsing response blob:', responseBlob);
    const parsed = JSON.parse(responseBlob);
    console.log('Parsed response:', parsed);
    
    // If it's a string, just return it
    if (typeof parsed === 'string') {
      return `<div class="whitespace-pre-wrap">${parsed}</div>`;
    }
    
    // If it's an array, format each item
    if (Array.isArray(parsed)) {
      return parsed.map((item, index) => {
        if (typeof item === 'string') {
          return `<div class="mb-3 p-3 bg-gray-50 rounded">${item}</div>`;
        }
        return `<div class="mb-3 p-3 bg-gray-50 rounded"><pre>${JSON.stringify(item, null, 2)}</pre></div>`;
      }).join('');
    }
    
    // If it's an object, create a structured display
    if (typeof parsed === 'object' && parsed !== null) {
      let html = '<div class="space-y-4">';
      
      Object.entries(parsed).forEach(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        html += '<div class="border-l-4 border-blue-500 pl-4">';
        html += `<h4 class="font-semibold text-gray-900 mb-2">${label}</h4>`;
        
        if (typeof value === 'string') {
          html += `<div class="text-gray-700 whitespace-pre-wrap">${value}</div>`;
        } else if (Array.isArray(value)) {
          html += '<ul class="list-disc list-inside space-y-1">';
          value.forEach(item => {
            if (typeof item === 'string') {
              html += `<li class="text-gray-700">${item}</li>`;
            } else {
              html += `<li class="text-gray-700"><pre class="text-sm">${JSON.stringify(item, null, 2)}</pre></li>`;
            }
          });
          html += '</ul>';
        } else if (typeof value === 'object' && value !== null) {
          html += `<pre class="text-sm bg-gray-50 p-2 rounded overflow-x-auto">${JSON.stringify(value, null, 2)}</pre>`;
        } else {
          html += `<div class="text-gray-700">${String(value)}</div>`;
        }
        
        html += '</div>';
      });
      
      html += '</div>';
      console.log('Generated HTML:', html);
      return html;
    }
    
    // Fallback to pretty-printed JSON
    return `<pre class="text-sm bg-gray-50 p-4 rounded overflow-x-auto">${JSON.stringify(parsed, null, 2)}</pre>`;
  } catch (error) {
    console.error('Error parsing response blob:', error);
    // If it's not valid JSON, return as plain text
    return `<div class="whitespace-pre-wrap text-gray-700">${responseBlob}</div>`;
  }
};

function TeamSharedPage() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<SavedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [availableTools, setAvailableTools] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [favoriteConfirmations, setFavoriteConfirmations] = useState<{[key: string]: boolean}>({});
  const [copyConfirmations, setCopyConfirmations] = useState<{[key: string]: boolean}>({});
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    system_prompt: true,
    user_input: true,
    final_prompt: true,
    raw_response_text: true
  });
  
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
  }, [slug]);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
    loadTeamShared();
  }, [filters]);

  const loadAvailableTools = async () => {
    try {
      const response = await apiClient.getAvailableToolNames();
      // Handle the actual API response structure: { success: true, message: "...", data: {...} }
      if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data)) {
        setAvailableTools(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load available tools:', err);
    }
  };

  const loadTeamShared = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      
      // If we have a slug, we need to get the specific shared item
      if (slug) {
        const response = await apiClient.getTeamSharedBySlug(slug);
        
        // Handle the actual API response structure: { success: true, message: "...", data: {...} }
        if (response.data && response.data.success && response.data.data) {
          setResponses([response.data.data]);
          setTotalCount(1);
        } else {
          console.error('Failed to load shared item:', response);
          setError('Shared item not found');
        }
        return;
      }
      
      const response = await apiClient.getTeamSharedHistoryEnhanced({
        ...filters,
        limit: ITEMS_PER_PAGE,
        offset
      });
      
      // Handle the actual API response structure: { success: true, message: "...", data: {...} }
      if (response.data && response.data.success && response.data.data) {
        setResponses(response.data.data);
        setTotalCount(response.data.total || response.data.data.length);
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
      
      // Show confirmation
      setFavoriteConfirmations(prev => ({ ...prev, [responseId]: true }));
      setTimeout(() => {
        setFavoriteConfirmations(prev => ({ ...prev, [responseId]: false }));
      }, 2000);
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

  const handleCopySection = async (content: string, sectionKey: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyConfirmations(prev => ({ ...prev, [sectionKey]: true }));
      setTimeout(() => {
        setCopyConfirmations(prev => ({ ...prev, [sectionKey]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const handleCopyFullJSON = async (response: SavedResponse) => {
    try {
      const fullData = {
        id: response.id,
        tool_name: response.tool_name,
        summary: response.summary,
        system_prompt: response.system_prompt,
        user_input: response.user_input,
        final_prompt: response.final_prompt,
        raw_response_text: response.raw_response_text,
        response_blob: response.response_blob,
        created_at: response.created_at,
        user_email: response.user_email,
        is_favorite: response.is_favorite,
        is_shared_public: response.is_shared_public,
        is_shared_team: response.is_shared_team
      };
      
      await navigator.clipboard.writeText(JSON.stringify(fullData, null, 2));
      setCopyConfirmations(prev => ({ ...prev, ['full_json']: true }));
      setTimeout(() => {
        setCopyConfirmations(prev => ({ ...prev, ['full_json']: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy full JSON:', err);
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
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString);
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateString);
      return 'Invalid Date';
    }
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // If we have a slug, show the detail view
  if (slug && responses.length > 0) {
    const response = responses[0];
    return (
      <AppLayout>
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <Link
              to="/app/team-shared"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              ← Back to Team Shared
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center">
                <FaUsers className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mr-2 sm:mr-3 flex-shrink-0" />
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                    {response.tool_name}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">
                    {formatDate(response.created_at)} • Shared by {response.user_email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleFavorite(response.id, response.is_favorite)}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    response.is_favorite 
                      ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200' 
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <FaHeart className={`w-4 h-4 mr-2 ${response.is_favorite ? 'fill-current' : ''}`} />
                  {response.is_favorite ? 'Favorited' : 'Favorite'}
                  {favoriteConfirmations[response.id] && (
                    <FaCheck className="w-4 h-4 ml-2 text-green-600" />
                  )}
                </button>
                <button
                  onClick={() => handleCopyFullJSON(response)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <FaCopy className="w-4 h-4 mr-2" />
                  Copy Full JSON
                  {copyConfirmations['full_json'] && (
                    <FaCheck className="w-4 h-4 ml-2 text-green-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Detail Content */}
          <div className="space-y-6">
            {/* System Prompt Section */}
            {response.system_prompt && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">System Prompt</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopySection(response.system_prompt!, 'system_prompt')}
                      className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <FaCopy className="w-3 h-3 mr-1" />
                      Copy
                      {copyConfirmations['system_prompt'] && (
                        <FaCheck className="w-3 h-3 ml-1 text-green-600" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleSection('system_prompt')}
                      className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {expandedSections['system_prompt'] ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                {expandedSections['system_prompt'] && (
                  <div className="bg-gray-50 rounded-md p-4 font-mono text-sm text-gray-700 whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                    {response.system_prompt}
                  </div>
                )}
              </div>
            )}

            {/* User Input Section */}
            {response.user_input && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">User Input</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopySection(response.user_input!, 'user_input')}
                      className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <FaCopy className="w-3 h-3 mr-1" />
                      Copy
                      {copyConfirmations['user_input'] && (
                        <FaCheck className="w-3 h-3 ml-1 text-green-600" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleSection('user_input')}
                      className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {expandedSections['user_input'] ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                {expandedSections['user_input'] && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 font-mono text-sm text-gray-700 whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                    {response.user_input}
                  </div>
                )}
              </div>
            )}

            {/* Final Prompt Section */}
            {response.final_prompt && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Final Prompt</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopySection(response.final_prompt!, 'final_prompt')}
                      className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <FaCopy className="w-3 h-3 mr-1" />
                      Copy
                      {copyConfirmations['final_prompt'] && (
                        <FaCheck className="w-3 h-3 ml-1 text-green-600" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleSection('final_prompt')}
                      className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {expandedSections['final_prompt'] ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                {expandedSections['final_prompt'] && (
                  <div className="bg-gray-50 rounded-md p-4 font-mono text-sm text-gray-700 whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                    {response.final_prompt}
                  </div>
                )}
              </div>
            )}

            {/* Raw Response Text Section */}
            {response.raw_response_text && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Raw AI Response</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopySection(response.raw_response_text!, 'raw_response_text')}
                      className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <FaCopy className="w-3 h-3 mr-1" />
                      Copy
                      {copyConfirmations['raw_response_text'] && (
                        <FaCheck className="w-3 h-3 ml-1 text-green-600" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleSection('raw_response_text')}
                      className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {expandedSections['raw_response_text'] ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                {expandedSections['raw_response_text'] && (
                  <div className="bg-gray-50 rounded-md p-4 font-mono text-sm text-gray-700 whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                    {response.raw_response_text}
                  </div>
                )}
              </div>
            )}

            {/* AI Response Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">AI Response</h3>
                <button
                  onClick={() => handleCopySection(response.response_blob, 'ai_response')}
                  className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <FaCopy className="w-3 h-3 mr-1" />
                  Copy
                  {copyConfirmations['ai_response'] && (
                    <FaCheck className="w-3 h-3 ml-1 text-green-600" />
                  )}
                </button>
              </div>
              <div className="bg-gray-50 rounded-md p-4 overflow-x-auto max-h-96 overflow-y-auto">
                <div 
                  className="text-sm text-gray-700 whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{ __html: parseAIResponse(response.response_blob) }}
                />
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // List view
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <FaUsers className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mr-2 sm:mr-3 flex-shrink-0" />
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                  Team Shared Responses
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  AI responses shared with your team
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
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
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                <div className="col-span-3">Tool Type</div>
                <div className="col-span-3">Date/Time</div>
                <div className="col-span-3">Shared by</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>
            
            {/* Table Rows */}
            <div className="divide-y divide-gray-200">
              {responses.map((response) => (
                <div key={response.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Tool Type */}
                    <div className="col-span-3">
                      <div className="font-medium text-gray-900">{response.tool_name}</div>
                    </div>
                    
                    {/* Date/Time */}
                    <div className="col-span-3">
                      <div className="text-sm text-gray-600">{formatDate(response.created_at)}</div>
                    </div>
                    
                    {/* Shared by */}
                    <div className="col-span-3">
                      <div className="text-sm text-gray-600">{response.user_email}</div>
                    </div>
                    
                    {/* Status */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        {response.is_favorite && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <FaStar className="w-3 h-3 mr-1" />
                            Favorite
                          </span>
                        )}
                        {response.is_shared_public && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FaShare className="w-3 h-3 mr-1" />
                            Public
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="col-span-1">
                      <div className="flex items-center gap-2">
                        {/* Favorite Button */}
                        <button
                          onClick={() => handleToggleFavorite(response.id, response.is_favorite)}
                          className={`p-2 rounded-md transition-colors ${
                            response.is_favorite 
                              ? 'text-yellow-600 hover:text-yellow-700' 
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                          title={response.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <FaHeart className={`w-4 h-4 ${response.is_favorite ? 'fill-current' : ''}`} />
                          {favoriteConfirmations[response.id] && (
                            <FaCheck className="w-4 h-4 absolute -mt-6 -ml-2 text-green-600" />
                          )}
                        </button>
                        
                        {/* View Button */}
                        <Link
                          to={`/app/team-shared/${response.shared_slug || response.id}`}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                          title="View details"
                        >
                          <FaEye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
      </div>
    </AppLayout>
  );
}

export default TeamSharedPage; 