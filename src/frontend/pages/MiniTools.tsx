import AppLayout from '../components/AppLayout';

function MiniTools() {
  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Mini Tools</h1>
        
        {/* Placeholder grid for future tool cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder cards - will be replaced with actual tools */}
          <div className="bg-white rounded-lg shadow p-6 border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-sm">Tool cards coming soon</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-sm">Tool cards coming soon</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-sm">Tool cards coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default MiniTools; 