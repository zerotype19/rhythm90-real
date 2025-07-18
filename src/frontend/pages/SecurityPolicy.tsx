import { Link } from 'react-router-dom';

function SecurityPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/" className="text-2xl font-bold text-red-500 hover:text-red-600 transition-colors">
            Rhythm90
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Security Policy</h1>
          
          <div className="text-sm text-gray-600 mb-8">
            <strong>Effective Date:</strong> July 1, 2025
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              We are committed to safeguarding your data.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Our Commitments</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>We use industry-standard encryption (in transit and at rest) to protect your data.</li>
              <li>We apply regular security patches and updates.</li>
              <li>We restrict access to production systems to authorized personnel only.</li>
              <li>We monitor for unauthorized access or vulnerabilities.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. What We Do Not Do</h2>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>We do not use your saved data for AI training or marketing.</li>
              <li>We do not access your saved content unless explicitly required to support or troubleshoot at your request.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Limits of Security</h2>
            <p className="text-gray-700 mb-4">
              No system is 100% secure.
            </p>
            <p className="text-gray-700 mb-4">
              We cannot guarantee the absolute security of data you transmit to or store on Rhythm90.io.
            </p>
            <p className="text-gray-700 mb-4">
              You are responsible for protecting your own systems and devices (including using strong passwords and keeping them secure).
            </p>
            <p className="text-gray-700 mb-6">
              We highly recommend you do not store sensitive or regulated data (e.g., customer PII, health data, financial data) in our platform.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Responsible Disclosure</h2>
            <p className="text-gray-700 mb-6">
              If you discover a security issue or vulnerability, please contact us immediately at{' '}
              <a href="mailto:security@rhythm90.io" className="text-red-600 hover:text-red-700 underline">
                security@rhythm90.io
              </a>
              . We appreciate your help in keeping our platform safe.
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link 
              to="/" 
              className="text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityPolicy; 