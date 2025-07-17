import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { apiClient } from '../lib/api';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';

interface AdminSettings {
  model: string;
  announcement: string;
}

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AdminSettings>({ model: '', announcement: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if user is admin
  if (!user?.is_admin) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access the admin panel.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAdminSettings();
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load admin settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const updateModel = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      const response = await apiClient.updateAdminModel(settings.model);
      if (response.data?.success) {
        setMessage({ type: 'success', text: 'Model updated successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update model' });
      }
    } catch (error) {
      console.error('Failed to update model:', error);
      setMessage({ type: 'error', text: 'Failed to update model' });
    } finally {
      setSaving(false);
    }
  };

  const updateAnnouncement = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      const response = await apiClient.updateAdminAnnouncement(settings.announcement);
      if (response.data?.success) {
        setMessage({ type: 'success', text: 'Announcement updated successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update announcement' });
      }
    } catch (error) {
      console.error('Failed to update announcement:', error);
      setMessage({ type: 'error', text: 'Failed to update announcement' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">Loading admin settings...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-2 text-gray-600">Manage system settings and announcements</p>
          
          {/* Navigation Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <div className="border-b-2 border-red-500 py-2 px-1 text-sm font-medium text-red-600">
                General Settings
              </div>
              <Link
                to="/app/admin/prompts"
                className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                System Prompts
              </Link>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Model Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">OpenAI Model Selection</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Model
                </label>
                <select
                  id="model"
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-4o">GPT-4o</option>
                </select>
              </div>
              <button
                onClick={updateModel}
                disabled={saving}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Updating...' : 'Update Model'}
              </button>
            </div>
          </div>

          {/* System Announcement */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Announcement</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="announcement" className="block text-sm font-medium text-gray-700 mb-2">
                  Announcement Text
                </label>
                <textarea
                  id="announcement"
                  value={settings.announcement}
                  onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                  rows={4}
                  placeholder="Enter system announcement (leave empty to clear)"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <button
                onClick={updateAnnouncement}
                disabled={saving}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Updating...' : 'Update Announcement'}
              </button>
            </div>
          </div>
        </div>

        {/* Current Settings Display */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Active Model:</span>
              <p className="text-gray-900 font-mono">{settings.model}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">System Announcement:</span>
              <p className="text-gray-900">
                {settings.announcement || <span className="text-gray-400 italic">No announcement set</span>}
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Admin; 