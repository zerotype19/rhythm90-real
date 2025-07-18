import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

function LandingPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col">
      {/* Navigation */}
      <nav className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-red-500">Rhythm90</div>
          <Link 
            to="/login" 
            className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-6">
            Build Smarter Teams with Rhythm90
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Bring clarity, focus, and momentum to your team. Use AI-assisted plays, live insights, and simple rituals to turn every quarter into real progress.
          </p>
          <Link 
            to="/login" 
            className="group bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 inline-flex items-center gap-2 hover:scale-105 relative overflow-hidden"
          >
            Start Your Rhythm
            <span className="inline-block opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">→</span>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center group cursor-pointer">
            <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 group-hover:underline transition-all duration-300">Play Builder</h3>
            <p className="text-gray-400">Turn ideas into smart, testable plays — fast.</p>
          </div>
          
          <div className="text-center group cursor-pointer">
            <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 group-hover:underline transition-all duration-300">Signal Lab</h3>
            <p className="text-gray-400">Spot live signals and shape sharper decisions.</p>
          </div>
          
          <div className="text-center group cursor-pointer">
            <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 group-hover:underline transition-all duration-300">Ritual Guide</h3>
            <p className="text-gray-400">Run simple, high-impact rituals that stick.</p>
          </div>
        </div>
      </div>

      {/* New Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Built for Teams That Want to Work Smarter</h2>
          <p className="text-gray-300 max-w-3xl mx-auto">
            Rhythm90 comes with lightweight Mini Tools, a Quarter Planner, and ready-to-use templates to help your team stay focused, learn faster, and make every quarter a step forward.
          </p>
        </div>
      </div>

      {/* Book Banner Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-red-900 to-red-800 rounded-2xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Learn the Complete Framework
              </h2>
              <p className="text-xl text-red-100 mb-6 max-w-2xl">
                Dive deeper into the Rhythm90 methodology with our comprehensive guide. 
                Master the art of building high-performing teams through strategic play building, 
                signal interpretation, and ritual design.
              </p>
              <a 
                href="https://www.amazon.com/dp/B0FGF9VC5J"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-red-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Get the Book on Amazon
              </a>
            </div>
            <div className="flex-shrink-0">
              <img 
                src="/rhythm90_cover.jpg" 
                alt="Rhythm90 Book Cover" 
                className="w-48 h-64 object-cover rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Micro-copy */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Built by teams, for teams. No new tools. No extra noise.
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default LandingPage; 