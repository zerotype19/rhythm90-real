import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { apiClient } from '../lib/api';
import { FaLightbulb, FaClipboardList, FaCheckCircle, FaChartLine, FaUserTie, FaArrowRight } from 'react-icons/fa';

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

    const sectionOrder = [
      'Hypothesis',
      'How-to-Run Summary',
      'Signals to Watch',
      'Owner Role',
      'What Success Looks Like',
      'Next Recommendation',
    ];
    const sectionIcons: Record<string, JSX.Element> = {
      'Hypothesis': <FaLightbulb className="text-yellow-500 mr-2" />,
      'How-to-Run Summary': <FaClipboardList className="text-blue-500 mr-2" />,
      'Signals to Watch': <FaChartLine className="text-green-500 mr-2" />,
      'Owner Role': <FaUserTie className="text-purple-500 mr-2" />,
      'What Success Looks Like': <FaCheckCircle className="text-emerald-500 mr-2" />,
      'Next Recommendation': <FaArrowRight className="text-orange-500 mr-2" />,
    };

    // Try to parse bolded sections (**Section Name:**)
    const boldSectionRegex = /\*\*(.+?):\*\*\n([\s\S]*?)(?=(\n\*\*|$))/g;
    let sections: { title: string; content: string }[] = [];
    let match;
    while ((match = boldSectionRegex.exec(output)) !== null) {
      sections.push({ title: match[1].trim(), content: match[2].trim() });
    }

    // If not found, try numbered sections (1. Section Name:)
    if (sections.length === 0) {
      const numberedSectionRegex = /(?:^|\n)(\d+)\.\s*([^:]+):\n([\s\S]*?)(?=(?:\n\d+\.|$))/g;
      while ((match = numberedSectionRegex.exec(output)) !== null) {
        sections.push({ title: match[2].trim(), content: match[3].trim(), number: match[1] });
      }
    }

    // If still not found, fallback to output as a single block
    if (sections.length === 0) {
      return (
        <div className="prose max-w-none text-xs">
          <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-2">
            <FaLightbulb aria-label="Output" className="inline text-yellow-400" /> Output
          </label>
          <pre style={{whiteSpace: 'pre-wrap'}} className="bg-gray-50 rounded-md p-2 border border-gray-100">{output}</pre>
        </div>
      );
    }

    // Render sections in order, only if present
    return (
      <div className="space-y-4">
        {sectionOrder.map((section, idx) => {
          const sec = sections.find(s => s.title.toLowerCase() === section.toLowerCase());
          if (!sec) return null;
          // Find the number if present (for numbered sections)
          const number = sec.number || (sections.length === sectionOrder.length ? (idx + 1).toString() : undefined);
          return (
            <div key={section} className="bg-white rounded-md shadow-sm p-3">
              <div className="flex items-center mb-1">
                {sectionIcons[section]}
                <span className="font-bold text-sm text-gray-900 mr-1">{number ? number + '.' : ''}</span>
                <span className="font-bold text-sm text-gray-900">{section}</span>
              </div>
              <div className="text-xs text-gray-800 leading-relaxed mt-1" style={{fontSize: '13px'}}>
                {/* Enhance readability: bold sub-headlines like **Timeframe:** */}
                {sec.content.split(/\n/).map((line, i) => {
                  // Bold sub-headlines (e.g., **Timeframe:**)
                  const subHeadlineMatch = line.match(/^\-?\s*\*\*(.+?):\*\*\s*(.*)$/);
                  if (subHeadlineMatch) {
                    return (
                      <div key={i} className="mb-1">
                        <span className="font-semibold text-gray-900">{subHeadlineMatch[1]}:</span> <span>{subHeadlineMatch[2]}</span>
                      </div>
                    );
                  }
                  // Bulleted list
                  if (line.trim().startsWith('- ')) {
                    return <div key={i} className="ml-2 mb-1">{line}</div>;
                  }
                  // Numbered list
                  if (line.trim().match(/^\d+\./)) {
                    return <div key={i} className="ml-2 mb-1">{line}</div>;
                  }
                  // Default
                  return <div key={i} className="mb-1">{line}</div>;
                })}
              </div>
            </div>
          );
        })}
        {/* Render any extra sections not in the standard order */}
        {sections.filter(s => !sectionOrder.map(x => x.toLowerCase()).includes(s.title.toLowerCase())).map((sec, idx) => (
          <div key={sec.title + idx} className="bg-white rounded-md shadow-sm p-3">
            <div className="flex items-center mb-1">
              <FaLightbulb className="text-yellow-500 mr-2" />
              <span className="font-bold text-sm text-gray-900">{sec.title}</span>
            </div>
            <div className="text-xs text-gray-800 leading-relaxed mt-1" style={{fontSize: '13px'}}>
              {sec.content.split(/\n/).map((line, i) => <div key={i} className="mb-1">{line}</div>)}
            </div>
          </div>
        ))}
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