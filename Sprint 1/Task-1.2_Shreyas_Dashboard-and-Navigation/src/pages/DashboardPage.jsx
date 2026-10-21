import { useContext } from 'react';
import { Plus } from 'lucide-react';
import { ProjectContext } from '../context/ProjectContext';
import { ProjectsGrid } from '../components/dashboard/ProjectsGrid';

export function DashboardPage() {
  const { createProject } = useContext(ProjectContext);

  // --- BUG FIX: Dynamic Greeting Logic ---
  // This gets the current hour from the user's local timezone (0 - 23)
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      
      {/* Banner Area */}
      <div className="bg-light-panel dark:bg-dark-panel p-8 rounded-2xl border border-light-border dark:border-dark-border shadow-sm flex justify-between items-center">
        <div className="max-w-xl">
          {/* The greeting will now automatically change based on the time! */}
          <h1 className="text-3xl font-bold text-light-textPrimary dark:text-dark-textPrimary flex items-center gap-2">
            👋 {getGreeting()}, John!
          </h1>
          <p className="text-light-textSecondary dark:text-dark-textSecondary mt-3 text-base leading-relaxed">
            Let's turn your data into powerful insights. Create a new project or continue working on your existing ML experiments.
          </p>
          
          <div className="flex gap-4 mt-6">
            <button 
              onClick={createProject}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <Plus size={18} />
              Create New Project
            </button>
          </div>
        </div>
      </div>

      <ProjectsGrid />

    </div>
  );
}