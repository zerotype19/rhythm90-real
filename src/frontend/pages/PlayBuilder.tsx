import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { apiClient } from '../lib/api';

function PlayBuilder() {
  const [idea, setIdea] = useState('');
  const [context, setContext] = useState('');
  const [output, setOutput] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!idea.trim()) return;

    setIsLoading(true);
    try {
      const response = await apiClient.generatePlay(idea, context);
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Idea
                </label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Describe your idea or observation..."
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
                  placeholder="Add any relevant context about your team, market, or situation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={!idea.trim() || isLoading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isLoading ? 'Generating...' : 'Generate Hypothesis'}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Hypothesis</h2>
            {output ? (
              <div className="prose max-w-none">
                {/* Optionally use a markdown renderer here if desired */}
                <pre style={{whiteSpace: 'pre-wrap'}}>{output}</pre>
              </div>
            ) : hypothesis ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hypothesis
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-gray-900">{hypothesis}</p>
                  </div>
                </div>
                
                {suggestions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Testing Suggestions
                    </label>
                    <ul className="space-y-2">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-red-500 mt-1">•</span>
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