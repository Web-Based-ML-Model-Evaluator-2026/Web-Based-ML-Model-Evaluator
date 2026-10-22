import { useState, useContext, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { ProjectContext } from '../../context/ProjectContext';
import { PROJECT_NAME_MAX } from '../../utils/projectValidation';

// One popup used for BOTH "Create project" and "Rename project".
export function ProjectFormModal({ mode, project }) {
  const { createProject, renameProject, closeDialog } = useContext(ProjectContext);
  const isRename = mode === 'rename';

  const [name, setName] = useState(isRename ? project.name : '');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Focus the input and close on Escape
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
    const onKey = (e) => e.key === 'Escape' && closeDialog();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeDialog]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = isRename ? renameProject(project.id, name) : createProject(name);
    if (result.ok) closeDialog();
    else setError(result.error);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={closeDialog}>
      <form
        onSubmit={handleSubmit}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-light-panel dark:bg-dark-panel border border-light-border dark:border-dark-border rounded-xl shadow-xl p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-bold text-light-textPrimary dark:text-dark-textPrimary">
            {isRename ? 'Rename project' : 'Create new project'}
          </h2>
          <button type="button" onClick={closeDialog} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <label htmlFor="project-name" className="block text-sm font-medium text-light-textSecondary dark:text-dark-textSecondary mb-1.5">
          Project name
        </label>
        <input
          id="project-name"
          ref={inputRef}
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          placeholder="e.g. Customer Churn Prediction"
          maxLength={PROJECT_NAME_MAX + 20}
          aria-invalid={Boolean(error)}
          className={`w-full px-3 py-2 rounded-lg text-sm bg-transparent text-light-textPrimary dark:text-dark-textPrimary border outline-none focus:ring-2 focus:ring-primary ${
            error ? 'border-red-500' : 'border-light-border dark:border-dark-border'
          }`}
        />
        <div className="flex justify-between mt-1.5 min-h-[1.25rem]">
          <p className="text-xs text-red-500" role="alert">{error}</p>
          <p className="text-xs text-gray-400">{name.trim().length}/{PROJECT_NAME_MAX}</p>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button type="button" onClick={closeDialog} className="px-4 py-2 text-sm rounded-lg text-light-textSecondary dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-gray-800">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-blue-700">
            {isRename ? 'Save' : 'Create project'}
          </button>
        </div>
      </form>
    </div>
  );
}
