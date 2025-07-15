import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import { FaLanguage, FaArrowLeft } from 'react-icons/fa';
import { apiClient } from '../../lib/api';

function PlainEnglishTranslator() {
  const [originalText, setOriginalText] = useState('');
  const [output, setOutput] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!originalText.trim()) {
      setError('Please enter some text to translate.');
      return;
    }

    setIsLoading(true);
    setError('');
    setOutput(null);

    try {
      const response = await apiClient.plainEnglishTranslator(originalText);

      if (response.data) {
        setOutput(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate translation');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOutput = () => {
    if (!output) return null;

    return (
      <div className="space-y-6">
        {/* Plain English Rewrite */}
        {output.plain_english_rewrite && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plain English Rewrite</h3>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-gray-800 leading-relaxed">{output.plain_english_rewrite}</p>
            </div>
          </div>
        )}

        {/* Side by Side Table */}
        {output.side_by_side_table && output.side_by_side_table.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What It Says vs. What It Means</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      What It Says
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      What It Really Means
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {output.side_by_side_table.map((row: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-900">
                        {row.what_it_says}
                      </td>
                      <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-900">
                        {row.what_it_really_means}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Jargon Glossary */}
        {output.jargon_glossary && output.jargon_glossary.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Jargon Glossary</h3>
            <ul className="space-y-2">
              {output.jargon_glossary.map((term: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-800">{term}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Raw Output (for debugging) */}
        {output.raw_response && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Raw AI Response</h3>
            <div className="bg-gray-50 rounded-md p-4">
              <pre className="text-gray-800 whitespace-pre-wrap text-sm">{output.raw_response}</pre>
            </div>
          </div>
        )}
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
            <FaLanguage className="w-8 h-8 text-blue-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Plain-English Translator</h1>
          </div>
          <p className="text-gray-600 mt-2">Rewrite marketing copy into clear, human language.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Original Text</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marketing Copy
                </label>
                <textarea
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  placeholder="Paste your marketing copy here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={8}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isLoading || !originalText.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isLoading ? 'Translating...' : 'Translate to Plain English'}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Translation Results</h2>
            {output ? (
              renderOutput()
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FaLanguage className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Enter your marketing copy and click translate to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default PlainEnglishTranslator; 