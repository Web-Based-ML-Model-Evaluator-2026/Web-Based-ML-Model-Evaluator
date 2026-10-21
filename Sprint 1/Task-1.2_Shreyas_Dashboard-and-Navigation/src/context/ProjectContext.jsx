import { createContext, useState } from 'react';

// Create a context to share project state across the whole app
export const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  // State to track if the user has created a project (starts as false)
  const [hasActiveProject, setHasActiveProject] = useState(false);

  // Function to simulate creating a project
  const createProject = () => {
    setHasActiveProject(true);
  };

  return (
    <ProjectContext.Provider value={{ hasActiveProject, createProject }}>
      {children}
    </ProjectContext.Provider>
  );
}