import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import SavedResponseActions from '../../components/SavedResponseActions';
import { FaChartLine, FaArrowLeft } from 'react-icons/fa';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth';

function TestLearnScale() {
  const [campaignOrProductContext, setCampaignOrProductContext] = useState('');
  const [resourcesOrConstraints, setResourcesOrConstraints] = useState('');
  const [output, setOutput] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentTeam } = useAuth();

  const handleGenerate = async () => {
    if (!campaignOrProductContext.trim()) {
      setError('Please enter a campaign or product context.');
      return;
    }

    setIsLoading(true);
    setError('');
    setOutput(null);

    try {
      const response = await apiClient.testLearnScale(campaignOrProductContext, resourcesOrConstraints);

      if (response.data) {
        setOutput(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate roadmap');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOutput = () => {
    if (!output) return null;

    return (
      <div className="space-y-6">
        {/* Core Hypotheses */}
        {output.core_hypotheses && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Hypotheses</h3>
            <ul className="space-y-2">
              {output.core_hypotheses.map((hypothesis: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-800">{hypothesis}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Test Design Table */}
        {output.test_design_table && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Design</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hypothesis</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tactic</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sample</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KPI</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeframe</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {output.test_design_table.map((test: any, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-4 text-sm text-gray-900">{test.hypothesis}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{test.tactic}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{test.target_sample}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{test.primary_kpi}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{test.success_threshold}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{test.timeframe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Learning Application */}
        {output.learning_application && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Application</h3>
            <div className="bg-blue-50 rounded-md p-4">
              <p className="text-blue-900">{output.learning_application}</p>
            </div>
          </div>
        )}

        {/* Risk Mitigation Tips */}
        {output.risk_mitigation_tips && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Mitigation Tips</h3>
            <ul className="space-y-2">
              {output.risk_mitigation_tips.map((tip: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-800">{tip}</span>
                </li>
              ))}
            </ul>
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
            toolName="Test Learn Scale"
            responseData={output}
            teamId={currentTeam?.id}
            summary={`Test/Learn/Scale roadmap for: "${campaignOrProductContext.substring(0, 100)}${campaignOrProductContext.length > 100 ? '...' : ''}"`}
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
            <FaChartLine className="w-8 h-8 text-orange-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Test-Learn-Scale Roadmap</h1>
          </div>
          <p className="text-gray-600 mt-2">Design an experimentation plan with hypotheses + KPIs.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Input</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign or Product Context *
                </label>
                <textarea
                  value={campaignOrProductContext}
                  onChange={(e) => setCampaignOrProductContext(e.target.value)}
                  placeholder="Describe your campaign, product, or initiative that needs experimentation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resources or Constraints (Optional)
                </label>
                <textarea
                  value={resourcesOrConstraints}
                  onChange={(e) => setResourcesOrConstraints(e.target.value)}
                  placeholder="Budget, timeline, team size, technical constraints, etc."
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
                disabled={isLoading || !campaignOrProductContext.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isLoading ? 'Generating...' : 'Generate Roadmap'}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Roadmap</h2>
            {output ? (
              renderOutput()
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FaChartLine className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Enter your input and click generate to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default TestLearnScale; 