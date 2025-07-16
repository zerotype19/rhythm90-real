import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { apiClient } from '../lib/api';
import AppLayout from '../components/AppLayout';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  DocumentTextIcon,
  PlayIcon,
  SignalIcon,
  BookOpenIcon,
  WrenchScrewdriverIcon
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
  summary?: string;
  sharedSlug?: string;
  timestamp: string;
  responseId?: string;
}

interface Announcement {
  id: number;
  title: string;
  body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


interface DashboardData {
  stats: DashboardStats;
  teamActivity: TeamActivity[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Re-add state for announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '', is_active: true });
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);

  const isAdmin = user?.email === 'kevin.mcgovern@gmail.com';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 2. Re-add effect to load announcements
  useEffect(() => {
    if (!user) return;
    setAnnouncementsLoading(true);
    apiClient.getDashboardAnnouncements()
      .then(res => {
        if (res.data?.announcements) setAnnouncements(res.data.announcements);
        else setAnnouncements([]);
      })
      .catch(() => setAnnouncements([]))
      .finally(() => setAnnouncementsLoading(false));
  }, [user]);

  // 3. Re-add announcement handlers
  const handleOpenAnnouncementModal = (a?: Announcement) => {
    setEditingAnnouncement(a || null);
    setAnnouncementForm(a ? { title: a.title, body: a.body, is_active: a.is_active } : { title: '', body: '', is_active: true });
    setShowAnnouncementModal(true);
  };
  const handleCloseAnnouncementModal = () => {
    setShowAnnouncementModal(false);
    setEditingAnnouncement(null);
    setAnnouncementForm({ title: '', body: '', is_active: true });
    setAnnouncementError(null);
  };
  const handleAnnouncementFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAnnouncementForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  const handleAnnouncementActiveChange = (v: boolean) => {
    setAnnouncementForm(f => ({ ...f, is_active: v }));
  };
  const handleSaveAnnouncement = async () => {
    setAnnouncementSaving(true);
    setAnnouncementError(null);
    try {
      if (editingAnnouncement) {
        await apiClient.updateDashboardAnnouncement(editingAnnouncement.id.toString(), {
          title: announcementForm.title,
          summary: announcementForm.body,
          body: announcementForm.body,
          is_active: announcementForm.is_active
        });
      } else {
        await apiClient.createDashboardAnnouncement({
          title: announcementForm.title,
          summary: announcementForm.body,
          body: announcementForm.body,
          is_active: announcementForm.is_active
        });
      }
      // Reload
      const res = await apiClient.getDashboardAnnouncements();
      if (res.data?.announcements) setAnnouncements(res.data.announcements);
      else setAnnouncements([]);
      handleCloseAnnouncementModal();
    } catch (err: any) {
      setAnnouncementError('Failed to save announcement');
    } finally {
      setAnnouncementSaving(false);
    }
  };
  const handleDeleteAnnouncement = async (id: number) => {
    if (!window.confirm('Delete this announcement?')) return;
    setAnnouncementSaving(true);
    setAnnouncementError(null);
    try {
      await apiClient.deleteDashboardAnnouncement(id.toString());
      const res = await apiClient.getDashboardAnnouncements();
      if (res.data?.announcements) setAnnouncements(res.data.announcements);
      else setAnnouncements([]);
      handleCloseAnnouncementModal();
    } catch (err: any) {
      setAnnouncementError('Failed to delete announcement');
    } finally {
      setAnnouncementSaving(false);
    }
  };


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

        {/* Quick Navigation */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/app/play-builder"
              className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
            >
              <PlayIcon className="h-8 w-8 text-blue-600 group-hover:text-blue-700 mb-2" />
              <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700">Play Builder</span>
            </a>
            
            <a
              href="/app/signal-lab"
              className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition-all duration-200 group"
            >
              <SignalIcon className="h-8 w-8 text-green-600 group-hover:text-green-700 mb-2" />
              <span className="text-sm font-medium text-gray-900 group-hover:text-green-700">Signal Lab</span>
            </a>
            
            <a
              href="/app/ritual-guide"
              className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-300 transition-all duration-200 group"
            >
              <BookOpenIcon className="h-8 w-8 text-purple-600 group-hover:text-purple-700 mb-2" />
              <span className="text-sm font-medium text-gray-900 group-hover:text-purple-700">Ritual Guide</span>
            </a>
            
            <a
              href="/app/mini-tools"
              className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-300 transition-all duration-200 group"
            >
              <WrenchScrewdriverIcon className="h-8 w-8 text-orange-600 group-hover:text-orange-700 mb-2" />
              <span className="text-sm font-medium text-gray-900 group-hover:text-orange-700">Mini Tools</span>
            </a>
          </div>
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
                        {dashboardData?.stats.topTools && dashboardData.stats.topTools.length > 0 
                          ? dashboardData.stats.topTools.reduce((max, tool) => tool.count > max.count ? tool : max).toolName 
                          : 'None'}
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
                          <span className="text-gray-600"> {activity.action === 'shared' ? 'shared a' : 'favorited a'} response from </span>
                          <a 
                            href={activity.sharedSlug ? `/app/team-shared/${activity.sharedSlug}` : `/app/team-shared`}
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            {activity.toolName}
                          </a>
                        </p>
                        <p className="text-sm text-gray-500">{formatTimestamp(activity.timestamp)}</p>
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent team activity</p>
              )}
            </div>
          </div>

          {/* Announcements Panel */}
          <section className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Announcements</h3>
              {user?.email === 'kevin.mcgovern@gmail.com' && (
                <button
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={() => handleOpenAnnouncementModal()}
                >
                  New Announcement
                </button>
              )}
            </div>
            {announcementsLoading ? (
              <div className="text-gray-500">Loading...</div>
            ) : announcements.length === 0 ? (
              <div className="text-gray-500">No announcements yet.</div>
            ) : (
              <ul className="space-y-4">
                {(announcements || []).filter(a => a.is_active).map(a => (
                  <li key={a.id} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{a.title}</div>
                      <div className="text-gray-700 mt-1 whitespace-pre-line">{a.body}</div>
                    </div>
                    {user?.email === 'kevin.mcgovern@gmail.com' && (
                      <div className="mt-2 md:mt-0 md:ml-4 flex space-x-2">
                        <button
                          className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                          onClick={() => handleOpenAnnouncementModal(a)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-2 py-1 text-xs bg-gray-100 text-red-600 border border-red-200 rounded hover:bg-red-50"
                          onClick={() => handleDeleteAnnouncement(a.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div>

        {/* Announcement Modal */}
        {showAnnouncementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h4 className="text-lg font-semibold mb-4">{editingAnnouncement ? 'Edit' : 'New'} Announcement</h4>
              <div className="space-y-4">
                <input
                  type="text"
                  name="title"
                  className="w-full border rounded px-3 py-2"
                  placeholder="Title"
                  value={announcementForm.title}
                  onChange={handleAnnouncementFormChange}
                />
                <textarea
                  name="body"
                  className="w-full border rounded px-3 py-2"
                  placeholder="Body"
                  rows={4}
                  value={announcementForm.body}
                  onChange={handleAnnouncementFormChange}
                />
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={announcementForm.is_active}
                    onChange={e => handleAnnouncementActiveChange(e.target.checked)}
                  />
                  <span>Active</span>
                </label>
                {announcementError && <div className="text-red-600 text-sm">{announcementError}</div>}
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={handleCloseAnnouncementModal}
                  disabled={announcementSaving}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={handleSaveAnnouncement}
                  disabled={announcementSaving}
                >
                  {announcementSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

       </div>
   </AppLayout>
 );
};



export default Dashboard; 