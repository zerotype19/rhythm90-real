import { Link } from 'react-router-dom';

function LoggedInFooter() {
  return (
    <footer className="bg-gray-100 text-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Copyright */}
          <div className="text-sm text-gray-600 mb-4 md:mb-0">
            © 2025 Rhythm90.io. All rights reserved.
          </div>
          
          {/* Policy Links */}
          <div className="flex space-x-6">
            <Link 
              to="/app/dashboard/terms" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              to="/app/dashboard/privacy" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/app/dashboard/security" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Security Policy
            </Link>
            <Link 
              to="/app/dashboard/faq" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LoggedInFooter; 