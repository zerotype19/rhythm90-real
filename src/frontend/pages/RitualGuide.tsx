import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { apiClient } from '../lib/api';

function RitualGuide() {
  const [ritualType, setRitualType] = useState<'kickoff' | 'pulse_check' | 'rr'>('kickoff');
  const [teamContext, setTeamContext] = useState('');
  const [agenda, setAgenda] = useState<string[]>([]);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.generateRitualPrompts(ritualType, teamContext);
      if (response.data) {
        setAgenda(response.data.agenda);
        setPrompts(response.data.prompts);
      }
    } catch (error) {
      console.error('Failed to generate ritual prompts:', error);
    } finally {
      setIsLoading(false);
    }
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
                  onChange={(e) => setRitualType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="kickoff">Kickoff Meeting</option>
                  <option value="pulse_check">Pulse Check</option>
                  <option value="rr">Retrospective & Planning</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Context (Optional)
                </label>
                <textarea
                  value={teamContext}
                  onChange={(e) => setTeamContext(e.target.value)}
                  placeholder="Describe your team's current situation, challenges, or focus areas..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
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
            
            {agenda.length > 0 || prompts.length > 0 ? (
              <div className="space-y-6">
                {agenda.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agenda
                    </label>
                    <ol className="space-y-2">
                      {agenda.map((item, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-red-500 font-medium">{index + 1}.</span>
                          <span className="text-gray-900">{item}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                
                {prompts.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discussion Prompts
                    </label>
                    <ul className="space-y-2">
                      {prompts.map((prompt, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span className="text-gray-900">{prompt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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