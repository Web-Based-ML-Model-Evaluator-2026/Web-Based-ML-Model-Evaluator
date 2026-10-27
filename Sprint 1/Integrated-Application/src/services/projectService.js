async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || 'Request failed.');
    error.status = response.status;
    error.errors = body.errors || {};
    throw error;
  }
  return body;
}
export const projectService = {
  list: () => request('/api/projects'),
  create: (payload) => request('/api/projects', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id) => request(`/api/projects/${id}`, { method: 'DELETE' })
};
