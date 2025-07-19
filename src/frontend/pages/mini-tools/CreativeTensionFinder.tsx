import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import SavedResponseActions from '../../components/SavedResponseActions';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FaLightbulb, FaArrowLeft } from 'react-icons/fa';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth';

function CreativeTensionFinder() {
  const [problemOrStrategySummary, setProblemOrStrategySummary] = useState('');
  const [output, setOutput] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentTeam } = useAuth();

  const handleGenerate = async () => {
    if (!problemOrStrategySummary.trim()) {
      setError('Please enter a problem or strategy summary.');
      return;
    }

    setIsLoading(true);
    setError('');
    setOutput(null);

    try {
      console.log('[FRONTEND DEBUG] Creative Tension Finder: Calling API with:', problemOrStrategySummary);
      const response = await apiClient.creativeTensionFinder(problemOrStrategySummary);
      console.log('[FRONTEND DEBUG] Creative Tension Finder: API response:', response);

      if (response.data) {
        console.log('[FRONTEND DEBUG] Creative Tension Finder: Setting output:', response.data);
        setOutput(response.data);
      } else {
        console.log('[FRONTEND DEBUG] Creative Tension Finder: No data in response');
        setError('No data received from API');
      }
    } catch (err: any) {
      console.log('[FRONTEND DEBUG] Creative Tension Finder: Error:', err);
      setError(err.response?.data?.error || 'Failed to generate creative tensions');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOutput = () => {
    if (!output || !Array.isArray(output)) return null;

    return (
      <div className="space-y-6">
        {/* Creative Tensions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Creative Tensions</h3>
          <div className="space-y-4">
            {output.map((tension: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">Tension {index + 1}</h4>
                    <p className="text-gray-800 leading-relaxed">{tension.tension}</p>
                  </div>
                  {tension.optional_platform_name && (
                    <div className="ml-4">
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                        {tension.optional_platform_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="bg-gray-50 rounded-md p-4">
            <p className="text-gray-800 leading-relaxed">
              Generated <strong>{output.length}</strong> creative tensions to inspire your campaign ideas. 
              Each tension represents a real human contradiction that can drive compelling creative work.
            </p>
          </div>
        </div>

        {/* Raw Output (for debugging) */}
        {output.raw_response && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Raw AI Response</h3>
            <div className="bg-gray-50 rounded-md p-4">
              <pre className="text-gray-800 whitespace-pre-wrap text-sm">{output.raw_response}</pre>
            </div>
          </div>
        )}

        {/* Action buttons for saving/favoriting/sharing */}
        <div className="bg-gray-50 rounded-lg p-2 mt-3">
          <SavedResponseActions
            toolName="Creative Tension Finder"
            responseData={output}
            teamId={currentTeam?.id}
            summary={`Creative tensions for: "${problemOrStrategySummary.substring(0, 100)}${problemOrStrategySummary.length > 100 ? '...' : ''}"`}
            promptContext={output.prompt_context}
          />
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header with breadcrumb */}
        <div className="mb-6">
          <Link
            to="/app/mini-tools"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Back to Mini Tools
          </Link>
          <div className="flex items-center">
            <FaLightbulb className="w-8 h-8 text-yellow-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Creative-Tension Finder</h1>
          </div>
          <p className="text-gray-600 mt-2">Generate creative tensions to inspire big campaign ideas.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Problem or Strategy</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary
                </label>
                <textarea
                  value={problemOrStrategySummary}
                  onChange={(e) => setProblemOrStrategySummary(e.target.value)}
                  placeholder="Describe your problem, challenge, or strategy that needs creative tension..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Focus on the core challenge or opportunity you're trying to address.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isLoading || !problemOrStrategySummary.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isLoading ? 'Finding Tensions...' : 'Find Creative Tensions'}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Creative Tensions</h2>
            {isLoading ? (
              <div className="text-center py-12">
                <LoadingSpinner size="lg" showText text="Finding creative tensions..." />
              </div>
            ) : output ? (
              renderOutput()
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FaLightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Enter your problem or strategy summary and click find to discover creative tensions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default CreativeTensionFinder; 