import { useState } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '../components/AppLayout';

interface WeekData {
  week: number;
  date: string;
  activities: string[];
  notes: string;
}

interface Role {
  id: string;
  name: string;
  color: string;
}

function QuarterlyPlanner() {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [weeks, setWeeks] = useState<WeekData[]>(() => {
    const today = new Date();
    const weeks: WeekData[] = [];
    
    for (let i = 0; i < 12; i++) {
      const weekDate = new Date(today);
      weekDate.setDate(today.getDate() + (i * 7));
      
      weeks.push({
        week: i + 1,
        date: weekDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }),
        activities: [],
        notes: ''
      });
    }
    
    // Add default activities for key weeks
    weeks[0].activities = ['Quarterly Kickoff', 'Play Planning', 'Role Assignment'];
    weeks[3].activities = ['Pulse Check #1', 'Progress Review', 'Signal Analysis'];
    weeks[7].activities = ['Pulse Check #2', 'Mid-quarter Assessment', 'Course Correction'];
    weeks[11].activities = ['R&R Session', 'Quarter Review', 'Next Quarter Planning'];
    
    return weeks;
  });

  const roles: Role[] = [
    { id: 'all', name: 'All Roles', color: 'gray' },
    { id: 'rhythm90-lead', name: 'Rhythm90 Lead', color: 'red' },
    { id: 'strategic-lead', name: 'Strategic Lead', color: 'blue' },
    { id: 'executional-lead', name: 'Executional Lead', color: 'green' },
    { id: 'signal-owner', name: 'Signal Owner', color: 'purple' }
  ];

  const roleActivities = {
    'rhythm90-lead': {
      1: ['Facilitate Kickoff', 'Set up team rituals', 'Create team board'],
      4: ['Run Pulse Check #1', 'Review team progress', 'Address blockers'],
      8: ['Run Pulse Check #2', 'Assess team health', 'Prepare for R&R'],
      12: ['Facilitate R&R', 'Document learnings', 'Plan next quarter']
    },
    'strategic-lead': {
      1: ['Define strategic direction', 'Set quarterly goals', 'Align with business objectives'],
      4: ['Review strategic alignment', 'Assess goal progress', 'Adjust priorities'],
      8: ['Evaluate strategic outcomes', 'Identify new opportunities', 'Prepare strategic input for R&R'],
      12: ['Strategic review', 'Set next quarter strategy', 'Align with leadership']
    },
    'executional-lead': {
      1: ['Create execution plan', 'Assign tasks', 'Set up tracking'],
      4: ['Review execution progress', 'Remove blockers', 'Adjust resources'],
      8: ['Assess execution health', 'Optimize processes', 'Prepare execution summary'],
      12: ['Execution review', 'Document processes', 'Plan next quarter execution']
    },
    'signal-owner': {
      1: ['Set up signal tracking', 'Define key metrics', 'Create monitoring dashboard'],
      4: ['Analyze early signals', 'Report trends', 'Identify anomalies'],
      8: ['Deep signal analysis', 'Pattern recognition', 'Prepare signal summary'],
      12: ['Signal review', 'Document insights', 'Plan next quarter signals']
    }
  };

  const getActivitiesForWeek = (week: number, role: string) => {
    if (role === 'all') {
      return weeks[week - 1]?.activities || [];
    }
    return roleActivities[role as keyof typeof roleActivities]?.[week] || [];
  };

  const updateWeekNotes = (weekIndex: number, notes: string) => {
    const newWeeks = [...weeks];
    newWeeks[weekIndex].notes = notes;
    setWeeks(newWeeks);
  };

  const exportToPDF = () => {
    // Placeholder for PDF export functionality
    alert('PDF export functionality will be implemented');
  };

  const exportToCalendar = () => {
    // Placeholder for calendar export functionality
    alert('Calendar export functionality will be implemented');
  };

  const savePlan = () => {
    // Placeholder for save functionality
    alert('Save functionality will be implemented');
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quarterly Planner</h1>
          <p className="text-gray-600">
            Plan your 90-day quarter with interactive timeline and role-specific views
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">View Options</h2>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedRole === role.id
                        ? `bg-${role.color}-100 text-${role.color}-700`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {role.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={savePlan}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Plan
              </button>
              <button
                onClick={exportToPDF}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Export PDF
              </button>
              <button
                onClick={exportToCalendar}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Export Calendar
              </button>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              12-Week Quarter Timeline
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-1 font-semibold text-gray-900 border-r border-gray-200 text-left w-24">
                    <span className="text-xs">Week</span>
                  </th>
                  {weeks.map((week) => (
                    <th
                      key={week.week}
                      className="p-1 font-semibold text-gray-900 border-r border-gray-200 text-center min-w-[100px]"
                    >
                      <div className="text-xs transform -rotate-1">Week {week.week}</div>
                      <div className="text-xs text-gray-500 leading-tight transform -rotate-1">{week.date}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="p-1 font-semibold text-gray-900 border-r border-gray-200 bg-gray-50">
                    <span className="text-xs">Activities</span>
                  </td>
                  {weeks.map((week) => (
                    <td
                      key={week.week}
                      className="p-1 border-r border-gray-200 min-h-[60px] align-top"
                    >
                      <div className="space-y-0.5">
                        {getActivitiesForWeek(week.week, selectedRole).map((activity, index) => (
                          <div
                            key={index}
                            className="text-xs bg-blue-50 text-blue-700 px-1 py-0.5 rounded leading-tight"
                          >
                            {activity}
                          </div>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-1 font-semibold text-gray-900 border-r border-gray-200 bg-gray-50">
                    <span className="text-xs">Notes</span>
                  </td>
                  {weeks.map((week, index) => (
                    <td
                      key={week.week}
                      className="p-1 border-r border-gray-200"
                    >
                      <textarea
                        value={week.notes}
                        onChange={(e) => updateWeekNotes(index, e.target.value)}
                        placeholder="Add notes..."
                        className="w-full h-14 text-xs border border-gray-300 rounded p-1 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Milestones */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Milestones</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-red-600">Week 1: Kickoff</h3>
              <p className="text-sm text-gray-600 mt-1">
                Align on plays, assign roles, set up tracking
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-blue-600">Week 4: Pulse Check #1</h3>
              <p className="text-sm text-gray-600 mt-1">
                Review progress, surface blockers, adjust course
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-green-600">Week 8: Pulse Check #2</h3>
              <p className="text-sm text-gray-600 mt-1">
                Mid-quarter assessment, course correction
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-purple-600">Week 12: R&R</h3>
              <p className="text-sm text-gray-600 mt-1">
                Review & Renew, plan next quarter
              </p>
            </div>
          </div>
        </div>

        {/* Role-Specific Tips */}
        {selectedRole !== 'all' && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Tips for {roles.find(r => r.id === selectedRole)?.name}
            </h2>
            <div className="prose prose-sm max-w-none">
              {selectedRole === 'rhythm90-lead' && (
                <ul className="space-y-2 text-gray-700">
                  <li>• Schedule all rituals at the beginning of the quarter</li>
                  <li>• Set up regular check-ins with team members</li>
                  <li>• Keep the team board updated and visible</li>
                  <li>• Document blockers and escalate when needed</li>
                </ul>
              )}
              {selectedRole === 'strategic-lead' && (
                <ul className="space-y-2 text-gray-700">
                  <li>• Ensure plays align with business objectives</li>
                  <li>• Review strategic context during pulse checks</li>
                  <li>• Provide clear direction on priority changes</li>
                  <li>• Connect team work to broader company goals</li>
                </ul>
              )}
              {selectedRole === 'executional-lead' && (
                <ul className="space-y-2 text-gray-700">
                  <li>• Break down plays into actionable tasks</li>
                  <li>• Monitor resource allocation and capacity</li>
                  <li>• Remove execution blockers quickly</li>
                  <li>• Track progress against milestones</li>
                </ul>
              )}
              {selectedRole === 'signal-owner' && (
                <ul className="space-y-2 text-gray-700">
                  <li>• Set up automated monitoring where possible</li>
                  <li>• Establish baseline metrics early</li>
                  <li>• Look for both leading and lagging indicators</li>
                  <li>• Share insights proactively with the team</li>
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default QuarterlyPlanner; 