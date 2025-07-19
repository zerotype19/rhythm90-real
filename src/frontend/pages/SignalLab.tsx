import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import SavedResponseActions from '../components/SavedResponseActions';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/auth';
import { FaLightbulb, FaClipboardList, FaCheckCircle, FaArrowRight } from 'react-icons/fa';

function SignalLab() {
  const [observation, setObservation] = useState('');
  const [context, setContext] = useState('');
  const [output, setOutput] = useState('');
  const [structured, setStructured] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Prompt context for saving
  const [promptContext, setPromptContext] = useState<{
    system_prompt?: string;
    user_input?: string;
    final_prompt?: string;
    raw_response_text?: string;
  } | null>(null);
  const { currentTeam } = useAuth();

  const handleInterpret = async () => {
    if (!observation.trim()) return;
    setIsLoading(true);
    try {
      const response = await apiClient.interpretSignal(observation, context);
      if (response.data) {
        // Extract prompt context if available
        if (response.data._promptContext) {
          setPromptContext(response.data._promptContext);
        } else {
          setPromptContext(null);
        }
        
        // Try to parse structured fields
        if (
          response.data.signal_summary !== undefined ||
          response.data.why_it_matters !== undefined ||
          response.data.possible_next_step !== undefined
        ) {
          setStructured(response.data);
          setOutput('');
        } else if (response.data.output) {
          setOutput(response.data.output);
          setStructured(null);
        } else {
          setOutput(JSON.stringify(response.data, null, 2));
          setStructured(null);
        }
      }
    } catch (error) {
      console.error('Failed to interpret signal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render structured output
  const renderStructured = () => {
    if (!structured) return null;
    const sections = [
      {
        key: 'signal_summary',
        label: 'Signal Summary',
        icon: <FaLightbulb className="text-yellow-500 mr-2" />,
        content: structured.signal_summary,
      },
      {
        key: 'why_it_matters',
        label: 'Why It Matters',
        icon: <FaCheckCircle className="text-emerald-500 mr-2" />,
        content: structured.why_it_matters,
      },
      {
        key: 'possible_next_step',
        label: 'Possible Next Step',
        icon: <FaArrowRight className="text-orange-500 mr-2" />,
        content: structured.possible_next_step,
      },
    ];
    return (
      <div className="space-y-4">
        {sections.map((section) =>
          section.content && section.content.length > 0 ? (
            <div key={section.key} className="bg-white rounded-md shadow-sm p-3">
              <div className="flex items-center mb-1">
                {section.icon}
                <span className="font-bold text-sm text-gray-900">{section.label}</span>
              </div>
              <div className="text-xs text-gray-800 leading-relaxed mt-1" style={{fontSize: '13px'}}>
                {section.content}
              </div>
            </div>
          ) : null
        )}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Signal Lab</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Interpret Observations</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observation
                </label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Describe what you observed..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe what you observed — for example, a surprising result, customer behavior, friction point, or comment that stood out.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Context (Optional)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Add any relevant context..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add any helpful details, like which play, team, audience, or moment this came from. This helps connect the observation to work in motion, but it's okay to leave it blank.
                </p>
              </div>
              
              {/* Guidance text above button */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Reminder:</strong> Good signals are specific, surprising, actionable, and explained — they help the team decide what to do next, not just what happened.
                </p>
              </div>
              
              <button
                onClick={handleInterpret}
                disabled={!observation.trim() || isLoading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isLoading ? 'Interpreting...' : 'Interpret Signal'}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Interpretation</h2>
            {isLoading ? (
              <div className="text-center py-12">
                <LoadingSpinner size="lg" showText text="Interpreting your signal..." />
              </div>
            ) : structured ? (
              <div>
                {renderStructured()}
                {/* Action buttons for saving/favoriting/sharing */}
                <div className="bg-gray-50 rounded-lg p-2 mt-3">
                  <SavedResponseActions
                    toolName="Signal Lab"
                    responseData={structured}
                    teamId={currentTeam?.id}
                    summary={`Signal: "${observation.substring(0, 100)}${observation.length > 100 ? '...' : ''}"`}
                    systemPrompt={promptContext?.system_prompt}
                    userInput={promptContext?.user_input}
                    finalPrompt={promptContext?.final_prompt}
                    rawResponseText={promptContext?.raw_response_text}
                  />
                </div>
              </div>
            ) : output ? (
              <div>
                <div className="prose max-w-none text-xs">
                  <pre style={{whiteSpace: 'pre-wrap'}}>{output}</pre>
                </div>
                {/* Action buttons for saving/favoriting/sharing */}
                <div className="bg-gray-50 rounded-lg p-2 mt-3">
                  <SavedResponseActions
                    toolName="Signal Lab"
                    responseData={{ output }}
                    teamId={currentTeam?.id}
                    summary={`Signal: "${observation.substring(0, 100)}${observation.length > 100 ? '...' : ''}"`}
                    systemPrompt={promptContext?.system_prompt}
                    userInput={promptContext?.user_input}
                    finalPrompt={promptContext?.final_prompt}
                    rawResponseText={promptContext?.raw_response_text}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>Enter an observation to get an AI interpretation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default SignalLab; 