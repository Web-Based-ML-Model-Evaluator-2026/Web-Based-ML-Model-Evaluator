import { z } from 'zod';
import { all, run, get } from './db.js';
import { requireAuth } from './auth.js';

const routerSchema = z.object({
  name: z.string().trim().min(3, 'Project name must be at least 3 characters.').max(50, 'Project name must be 50 characters or fewer.').regex(/^[A-Za-z0-9 _.-]+$/, 'Use only letters, numbers, spaces, hyphens, underscores and dots.'),
  description: z.string().trim().max(500, 'Description must be 500 characters or fewer.').optional().default('')
});
function validate(req, res) {
  const parsed = routerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid project details.' });
    return null;
  }
  return parsed.data;
}
export async function listProjects(req, res, next) {
  try {
    const projects = await all('SELECT id, owner_id, name, description, status, created_at, updated_at FROM projects WHERE owner_id = ? ORDER BY created_at DESC', [req.auth.sub]);
    res.json({ projects });
  } catch (e) { next(e); }
}
export async function createProject(req, res, next) {
  const data = validate(req, res); if (!data) return;
  try {
    const duplicate = await get('SELECT id FROM projects WHERE owner_id = ? AND lower(name) = lower(?)', [req.auth.sub, data.name]);
    if (duplicate) return res.status(409).json({ message: 'You already have a project with this name.' });
    const now = new Date().toISOString();
    const result = await run('INSERT INTO projects (owner_id, name, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [req.auth.sub, data.name.replace(/\s+/g, ' '), data.description, 'Draft', now, now]);
    const project = await get('SELECT id, owner_id, name, description, status, created_at, updated_at FROM projects WHERE id = ?', [result.lastID]);
    res.status(201).json({ project });
  } catch (e) { next(e); }
}
export async function updateProject(req, res, next) {
  const data = validate(req, res); if (!data) return;
  try {
    const existing = await get('SELECT id FROM projects WHERE id = ? AND owner_id = ?', [req.params.id, req.auth.sub]);
    if (!existing) return res.status(404).json({ message: 'Project not found.' });
    const duplicate = await get('SELECT id FROM projects WHERE owner_id = ? AND lower(name) = lower(?) AND id <> ?', [req.auth.sub, data.name, req.params.id]);
    if (duplicate) return res.status(409).json({ message: 'You already have a project with this name.' });
    await run('UPDATE projects SET name = ?, description = ?, updated_at = ? WHERE id = ? AND owner_id = ?', [data.name.replace(/\s+/g, ' '), data.description, new Date().toISOString(), req.params.id, req.auth.sub]);
    const project = await get('SELECT id, owner_id, name, description, status, created_at, updated_at FROM projects WHERE id = ?', [req.params.id]);
    res.json({ project });
  } catch (e) { next(e); }
}
export async function deleteProject(req, res, next) {
  try {
    const result = await run('DELETE FROM projects WHERE id = ? AND owner_id = ?', [req.params.id, req.auth.sub]);
    if (!result.changes) return res.status(404).json({ message: 'Project not found.' });
    res.json({ message: 'Project deleted successfully.' });
  } catch (e) { next(e); }
}
export { requireAuth };
