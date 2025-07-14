import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { apiClient } from '../lib/api';
import { FaLightbulb, FaClipboardList, FaCheckCircle } from 'react-icons/fa';

const TEAM_TYPE_OPTIONS = [
  'B2B', 'B2C', 'SaaS', 'DTC', 'Agency', 'Other'
];
const QUARTER_FOCUS_OPTIONS = [
  'Growth', 'Retention', 'Friction Reduction', 'Brand Lift', 'Other'
];
const OWNER_ROLE_OPTIONS = [
  'Rhythm90 Lead', 'Strategic Lead', 'Executional Lead', 'Signal Owner', 'Other'
];

function PlayBuilder() {
  // New fields
  const [teamType, setTeamType] = useState('');
  const [teamTypeOther, setTeamTypeOther] = useState('');
  const [quarterFocus, setQuarterFocus] = useState('');
  const [quarterFocusOther, setQuarterFocusOther] = useState('');
  const [topSignal, setTopSignal] = useState('');
  const [ownerRole, setOwnerRole] = useState('');
  const [ownerRoleOther, setOwnerRoleOther] = useState('');
  const [ideaPrompt, setIdeaPrompt] = useState('');
  // Legacy fields
  const [context, setContext] = useState('');
  // Output
  const [output, setOutput] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Helper to validate fields
  const validate = () => {
    const errs: {[key: string]: string} = {};
    if (!ideaPrompt.trim()) errs.idea_prompt = 'Idea is required.';
    if (ideaPrompt.length > 300) errs.idea_prompt = 'Max 300 characters.';
    if (context.length > 300) errs.context = 'Max 300 characters.';
    if (topSignal.length > 300) errs.top_signal = 'Max 300 characters.';
    if (teamType === 'Other' && (!teamTypeOther.trim() || teamTypeOther.length > 50)) errs.team_type_other = 'Required, max 50 characters.';
    if (quarterFocus === 'Other' && (!quarterFocusOther.trim() || quarterFocusOther.length > 50)) errs.quarter_focus_other = 'Required, max 50 characters.';
    if (ownerRole === 'Other' && (!ownerRoleOther.trim() || ownerRoleOther.length > 50)) errs.owner_role_other = 'Required, max 50 characters.';
    return errs;
  };

  // Helper to render output
  const renderOutput = () => {
    if (!output) return null;
    let parsed: any = null;
    // Try JSON parse first
    try {
      parsed = JSON.parse(output);
    } catch (e) {
      parsed = null;
    }
    // If JSON and has hypothesis/suggestions
    if (parsed && (parsed.hypothesis || parsed.suggestions)) {
      return (
        <div className="space-y-6 text-xs">
          {parsed.hypothesis && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FaLightbulb aria-label="Hypothesis" className="inline text-yellow-400" /> Hypothesis
              </label>
              <div className="p-2 bg-gray-50 rounded-md border border-gray-100">
                <p className="text-gray-900">{parsed.hypothesis}</p>
              </div>
            </div>
          )}
          {parsed.hypothesis && parsed.suggestions && (
            <hr className="my-2 border-gray-200" />
          )}
          {parsed.suggestions && Array.isArray(parsed.suggestions) && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-2">
                <FaClipboardList aria-label="Testing Suggestions" className="inline text-blue-400" /> Testing Suggestions
              </label>
              <ul className="space-y-2 bg-gray-50 rounded-md p-2 border border-gray-100">
                {parsed.suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <FaCheckCircle aria-label="Suggestion" className="text-green-500 mt-0.5" />
                    <span className="text-gray-900">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    // Try to parse new multi-section output (numbered sections)
    const sectionRegex = /(?:^|\n)(\d+)\.\s*([^\n]+)\n([\s\S]*?)(?=(?:\n\d+\.|$))/g;
    const sections: { title: string; content: string }[] = [];
    let match;
    while ((match = sectionRegex.exec(output)) !== null) {
      sections.push({ title: match[2].trim(), content: match[3].trim() });
    }
    if (sections.length > 0) {
      // Map section titles to icons
      const sectionIcons: Record<string, JSX.Element> = {
        'Hypothesis': <FaLightbulb aria-label="Hypothesis" className="inline text-yellow-400" />,
        'How-to-Run Summary': <FaClipboardList aria-label="How-to-Run" className="inline text-blue-400" />,
        'Signals to Watch': <FaClipboardList aria-label="Signals" className="inline text-blue-400" />,
        'Owner Role': <FaCheckCircle aria-label="Owner Role" className="inline text-green-500" />,
        'What Success Looks Like': <FaCheckCircle aria-label="Success" className="inline text-green-500" />,
      };
      return (
        <div className="space-y-6 text-xs">
          {sections.map((section, idx) => (
            <div key={idx}>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-2">
                {sectionIcons[section.title] || null} {section.title}
              </label>
              <div className="p-2 bg-gray-50 rounded-md border border-gray-100 whitespace-pre-line">
                <span className="text-gray-900">{section.content}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }
    // Fallback: show as preformatted text
    return (
      <div className="prose max-w-none text-xs">
        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-2">
          <FaLightbulb aria-label="Output" className="inline text-yellow-400" /> Output
        </label>
        <pre style={{whiteSpace: 'pre-wrap'}} className="bg-gray-50 rounded-md p-2 border border-gray-100">{output}</pre>
      </div>
    );
  };

  const handleGenerate = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setIsLoading(true);
    try {
      // Helper to extract .value for dropdowns/objects, or use string
      const extractValue = (field: any) => {
        if (field && typeof field === 'object') {
          if ('value' in field && typeof field.value === 'string') return field.value;
          if ('label' in field && typeof field.label === 'string') return field.label;
          return '';
        }
        return typeof field === 'string' ? field : (field ? String(field) : '');
      };
      const payload: any = {
        team_type: extractValue(teamType === 'Other' ? teamTypeOther : teamType),
        quarter_focus: extractValue(quarterFocus === 'Other' ? quarterFocusOther : quarterFocus),
        top_signal: extractValue(topSignal),
        owner_role: extractValue(ownerRole === 'Other' ? ownerRoleOther : ownerRole),
        idea_prompt: extractValue(ideaPrompt),
        idea: extractValue(ideaPrompt), // legacy
        context: extractValue(context)
      };
      const response = await apiClient.generatePlay(payload);
      if (response.data) {
        if (response.data.output) {
          setOutput(response.data.output);
          setHypothesis('');
          setSuggestions([]);
        } else {
          setHypothesis(response.data.hypothesis);
          setSuggestions(response.data.suggestions);
          setOutput('');
        }
      }
    } catch (error) {
      console.error('Failed to generate play:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Play Builder</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transform Your Idea</h2>
            
            <div className="space-y-4">
              {/* Team Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Type</label>
                <select
                  value={teamType}
                  onChange={e => setTeamType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select team type</option>
                  {TEAM_TYPE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {teamType === 'Other' && (
                  <input
                    type="text"
                    value={teamTypeOther}
                    onChange={e => setTeamTypeOther(e.target.value)}
                    maxLength={50}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Please specify (max 50 characters)"
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">Select the type of team or business model. Choose ‘Other’ to enter a custom type.</p>
                {errors.team_type_other && <p className="text-xs text-red-500">{errors.team_type_other}</p>}
              </div>
              {/* Quarter Focus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quarter Focus</label>
                <select
                  value={quarterFocus}
                  onChange={e => setQuarterFocus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select focus</option>
                  {QUARTER_FOCUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {quarterFocus === 'Other' && (
                  <input
                    type="text"
                    value={quarterFocusOther}
                    onChange={e => setQuarterFocusOther(e.target.value)}
                    maxLength={50}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Please specify (max 50 characters)"
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">What is your team’s main focus this quarter? Choose ‘Other’ to enter a custom focus area.</p>
                {errors.quarter_focus_other && <p className="text-xs text-red-500">{errors.quarter_focus_other}</p>}
              </div>
              {/* Top Signal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Top Signal</label>
                <input
                  type="text"
                  value={topSignal}
                  onChange={e => setTopSignal(e.target.value)}
                  maxLength={300}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="E.g., high churn at onboarding"
                />
                <p className="text-xs text-gray-500 mt-1">Describe the key signal or observation driving this play. (E.g., ‘High churn at onboarding’)</p>
                {errors.top_signal && <p className="text-xs text-red-500">{errors.top_signal}</p>}
              </div>
              {/* Owner Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Role</label>
                <select
                  value={ownerRole}
                  onChange={e => setOwnerRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select owner role</option>
                  {OWNER_ROLE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {ownerRole === 'Other' && (
                  <input
                    type="text"
                    value={ownerRoleOther}
                    onChange={e => setOwnerRoleOther(e.target.value)}
                    maxLength={50}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Please specify (max 50 characters)"
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">Who will own this play? Select a role or choose ‘Other’ to enter a custom owner.</p>
                {errors.owner_role_other && <p className="text-xs text-red-500">{errors.owner_role_other}</p>}
              </div>
              {/* Idea Prompt (Your Idea) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Idea</label>
                <textarea
                  value={ideaPrompt}
                  onChange={e => setIdeaPrompt(e.target.value)}
                  placeholder="Describe your idea or challenge"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={4}
                  maxLength={300}
                />
                <p className="text-xs text-gray-500 mt-1">Briefly describe your idea or challenge. (Required, max 300 characters)</p>
                {errors.idea_prompt && <p className="text-xs text-red-500">{errors.idea_prompt}</p>}
              </div>
              {/* Context (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Context (Optional)</label>
                <textarea
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  placeholder="Add any relevant background, team details, or market context..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  maxLength={300}
                />
                <p className="text-xs text-gray-500 mt-1">Add any relevant background, team details, or market context. (Optional, max 300 characters)</p>
                {errors.context && <p className="text-xs text-red-500">{errors.context}</p>}
              </div>
              <button
                onClick={handleGenerate}
                disabled={!ideaPrompt.trim() || isLoading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isLoading ? 'Generating...' : 'Generate Hypothesis'}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaLightbulb className="text-yellow-400" /> Generated Hypothesis
            </h2>
            {output ? (
              renderOutput()
            ) : hypothesis ? (
              <div className="space-y-6 text-xs">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <FaLightbulb aria-label="Hypothesis" className="inline text-yellow-400" /> Hypothesis
                  </label>
                  <div className="p-2 bg-gray-50 rounded-md border border-gray-100">
                    <p className="text-gray-900">{hypothesis}</p>
                  </div>
                </div>
                {hypothesis && suggestions.length > 0 && (
                  <hr className="my-2 border-gray-200" />
                )}
                {suggestions.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <FaClipboardList aria-label="Testing Suggestions" className="inline text-blue-400" /> Testing Suggestions
                    </label>
                    <ul className="space-y-2 bg-gray-50 rounded-md p-2 border border-gray-100">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <FaCheckCircle aria-label="Suggestion" className="text-green-500 mt-0.5" />
                          <span className="text-gray-900">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p>Enter your idea and generate a testable hypothesis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default PlayBuilder; 