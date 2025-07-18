import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Copyright */}
          <div className="text-sm text-gray-400 mb-4 md:mb-0">
            © 2025 Rhythm90.io. All rights reserved.
          </div>
          
          {/* Policy Links */}
          <div className="flex space-x-6">
            <Link 
              to="/terms" 
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              to="/privacy" 
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/security" 
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Security Policy
            </Link>
            <Link 
              to="/faq" 
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 