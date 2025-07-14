import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { apiClient } from '../lib/api';

function SignalLab() {
  const [observation, setObservation] = useState('');
  const [context, setContext] = useState('');
  const [output, setOutput] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleInterpret = async () => {
    if (!observation.trim()) return;

    setIsLoading(true);
    try {
      const response = await apiClient.interpretSignal(observation, context);
      if (response.data) {
        if (response.data.output) {
          setOutput(response.data.output);
          setInterpretation('');
          setConfidence(0);
        } else {
          setInterpretation(response.data.interpretation);
          setConfidence(response.data.confidence);
          setOutput('');
        }
      }
    } catch (error) {
      console.error('Failed to interpret signal:', error);
    } finally {
      setIsLoading(false);
    }
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
            {output ? (
              <div className="prose max-w-none">
                <pre style={{whiteSpace: 'pre-wrap'}}>{output}</pre>
              </div>
            ) : interpretation ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interpretation
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-gray-900">{interpretation}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confidence Level
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${confidence}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{confidence}%</span>
                  </div>
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