import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import { FaRoute, FaArrowLeft } from 'react-icons/fa';
import { apiClient } from '../../lib/api';

function JourneyBuilder() {
  const [productOrService, setProductOrService] = useState('');
  const [primaryObjective, setPrimaryObjective] = useState('');
  const [keyBarrier, setKeyBarrier] = useState('');
  const [output, setOutput] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!productOrService.trim() || !primaryObjective.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setError('');
    setOutput(null);

    try {
      const response = await apiClient.journeyBuilder(productOrService, primaryObjective, keyBarrier);

      if (response.data) {
        setOutput(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to build journey');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOutput = () => {
    if (!output) return null;

    return (
      <div className="space-y-6">
        {/* Journey Map */}
        {output.journey_map && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Journey Map</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mindset & Need</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barrier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marketing Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channels</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KPI</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {output.journey_map.map((stage: any, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stage.stage}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{stage.mindset}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{stage.barrier}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{stage.marketing_role}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{stage.channels}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{stage.kpi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stuck Stage */}
        {output.stuck_stage && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Potential Bottleneck</h3>
            <div className="bg-yellow-50 rounded-md p-4">
              <p className="text-yellow-900 font-medium">Most blocked stage: {output.stuck_stage}</p>
            </div>
          </div>
        )}

        {/* Raw Output (for debugging) */}
        {output.status === 'not_implemented' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Output</h3>
            <div className="bg-gray-50 rounded-md p-4">
              <pre className="text-gray-800 whitespace-pre-wrap">{JSON.stringify(output, null, 2)}</pre>
            </div>
          </div>
        )}
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
            <FaRoute className="w-8 h-8 text-indigo-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Journey Builder</h1>
          </div>
          <p className="text-gray-600 mt-2">Map a step-by-step customer journey with action tips.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Input</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product or Service *
                </label>
                <input
                  type="text"
                  value={productOrService}
                  onChange={(e) => setProductOrService(e.target.value)}
                  placeholder="e.g., SaaS tool, consulting service, physical product"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Objective *
                </label>
                <input
                  type="text"
                  value={primaryObjective}
                  onChange={(e) => setPrimaryObjective(e.target.value)}
                  placeholder="e.g., increase conversions, reduce churn, expand market"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Barrier (Optional)
                </label>
                <input
                  type="text"
                  value={keyBarrier}
                  onChange={(e) => setKeyBarrier(e.target.value)}
                  placeholder="e.g., high price point, complex onboarding, trust issues"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isLoading || !productOrService.trim() || !primaryObjective.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isLoading ? 'Building...' : 'Build Journey'}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Journey</h2>
            {output ? (
              renderOutput()
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FaRoute className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Enter your input and click build to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default JourneyBuilder; 