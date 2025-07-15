import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { FaArrowLeft, FaShare, FaGlobe } from 'react-icons/fa';
import { apiClient } from '../lib/api';

interface SharedResponse {
  id: string;
  tool_name: string;
  summary: string;
  response_blob: string;
  created_at: string;
}

function PublicSharedPage() {
  const { slug } = useParams<{ slug: string }>();
  const [response, setResponse] = useState<SharedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) {
      loadPublicShared(slug);
    }
  }, [slug]);

  const loadPublicShared = async (sharedSlug: string) => {
    try {
      setLoading(true);
      const response = await apiClient.getPublicShared(sharedSlug);
      setResponse(response.data);
    } catch (err: any) {
      setError('This shared response could not be found or is no longer available');
    } finally {
      setLoading(false);
    }
  };

  const renderResponseContent = (responseData: any) => {
    // Handle different tool response formats
    if (responseData.plain_english_rewrite) {
      return (
        <div className="space-y-6">
          {/* Plain English Rewrite */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plain English Rewrite</h3>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-gray-800 leading-relaxed">{responseData.plain_english_rewrite}</p>
            </div>
          </div>

          {/* Side by Side Table */}
          {responseData.side_by_side_table && responseData.side_by_side_table.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What It Says vs. What It Means</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        What It Says
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        What It Really Means
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {responseData.side_by_side_table.map((row: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-900">
                          {row.what_it_says}
                        </td>
                        <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-900">
                          {row.what_it_really_means}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Jargon Glossary */}
          {responseData.jargon_glossary && responseData.jargon_glossary.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Jargon Glossary</h3>
              <ul className="space-y-2">
                {responseData.jargon_glossary.map((term: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-800">{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (responseData.persona) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Persona</h3>
          <div className="bg-gray-50 rounded-md p-4">
            <pre className="text-gray-800 whitespace-pre-wrap text-sm">{responseData.persona}</pre>
          </div>
        </div>
      );
    }

    if (responseData.agenda || responseData.discussion_prompts) {
      return (
        <div className="space-y-6">
          {/* Agenda */}
          {responseData.agenda && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Agenda</h3>
              <div className="space-y-3">
                {responseData.agenda.map((item: string, index: number) => (
                  <div key={index} className="flex items-start">
                    <span className="inline-block w-6 h-6 bg-red-100 text-red-600 rounded-full text-sm font-medium flex items-center justify-center mr-3 flex-shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-gray-800">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discussion Prompts */}
          {responseData.discussion_prompts && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Discussion Prompts</h3>
              <div className="space-y-3">
                {responseData.discussion_prompts.map((prompt: string, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-md p-3">
                    <p className="text-gray-800">{prompt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Generic fallback
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Content</h3>
        <div className="bg-gray-50 rounded-md p-4">
          <pre className="text-gray-800 whitespace-pre-wrap text-sm">
            {JSON.stringify(responseData, null, 2)}
          </pre>
        </div>
      </div>
    );
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          
          {loading ? (
            <div className="flex items-center">
              <FaGlobe className="w-8 h-8 text-green-500 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Loading Shared Response...</h1>
            </div>
          ) : error ? (
            <div className="flex items-center">
              <FaGlobe className="w-8 h-8 text-red-500 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Response Not Found</h1>
            </div>
          ) : response ? (
            <div className="flex items-center">
              <FaGlobe className="w-8 h-8 text-green-500 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Public Shared Response</h1>
            </div>
          ) : null}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading shared response...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Response Not Found</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              to="/app"
              className="inline-block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : response ? (
          <div className="space-y-6">
            {/* Response Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getToolIcon(response.tool_name)}</span>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{response.tool_name}</h2>
                    <p className="text-sm text-gray-500">Shared on {formatDate(response.created_at)}</p>
                  </div>
                </div>
                
                {/* Public Badge */}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <FaShare className="w-4 h-4 mr-1" />
                  Public
                </span>
              </div>

              {/* Summary */}
              <p className="text-gray-700">{response.summary}</p>
            </div>

            {/* Response Content */}
            {renderResponseContent(JSON.parse(response.response_blob))}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}

export default PublicSharedPage; 