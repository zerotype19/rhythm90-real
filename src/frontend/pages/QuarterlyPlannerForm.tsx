import { useState } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../lib/auth';
import { apiCall } from '../lib/api';

interface PlannerInputs {
  bigChallenge: string;
  learningGoals: string[];
  businessContext?: string;
  knownPlays?: string;
  signalsToWatch: string[];
  blockers?: string;
  roles: {
    rhythm90Lead?: string;
    strategicLeads?: string[];
    executionalLeads?: string[];
    signalOwner?: string;
  };
}

interface PlannerSession {
  id: string;
  team_id: string;
  created_by: string;
  inputs_json: string;
  output_summary: string | null;
  created_at: string;
}

const LEARNING_GOALS_OPTIONS = [
  'Conversion rates',
  'Customer retention',
  'Creative effectiveness',
  'Message clarity',
  'Experience friction',
  'Audience targeting',
  'Other'
];

const SIGNALS_OPTIONS = [
  'Funnel drop-offs',
  'Customer feedback / verbatims',
  'Click-throughs / engagement',
  'Behavioral patterns',
  'Channel performance',
  'Support / field feedback'
];

function QuarterlyPlannerForm() {
  const { currentTeam } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [session, setSession] = useState<PlannerSession | null>(null);
  
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

  const [otherLearningGoal, setOtherLearningGoal] = useState('');
  const [otherSignal, setOtherSignal] = useState('');

  const updateInputs = (updates: Partial<PlannerInputs>) => {
    setInputs(prev => ({ ...prev, ...updates }));
  };

  const toggleLearningGoal = (goal: string) => {
    setInputs(prev => ({
      ...prev,
      learningGoals: prev.learningGoals.includes(goal)
        ? prev.learningGoals.filter(g => g !== goal)
        : [...prev.learningGoals, goal]
    }));
  };

  const toggleSignal = (signal: string) => {
    setInputs(prev => ({
      ...prev,
      signalsToWatch: prev.signalsToWatch.includes(signal)
        ? prev.signalsToWatch.filter(s => s !== signal)
        : [...prev.signalsToWatch, signal]
    }));
  };

  const addOtherLearningGoal = () => {
    if (otherLearningGoal.trim() && !inputs.learningGoals.includes(otherLearningGoal.trim())) {
      setInputs(prev => ({
        ...prev,
        learningGoals: [...prev.learningGoals, otherLearningGoal.trim()]
      }));
      setOtherLearningGoal('');
    }
  };

  const addOtherSignal = () => {
    if (otherSignal.trim() && !inputs.signalsToWatch.includes(otherSignal.trim())) {
      setInputs(prev => ({
        ...prev,
        signalsToWatch: [...prev.signalsToWatch, otherSignal.trim()]
      }));
      setOtherSignal('');
    }
  };

  const removeLearningGoal = (goal: string) => {
    setInputs(prev => ({
      ...prev,
      learningGoals: prev.learningGoals.filter(g => g !== goal)
    }));
  };

  const removeSignal = (signal: string) => {
    setInputs(prev => ({
      ...prev,
      signalsToWatch: prev.signalsToWatch.filter(s => s !== signal)
    }));
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

  const saveSession = async () => {
    setIsLoading(true);
    try {
      console.log('Saving planner session with inputs:', inputs);
      
      const response = await apiCall('/api/planner/sessions', {
        method: 'POST',
        body: JSON.stringify({ inputs })
      });

      console.log('API response:', response);

      if (response.error) {
        console.error('API error:', response.error);
        alert(`Error generating summary: ${response.error}`);
        return;
      }

      if (response.data?.session && response.data?.summary) {
        setSession(response.data.session);
        setSummary(response.data.summary);
        setCurrentStep(8); // Show summary
      } else {
        console.error('Unexpected response format:', response);
        alert('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Error saving planner session:', error);
      alert('Error saving planner session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSummary = () => {
    const content = `
Quarterly Planner Summary
Generated on: ${new Date().toLocaleDateString()}

BIG CHALLENGE
${inputs.bigChallenge}

LEARNING GOALS
${inputs.learningGoals.join('\n• ')}

BUSINESS CONTEXT
${inputs.businessContext || 'Not specified'}

KNOWN PLAYS
${inputs.knownPlays || 'None specified'}

SIGNALS TO WATCH
${inputs.signalsToWatch.join('\n• ')}

BLOCKERS
${inputs.blockers || 'None identified'}

ROLES
• Rhythm90 Lead: ${inputs.roles.rhythm90Lead || 'Not assigned'}
• Strategic Leads: ${inputs.roles.strategicLeads?.join(', ') || 'Not assigned'}
• Executional Leads: ${inputs.roles.executionalLeads?.join(', ') || 'Not assigned'}
• Signal Owner: ${inputs.roles.signalOwner || 'Not assigned'}

AI-GENERATED SUMMARY
${summary}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quarterly-planner-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareWithTeam = () => {
    // For now, just copy to clipboard
    const shareText = `Quarterly Planner Summary\n\n${summary}`;
    navigator.clipboard.writeText(shareText).then(() => {
      alert('Summary copied to clipboard!');
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What's the big challenge or goal this quarter?</h2>
              <p className="text-gray-600 mb-4">Describe the main challenge you're trying to solve or goal you're working toward.</p>
              <textarea
                value={inputs.bigChallenge}
                onChange={(e) => updateInputs({ bigChallenge: e.target.value })}
                placeholder="e.g., Improve customer retention by 20%, Launch new product feature, Increase conversion rates..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What are we trying to learn or improve?</h2>
              <p className="text-gray-600 mb-4">Select all that apply:</p>
              <div className="space-y-3">
                {LEARNING_GOALS_OPTIONS.map((goal) => (
                  <label key={goal} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inputs.learningGoals.includes(goal)}
                      onChange={() => toggleLearningGoal(goal)}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-gray-700">{goal}</span>
                  </label>
                ))}
              </div>
              
              {inputs.learningGoals.includes('Other') && (
                <div className="mt-4 flex space-x-2">
                  <input
                    type="text"
                    value={otherLearningGoal}
                    onChange={(e) => setOtherLearningGoal(e.target.value)}
                    placeholder="Specify other learning goal..."
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    onClick={addOtherLearningGoal}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}

              {inputs.learningGoals.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected goals:</p>
                  <div className="flex flex-wrap gap-2">
                    {inputs.learningGoals.map((goal) => (
                      <span
                        key={goal}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
                      >
                        {goal}
                        <button
                          onClick={() => removeLearningGoal(goal)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What's the business context?</h2>
              <p className="text-gray-600 mb-4">Any important business context, market conditions, or strategic considerations? (Optional)</p>
              <textarea
                value={inputs.businessContext}
                onChange={(e) => updateInputs({ businessContext: e.target.value })}
                placeholder="e.g., New competitor entering market, Q4 budget constraints, Leadership changes..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Any known plays or bets already?</h2>
              <p className="text-gray-600 mb-4">What initiatives, experiments, or bets are you already planning or considering? (Optional)</p>
              <textarea
                value={inputs.knownPlays}
                onChange={(e) => updateInputs({ knownPlays: e.target.value })}
                placeholder="e.g., A/B test new pricing model, Launch referral program, Redesign onboarding flow..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What signals should we watch for?</h2>
              <p className="text-gray-600 mb-4">Select signals that will help you understand if you're on track:</p>
              <div className="space-y-3">
                {SIGNALS_OPTIONS.map((signal) => (
                  <label key={signal} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inputs.signalsToWatch.includes(signal)}
                      onChange={() => toggleSignal(signal)}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-gray-700">{signal}</span>
                  </label>
                ))}
              </div>
              
              <div className="mt-4 flex space-x-2">
                <input
                  type="text"
                  value={otherSignal}
                  onChange={(e) => setOtherSignal(e.target.value)}
                  placeholder="Add your own signal..."
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  onClick={addOtherSignal}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Add
                </button>
              </div>

              {inputs.signalsToWatch.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected signals:</p>
                  <div className="flex flex-wrap gap-2">
                    {inputs.signalsToWatch.map((signal) => (
                      <span
                        key={signal}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {signal}
                        <button
                          onClick={() => removeSignal(signal)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Any known blockers or dependencies?</h2>
              <p className="text-gray-600 mb-4">What might slow you down or prevent success? (Optional)</p>
              <textarea
                value={inputs.blockers}
                onChange={(e) => updateInputs({ blockers: e.target.value })}
                placeholder="e.g., Resource constraints, Technical debt, External dependencies..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>
          </motion.div>
        );

      case 7:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Who's who this quarter?</h2>
              <p className="text-gray-600 mb-4">Assign key roles for this quarter:</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rhythm90 Lead
                  </label>
                  <input
                    type="text"
                    value={inputs.roles.rhythm90Lead}
                    onChange={(e) => updateInputs({ 
                      roles: { ...inputs.roles, rhythm90Lead: e.target.value }
                    })}
                    placeholder="Who will facilitate rituals and keep the team on track?"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strategic Lead(s)
                  </label>
                  <input
                    type="text"
                    value={inputs.roles.strategicLeads?.join(', ') || ''}
                    onChange={(e) => updateInputs({ 
                      roles: { 
                        ...inputs.roles, 
                        strategicLeads: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      }
                    })}
                    placeholder="Who will provide strategic direction? (comma-separated)"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Executional Lead(s)
                  </label>
                  <input
                    type="text"
                    value={inputs.roles.executionalLeads?.join(', ') || ''}
                    onChange={(e) => updateInputs({ 
                      roles: { 
                        ...inputs.roles, 
                        executionalLeads: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      }
                    })}
                    placeholder="Who will drive execution? (comma-separated)"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Signal Owner (Optional)
                  </label>
                  <input
                    type="text"
                    value={inputs.roles.signalOwner}
                    onChange={(e) => updateInputs({ 
                      roles: { ...inputs.roles, signalOwner: e.target.value }
                    })}
                    placeholder="Who will monitor and report on signals?"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 8:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Quarterly Planner Summary</h2>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Big Challenge</h3>
                    <p className="text-gray-700">{inputs.bigChallenge}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900">Learning Goals</h3>
                    <ul className="list-disc list-inside text-gray-700">
                      {inputs.learningGoals.map((goal, index) => (
                        <li key={index}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {inputs.businessContext && (
                    <div>
                      <h3 className="font-semibold text-gray-900">Business Context</h3>
                      <p className="text-gray-700">{inputs.businessContext}</p>
                    </div>
                  )}
                  
                  {inputs.knownPlays && (
                    <div>
                      <h3 className="font-semibold text-gray-900">Known Plays</h3>
                      <p className="text-gray-700">{inputs.knownPlays}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-semibold text-gray-900">Signals to Watch</h3>
                    <ul className="list-disc list-inside text-gray-700">
                      {inputs.signalsToWatch.map((signal, index) => (
                        <li key={index}>{signal}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {inputs.blockers && (
                    <div>
                      <h3 className="font-semibold text-gray-900">Blockers</h3>
                      <p className="text-gray-700">{inputs.blockers}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-semibold text-gray-900">Roles</h3>
                    <div className="space-y-2 text-gray-700">
                      <p><strong>Rhythm90 Lead:</strong> {inputs.roles.rhythm90Lead || 'Not assigned'}</p>
                      <p><strong>Strategic Leads:</strong> {inputs.roles.strategicLeads?.join(', ') || 'Not assigned'}</p>
                      <p><strong>Executional Leads:</strong> {inputs.roles.executionalLeads?.join(', ') || 'Not assigned'}</p>
                      <p><strong>Signal Owner:</strong> {inputs.roles.signalOwner || 'Not assigned'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {summary && (
                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-3">AI-Generated Insights</h3>
                  <div className="prose prose-sm max-w-none text-blue-800">
                    {summary.split('\n').map((line, index) => (
                      <p key={index} className="mb-2">{line}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={saveSession}
                  disabled={isLoading}
                  className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Summary'}
                </button>
                <button
                  onClick={shareWithTeam}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Share with Team
                </button>
                <button
                  onClick={downloadSummary}
                  className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Download Summary
                </button>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quarterly Planner</h1>
          <p className="text-gray-600">
            Prepare for your quarterly Kickoff by clarifying challenges, goals, and alignment
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of 8
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / 8) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 8) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        {currentStep < 8 && (
          <div className="mt-8 flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
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
        )}
      </div>
    </AppLayout>
  );
}

export default QuarterlyPlannerForm; 