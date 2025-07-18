import { Link } from 'react-router-dom';

function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="text-sm text-gray-600 mb-8">
            <strong>Effective Date:</strong> July 1, 2025
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              Welcome to Rhythm90.io ("we," "us," "our"). By accessing or using this site, you agree to the following terms. Please read them carefully.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Purpose of the Site</h2>
            <p className="text-gray-700 mb-4">
              Rhythm90.io provides tools, templates, and resources designed to help marketing teams run smarter quarterly cycles using the Rhythm90 framework. This includes AI-assisted features to generate prompts, suggestions, summaries, or draft content.
            </p>
            <p className="text-gray-700 mb-6">
              We do not provide consulting, guarantees of business success, or legal/financial advice.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Use of AI</h2>
            <p className="text-gray-700 mb-4">
              Our site uses AI models (including from third-party providers like OpenAI) to generate outputs based on your inputs. These models may process your text to return suggestions, but:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>We do not permanently store or use your inputs or outputs beyond delivering your session (unless you explicitly choose to save them in your account).</li>
              <li>We do not use your inputs or outputs to train any AI models.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. User Responsibilities</h2>
            <p className="text-gray-700 mb-4">
              You are fully responsible for any content you upload, input, or generate on the site. Specifically:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Do not upload or share confidential, proprietary, or sensitive information.</li>
              <li>Do not use the site to process regulated data (including but not limited to PII, PHI, PCI data, or trade secrets).</li>
              <li>You assume all risks for using AI outputs or templates in your business, including accuracy, fitness for purpose, and applicability.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              All content on Rhythm90.io (including the Rhythm90 name, framework, templates, and materials) is protected by copyright and other intellectual property rights.
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>You may use these materials for your own business or team.</li>
              <li>You may not copy, distribute, resell, reverse-engineer, or create derivative works without our permission.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. No Warranties</h2>
            <p className="text-gray-700 mb-4">
              We provide Rhythm90.io "as-is" and "as-available." We make no guarantees or warranties — expressed or implied — about:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Fitness for any particular purpose</li>
              <li>Accuracy, completeness, or timeliness of outputs</li>
              <li>Uninterrupted or error-free service</li>
              <li>Business or financial results from using the site</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              To the fullest extent allowed by law, we are not liable for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Any direct, indirect, incidental, consequential, or special damages</li>
              <li>Loss of data, profits, revenues, or business opportunities</li>
              <li>Any decisions or actions you take based on AI outputs or site content</li>
            </ul>
            <p className="text-gray-700 mb-6">
              Using Rhythm90.io is at your own risk.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Updates</h2>
            <p className="text-gray-700 mb-6">
              We may update these terms at any time. Continued use after changes means you accept the updated terms.
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

export default TermsOfService; 