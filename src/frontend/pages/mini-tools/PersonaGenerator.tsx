import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import { FaUser, FaArrowLeft, FaComments } from 'react-icons/fa';
import { apiClient } from '../../lib/api';

function PersonaGenerator() {
  const [audienceSeed, setAudienceSeed] = useState('');
  const [output, setOutput] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Ask Mode state
  const [askQuestion, setAskQuestion] = useState('');
  const [askResponse, setAskResponse] = useState<any>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState('');
  
  // Generate a simple user ID for session management
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const handleGenerate = async () => {
    if (!audienceSeed.trim()) {
      setError('Please enter an audience seed.');
      return;
    }

    setIsLoading(true);
    setError('');
    setOutput(null);
    setAskResponse(null); // Clear previous ask responses

    try {
      const response = await apiClient.personaGenerator(audienceSeed, userId);

      if (response.data) {
        setOutput(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate persona');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!askQuestion.trim()) {
      setAskError('Please enter a question.');
      return;
    }

    if (!output?.persona_sheet?.name) {
      setAskError('Please generate a persona first.');
      return;
    }

    setIsAsking(true);
    setAskError('');
    setAskResponse(null);

    try {
      const response = await apiClient.personaAsk(askQuestion, userId);

      if (response.data) {
        setAskResponse(response.data);
        setAskQuestion(''); // Clear the question input
      }
    } catch (err: any) {
      setAskError(err.response?.data?.error || 'Failed to get persona response');
    } finally {
      setIsAsking(false);
    }
  };

  const renderOutput = () => {
    if (!output) return null;

    return (
      <div className="space-y-6">
        {/* Persona Sheet */}
        {output.persona_sheet && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Persona Sheet</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Basic Info</h4>
                  <div className="bg-gray-50 rounded-md p-3">
                    <p><strong>Name:</strong> {output.persona_sheet.name}</p>
                    <p><strong>Age:</strong> {output.persona_sheet.age}</p>
                    <p><strong>Location:</strong> {output.persona_sheet.location}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-gray-800">{output.persona_sheet.bio}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Motivations & Values</h4>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-gray-800">{output.persona_sheet.motivations}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Pain Points & Objections</h4>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-gray-800">{output.persona_sheet.pain_points}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Decision Drivers & Triggers</h4>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-gray-800">{output.persona_sheet.triggers}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Media & Content Habits</h4>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-gray-800">{output.persona_sheet.media_habits}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ask Mode Section */}
        {output.persona_sheet && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaComments className="w-5 h-5 mr-2 text-purple-500" />
              Ask Mode
            </h3>
            
            {/* Ask Mode Message */}
            {output.ask_mode_message && (
              <div className="bg-purple-50 rounded-md p-4 mb-4">
                <p className="text-purple-900 font-medium">{output.ask_mode_message}</p>
              </div>
            )}

            {/* Ask Question Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ask {output.persona_sheet.name} a question:
                </label>
                <textarea
                  value={askQuestion}
                  onChange={(e) => setAskQuestion(e.target.value)}
                  placeholder={`e.g., "Why do you prefer Instagram for product research?" or "What frustrates you most about shopping online?"`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>

              {askError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{askError}</p>
                </div>
              )}

              <button
                onClick={handleAsk}
                disabled={isAsking || !askQuestion.trim() || !output?.persona_sheet?.name}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isAsking ? 'Asking...' : `Ask ${output.persona_sheet.name}`}
              </button>
            </div>

            {/* Ask Response */}
            {askResponse && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">
                  {askResponse.persona_name}'s Response:
                </h4>
                <div className="bg-white rounded-md p-3 border-l-4 border-purple-500">
                  <p className="text-gray-800">{askResponse.answer}</p>
                </div>
              </div>
            )}
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
            <FaUser className="w-8 h-8 text-purple-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Persona Generator + Ask Mode</h1>
          </div>
          <p className="text-gray-600 mt-2">Build detailed audience personas and enter live Q&A.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Input</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audience Seed
                </label>
                <textarea
                  value={audienceSeed}
                  onChange={(e) => setAudienceSeed(e.target.value)}
                  placeholder="e.g., 'urban young adults, ages 18–25, into gaming and social media'"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe your target audience to generate a detailed persona.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isLoading || !audienceSeed.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isLoading ? 'Generating...' : 'Generate Persona'}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Persona</h2>
            {output ? (
              renderOutput()
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FaUser className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Enter your input and click generate to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default PersonaGenerator; 