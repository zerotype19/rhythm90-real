import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';

interface Section {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  toolLink?: string;
  downloadLink?: string;
}

function TrainingModule() {
  const [activeSection, setActiveSection] = useState('intro');

  const sections: Section[] = [
    {
      id: 'intro',
      title: 'Introduction',
      description: 'Why Rhythm90, why now?',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg border border-red-200">
            <h3 className="text-lg font-semibold text-red-800 mb-3">Welcome to Rhythm90</h3>
            <p className="text-gray-700 mb-4">
              Rhythm90 is a system for running teams and quarters with clarity, focus, and continuous learning. 
              It's designed for teams that want to move fast while staying aligned and learning from every cycle.
            </p>
            <p className="text-gray-700">
              This training module will guide you through the core concepts and tools that make Rhythm90 work. 
              You can explore sections in any order and revisit them anytime.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Why Rhythm90?</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Structured approach to quarterly planning</li>
                <li>• Clear roles and responsibilities</li>
                <li>• Continuous learning and adaptation</li>
                <li>• Focus on outcomes over outputs</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Why Now?</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Teams need better alignment</li>
                <li>• Traditional planning falls short</li>
                <li>• Learning cycles are too slow</li>
                <li>• Need for structured experimentation</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      description: 'Plan → Run → Learn → Reset loop',
      content: (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">The Rhythm90 Cycle</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-red-600 font-bold text-xl">1</span>
                </div>
                <h4 className="font-semibold text-gray-900">Plan</h4>
                <p className="text-sm text-gray-600 mt-1">Define plays and success metrics</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold text-xl">2</span>
                </div>
                <h4 className="font-semibold text-gray-900">Run</h4>
                <p className="text-sm text-gray-600 mt-1">Execute and track signals</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold text-xl">3</span>
                </div>
                <h4 className="font-semibold text-gray-900">Learn</h4>
                <p className="text-sm text-gray-600 mt-1">Review outcomes and insights</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold text-xl">4</span>
                </div>
                <h4 className="font-semibold text-gray-900">Reset</h4>
                <p className="text-sm text-gray-600 mt-1">Adjust and plan next cycle</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3">Quick Start Guide</h4>
            <p className="text-blue-800 mb-4">
              Download our comprehensive Quick Start Guide to get your team up and running with Rhythm90.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Download Quick Start Guide
            </button>
          </div>
        </div>
      ),
      downloadLink: '/quick-start-guide.pdf'
    },
    {
      id: 'setup-roles',
      title: 'Setup & Roles',
      description: 'Role overview and cheat sheet',
      content: (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Roles</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-red-600 mb-2">Rhythm90 Lead</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Facilitates rituals and meetings</li>
                  <li>• Ensures team follows the process</li>
                  <li>• Tracks progress and blockers</li>
                  <li>• Coordinates with stakeholders</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Strategic Lead</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Defines strategic direction</li>
                  <li>• Sets priorities and goals</li>
                  <li>• Makes high-level decisions</li>
                  <li>• Aligns with business objectives</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Executional Lead</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Manages day-to-day execution</li>
                  <li>• Coordinates team activities</li>
                  <li>• Removes blockers</li>
                  <li>• Reports on progress</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-600 mb-2">Signal Owner</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Monitors key metrics</li>
                  <li>• Identifies trends and patterns</li>
                  <li>• Reports insights to team</li>
                  <li>• Suggests course corrections</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-3">Role Cheat Sheet</h4>
            <p className="text-green-800 mb-4">
              Get a quick reference guide for all roles and their responsibilities.
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              Download Role Cheat Sheet
            </button>
          </div>
        </div>
      ),
      downloadLink: '/role-cheat-sheet.pdf'
    },
    {
      id: 'quarterly-cadence',
      title: 'Quarterly Cadence',
      description: 'Kickoff, Pulse Checks, R&R explained',
      content: (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quarterly Rituals</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-semibold text-red-600">Kickoff (Week 1)</h4>
                <p className="text-sm text-gray-700 mt-1">
                  Align on 1-3 focused plays, define success outcomes, assign owners, and set business context.
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-blue-600">Pulse Check (Week 4, 8)</h4>
                <p className="text-sm text-gray-700 mt-1">
                  Review in-flight plays, surface blockers, check early signals, and adjust priorities.
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-green-600">R&R - Review & Renew (Week 12)</h4>
                <p className="text-sm text-gray-700 mt-1">
                  Reflect on what ran, what was learned, and what should happen next quarter.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-3">Ready to Plan Your Rituals?</h4>
            <p className="text-purple-800 mb-4">
              Use our Ritual Guide tool to create customized agendas and discussion prompts for your team.
            </p>
            <Link 
              to="/app/ritual-guide"
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              Open Ritual Guide
            </Link>
          </div>
        </div>
      ),
      toolLink: '/app/ritual-guide'
    },
    {
      id: 'the-board',
      title: 'The Board',
      description: 'What it is, how to use, examples',
      content: (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">The Rhythm90 Board</h3>
            <p className="text-gray-700 mb-4">
              The Board is your team's central command center - a visual representation of your plays, 
              their status, and the signals that indicate progress or problems.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Plays Column</h4>
                <p className="text-sm text-gray-600">Your 1-3 focused initiatives for the quarter</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Status Column</h4>
                <p className="text-sm text-gray-600">Current state: On Track, At Risk, or Off Track</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Signals Column</h4>
                <p className="text-sm text-gray-600">Key metrics and observations</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">Pro Tips</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Keep it visible and updated weekly</li>
                <li>• Use color coding for quick status recognition</li>
                <li>• Include both leading and lagging indicators</li>
                <li>• Review and update during Pulse Checks</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-900 mb-3">Board Templates</h4>
            <p className="text-yellow-800 mb-4">
              Get started with our pre-built templates for Notion, Trello, and Google Sheets.
            </p>
            <div className="space-y-2">
              <button className="block w-full text-left bg-white text-yellow-800 px-4 py-2 rounded-md hover:bg-yellow-100 transition-colors">
                📋 Notion Template
              </button>
              <button className="block w-full text-left bg-white text-yellow-800 px-4 py-2 rounded-md hover:bg-yellow-100 transition-colors">
                📊 Trello Template
              </button>
              <button className="block w-full text-left bg-white text-yellow-800 px-4 py-2 rounded-md hover:bg-yellow-100 transition-colors">
                📈 Google Sheets Template
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'play-canvas',
      title: 'Play Canvas',
      description: 'Hypothesis-driven plays, strong play design',
      content: (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Designing Strong Plays</h3>
            <p className="text-gray-700 mb-4">
              A play is a hypothesis-driven initiative designed to achieve a specific outcome. 
              Strong plays are clear, measurable, and aligned with your team's strategic goals.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Play Components</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li><strong>Hypothesis:</strong> "If we do X, then Y will happen"</li>
                  <li><strong>Success Metrics:</strong> How we'll measure progress</li>
                  <li><strong>Timeline:</strong> When we expect to see results</li>
                  <li><strong>Owner:</strong> Who's responsible for execution</li>
                  <li><strong>Resources:</strong> What we need to succeed</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Strong Play Examples</h4>
                <div className="space-y-3">
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <p className="text-sm text-green-800">
                      <strong>Good:</strong> "If we implement feature X, user engagement will increase by 20%"
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <p className="text-sm text-red-800">
                      <strong>Avoid:</strong> "Improve user experience"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-200">
            <h4 className="font-semibold text-indigo-900 mb-3">Build Your Plays</h4>
            <p className="text-indigo-800 mb-4">
              Use our Play Builder tool to create hypothesis-driven plays with clear success metrics.
            </p>
            <Link 
              to="/app/play-builder"
              className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Open Play Builder
            </Link>
          </div>
        </div>
      ),
      toolLink: '/app/play-builder'
    },
    {
      id: 'signal-log',
      title: 'Signal Log',
      description: 'Signals vs. KPIs, what to log, how to log',
      content: (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Signals vs. KPIs</h3>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Signals</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Early indicators of change</li>
                  <li>• Qualitative and quantitative</li>
                  <li>• Help predict outcomes</li>
                  <li>• Require interpretation</li>
                  <li>• Can be anecdotal</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">KPIs</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Lagging performance metrics</li>
                  <li>• Quantitative only</li>
                  <li>• Measure past performance</li>
                  <li>• Clear targets</li>
                  <li>• Historical data</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">What to Log</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Customer feedback and reactions</li>
                <li>• Usage patterns and behaviors</li>
                <li>• Market changes and trends</li>
                <li>• Team observations and insights</li>
                <li>• Unexpected outcomes or blockers</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3">Start Logging Signals</h4>
            <p className="text-blue-800 mb-4">
              Use our Signal Lab to capture, categorize, and analyze signals from your plays.
            </p>
            <Link 
              to="/app/signal-lab"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Open Signal Lab
            </Link>
          </div>
        </div>
      ),
      toolLink: '/app/signal-lab'
    },
    {
      id: 'rr',
      title: 'R&R',
      description: 'How to run a real Review & Renew session',
      content: (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Renew Process</h3>
            <p className="text-gray-700 mb-4">
              R&R is your quarterly reflection session - a time to look back on what worked, 
              what didn't, and what you learned. It's the foundation for planning your next quarter.
            </p>
            
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-green-600">1. Review What Ran</h4>
                <p className="text-sm text-gray-700 mt-1">
                  Look at your plays, their outcomes, and the signals you collected. What actually happened?
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-blue-600">2. Identify What Was Learned</h4>
                <p className="text-sm text-gray-700 mt-1">
                  What insights emerged? What surprised you? What patterns did you notice?
                </p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-purple-600">3. Plan What Happens Next</h4>
                <p className="text-sm text-gray-700 mt-1">
                  Based on your learnings, what should you do differently next quarter?
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg border border-emerald-200">
            <h4 className="font-semibold text-emerald-900 mb-3">R&R Summary Template</h4>
            <p className="text-emerald-800 mb-4">
              Use our structured template to capture your R&R insights and plan your next quarter.
            </p>
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors">
              Download R&R Template
            </button>
          </div>
        </div>
      ),
      downloadLink: '/rr-summary-template.pdf'
    },
    {
      id: 'quarterly-planner',
      title: 'Quarterly Planner',
      description: 'Full 90-day schedule + role views',
      content: (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quarterly Planning</h3>
            <p className="text-gray-700 mb-4">
              The Quarterly Planner helps you map out your entire 90-day cycle, including rituals, 
              milestones, and role-specific activities. It's your roadmap for the quarter.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Timeline View</h4>
                <p className="text-sm text-gray-600">12-week grid with key milestones and rituals</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Role Views</h4>
                <p className="text-sm text-gray-600">Filter by Rhythm90 Lead, Strategic Lead, Executional Lead, Signal Owner</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Export Options</h4>
                <p className="text-sm text-gray-600">PDF reports and calendar files for easy sharing</p>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-2">Key Features</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Interactive 12-week timeline</li>
                <li>• Role-specific activity views</li>
                <li>• Editable notes and milestones</li>
                <li>• Export to PDF and calendar</li>
                <li>• Save and share with team</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-900 mb-3">Plan Your Quarter</h4>
            <p className="text-orange-800 mb-4">
              Create your team's 90-day plan with our interactive Quarterly Planner tool.
            </p>
            <Link 
              to="/app/tools/planner"
              className="inline-block bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              Open Quarterly Planner
            </Link>
          </div>
        </div>
      ),
      toolLink: '/app/tools/planner'
    }
  ];

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Module</h1>
          <p className="text-gray-600">
            Learn how to use Rhythm90 to run teams and quarters effectively
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sections</h2>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <div className="font-medium">{section.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{section.description}</div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div
              key={activeSection}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-8"
            >
              {currentSection && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentSection.title}
                    </h2>
                    <p className="text-gray-600">{currentSection.description}</p>
                  </div>
                  
                  {currentSection.content}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default TrainingModule; 