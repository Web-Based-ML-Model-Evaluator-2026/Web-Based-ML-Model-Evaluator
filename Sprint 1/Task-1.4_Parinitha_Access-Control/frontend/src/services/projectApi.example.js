// Example only; adjust URL and authentication to the real team app.
export async function listProjects() {
  const response = await fetch("/api/projects/", {
    method: "GET", credentials: "include", headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Could not load projects (HTTP ${response.status}).`);
  return response.json();
}
