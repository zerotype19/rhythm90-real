import AppLayout from '../components/AppLayout';

function Community() {
  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Community Exchange</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Share best practices, discuss friction points, and learn from other teams in the Rhythm90 community.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default Community; 