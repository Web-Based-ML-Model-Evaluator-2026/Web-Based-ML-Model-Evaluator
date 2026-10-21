import { useContext, useState, useEffect } from 'react';
import { Database, Activity, ArrowRight, Box, MoreVertical, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { ProjectContext } from '../../context/ProjectContext';

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export function ProjectsGrid() {
  const { projects, activeProject, openProject, openRenameDialog, openDeleteDialog } = useContext(ProjectContext);

  // id of the project whose "..." menu is open (only one at a time)
  const [menuId, setMenuId] = useState(null);

  // Close the menu when clicking anywhere else
  useEffect(() => {
    if (!menuId) return;
    const close = () => setMenuId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menuId]);

  return (
    <div className="mt-8">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-xl font-bold text-light-textPrimary dark:text-dark-textPrimary">Your Projects</h2>
          <p className="text-sm text-light-textSecondary dark:text-dark-textSecondary mt-1">
            Manage and continue your machine learning projects.
          </p>
        </div>
        <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1 transition-all">
          View All <ArrowRight size={16} />
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-light-panel dark:bg-dark-panel rounded-xl border-2 border-dashed border-light-border dark:border-dark-border">
          <p className="text-light-textSecondary dark:text-dark-textSecondary mb-3">You don't have any projects yet.</p>
          <p className="text-sm text-gray-400">Click the "Create New Project" button above to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => {
            const isActive = activeProject?.id === project.id;
            return (
              <div
                key={project.id}
                className={`bg-light-panel dark:bg-dark-panel p-5 rounded-xl border hover:shadow-md transition-shadow ${
                  isActive ? 'border-primary' : 'border-light-border dark:border-dark-border'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600 h-fit">
                      <Box size={22} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-light-textPrimary dark:text-dark-textPrimary truncate" title={project.name}>
                        {project.name}
                      </h3>
                      <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary mt-1">
                        Created {formatDate(project.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 relative">
                    {isActive && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                      {project.status}
                    </span>

                    {/* "..." menu: rename / delete */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuId(menuId === project.id ? null : project.id); }}
                      aria-label={`Actions for ${project.name}`}
                      className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {menuId === project.id && (
                      <div className="absolute right-0 top-9 w-40 bg-white dark:bg-dark-panel border border-light-border dark:border-dark-border rounded-lg shadow-lg py-1 z-20">
                        <button
                          onClick={() => openRenameDialog(project.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-light-textSecondary dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Pencil size={14} /> Rename
                        </button>
                        <button
                          onClick={() => openDeleteDialog(project.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-800"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

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

                  <button
                    onClick={() => openProject(project.id)}
                    className="text-primary text-xs font-medium flex items-center gap-1 hover:underline"
                  >
                    {isActive ? 'Currently open' : 'Open Project'} <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
