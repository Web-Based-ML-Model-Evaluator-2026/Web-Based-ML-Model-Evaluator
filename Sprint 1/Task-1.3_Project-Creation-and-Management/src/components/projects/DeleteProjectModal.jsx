import { useState, useContext, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ProjectContext } from '../../context/ProjectContext';

// Confirmation popup so a project is never deleted by accident.
export function DeleteProjectModal({ project }) {
  const { deleteProject, closeDialog } = useContext(ProjectContext);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && closeDialog();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeDialog]);

  const handleDelete = () => {
    const result = deleteProject(project.id);
    if (result.ok) closeDialog();
    else setError(result.error);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={closeDialog}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-light-panel dark:bg-dark-panel border border-light-border dark:border-dark-border rounded-xl shadow-xl p-6"
      >
        <div className="flex gap-3">
          <div className="p-2.5 rounded-full bg-red-100 text-red-600 h-fit"><AlertTriangle size={20} /></div>
          <div>
            <h2 className="text-lg font-bold text-light-textPrimary dark:text-dark-textPrimary">Delete project?</h2>
            <p className="text-sm text-light-textSecondary dark:text-dark-textSecondary mt-1.5">
              <span className="font-semibold">{project.name}</span> and everything inside it will be permanently removed. This cannot be undone.
            </p>
            {error && <p className="text-xs text-red-500 mt-2" role="alert">{error}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={closeDialog} className="px-4 py-2 text-sm rounded-lg text-light-textSecondary dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-gray-800">
            Cancel
          </button>
          <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
