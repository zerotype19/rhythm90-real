import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import SavedResponseActions from '../components/SavedResponseActions';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/auth';
import { 
  FaBullseye, 
  FaGraduationCap, 
  FaBriefcase, 
  FaPlay, 
  FaChartLine, 
  FaExclamationTriangle, 
  FaUsers, 
  FaFileAlt,
  FaLightbulb,
  FaClipboardList,
  FaCheckCircle,
  FaArrowRight,
  FaChartBar,
  FaUserTie
} from 'react-icons/fa';

interface PlannerInputs {
  bigChallenge: string;
  learningGoals: string[];
  businessContext: string;
  knownPlays: string;
  signalsToWatch: string[];
  blockers: string;
  roles: {
    rhythm90Lead: string;
    strategicLeads: string[];
    executionalLeads: string[];
    signalOwner: string;
  };
}

interface StructuredSummary {
  title: string;
  objective: string;
  keyFocusAreas: string[];
  plays: Array<{
    title: string;
    description: string;
    leads: string[];
    expectedOutcome: string;
  }>;
  learningGoals: string[];
  signalsToWatch: string[];
  nextSteps: string[];
}

function QuarterlyPlannerForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [inputs, setInputs] = useState<PlannerInputs>({
    bigChallenge: '',
    learningGoals: [],
    businessContext: '',
    knownPlays: '',
    signalsToWatch: [],
    blockers: '',
    roles: {
      rhythm90Lead: '',
      strategicLeads: [],
      executionalLeads: [],
      signalOwner: ''
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [structuredSummary, setStructuredSummary] = useState<StructuredSummary | null>(null);
  const [session, setSession] = useState<any>(null);
  const { currentTeam } = useAuth();

  // Available options
  const learningGoalOptions = [
    'Customer retention', 'Experience friction', 'Growth channels', 'Team alignment',
    'Data & analytics', 'Product-market fit', 'Operational efficiency', 'Brand awareness',
    'Revenue optimization', 'User engagement', 'Market expansion', 'Process improvement',
    'Technology adoption', 'Competitive analysis', 'Other'
  ];

  const signalOptions = [
    'Funnel drop-offs', 'Click-throughs / engagement', 'Support / field feedback',
    'Revenue metrics', 'User behavior', 'Market trends', 'Competitor activity',
    'Team performance', 'Customer feedback', 'Operational metrics', 'Other'
  ];

  const roleOptions = [
    'sam', 'dave', 'frank', 'sarah', 'mike', 'jessica', 'alex', 'emma', 'david', 'lisa'
  ];

  // Helper to parse AI response
  const parseAIResponse = (response: string): StructuredSummary | null => {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
      return null;
    }
  };

  // Helper to render structured summary
  const renderStructuredSummary = () => {
    if (!structuredSummary) return null;

    const sections = [
      {
        key: 'objective',
        label: 'Objective',
        icon: <FaBullseye className="text-red-500 mr-2" />,
        content: structuredSummary.objective,
      },
      {
        key: 'keyFocusAreas',
        label: 'Key Focus Areas',
        icon: <FaChartBar className="text-blue-500 mr-2" />,
        content: structuredSummary.keyFocusAreas,
        isList: true,
      },
      {
        key: 'plays',
        label: 'Plays to Implement',
        icon: <FaPlay className="text-green-500 mr-2" />,
        content: structuredSummary.plays,
        isPlays: true,
      },
      {
        key: 'learningGoals',
        label: 'Learning Goals',
        icon: <FaGraduationCap className="text-purple-500 mr-2" />,
        content: structuredSummary.learningGoals,
        isList: true,
      },
      {
        key: 'signalsToWatch',
        label: 'Signals to Watch',
        icon: <FaChartLine className="text-orange-500 mr-2" />,
        content: structuredSummary.signalsToWatch,
        isList: true,
      },
      {
        key: 'nextSteps',
        label: 'Next Steps',
        icon: <FaArrowRight className="text-emerald-500 mr-2" />,
        content: structuredSummary.nextSteps,
        isList: true,
      },
    ];

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border border-red-200">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{structuredSummary.title}</h3>
        </div>
        
        {sections.map((section) => {
          if (!section.content || (Array.isArray(section.content) && section.content.length === 0)) {
            return null;
          }

          return (
            <div key={section.key} className="bg-white rounded-md shadow-sm p-3">
              <div className="flex items-center mb-2">
                {section.icon}
                <span className="font-bold text-sm text-gray-900">{section.label}</span>
              </div>
              <div className="text-xs text-gray-800 leading-relaxed">
                {section.isList && Array.isArray(section.content) ? (
                  <ul className="ml-5 space-y-1 list-disc">
                    {section.content.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : section.isPlays && Array.isArray(section.content) ? (
                  <div className="space-y-3">
                    {section.content.map((play: any, index: number) => (
                      <div key={index} className="border-l-2 border-blue-200 pl-3">
                        <h4 className="font-semibold text-gray-900 mb-1">{play.title}</h4>
                        <p className="text-gray-700 mb-2">{play.description}</p>
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Leads:</span> {play.leads.join(', ')}
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Expected Outcome:</span> {play.expectedOutcome}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>{section.content}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const saveSession = async () => {
    setIsLoading(true);
    try {
      console.log('Saving planner session with inputs:', inputs);
      
      const response = await apiClient.planner.createSession({ inputs });
      console.log('API response:', response);

      if (response.data?.session && response.data?.summary) {
        setSession(response.data.session);
        setSummary(response.data.summary);
        
        // Try to parse the summary as structured data
        const parsed = parseAIResponse(response.data.summary);
        if (parsed) {
          setStructuredSummary(parsed);
        }
      }
    } catch (error) {
      console.error('Error saving planner session:', error);
      alert('Error saving planner session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    if (currentStep === 7) {
      // Generate summary when moving from step 7 to step 8
      await saveSession();
    } else if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateInput = (field: keyof PlannerInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const updateRoles = (field: keyof PlannerInputs['roles'], value: any) => {
    setInputs(prev => ({
      ...prev,
      roles: { ...prev.roles, [field]: value }
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What's your team's biggest challenge this quarter?
              </label>
              <textarea
                value={inputs.bigChallenge}
                onChange={(e) => updateInput('bigChallenge', e.target.value)}
                placeholder="E.g., improve customer retention by 20%"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                Describe the main challenge or goal your team needs to tackle this quarter.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What do you want to learn or improve this quarter?
              </label>
              <div className="space-y-2">
                {learningGoalOptions.map((goal) => (
                  <label key={goal} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={inputs.learningGoals.includes(goal)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateInput('learningGoals', [...inputs.learningGoals, goal]);
                        } else {
                          updateInput('learningGoals', inputs.learningGoals.filter(g => g !== goal));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{goal}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select the areas where your team wants to grow or improve.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What's the business context for this quarter?
              </label>
              <textarea
                value={inputs.businessContext}
                onChange={(e) => updateInput('businessContext', e.target.value)}
                placeholder="E.g., new product launch, market expansion, cost optimization"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Describe the broader business context or initiatives happening this quarter.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What plays or strategies do you already know you'll be running?
              </label>
              <textarea
                value={inputs.knownPlays}
                onChange={(e) => updateInput('knownPlays', e.target.value)}
                placeholder="E.g., loyalty program optimization, email campaign series"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                List any plays, campaigns, or strategies you've already planned.
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What signals should you watch to measure progress?
              </label>
              <div className="space-y-2">
                {signalOptions.map((signal) => (
                  <label key={signal} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={inputs.signalsToWatch.includes(signal)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateInput('signalsToWatch', [...inputs.signalsToWatch, signal]);
                        } else {
                          updateInput('signalsToWatch', inputs.signalsToWatch.filter(s => s !== signal));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{signal}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select the key metrics and signals you'll monitor this quarter.
              </p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What blockers or challenges do you anticipate?
              </label>
              <textarea
                value={inputs.blockers}
                onChange={(e) => updateInput('blockers', e.target.value)}
                placeholder="E.g., resource constraints, technical limitations, market conditions"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Identify potential obstacles or challenges that might impact your quarter.
              </p>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign roles and responsibilities
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Rhythm90 Lead</label>
                  <select
                    value={inputs.roles.rhythm90Lead}
                    onChange={(e) => updateRoles('rhythm90Lead', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  >
                    <option value="">Select lead</option>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Strategic Leads</label>
                  <select
                    multiple
                    value={inputs.roles.strategicLeads}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      updateRoles('strategicLeads', selected);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Executional Leads</label>
                  <select
                    multiple
                    value={inputs.roles.executionalLeads}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      updateRoles('executionalLeads', selected);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Signal Owner</label>
                  <select
                    value={inputs.roles.signalOwner}
                    onChange={(e) => updateRoles('signalOwner', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  >
                    <option value="">Select owner</option>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Assign team members to key roles for this quarter's initiatives.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Quarterly Planner</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Your Quarter</h2>
            
            {/* Progress indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Step {currentStep} of 7</span>
                <span className="text-sm text-gray-500">{Math.round((currentStep / 7) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 7) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && !inputs.bigChallenge.trim()) ||
                  (currentStep === 2 && inputs.learningGoals.length === 0) ||
                  (currentStep === 5 && inputs.signalsToWatch.length === 0) ||
                  (currentStep === 7 && isLoading)
                }
                className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {currentStep === 7 ? (isLoading ? 'Generating...' : 'Generate Summary') : 'Next'}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaLightbulb className="text-yellow-400" /> Quarterly Summary
            </h2>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Generating your quarterly summary...</p>
              </div>
            ) : structuredSummary ? (
              <div>
                {renderStructuredSummary()}
                {/* Action buttons for saving/favoriting/sharing */}
                <div className="bg-gray-50 rounded-lg p-2 mt-3">
                  <SavedResponseActions
                    toolName="Quarterly Planner"
                    responseData={structuredSummary}
                    teamId={currentTeam?.id}
                    summary={`Quarterly Plan: "${inputs.bigChallenge.substring(0, 100)}${inputs.bigChallenge.length > 100 ? '...' : ''}"`}
                  />
                </div>
              </div>
            ) : summary ? (
              <div>
                <div className="prose max-w-none text-xs">
                  <pre style={{whiteSpace: 'pre-wrap'}} className="bg-gray-50 rounded-md p-2 border border-gray-100">{summary}</pre>
                </div>
                {/* Action buttons for saving/favoriting/sharing */}
                <div className="bg-gray-50 rounded-lg p-2 mt-3">
                  <SavedResponseActions
                    toolName="Quarterly Planner"
                    responseData={{ summary }}
                    teamId={currentTeam?.id}
                    summary={`Quarterly Plan: "${inputs.bigChallenge.substring(0, 100)}${inputs.bigChallenge.length > 100 ? '...' : ''}"`}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>Complete the steps to generate your quarterly planning summary</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default QuarterlyPlannerForm; 