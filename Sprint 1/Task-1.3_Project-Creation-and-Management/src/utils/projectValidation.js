// Pure helper functions (no React) so the rules are easy to test.

export const PROJECT_NAME_MIN = 3;
export const PROJECT_NAME_MAX = 50;

// Letters, numbers, spaces, hyphens, underscores and dots only.
const ALLOWED_CHARS = /^[A-Za-z0-9 _.-]+$/;

// Trim and collapse repeated spaces: "  My   Project " -> "My Project"
export function normalizeName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ');
}

/**
 * Validate a project name.
 * @param {string} rawName       what the user typed
 * @param {Array}  ownerProjects projects belonging to the SAME owner
 * @param {string|null} ignoreId project id to skip in the duplicate check (used when renaming)
 * @returns {string|null} an error message, or null if the name is valid
 */
export function validateProjectName(rawName, ownerProjects = [], ignoreId = null) {
  const name = normalizeName(rawName);

  if (!name) return 'Project name is required.';
  if (name.length < PROJECT_NAME_MIN) return `Project name must be at least ${PROJECT_NAME_MIN} characters.`;
  if (name.length > PROJECT_NAME_MAX) return `Project name must be ${PROJECT_NAME_MAX} characters or fewer.`;
  if (!ALLOWED_CHARS.test(name)) return 'Use only letters, numbers, spaces, hyphens, underscores and dots.';

  const duplicate = ownerProjects.some(
    (p) => p.id !== ignoreId && p.name.toLowerCase() === name.toLowerCase()
  );
  if (duplicate) return 'You already have a project with this name.';

  return null;
}

// A user may only change or delete projects they own.
export function isOwner(project, user) {
  return Boolean(project && user && project.ownerId === user.id);
}
