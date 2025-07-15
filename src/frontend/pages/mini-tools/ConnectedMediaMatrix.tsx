import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import SavedResponseActions from '../../components/SavedResponseActions';
import { FaBroadcastTower, FaArrowLeft } from 'react-icons/fa';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth';

function ConnectedMediaMatrix() {
  const [audienceSnapshot, setAudienceSnapshot] = useState('');
  const [primaryConversionAction, setPrimaryConversionAction] = useState('');
  const [seasonalOrContextualTriggers, setSeasonalOrContextualTriggers] = useState('');
  const [output, setOutput] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentTeam } = useAuth();

  const handleGenerate = async () => {
    if (!audienceSnapshot.trim() || !primaryConversionAction.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setError('');
    setOutput(null);

    try {
      const response = await apiClient.connectedMediaMatrix(audienceSnapshot, primaryConversionAction, seasonalOrContextualTriggers);

      if (response.data) {
        setOutput(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate media matrix');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOutput = () => {
    if (!output) return null;

    return (
      <div className="space-y-6">
        {/* Moment Matrix */}
        {output.moment_matrix && output.moment_matrix.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Media Moment Matrix</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moment/Trigger</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audience Mindset</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel/Format (Ranked)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creative/Offer Cue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Primary KPI</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Measurement Approach</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {output.moment_matrix.map((moment: any, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">{moment.moment_or_trigger}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{moment.audience_mindset}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{moment.channel_format_ranked}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{moment.creative_or_offer_cue}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{moment.primary_kpi}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{moment.measurement_approach}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        {output.moment_matrix && output.moment_matrix.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="bg-teal-50 rounded-md p-4">
              <p className="text-teal-900 leading-relaxed">
                Generated <strong>{output.moment_matrix.length}</strong> connected media moments to guide your campaign execution. 
                Each moment represents a specific trigger or context where your audience is most receptive to your message.
              </p>
            </div>
          </div>
        )}

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
            toolName="Connected Media Matrix"
            responseData={output}
            teamId={currentTeam?.id}
            summary={`Media matrix for: "${primaryConversionAction}"`}
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
            <FaBroadcastTower className="w-8 h-8 text-teal-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Connected-Media Moment Matrix</h1>
          </div>
          <p className="text-gray-600 mt-2">Create a moment-based media plan.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Input</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audience Snapshot *
                </label>
                <textarea
                  value={audienceSnapshot}
                  onChange={(e) => setAudienceSnapshot(e.target.value)}
                  placeholder="Describe your target audience, their behaviors, and media consumption habits..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Conversion Action *
                </label>
                <input
                  type="text"
                  value={primaryConversionAction}
                  onChange={(e) => setPrimaryConversionAction(e.target.value)}
                  placeholder="e.g., download app, sign up, make purchase, share content"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seasonal or Contextual Triggers (Optional)
                </label>
                <textarea
                  value={seasonalOrContextualTriggers}
                  onChange={(e) => setSeasonalOrContextualTriggers(e.target.value)}
                  placeholder="e.g., holidays, events, weather, news cycles, cultural moments"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isLoading || !audienceSnapshot.trim() || !primaryConversionAction.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isLoading ? 'Generating...' : 'Generate Media Matrix'}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Media Matrix</h2>
            {output ? (
              renderOutput()
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FaBroadcastTower className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Enter your input and click generate to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default ConnectedMediaMatrix; 