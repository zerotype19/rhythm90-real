import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import SavedResponseActions from '../components/SavedResponseActions';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/auth';
import { FaClipboardList, FaComments, FaUsers, FaLightbulb, FaCheckCircle } from 'react-icons/fa';

function RitualGuide() {
  const [ritualType, setRitualType] = useState('kickoff');
  const [teamType, setTeamType] = useState('');
  const [topChallenges, setTopChallenges] = useState('');
  const [focusAreas, setFocusAreas] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [output, setOutput] = useState('');
  const [structured, setStructured] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [userNote, setUserNote] = useState('');
  // Prompt context for saving
  const [promptContext, setPromptContext] = useState<{
    system_prompt?: string;
    user_input?: string;
    final_prompt?: string;
    raw_response_text?: string;
  } | null>(null);
  const { currentTeam } = useAuth();

  const handleGenerate = async () => {
    // Clear previous validation error and user note
    setValidationError('');
    setUserNote('');
    
    // Validate ritual type
    const validRitualTypes = ['kickoff', 'pulse_check', 'rr'];
    if (!validRitualTypes.includes(ritualType)) {
      setValidationError(`"${ritualType}" is not a valid Rhythm90 ritual. Please select Kickoff, Pulse Check, or R&R.`);
      return;
    }
    
    setIsLoading(true);
    try {
      const payload = {
        ritual_type: ritualType,
        team_type: teamType,
        top_challenges: topChallenges,
        focus_areas: focusAreas,
        additional_context: additionalContext
      };
      const response = await apiClient.generateRitualPrompts(payload);
      if (response.data) {
        // Extract prompt context if available
        if (response.data._promptContext) {
          setPromptContext(response.data._promptContext);
        } else {
          setPromptContext(null);
        }
        
        // Check for user note from backend
        if (response.data.user_note) {
          setUserNote(response.data.user_note);
        }
        
        // Handle raw response fallback
        if (response.data.raw_response) {
          setOutput(response.data.raw_response);
          setStructured(null);
          return;
        }
        
        // Try to parse structured fields
        if (
          response.data.agenda !== undefined ||
          response.data.discussion_prompts !== undefined ||
          response.data.roles_contributions !== undefined ||
          response.data.preparation_tips !== undefined ||
          response.data.success_definition !== undefined
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
      console.error('Failed to generate ritual prompts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render structured output
  const renderStructured = () => {
    if (!structured) return null;
    const sections = [
      {
        key: 'agenda',
        label: 'Agenda',
        icon: <FaClipboardList className="text-blue-500 mr-2" />,
        content: structured.agenda && Array.isArray(structured.agenda)
          ? structured.agenda.filter(Boolean).map((item: string, i: number) => <li key={i}>{item}</li>)
          : structured.agenda,
      },
      {
        key: 'discussion_prompts',
        label: 'Discussion Prompts',
        icon: <FaComments className="text-green-500 mr-2" />,
        content: structured.discussion_prompts && Array.isArray(structured.discussion_prompts)
          ? structured.discussion_prompts.filter(Boolean).map((item: string, i: number) => <li key={i}>{item}</li>)
          : structured.discussion_prompts,
      },
      {
        key: 'roles_contributions',
        label: 'Roles & Contributions',
        icon: <FaUsers className="text-purple-500 mr-2" />,
        content: structured.roles_contributions,
      },
      {
        key: 'preparation_tips',
        label: 'Preparation Tips',
        icon: <FaLightbulb className="text-yellow-500 mr-2" />,
        content: structured.preparation_tips && Array.isArray(structured.preparation_tips)
          ? structured.preparation_tips.filter(Boolean).map((item: string, i: number) => <li key={i}>{item}</li>)
          : structured.preparation_tips,
      },
      {
        key: 'success_definition',
        label: 'Success Definition',
        icon: <FaCheckCircle className="text-emerald-500 mr-2" />,
        content: structured.success_definition,
      },
    ];
    return (
      <div className="space-y-4">
        {sections.map((section) =>
          section.content && (Array.isArray(section.content) ? section.content.length > 0 : section.content.length > 0) ? (
            <div key={section.key} className="bg-white rounded-md shadow-sm p-3">
              <div className="flex items-center mb-1">
                {section.icon}
                <span className="font-bold text-sm text-gray-900">{section.label}</span>
              </div>
              <div className="text-xs text-gray-800 leading-relaxed mt-1" style={{fontSize: '13px'}}>
                {Array.isArray(section.content) ? (
                  <ul className={`ml-5 space-y-1 ${['agenda', 'discussion_prompts', 'preparation_tips'].includes(section.key) ? 'list-disc' : 'list-none'}`}>
                    {section.content}
                  </ul>
                ) : section.content}
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Ritual Guide</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Meeting Structure</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ritual Type
                </label>
                <select
                  value={ritualType}
                  onChange={(e) => {
                    setRitualType(e.target.value);
                    // Clear validation error when user selects a valid option
                    setValidationError('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="kickoff">Kickoff</option>
                  <option value="pulse_check">Pulse Check</option>
                  <option value="rr">R&R (Review & Renew)</option>
                </select>
                {validationError && (
                  <p className="mt-1 text-sm text-red-600">{validationError}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Type (Optional)
                </label>
                <input
                  type="text"
                  value={teamType}
                  onChange={(e) => setTeamType(e.target.value)}
                  placeholder="e.g., B2B SaaS, DTC, Agency..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Top Challenges (Optional)
                </label>
                <textarea
                  value={topChallenges}
                  onChange={(e) => setTopChallenges(e.target.value)}
                  placeholder="What are the main challenges your team is facing?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Focus Areas (Optional)
                </label>
                <textarea
                  value={focusAreas}
                  onChange={(e) => setFocusAreas(e.target.value)}
                  placeholder="What areas should the team focus on this quarter?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Any other relevant context about your team or situation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={2}
                />
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isLoading ? 'Generating...' : 'Generate Ritual'}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Meeting Structure</h2>
            {userNote && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">{userNote}</p>
              </div>
            )}
            {structured ? (
              <div>
                {renderStructured()}
                {/* Action buttons for saving/favoriting/sharing */}
                <div className="bg-gray-50 rounded-lg p-2 mt-3">
                  <SavedResponseActions
                    toolName="Ritual Guide"
                    responseData={structured}
                    teamId={currentTeam?.id}
                    summary={`${ritualType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} ritual for ${teamType || 'team'}`}
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
                    toolName="Ritual Guide"
                    responseData={{ output }}
                    teamId={currentTeam?.id}
                    summary={`${ritualType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} ritual for ${teamType || 'team'}`}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p>Select a ritual type and generate meeting structure</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default RitualGuide; 