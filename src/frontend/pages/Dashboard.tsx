import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { apiClient } from '../lib/api';
import AppLayout from '../components/AppLayout';
import { useUsageTracking } from '../hooks/useUsageTracking';
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




interface DashboardData {
  stats: DashboardStats;
  teamActivity: TeamActivity[];
  systemAnnouncement: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { usageSummary, subscriptionStatus, isLoading: usageLoading } = useUsageTracking();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Announcements state
  const [systemAnnouncement, setSystemAnnouncement] = useState<string>('');

  const isAdmin = user?.email === 'kevin.mcgovern@gmail.com';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Load system announcement
  useEffect(() => {
    if (!user) return;
    if (dashboardData?.systemAnnouncement) {
      setSystemAnnouncement(dashboardData.systemAnnouncement);
    }
  }, [user, dashboardData?.systemAnnouncement]);


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

        {/* Usage Status Bars */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Tool Usage (This Billing Cycle)</h2>
              {subscriptionStatus && (
                <span className="text-sm font-medium text-gray-500 capitalize">
                  {subscriptionStatus.plan} Plan
                </span>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              {usageSummary ? (
                <div className="space-y-4">
                  {Object.entries(usageSummary).map(([toolName, usage]) => (
                    <div key={toolName} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {toolName.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-500">
                            {usage.limit === -1 ? 'Unlimited' : `${usage.used} / ${usage.limit}`}
                          </span>
                        </div>
                        {usage.limit !== -1 && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                usage.used >= usage.limit ? 'bg-red-500' :
                                usage.used >= usage.limit * 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : usageLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading usage summary...</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Unable to load usage data</p>
                </div>
              )}
            </div>
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

          {/* System Announcement Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Announcement</h2>
            {systemAnnouncement ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-blue-900 whitespace-pre-line">{systemAnnouncement}</div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">No system announcement</div>
            )}
          </div>

        </div>



       </div>
   </AppLayout>
 );
};



export default Dashboard; 