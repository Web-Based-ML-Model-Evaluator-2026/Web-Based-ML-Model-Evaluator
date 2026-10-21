import { useContext } from 'react';
import { ProjectContext } from '../../context/ProjectContext';
import { ProjectFormModal } from './ProjectFormModal';
import { DeleteProjectModal } from './DeleteProjectModal';

// Rendered once in App. Shows whichever popup the context says is open.
export function ProjectDialogs() {
  const { dialog, projects } = useContext(ProjectContext);
  if (!dialog) return null;

  if (dialog.type === 'create') return <ProjectFormModal mode="create" />;

  const project = projects.find((p) => p.id === dialog.projectId);
  if (!project) return null;

  // `key` makes React reset the form when a different project is picked
  if (dialog.type === 'rename') return <ProjectFormModal key={project.id} mode="rename" project={project} />;
  if (dialog.type === 'delete') return <DeleteProjectModal project={project} />;
  return null;
}
