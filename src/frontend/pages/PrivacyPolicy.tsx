import { Link } from 'react-router-dom';

function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="text-sm text-gray-600 mb-8">
            <strong>Effective Date:</strong> July 1, 2025
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              We respect your privacy and keep things simple.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. What We Collect</h2>
            <p className="text-gray-700 mb-4">
              We collect only what we need to run the service:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Basic account info (if you create one): email, username, password (hashed).</li>
              <li>Site analytics (anonymous, aggregate) to understand usage patterns.</li>
              <li>Inputs and outputs only if you choose to save them (for example, saving a project or board).</li>
            </ul>
            <p className="text-gray-700 mb-6">
              We do not collect or store any personal data beyond this.<br />
              We do not track you across the web.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Use of AI</h2>
            <p className="text-gray-700 mb-4">
              When you use AI features, your prompts are temporarily sent to third-party AI providers (such as OpenAI) to generate a response.
            </p>
            <p className="text-gray-700 mb-4">We do not:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Use your inputs or outputs to train AI models.</li>
              <li>Keep copies of your prompts or responses unless you explicitly save them.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Your Control</h2>
            <p className="text-gray-700 mb-4">
              You have full control over your saved content:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>You can view, edit, or delete your saved projects at any time.</li>
              <li>You can close your account and request deletion of all stored data.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-4">
              We do not sell, rent, or share your personal data or project data with any third parties for marketing or sales purposes.
            </p>
            <p className="text-gray-700 mb-4">The only exceptions are:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-6">
              <li>Service providers who help run the site (under strict confidentiality)</li>
              <li>Legal requests or obligations where we are required to comply</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Protect Yourself</h2>
            <p className="text-gray-700 mb-4">
              We strongly advise you not to input or upload any confidential, proprietary, or sensitive information.
            </p>
            <p className="text-gray-700 mb-6">
              While we take data security seriously, we cannot guarantee the confidentiality or integrity of any data you choose to enter.<br />
              You are responsible for evaluating what you share.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Changes to This Policy</h2>
            <p className="text-gray-700 mb-6">
              We may update this policy, and we'll notify you of material changes.
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

export default PrivacyPolicy; 