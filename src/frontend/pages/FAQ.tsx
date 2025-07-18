import { Link } from 'react-router-dom';

function FAQ() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h1>
          
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. What is Rhythm90.io?</h2>
              <p className="text-gray-700 mb-2">
                Rhythm90.io is a digital toolbox to help marketing teams run smarter, simpler quarterly cycles using the Rhythm90 framework.
              </p>
              <p className="text-gray-700">
                We provide tools, templates, and AI-assisted features to help teams set plays, log signals, reflect, and improve — quarter after quarter.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Do you use AI?</h2>
              <p className="text-gray-700 mb-2">Yes!</p>
              <p className="text-gray-700 mb-2">
                We use AI models (including from trusted third-party providers like OpenAI) to generate suggestions, summaries, draft copy, and help you work faster.
              </p>
              <p className="text-gray-700 mb-2">But here's what matters:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Your inputs are only used to generate your outputs.</li>
                <li>We do not use your content to train any models.</li>
                <li>We do not store your inputs or outputs unless you explicitly save them in your account.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. What data do you collect?</h2>
              <p className="text-gray-700 mb-2">We keep it minimal:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>If you create an account: email + username (passwords are encrypted).</li>
                <li>If you save projects or boards: we store only the content you choose to save.</li>
                <li>We collect anonymous, aggregated site analytics to understand usage and improve the platform.</li>
                <li>We do not collect or sell personal data or track you across other websites.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Can you see my projects or saved content?</h2>
              <p className="text-gray-700 mb-2">No, not by default.</p>
              <p className="text-gray-700 mb-2">Your saved content (plays, signals, boards) belongs to you.</p>
              <p className="text-gray-700">
                We only access it if you specifically request support or troubleshooting, and even then, only authorized team members can assist.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Should I input sensitive or proprietary information?</h2>
              <p className="text-gray-700 mb-2">No. Please don't.</p>
              <p className="text-gray-700 mb-2">
                While we apply strong security measures, no online system is 100% secure.
              </p>
              <p className="text-gray-700 mb-2">
                We recommend you avoid entering any confidential, proprietary, regulated, or sensitive data — like trade secrets, customer PII, health or financial data — into the platform.
              </p>
              <p className="text-gray-700">You are responsible for deciding what to share.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Who owns the AI-generated outputs?</h2>
              <p className="text-gray-700 mb-2">You own the outputs generated in your workspace, but:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>They come without warranty or guarantee.</li>
                <li>You are responsible for how you use them.</li>
                <li>We retain the rights to the underlying Rhythm90 framework, templates, and system.</li>
              </ul>
              <p className="text-gray-700">
                If you want to use AI outputs in high-stakes business, legal, or financial settings, we recommend human review and judgment.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Can I delete my data?</h2>
              <p className="text-gray-700 mb-2">Yes.</p>
              <p className="text-gray-700 mb-2">At any time, you can:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Delete individual projects or boards.</li>
                <li>Delete your entire account and all associated data.</li>
              </ul>
              <p className="text-gray-700">
                If you have a deletion request, contact us at support@rhythm90.io.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. How secure is the platform?</h2>
              <p className="text-gray-700 mb-2">We take security seriously:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Encryption in transit and at rest.</li>
                <li>Regular security updates.</li>
                <li>Strict access controls.</li>
              </ul>
              <p className="text-gray-700 mb-2">But: no system is perfectly secure. Please use caution with sensitive information.</p>
              <p className="text-gray-700">
                If you find a security issue, report it immediately to security@rhythm90.io.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Will you ever sell my data?</h2>
              <p className="text-gray-700 mb-2">No. Never.</p>
              <p className="text-gray-700">
                We do not sell, rent, or share your data for marketing or sales purposes.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. How do I get support?</h2>
              <p className="text-gray-700 mb-2">Email us anytime at support@rhythm90.io.</p>
              <p className="text-gray-700">
                We're a small team, but we care deeply about helping users succeed and will get back to you as soon as we can.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Anything else I should know?</h2>
              <p className="text-gray-700 mb-2">
                Rhythm90.io is here to help you work smarter — but we don't guarantee results or outcomes.
              </p>
              <p className="text-gray-700 mb-2">
                The tools, templates, and AI features are provided as-is, and it's up to you to decide how to use them wisely for your team.
              </p>
              <p className="text-gray-700">
                We are constantly improving — thank you for being part of the journey!
              </p>
            </div>
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

export default FAQ; 