import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useState } from 'react';
import AssistantModal from './AssistantModal';
import FloatingChatIcon from './FloatingChatIcon';
import LoggedInFooter from './LoggedInFooter';
import { useUsageTracking } from '../hooks/useUsageTracking';

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { user, teams, currentTeam, setCurrentTeam, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const { subscriptionStatus } = useUsageTracking();

  // Rhythm90 Guide Section
  const rhythm90Guide = [
    { name: 'Rhythm90 Guide', href: '/app/training', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { name: 'Rhythm90 Assistant', href: '#', icon: 'M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z', onClick: () => setAssistantOpen(true) },
  ];

  // Working Tools Section
  const workingTools = [
    { name: 'Dashboard', href: '/app/dashboard', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
    { name: 'Quarterly Planner', href: '/app/quarterly-planner', icon: 'M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-8 0h8m-8 0a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2m-8 0v4h8V9a2 2 0 00-2-2' },
    { name: 'Play Builder', href: '/app/play-builder', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    { name: 'Signal Lab', href: '/app/signal-lab', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Ritual Guide', href: '/app/ritual-guide', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'Mini Tools', href: '/app/mini-tools', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
  ];

  // Collaboration Section
  const collaboration = [
    { name: 'Team Shared', href: '/app/team-shared', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'Community', href: '/app/community', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'History', href: '/app/history', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', deEmphasized: true },
  ];

  // System Section
  const system = [
    { name: 'Team Benchmarking', href: '/app/team-benchmarking', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Settings', href: '/app/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    ...(user?.is_admin ? [{ name: 'Admin', href: '/app/admin', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }] : []),
  ];

  const renderNavigationSection = (items: any[], sectionName?: string) => (
    <div key={sectionName}>
      {sectionName && (
        <div className="px-3 py-2">
          <h3 className="text-xs text-gray-400 uppercase tracking-wide font-medium">
            {sectionName}
          </h3>
        </div>
      )}
      {items.map((item) => {
        const isActive = location.pathname === item.href;
        
        if (item.onClick) {
          return (
            <button
              key={item.name}
              onClick={item.onClick}
              className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-red-100 text-red-700'
                  : item.deEmphasized
                  ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={item.icon}
                />
              </svg>
              {item.name}
            </button>
          );
        }
        
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-red-100 text-red-700'
                : item.deEmphasized
                ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={item.icon}
              />
            </svg>
            {item.name}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Hamburger */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white shadow z-50">
        <Link to="/app/dashboard" className="text-2xl font-bold text-red-500 hover:text-red-600 transition-colors">
          Rhythm90
        </Link>
        <button
          className="text-gray-700 focus:outline-none"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {/* Sidebar */}
      <div>
        {/* Desktop Sidebar */}
        <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-50 md:w-64 md:bg-white md:shadow-lg md:block">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
              <Link to="/app/dashboard" className="text-2xl font-bold text-red-500 hover:text-red-600 transition-colors">
                Rhythm90
              </Link>
            </div>
            {/* Team Selector */}
            {teams.length > 0 && (
              <div className="p-4 border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Team
                </label>
                <select
                  value={currentTeam?.id || ''}
                  onChange={(e) => {
                    const team = teams.find(t => t.id === e.target.value);
                    if (team) setCurrentTeam(team);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {renderNavigationSection(rhythm90Guide)}
              {renderNavigationSection(workingTools, 'Working Tools')}
              {renderNavigationSection(collaboration, 'Collaboration')}
              {renderNavigationSection(system, 'System')}
            </nav>
            {/* User Menu */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-700 truncate">{user?.name}</p>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-gray-600 ml-3 flex-shrink-0 p-1"
                  title="Sign out"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Mobile Sidebar Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setSidebarOpen(false)} />
            <div className="relative w-64 bg-white shadow-lg h-full flex flex-col">
              <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                <Link to="/app/dashboard" className="text-2xl font-bold text-red-500 hover:text-red-600 transition-colors">
                  Rhythm90
                </Link>
                <button
                  className="text-gray-700 focus:outline-none"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close menu"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Team Selector */}
              {teams.length > 0 && (
                <div className="p-4 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Team
                  </label>
                  <select
                    value={currentTeam?.id || ''}
                    onChange={(e) => {
                      const team = teams.find(t => t.id === e.target.value);
                      if (team) setCurrentTeam(team);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                {renderNavigationSection(rhythm90Guide)}
                {renderNavigationSection(workingTools, 'Working Tools')}
                {renderNavigationSection(collaboration, 'Collaboration')}
                {renderNavigationSection(system, 'System')}
              </nav>
              {/* User Menu */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">
                        {user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                                    <div className="ml-3 min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-700 truncate">{user?.name}</p>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                  </div>
                  <button
                    onClick={logout}
                    className="text-gray-400 hover:text-gray-600 ml-3 flex-shrink-0 p-1"
                    title="Sign out"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Main Content */}
      <div className="md:pl-64 flex-1 flex flex-col">
        <main className="flex-1 px-2 sm:px-4 md:px-0">
          {children}
        </main>
        
        {/* Footer */}
        <LoggedInFooter />
      </div>

      {/* Floating Chat Icon */}
      <FloatingChatIcon onClick={() => setAssistantOpen(true)} />

      {/* Assistant Modal */}
      <AssistantModal 
        isOpen={assistantOpen} 
        onClose={() => setAssistantOpen(false)} 
      />
    </div>
  );
}

export default AppLayout; 