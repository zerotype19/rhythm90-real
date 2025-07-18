import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { FaLanguage, FaCrosshairs, FaLightbulb, FaUser, FaRoute, FaChartLine, FaRocket, FaBroadcastTower, FaUsers } from 'react-icons/fa';

function MiniTools() {
  const tools = [
    {
      name: 'Plain-English Translator',
      description: 'Rewrite marketing copy into clear, human language.',
      slug: 'plain-english-translator',
      icon: <FaLanguage className="w-8 h-8 text-blue-500" />
    },
    {
      name: 'Get/To/By Generator',
      description: 'Craft sharp Get/To/By strategy statements.',
      slug: 'get-to-by-generator',
      icon: <FaCrosshairs className="w-8 h-8 text-green-500" />
    },
    {
      name: 'Creative-Tension Finder',
      description: 'Generate creative tensions to inspire big campaign ideas.',
      slug: 'creative-tension-finder',
      icon: <FaLightbulb className="w-8 h-8 text-yellow-500" />
    },
    {
      name: 'Persona Generator + Ask Mode',
      description: 'Build detailed audience personas and enter live Q&A.',
      slug: 'persona-generator',
      icon: <FaUser className="w-8 h-8 text-purple-500" />
    },
    {
      name: 'Journey Builder',
      description: 'Map a step-by-step customer journey with action tips.',
      slug: 'journey-builder',
      icon: <FaRoute className="w-8 h-8 text-indigo-500" />
    },
    {
      name: 'Test-Learn-Scale Roadmap',
      description: 'Design an experimentation plan with hypotheses + KPIs.',
      slug: 'test-learn-scale',
      icon: <FaChartLine className="w-8 h-8 text-orange-500" />
    },
    {
      name: 'Agile Sprint / War-Room Planner',
      description: 'Outline an agile sprint plan for a marketing challenge.',
      slug: 'agile-sprint-planner',
      icon: <FaRocket className="w-8 h-8 text-red-500" />
    },
    {
      name: 'Connected-Media Moment Matrix',
      description: 'Create a moment-based media plan.',
      slug: 'connected-media-matrix',
      icon: <FaBroadcastTower className="w-8 h-8 text-teal-500" />
    },
    {
      name: 'Synthetic Focus Group',
      description: 'Create a synthetic focus group of five personas and enter Ask Mode.',
      slug: 'synthetic-focus-group',
      icon: <FaUsers className="w-8 h-8 text-pink-500" />
    }
  ];

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Mini Tools</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <div key={tool.slug} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                {tool.icon}
                <h3 className="text-lg font-semibold text-gray-900 ml-3">{tool.name}</h3>
              </div>
              <p className="text-gray-600 mb-6">{tool.description}</p>
              <Link
                to={`/app/mini-tools/${tool.slug}`}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
              >
                Open Tool
              </Link>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

export default MiniTools; 