import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { CURRENT_USER } from '../utils/currentUser';
import { normalizeName, validateProjectName, isOwner } from '../utils/projectValidation';

export const ProjectContext = createContext();

const PROJECTS_KEY = 'mle_projects';
const ACTIVE_KEY = 'mle_active_project';

// Safe localStorage helpers (storage can be blocked or contain bad data)
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore: app still works in memory */
  }
}

function makeId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `p-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ProjectProvider({ children }) {
  const user = CURRENT_USER;

  // ALL projects (of every owner) live here. Components only ever see the
  // current user's projects through `projects` below.
  const [allProjects, setAllProjects] = useState(() => load(PROJECTS_KEY, []));
  const [activeProjectId, setActiveProjectId] = useState(() => load(ACTIVE_KEY, null));

  // Which popup is open: { type: 'create' | 'rename' | 'delete', projectId? } or null
  const [dialog, setDialog] = useState(null);

  useEffect(() => save(PROJECTS_KEY, allProjects), [allProjects]);
  useEffect(() => save(ACTIVE_KEY, activeProjectId), [activeProjectId]);

  // Ownership: only projects owned by the logged-in user, newest first
  const projects = useMemo(
    () =>
      allProjects
        .filter((p) => p.ownerId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allProjects, user.id]
  );

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;
  const hasActiveProject = Boolean(activeProject);

  // ---- Subtask 1: create ----
  const createProject = useCallback(
    (rawName) => {
      const error = validateProjectName(rawName, projects);
      if (error) return { ok: false, error };

      const now = new Date().toISOString();
      const project = {
        id: makeId(),
        name: normalizeName(rawName),
        ownerId: user.id, // connects the project to its owner
        createdAt: now,
        updatedAt: now,
        status: 'Draft',
        dataset: 'No dataset',
        models: 0,
      };
      setAllProjects((prev) => [...prev, project]);
      setActiveProjectId(project.id); // newly created project becomes the active one
      return { ok: true, project };
    },
    [projects, user.id]
  );

  // ---- Subtask 2: rename ----
  const renameProject = useCallback(
    (id, rawName) => {
      const project = allProjects.find((p) => p.id === id);
      if (!project) return { ok: false, error: 'Project not found.' };
      if (!isOwner(project, user)) return { ok: false, error: 'You do not have permission to rename this project.' };

      const error = validateProjectName(rawName, projects, id);
      if (error) return { ok: false, error };

      const name = normalizeName(rawName);
      setAllProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p))
      );
      return { ok: true };
    },
    [allProjects, projects, user]
  );

  // ---- Subtask 3: delete ----
  const deleteProject = useCallback(
    (id) => {
      const project = allProjects.find((p) => p.id === id);
      if (!project) return { ok: false, error: 'Project not found.' };
      if (!isOwner(project, user)) return { ok: false, error: 'You do not have permission to delete this project.' };

      setAllProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProjectId === id) setActiveProjectId(null);
      return { ok: true };
    },
    [allProjects, user, activeProjectId]
  );

  const openProject = useCallback(
    (id) => {
      if (projects.some((p) => p.id === id)) setActiveProjectId(id);
    },
    [projects]
  );

  // Dialog controls
  const openCreateDialog = () => setDialog({ type: 'create' });
  const openRenameDialog = (projectId) => setDialog({ type: 'rename', projectId });
  const openDeleteDialog = (projectId) => setDialog({ type: 'delete', projectId });
  const closeDialog = () => setDialog(null);

  return (
    <ProjectContext.Provider
      value={{
        user,
        projects,
        activeProject,
        hasActiveProject,
        createProject,
        renameProject,
        deleteProject,
        openProject,
        dialog,
        openCreateDialog,
        openRenameDialog,
        openDeleteDialog,
        closeDialog,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
