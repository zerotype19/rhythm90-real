import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import { FaUsers, FaArrowLeft } from 'react-icons/fa';
import { apiClient } from '../../lib/api';

function SyntheticFocusGroup() {
  const [topicOrCategory, setTopicOrCategory] = useState('');
  const [audienceSeedInfo, setAudienceSeedInfo] = useState('');
  const [mustIncludeSegments, setMustIncludeSegments] = useState('');
  const [output, setOutput] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!topicOrCategory.trim() || !audienceSeedInfo.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setError('');
    setOutput(null);

    try {
      const response = await apiClient.syntheticFocusGroup(topicOrCategory, audienceSeedInfo, mustIncludeSegments);

      if (response.data) {
        setOutput(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate focus group');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOutput = () => {
    if (!output) return null;

    return (
      <div className="space-y-6">
        {/* Persona Lineup */}
        {output.persona_lineup && output.persona_lineup.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Focus Group Personas</h3>
            <div className="space-y-4">
              {output.persona_lineup.map((persona: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">{persona.name}</h4>
                      <p className="text-sm text-gray-600">{persona.age}, {persona.location}</p>
                    </div>
                    <span className="inline-block bg-pink-100 text-pink-800 text-xs font-medium px-2 py-1 rounded">
                      Persona {index + 1}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Bio</h5>
                      <p className="text-sm text-gray-700 mb-3">{persona.bio}</p>
                      
                      <h5 className="font-medium text-gray-900 mb-2">Motivations & Values</h5>
                      <p className="text-sm text-gray-700 mb-3">{persona.motivations}</p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Pain Points & Objections</h5>
                      <p className="text-sm text-gray-700 mb-3">{persona.pain_points}</p>
                      
                      <h5 className="font-medium text-gray-900 mb-2">Decision Drivers & Triggers</h5>
                      <p className="text-sm text-gray-700 mb-3">{persona.triggers}</p>
                      
                      <h5 className="font-medium text-gray-900 mb-2">Media & Content Habits</h5>
                      <p className="text-sm text-gray-700">{persona.media_habits}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ask Mode Message */}
        {output.ask_mode_message && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ask Mode</h3>
            <div className="bg-pink-50 rounded-md p-4">
              <p className="text-pink-900 font-medium">{output.ask_mode_message}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use</h3>
          <div className="bg-blue-50 rounded-md p-4">
            <ul className="text-blue-900 space-y-2 text-sm">
              <li>• Address questions to specific personas by name (e.g., "Sarah, what do you think about...?")</li>
              <li>• Ask the whole group with "the group" (e.g., "What does the group think about...?")</li>
              <li>• When finished, say "exit group" to end the session</li>
              <li>• Each persona will respond based on their unique characteristics and perspectives</li>
            </ul>
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
            <FaUsers className="w-8 h-8 text-pink-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Synthetic Focus Group</h1>
          </div>
          <p className="text-gray-600 mt-2">Create a synthetic focus group of five personas and enter Ask Mode.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Input</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic or Category *
                </label>
                <input
                  type="text"
                  value={topicOrCategory}
                  onChange={(e) => setTopicOrCategory(e.target.value)}
                  placeholder="e.g., mobile banking, fitness apps, sustainable fashion"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audience Seed Info *
                </label>
                <textarea
                  value={audienceSeedInfo}
                  onChange={(e) => setAudienceSeedInfo(e.target.value)}
                  placeholder="Describe your target audience segments, demographics, behaviors, and characteristics..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Must Include Segments (Optional)
                </label>
                <textarea
                  value={mustIncludeSegments}
                  onChange={(e) => setMustIncludeSegments(e.target.value)}
                  placeholder="e.g., must include millennials, must include small business owners, must include urban vs rural"
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
                disabled={isLoading || !topicOrCategory.trim() || !audienceSeedInfo.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isLoading ? 'Generating...' : 'Generate Focus Group'}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Focus Group</h2>
            {output ? (
              renderOutput()
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FaUsers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Enter your input and click generate to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default SyntheticFocusGroup; 