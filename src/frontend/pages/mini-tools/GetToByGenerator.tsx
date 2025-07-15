import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import { FaCrosshairs, FaArrowLeft } from 'react-icons/fa';
import { apiClient } from '../../lib/api';

function GetToByGenerator() {
  const [audienceDescription, setAudienceDescription] = useState('');
  const [behavioralOrEmotionalInsight, setBehavioralOrEmotionalInsight] = useState('');
  const [brandProductRole, setBrandProductRole] = useState('');
  const [output, setOutput] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!audienceDescription.trim() || !behavioralOrEmotionalInsight.trim() || !brandProductRole.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError('');
    setOutput(null);

    try {
      const response = await apiClient.getToByGenerator(audienceDescription, behavioralOrEmotionalInsight, brandProductRole);

      if (response.data) {
        setOutput(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate Get/To/By statement');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOutput = () => {
    if (!output) return null;

    return (
      <div className="space-y-6">
        {/* Get/To/By Statement */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Get/To/By Statement</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-md p-4">
              <div className="flex items-start">
                <span className="font-bold text-blue-800 mr-3">Get:</span>
                <p className="text-blue-900 leading-relaxed">{output.get}</p>
              </div>
            </div>
            <div className="bg-green-50 rounded-md p-4">
              <div className="flex items-start">
                <span className="font-bold text-green-800 mr-3">To:</span>
                <p className="text-green-900 leading-relaxed">{output.to}</p>
              </div>
            </div>
            <div className="bg-purple-50 rounded-md p-4">
              <div className="flex items-start">
                <span className="font-bold text-purple-800 mr-3">By:</span>
                <p className="text-purple-900 leading-relaxed">{output.by}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Complete Statement */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Statement</h3>
          <div className="bg-gray-50 rounded-md p-4">
            <p className="text-gray-800 leading-relaxed text-lg">
              <span className="font-semibold">Get</span> {output.get?.toLowerCase()} <span className="font-semibold">to</span> {output.to?.toLowerCase()} <span className="font-semibold">by</span> {output.by?.toLowerCase()}.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header with breadcrumb */}
        <div className="mb-6">
          <Link
            to="/app/mini-tools"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Back to Mini Tools
          </Link>
          <div className="flex items-center">
            <FaCrosshairs className="w-8 h-8 text-green-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Get/To/By Generator</h1>
          </div>
          <p className="text-gray-600 mt-2">Craft sharp Get/To/By strategy statements.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Strategy Inputs</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audience Description
                </label>
                <textarea
                  value={audienceDescription}
                  onChange={(e) => setAudienceDescription(e.target.value)}
                  placeholder="Describe your target audience behaviorally, not just demographically..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Behavioral or Emotional Insight
                </label>
                <textarea
                  value={behavioralOrEmotionalInsight}
                  onChange={(e) => setBehavioralOrEmotionalInsight(e.target.value)}
                  placeholder="What key insight drives your audience's behavior or emotions?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand/Product Role
                </label>
                <textarea
                  value={brandProductRole}
                  onChange={(e) => setBrandProductRole(e.target.value)}
                  placeholder="What specific action will your brand or product take?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isLoading || !audienceDescription.trim() || !behavioralOrEmotionalInsight.trim() || !brandProductRole.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isLoading ? 'Generating...' : 'Generate Get/To/By Statement'}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Statement</h2>
            {output ? (
              renderOutput()
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FaCrosshairs className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Fill in the strategy inputs and click generate to see your Get/To/By statement</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default GetToByGenerator; 