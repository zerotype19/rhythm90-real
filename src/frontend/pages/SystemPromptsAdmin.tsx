import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { apiClient } from '../lib/api';
import { FaEdit, FaSave, FaTimes, FaInfoCircle, FaEye } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface SystemPrompt {
  id: string;
  tool_name: string;
  prompt_text: string;
  updated_at: string;
}

interface Placeholders {
  tool_name: string;
  placeholders: string[];
}

const SystemPromptsAdmin: React.FC = () => {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showPlaceholders, setShowPlaceholders] = useState<string | null>(null);
  const [placeholders, setPlaceholders] = useState<Placeholders | null>(null);

  // Check if user is admin
  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the system prompts admin panel.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSystemPrompts();
      if (response.data) {
        setPrompts(response.data);
      }
    } catch (error) {
      console.error('Failed to load system prompts:', error);
      setMessage({ type: 'error', text: 'Failed to load system prompts' });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (prompt: SystemPrompt) => {
    setEditingId(prompt.id);
    setEditingText(prompt.prompt_text);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
  };

  const savePrompt = async () => {
    if (!editingId) return;
    
    try {
      setSaving(true);
      setMessage(null);
      
      const response = await apiClient.updateSystemPrompt(editingId, editingText);
      if (response.data?.success) {
        setMessage({ type: 'success', text: 'System prompt updated successfully' });
        setEditingId(null);
        setEditingText('');
        loadPrompts(); // Reload to get updated data
      } else {
        setMessage({ type: 'error', text: 'Failed to update system prompt' });
      }
    } catch (error) {
      console.error('Failed to update system prompt:', error);
      setMessage({ type: 'error', text: 'Failed to update system prompt' });
    } finally {
      setSaving(false);
    }
  };

  const loadPlaceholders = async (toolName: string) => {
    try {
      console.log('Loading placeholders for tool:', toolName);
      const response = await apiClient.getPlaceholders(toolName);
      console.log('Placeholders response:', response);
      if (response.data && response.data.placeholders) {
        setPlaceholders(response.data);
        setShowPlaceholders(toolName);
      } else {
        console.error('Invalid placeholders data:', response.data);
        setMessage({ type: 'error', text: 'Invalid placeholders data received' });
      }
    } catch (error) {
      console.error('Failed to load placeholders:', error);
      setMessage({ type: 'error', text: 'Failed to load placeholders' });
    }
  };

  const closePlaceholders = () => {
    setShowPlaceholders(null);
    setPlaceholders(null);
  };

  const formatToolName = (toolName: string) => {
    return toolName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading system prompts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Prompts Management</h1>
          <p className="mt-2 text-gray-600">Manage AI system prompts for all tools and modules</p>
          
          {/* Navigation Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <Link
                to="/app/admin"
                className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                General Settings
              </Link>
              <div className="border-b-2 border-red-500 py-2 px-1 text-sm font-medium text-red-600">
                System Prompts
              </div>
            </nav>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* System Prompts Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">System Prompts</h2>
            <p className="text-sm text-gray-600 mt-1">
              Edit system prompts for each tool. Use {'{{placeholder}}'} syntax for dynamic content.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tool
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prompt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prompts.map((prompt) => (
                  <tr key={prompt.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatToolName(prompt.tool_name)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {prompt.tool_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === prompt.id ? (
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          rows={4}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Enter system prompt..."
                        />
                      ) : (
                        <div className="text-sm text-gray-900 max-w-md">
                          {prompt.prompt_text.length > 200 
                            ? `${prompt.prompt_text.substring(0, 200)}...` 
                            : prompt.prompt_text
                          }
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(prompt.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingId === prompt.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={savePrompt}
                            disabled={saving}
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <FaSave className="w-4 h-4 mr-1" />
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-gray-600 hover:text-gray-900 flex items-center"
                          >
                            <FaTimes className="w-4 h-4 mr-1" />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditing(prompt)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <FaEdit className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => loadPlaceholders(prompt.tool_name)}
                            className="text-purple-600 hover:text-purple-900 flex items-center"
                          >
                            <FaEye className="w-4 h-4 mr-1" />
                            Placeholders
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Placeholders Modal */}
        {showPlaceholders && placeholders && placeholders.placeholders && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Available Placeholders
                </h3>
                <button
                  onClick={closePlaceholders}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Tool: <span className="font-medium">{placeholders?.tool_name ? formatToolName(placeholders.tool_name) : 'Unknown'}</span>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  These placeholders can be used in the system prompt with {'{{placeholder}}'} syntax.
                </p>
              </div>

              {placeholders?.placeholders && placeholders.placeholders.length > 0 ? (
                <div className="space-y-2">
                  {placeholders.placeholders.map((placeholder, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <FaInfoCircle className="w-4 h-4 text-blue-500" />
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {`{{${placeholder}}}`}
                      </code>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No placeholders found in this prompt.
                </p>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closePlaceholders}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use Placeholders</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              • Use <code className="bg-blue-100 px-1 rounded">{'{{placeholder_name}}'}</code> syntax in your prompts
            </p>
            <p>
              • Placeholders will be automatically replaced with actual form data when the AI is called
            </p>
            <p>
              • Click "Placeholders" to see available placeholders for each tool
            </p>
            <p>
              • Changes are applied immediately to all new AI calls
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemPromptsAdmin; 