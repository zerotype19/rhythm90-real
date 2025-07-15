import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { apiClient } from '../lib/api';
import AppLayout from '../components/AppLayout';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalSavedResponses: number;
  totalTeamShared: number;
  topTools: Array<{
    toolName: string;
    count: number;
  }>;
}

interface TeamActivity {
  id: string;
  userName: string;
  action: string;
  toolName: string;
  timestamp: string;
  responseId?: string;
}

interface Announcement {
  id: string;
  title: string;
  summary: string;
  body?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DashboardData {
  stats: DashboardStats;
  teamActivity: TeamActivity[];
  announcements: Announcement[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Set<string>>(new Set());

  const isAdmin = user?.email === 'kevin.mcgovern@gmail.com';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Dashboard: Fetching dashboard overview data');
      const response = await apiClient.getDashboardOverview();
      console.log('Dashboard: Overview response:', response);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Dashboard: Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnouncement = async (formData: { title: string; summary: string; body?: string }) => {
    try {
      console.log('Dashboard: Creating announcement:', formData);
      const response = await apiClient.createDashboardAnnouncement(formData);
      console.log('Dashboard: Announcement created successfully');
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setShowAddModal(false);
      fetchDashboardData();
    } catch (err) {
      console.error('Dashboard: Error creating announcement:', err);
      setError('Failed to create announcement');
    }
  };

  const handleEditAnnouncement = async (id: string, formData: { title: string; summary: string; body?: string }) => {
    try {
      console.log('Dashboard: Updating announcement:', id, formData);
      const response = await apiClient.updateDashboardAnnouncement(id, formData);
      console.log('Dashboard: Announcement updated successfully');
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setShowEditModal(false);
      setEditingAnnouncement(null);
      fetchDashboardData();
    } catch (err) {
      console.error('Dashboard: Error updating announcement:', err);
      setError('Failed to update announcement');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      console.log('Dashboard: Deleting announcement:', id);
      const response = await apiClient.deleteDashboardAnnouncement(id);
      console.log('Dashboard: Announcement deleted successfully');
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      fetchDashboardData();
    } catch (err) {
      console.error('Dashboard: Error deleting announcement:', err);
      setError('Failed to delete announcement');
    }
  };

  const toggleAnnouncementExpansion = (id: string) => {
    const newExpanded = new Set(expandedAnnouncements);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAnnouncements(newExpanded);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

    return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.name || 'User'}! Here's what's happening with your team.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Stats + Team Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Stats (Last 30 Days)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">Saved Responses</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {dashboardData?.stats.totalSavedResponses || 0}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">Team Shared</p>
                      <p className="text-2xl font-bold text-green-900">
                        {dashboardData?.stats.totalTeamShared || 0}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600">Most Used Tool</p>
                      <p className="text-lg font-bold text-purple-900">
                        {dashboardData?.stats.topTools[0]?.toolName || 'None'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Tools */}
              {dashboardData?.stats.topTools && dashboardData.stats.topTools.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Top Tools</h3>
                  <div className="space-y-2">
                    {dashboardData.stats.topTools.slice(0, 3).map((tool, index) => (
                      <div key={tool.toolName} className="flex justify-between items-center py-2">
                        <span className="text-gray-700">{tool.toolName}</span>
                        <span className="text-gray-500 font-medium">{tool.count} uses</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Team Activity Feed */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Team Activity</h2>
              {dashboardData?.teamActivity && dashboardData.teamActivity.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.teamActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <p className="text-gray-900">
                          <span className="font-medium">{activity.userName}</span>
                          <span className="text-gray-600"> {activity.action} on </span>
                          <span className="font-medium text-blue-600">{activity.toolName}</span>
                        </p>
                        <p className="text-sm text-gray-500">{formatTimestamp(activity.timestamp)}</p>
                      </div>
                      {activity.responseId && (
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent team activity</p>
              )}
            </div>
          </div>

          {/* Right Panel - Announcements */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Announcements</h2>
              {isAdmin && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add
                </button>
              )}
            </div>

            {dashboardData?.announcements && dashboardData.announcements.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.announcements
                  .filter(announcement => announcement.is_active)
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((announcement) => (
                    <div key={announcement.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                        {isAdmin && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingAnnouncement(announcement);
                                setShowEditModal(true);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAnnouncement(announcement.id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{announcement.summary}</p>
                      
                      {announcement.body && (
                        <div>
                          {expandedAnnouncements.has(announcement.id) ? (
                            <div>
                              <p className="text-sm text-gray-700 mb-2">{announcement.body}</p>
                              <button
                                onClick={() => toggleAnnouncementExpansion(announcement.id)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                              >
                                <EyeSlashIcon className="h-4 w-4 mr-1" />
                                Show less
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => toggleAnnouncementExpansion(announcement.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              Read more
                            </button>
                          )}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-2">
                        {formatTimestamp(announcement.created_at)}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No announcements</p>
            )}
          </div>
        </div>

        {/* Add Announcement Modal */}
        {showAddModal && (
          <AddAnnouncementModal
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddAnnouncement}
          />
        )}

                 {/* Edit Announcement Modal */}
         {showEditModal && editingAnnouncement && (
           <EditAnnouncementModal
             announcement={editingAnnouncement}
             onClose={() => {
               setShowEditModal(false);
               setEditingAnnouncement(null);
             }}
             onSubmit={handleEditAnnouncement}
           />
         )}
       </div>
   </AppLayout>
 );
};

// Add Announcement Modal Component
interface AddAnnouncementModalProps {
  onClose: () => void;
  onSubmit: (data: { title: string; summary: string; body?: string }) => void;
}

const AddAnnouncementModal: React.FC<AddAnnouncementModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({ title: '', summary: '', body: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.summary.trim()) newErrors.summary = 'Summary is required';
    if (formData.summary.length > 140) newErrors.summary = 'Summary must be 140 characters or less';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      title: formData.title.trim(),
      summary: formData.summary.trim(),
      body: formData.body.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Announcement</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Announcement title"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Summary <span className="text-gray-500">({formData.summary.length}/140)</span>
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief summary (max 140 characters)"
              />
              {errors.summary && <p className="mt-1 text-sm text-red-600">{errors.summary}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Body (Optional)</label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Full announcement content"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Announcement
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Edit Announcement Modal Component
interface EditAnnouncementModalProps {
  announcement: Announcement;
  onClose: () => void;
  onSubmit: (id: string, data: { title: string; summary: string; body?: string }) => void;
}

const EditAnnouncementModal: React.FC<EditAnnouncementModalProps> = ({ announcement, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({ 
    title: announcement.title, 
    summary: announcement.summary, 
    body: announcement.body || '' 
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.summary.trim()) newErrors.summary = 'Summary is required';
    if (formData.summary.length > 140) newErrors.summary = 'Summary must be 140 characters or less';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(announcement.id, {
      title: formData.title.trim(),
      summary: formData.summary.trim(),
      body: formData.body.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Announcement</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Announcement title"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Summary <span className="text-gray-500">({formData.summary.length}/140)</span>
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief summary (max 140 characters)"
              />
              {errors.summary && <p className="mt-1 text-sm text-red-600">{errors.summary}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Body (Optional)</label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Full announcement content"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update Announcement
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 