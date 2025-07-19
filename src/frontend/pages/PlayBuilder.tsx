import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import SavedResponseActions from '../components/SavedResponseActions';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/auth';
import { trackAIGeneration } from '../utils/analytics';
import { FaLightbulb, FaClipboardList, FaCheckCircle, FaChartLine, FaUserTie, FaArrowRight } from 'react-icons/fa';

const OWNER_ROLE_OPTIONS = [
  'Rhythm90 Lead',
  'Strategic Lead', 
  'Executional Lead',
  'Signal Owner',
  'Other'
];

function PlayBuilder() {
  // Form fields
  const [playIdea, setPlayIdea] = useState('');
  const [whyThisPlay, setWhyThisPlay] = useState('');
  const [targetOutcome, setTargetOutcome] = useState('');
  const [signalsToWatch, setSignalsToWatch] = useState('');
  const [ownerRole, setOwnerRole] = useState('');
  const [ownerRoleOther, setOwnerRoleOther] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // Output
  const [output, setOutput] = useState('');
  const [structured, setStructured] = useState<any>(null);
  const [hypothesis, setHypothesis] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userNote, setUserNote] = useState('');
  
  // Validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Prompt context for saving
  const [promptContext, setPromptContext] = useState<{
    system_prompt?: string;
    user_input?: string;
    final_prompt?: string;
    raw_response_text?: string;
  } | null>(null);
  
  const { currentTeam } = useAuth();

  // Helper to validate fields
  const validate = () => {
    const errs: {[key: string]: string} = {};
    
    if (!playIdea.trim()) errs.play_idea = 'Play Idea is required.';
    if (playIdea.length > 300) errs.play_idea = 'Max 300 characters.';
    
    if (!whyThisPlay.trim()) errs.why_this_play = 'Why This Play is required.';
    if (whyThisPlay.length > 300) errs.why_this_play = 'Max 300 characters.';
    
    if (!targetOutcome.trim()) errs.target_outcome = 'Target Outcome is required.';
    if (targetOutcome.length > 300) errs.target_outcome = 'Max 300 characters.';
    
    if (!signalsToWatch.trim()) errs.signals_to_watch = 'Signals to Watch is required.';
    if (signalsToWatch.length > 300) errs.signals_to_watch = 'Max 300 characters.';
    
    if (!ownerRole) errs.owner_role = 'Owner Role is required.';
    if (ownerRole === 'Other' && (!ownerRoleOther.trim() || ownerRoleOther.length > 50)) {
      errs.owner_role_other = 'Required, max 50 characters.';
    }
    
    if (additionalNotes.length > 300) errs.additional_notes = 'Max 300 characters.';
    
    return errs;
  };

  // Helper to render structured output
  const renderStructured = () => {
    if (!structured) return null;
    
    // Helper to format nested objects
    const formatNestedContent = (content: any, sectionKey: string) => {
      if (Array.isArray(content)) {
        return content.filter(Boolean).map((item: string, i: number) => <li key={i}>{item}</li>);
      } else if (typeof content === 'object' && content !== null) {
        // Handle nested objects like how_to_run_summary, owner_role, what_success_looks_like
        const items = [];
        for (const [key, value] of Object.entries(content)) {
          if (value) {
            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            items.push(
              <div key={key} className="mb-2">
                <span className="font-semibold text-gray-900">{formattedKey}:</span> <span>{String(value)}</span>
              </div>
            );
          }
        }
        return items;
      } else if (typeof content === 'string') {
        return content;
      }
      return null;
    };

    const sections = [
      {
        key: 'hypothesis',
        label: 'Hypothesis',
        icon: <FaLightbulb className="text-yellow-500 mr-2" />,
        content: structured.hypothesis,
      },
      {
        key: 'how_to_run_summary',
        label: 'How-to-Run Summary',
        icon: <FaClipboardList className="text-blue-500 mr-2" />,
        content: structured.how_to_run_summary,
      },
      {
        key: 'signals_to_watch',
        label: 'Signals to Watch',
        icon: <FaChartLine className="text-green-500 mr-2" />,
        content: structured.signals_to_watch,
      },
      {
        key: 'owner_role',
        label: 'Owner Role',
        icon: <FaUserTie className="text-purple-500 mr-2" />,
        content: structured.owner_role,
      },
      {
        key: 'what_success_looks_like',
        label: 'What Success Looks Like',
        icon: <FaCheckCircle className="text-emerald-500 mr-2" />,
        content: structured.what_success_looks_like,
      },
      {
        key: 'next_recommendation',
        label: 'Next Recommendation',
        icon: <FaArrowRight className="text-orange-500 mr-2" />,
        content: structured.next_recommendation,
      },
    ];
    
    return (
      <div className="space-y-4">
        {sections.map((section) => {
          const formattedContent = formatNestedContent(section.content, section.key);
          if (!formattedContent) return null;
          
          return (
            <div key={section.key} className="bg-white rounded-md shadow-sm p-3">
              <div className="flex items-center mb-1">
                {section.icon}
                <span className="font-bold text-sm text-gray-900">{section.label}</span>
              </div>
              <div className="text-xs text-gray-800 leading-relaxed mt-1" style={{fontSize: '13px'}}>
                {Array.isArray(formattedContent) ? (
                  <ul className={`ml-5 space-y-1 ${['signals_to_watch', 'next_recommendation'].includes(section.key) ? 'list-disc' : 'list-none'}`}>
                    {formattedContent}
                  </ul>
                ) : formattedContent}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper to render legacy output
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
    
    trackAIGeneration('play_builder');
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
        play_idea: extractValue(playIdea),
        observed_signal: extractValue(whyThisPlay),
        target_outcome: extractValue(targetOutcome),
        signals_to_watch: extractValue(signalsToWatch),
        owner_role: extractValue(ownerRole === 'Other' ? ownerRoleOther : ownerRole),
        additional_context: extractValue(additionalNotes)
      };
      
      const response = await apiClient.generatePlay(payload);
      if (response.data) {
        // Extract prompt context if available
        if (response.data._promptContext) {
          setPromptContext(response.data._promptContext);
        } else {
          setPromptContext(null);
        }
        
        // Check if we have structured data (new format)
        if (response.data.hypothesis || response.data.how_to_run_summary || response.data.signals_to_watch || 
            response.data.owner_role || response.data.what_success_looks_like || response.data.next_recommendation) {
          setStructured(response.data);
          setOutput('');
          setHypothesis('');
          setSuggestions([]);
          setUserNote(response.data.user_note || '');
        } else if (response.data.output) {
          // Legacy format
          setOutput(response.data.output);
          setStructured(null);
          setHypothesis('');
          setSuggestions([]);
          setUserNote('');
        } else {
          // Old legacy format
          setHypothesis(response.data.hypothesis || '');
          setSuggestions(response.data.suggestions || []);
          setOutput('');
          setStructured(null);
          setUserNote('');
        }
      }
    } catch (error) {
      console.error('Failed to generate play:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    return playIdea.trim() && 
           whyThisPlay.trim() && 
           targetOutcome.trim() && 
           signalsToWatch.trim() && 
           ownerRole && 
           !isLoading;
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
              {/* Play Idea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Play Idea <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={playIdea}
                  onChange={e => setPlayIdea(e.target.value)}
                  placeholder="Describe the change, experiment, or idea you want to test or explore."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  maxLength={300}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">This is your core idea or challenge.</p>
                  <span className="text-xs text-gray-400">{playIdea.length}/300</span>
                </div>
                {errors.play_idea && <p className="text-xs text-red-500">{errors.play_idea}</p>}
              </div>

              {/* Why This Play? */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why This Play? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={whyThisPlay}
                  onChange={e => setWhyThisPlay(e.target.value)}
                  placeholder="What feedback, data, or observation makes this worth testing?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  maxLength={300}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">Mention what prompted the idea (e.g., drop-off, insight, feedback).</p>
                  <span className="text-xs text-gray-400">{whyThisPlay.length}/300</span>
                </div>
                {errors.why_this_play && <p className="text-xs text-red-500">{errors.why_this_play}</p>}
              </div>

              {/* Target Outcome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Outcome <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={targetOutcome}
                  onChange={e => setTargetOutcome(e.target.value)}
                  placeholder="What's the measurable goal or improvement you're aiming for?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  maxLength={300}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">Be specific — e.g., +15% bundling, -20% abandonment.</p>
                  <span className="text-xs text-gray-400">{targetOutcome.length}/300</span>
                </div>
                {errors.target_outcome && <p className="text-xs text-red-500">{errors.target_outcome}</p>}
              </div>

              {/* Signals to Watch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signals to Watch <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={signalsToWatch}
                  onChange={e => setSignalsToWatch(e.target.value)}
                  placeholder="What clues or indicators will tell you if it's working?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  maxLength={300}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">Include quantitative (KPIs) and qualitative (feedback) signals.</p>
                  <span className="text-xs text-gray-400">{signalsToWatch.length}/300</span>
                </div>
                {errors.signals_to_watch && <p className="text-xs text-red-500">{errors.signals_to_watch}</p>}
              </div>

              {/* Owner Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner Role <span className="text-red-500">*</span>
                </label>
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
                <p className="text-xs text-gray-500 mt-1">Who will own this play?</p>
                {errors.owner_role && <p className="text-xs text-red-500">{errors.owner_role}</p>}
                {errors.owner_role_other && <p className="text-xs text-red-500">{errors.owner_role_other}</p>}
              </div>

              {/* Additional Notes (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
                <textarea
                  value={additionalNotes}
                  onChange={e => setAdditionalNotes(e.target.value)}
                  placeholder="Add any helpful background or details."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  maxLength={300}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">Add any helpful background or details.</p>
                  <span className="text-xs text-gray-400">{additionalNotes.length}/300</span>
                </div>
                {errors.additional_notes && <p className="text-xs text-red-500">{errors.additional_notes}</p>}
              </div>

              <button
                onClick={handleGenerate}
                disabled={!isFormValid()}
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
            {userNote && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">{userNote}</p>
              </div>
            )}
            {isLoading ? (
              <div className="text-center py-12">
                <LoadingSpinner size="lg" showText text="Generating your hypothesis..." />
              </div>
            ) : structured ? (
              <div>
                {renderStructured()}
                {/* Action buttons for saving/favoriting/sharing */}
                <div className="bg-gray-50 rounded-lg p-2 mt-3">
                  <SavedResponseActions
                    toolName="Play Builder"
                    responseData={structured}
                    teamId={currentTeam?.id}
                    summary={`Play: "${playIdea.substring(0, 100)}${playIdea.length > 100 ? '...' : ''}"`}
                    systemPrompt={promptContext?.system_prompt}
                    userInput={promptContext?.user_input}
                    finalPrompt={promptContext?.final_prompt}
                    rawResponseText={promptContext?.raw_response_text}
                  />
                </div>
              </div>
            ) : output ? (
              <div>
                {renderOutput()}
                {/* Action buttons for saving/favoriting/sharing */}
                <div className="bg-gray-50 rounded-lg p-2 mt-3">
                  <SavedResponseActions
                    toolName="Play Builder"
                    responseData={{ output, hypothesis, suggestions }}
                    teamId={currentTeam?.id}
                    summary={`Play: "${playIdea.substring(0, 100)}${playIdea.length > 100 ? '...' : ''}"`}
                    systemPrompt={promptContext?.system_prompt}
                    userInput={promptContext?.user_input}
                    finalPrompt={promptContext?.final_prompt}
                    rawResponseText={promptContext?.raw_response_text}
                  />
                </div>
              </div>
            ) : hypothesis ? (
              <div>
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
                {/* Action buttons for saving/favoriting/sharing */}
                <div className="bg-gray-50 rounded-lg p-2 mt-3">
                  <SavedResponseActions
                    toolName="Play Builder"
                    responseData={{ hypothesis, suggestions }}
                    teamId={currentTeam?.id}
                    summary={`Play: "${playIdea.substring(0, 100)}${playIdea.length > 100 ? '...' : ''}"`}
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