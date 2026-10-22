export function validateProjectName(value) {
  const name = String(value ?? "").trim();
  if (!name) return "Project name is required.";
  if (name.length > 100) return "Project name must be 100 characters or fewer.";
  return "";
}

export function validateModelName(value) {
  const name = String(value ?? "").trim();
  if (!name) return "Model name is required.";
  if (name.length > 100) return "Model name must be 100 characters or fewer.";
  return "";
}
