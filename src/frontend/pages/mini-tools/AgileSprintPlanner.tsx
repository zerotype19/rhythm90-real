import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import SavedResponseActions from '../../components/SavedResponseActions';
import { FaRocket, FaArrowLeft } from 'react-icons/fa';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../lib/auth';

function AgileSprintPlanner() {
  const [challengeStatement, setChallengeStatement] = useState('');
  const [timeHorizon, setTimeHorizon] = useState('');
  const [teamSizeRoles, setTeamSizeRoles] = useState('');
  const [output, setOutput] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentTeam } = useAuth();

  const handleGenerate = async () => {
    if (!challengeStatement.trim() || !timeHorizon.trim() || !teamSizeRoles.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setError('');
    setOutput(null);

    try {
      const response = await apiClient.agileSprintPlanner(challengeStatement, timeHorizon, teamSizeRoles);

      if (response.data) {
        setOutput(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate sprint plan');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOutput = () => {
    if (!output) return null;

    return (
      <div className="space-y-6">
        {/* Sprint Objective */}
        {output.sprint_objective && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sprint Objective</h3>
            <div className="bg-blue-50 rounded-md p-4">
              <p className="text-blue-900 leading-relaxed">{output.sprint_objective}</p>
            </div>
          </div>
        )}

        {/* Team Roster and Responsibilities */}
        {output.team_roster_and_responsibilities && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Roster & Responsibilities</h3>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-gray-800 leading-relaxed">{output.team_roster_and_responsibilities}</p>
            </div>
          </div>
        )}

        {/* Sprint Cadence */}
        {output.sprint_cadence && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sprint Cadence</h3>
            <div className="bg-green-50 rounded-md p-4">
              <p className="text-green-900 leading-relaxed">{output.sprint_cadence}</p>
            </div>
          </div>
        )}

        {/* Rituals and Artifacts */}
        {output.rituals_and_artifacts && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rituals & Artifacts</h3>
            <div className="bg-purple-50 rounded-md p-4">
              <p className="text-purple-900 leading-relaxed">{output.rituals_and_artifacts}</p>
            </div>
          </div>
        )}

        {/* Deliverables per Sprint */}
        {output.deliverables_per_sprint && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deliverables per Sprint</h3>
            <div className="bg-orange-50 rounded-md p-4">
              <p className="text-orange-900 leading-relaxed">{output.deliverables_per_sprint}</p>
            </div>
          </div>
        )}

        {/* Rapid Testing & Validation Methods */}
        {output.rapid_testing_validation_methods && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rapid Testing & Validation Methods</h3>
            <div className="bg-yellow-50 rounded-md p-4">
              <p className="text-yellow-900 leading-relaxed">{output.rapid_testing_validation_methods}</p>
            </div>
          </div>
        )}

        {/* Definition of Done */}
        {output.definition_of_done && output.definition_of_done.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Definition of Done (DoD)</h3>
            <ul className="space-y-2">
              {output.definition_of_done.map((item: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-800">{item}</span>
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
            toolName="Agile Sprint Planner"
            responseData={output}
            teamId={currentTeam?.id}
            summary={`Sprint plan for: "${challengeStatement.substring(0, 100)}${challengeStatement.length > 100 ? '...' : ''}"`}
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
            <FaRocket className="w-8 h-8 text-red-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Agile Sprint / War-Room Planner</h1>
          </div>
          <p className="text-gray-600 mt-2">Outline an agile sprint plan for a marketing challenge.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Input</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Challenge Statement *
                </label>
                <textarea
                  value={challengeStatement}
                  onChange={(e) => setChallengeStatement(e.target.value)}
                  placeholder="Describe the marketing challenge or problem you need to solve..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Horizon *
                </label>
                <input
                  type="text"
                  value={timeHorizon}
                  onChange={(e) => setTimeHorizon(e.target.value)}
                  placeholder="e.g., 6 weeks, 3 months, 2 sprints"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Size & Roles *
                </label>
                <textarea
                  value={teamSizeRoles}
                  onChange={(e) => setTeamSizeRoles(e.target.value)}
                  placeholder="Describe your team size, roles, and responsibilities..."
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
                disabled={isLoading || !challengeStatement.trim() || !timeHorizon.trim() || !teamSizeRoles.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isLoading ? 'Generating...' : 'Generate Sprint Plan'}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Sprint Plan</h2>
            {output ? (
              renderOutput()
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FaRocket className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Enter your input and click generate to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default AgileSprintPlanner; 