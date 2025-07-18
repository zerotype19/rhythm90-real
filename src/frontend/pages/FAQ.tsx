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
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. What plans are available?</h2>
              <p className="text-gray-700 mb-2">We currently offer three plans:</p>
              <p className="text-gray-700 mb-2">
                <strong>Free Tier:</strong><br />
                15-day trial with no tool usage after expiration.
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Pro Limited ($6.99/month):</strong><br />
                Access to all tools, up to 100 uses per tool per month.
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Pro Unlimited ($11.99/month):</strong><br />
                Unlimited access to all tools, no monthly limits.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. How does the free trial work?</h2>
              <p className="text-gray-700 mb-2">All new subscriptions start with a 15-day free trial.</p>
              <p className="text-gray-700 mb-2">You can explore all Pro features with no charge during this time.</p>
              <p className="text-gray-700">
                After 15 days, you'll need to upgrade to keep using the tools.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. How is usage tracked?</h2>
              <p className="text-gray-700 mb-2">We track how many times you use each AI-powered tool (like Play Builder, Signal Lab, and Ritual Guide).</p>
              <p className="text-gray-700 mb-2">
                <strong>Pro Limited:</strong> 100 uses per tool per month.
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Pro Unlimited:</strong> No limits.
              </p>
              <p className="text-gray-700">
                Usage resets on your billing cycle date — not on the first of each month.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. How do I upgrade or downgrade?</h2>
              <p className="text-gray-700 mb-2">You can upgrade, downgrade, or cancel anytime through your account settings.</p>
              <p className="text-gray-700">
                Changes take effect immediately, and we'll handle the rest behind the scenes.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">15. What happens if I hit my limit?</h2>
              <p className="text-gray-700 mb-2">If you reach your usage limit on the Pro Limited plan:</p>
              <p className="text-gray-700 mb-2">You'll get a friendly upgrade prompt in the app.</p>
              <p className="text-gray-700">
                You can either wait until your usage resets next cycle or upgrade to Pro Unlimited for unlimited access.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">16. What happens if my payment fails?</h2>
              <p className="text-gray-700 mb-2">If a payment fails (like an expired card), we'll:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Notify you by email.</li>
                <li>Retry the payment per Stripe's standard schedule.</li>
                <li>If the issue isn't resolved, your subscription will automatically downgrade to the Free Tier.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">17. How do you handle billing securely?</h2>
              <p className="text-gray-700 mb-2">All payments are processed through Stripe, a global, PCI-compliant payment provider.</p>
              <p className="text-gray-700 mb-2">We do not store your payment details on our servers.</p>
              <p className="text-gray-700 mb-2">We only store:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Your Stripe subscription ID.</li>
                <li>Your plan tier.</li>
                <li>Trial end dates and usage counts.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">18. Can I see how much I've used?</h2>
              <p className="text-gray-700">
                Yes! We'll soon add a usage summary in your account settings, so you can track how many times you've used each tool this month.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">19. How do I cancel my subscription?</h2>
              <p className="text-gray-700 mb-2">You can cancel anytime in your account settings.</p>
              <p className="text-gray-700">
                Your access will continue until the end of your billing period — no partial refunds, but no penalties either.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">20. Who can I contact for billing help?</h2>
              <p className="text-gray-700 mb-2">If you have any billing questions or issues, email us at:</p>
              <p className="text-gray-700">
                billing@rhythm90.io
              </p>
              <p className="text-gray-700">
                We're happy to help!
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