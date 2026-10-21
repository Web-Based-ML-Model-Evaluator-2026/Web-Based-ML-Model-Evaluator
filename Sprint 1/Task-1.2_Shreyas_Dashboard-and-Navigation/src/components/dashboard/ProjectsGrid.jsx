// Import icons for the project cards
import { Database, Activity, ArrowRight, Box } from 'lucide-react';

export function ProjectsGrid() {
  // This is an empty array representing a new user who hasn't created any projects yet.
  // Later, your teammate will replace this with real data from the database.
  const projects = [];

  return (
    <div className="mt-8">
      
      {/* Header area showing the title and "View All" button */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-xl font-bold text-light-textPrimary dark:text-dark-textPrimary">Your Projects</h2>
          <p className="text-sm text-light-textSecondary dark:text-dark-textSecondary mt-1">
            Manage and continue your machine learning projects.
          </p>
        </div>
        {/* Button to view all projects (currently just for design) */}
        <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1 transition-all">
          View All <ArrowRight size={16} />
        </button>
      </div>

      {/* 
        Conditional Rendering logic:
        If the projects list is empty (0 projects), show the "Empty State" message.
        Otherwise, show the grid of project cards.
      */}
      {projects.length === 0 ? (
        
        // --- EMPTY STATE UI (When user has no projects) ---
        <div className="text-center py-12 bg-light-panel dark:bg-dark-panel rounded-xl border-2 border-dashed border-light-border dark:border-dark-border">
          <p className="text-light-textSecondary dark:text-dark-textSecondary mb-3">
            You don't have any projects yet.
          </p>
          <p className="text-sm text-gray-400">
            Click the "Create New Project" button above to get started!
          </p>
        </div>

      ) : (
        
        // --- PROJECTS GRID UI (When user has 1 or more projects) ---
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Loop through the projects array and create a card for each one */}
          {projects.map(project => (
            <div key={project.id} className="bg-light-panel dark:bg-dark-panel p-5 rounded-xl border border-light-border dark:border-dark-border hover:shadow-md transition-shadow">
              
              {/* Top half of the card: Icon, Title, Date, and Status */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className={`p-2.5 rounded-lg ${project.iconColor}`}>
                    <Box size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-light-textPrimary dark:text-dark-textPrimary">{project.title}</h3>
                    <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary mt-1">{project.date}</p>
                  </div>
                </div>
                {/* Status label (e.g., Completed, In Progress) */}
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${project.statusClass}`}>
                  {project.status}
                </span>
              </div>

              {/* Bottom half of the card: Details (Dataset, Models) and Open Button */}
              <div className="flex justify-between items-end mt-6 pt-4 border-t border-light-border dark:border-dark-border">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-light-textSecondary dark:text-dark-textSecondary">
                    <Database size={14} />
                    <span>Dataset: {project.dataset}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-light-textSecondary dark:text-dark-textSecondary">
                    <Activity size={14} />
                    <span>Models: {project.models}</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary mb-1">{project.metricLabel}</p>
                  <p className="text-sm font-bold text-light-textPrimary dark:text-dark-textPrimary">{project.metricValue}</p>
                  {/* Button to open the specific project */}
                  <button className="text-primary text-xs font-medium mt-2 flex items-center gap-1 hover:underline ml-auto">
                    Open Project <ArrowRight size={14} />
                  </button>
                </div>
              </div>
              
            </div>
          ))}
        </div>
      )}
    </div>
  );
}