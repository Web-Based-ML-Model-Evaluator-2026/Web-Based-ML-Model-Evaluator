import { useState, useContext } from 'react';
import { 
  Home, FolderKanban, Database, Settings2, Cpu,
  BarChart2, FileText, ChevronLeft, ChevronRight, Brain, Plus 
} from 'lucide-react';
// CORRECTED IMPORT PATH (only two dots: ../../)
import { ProjectContext } from '../../context/ProjectContext';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  
  // Get the project state and the function to create a project
  const { hasActiveProject, createProject } = useContext(ProjectContext);
  
  // Links that are always visible
  const baseLinks = [
    { name: 'Home', icon: <Home size={20} /> },
    { name: 'Projects', icon: <FolderKanban size={20} /> },
  ];

  // Links that ONLY appear after clicking Create Project
  const hiddenLinks = [
    { name: 'Datasets', icon: <Database size={20} /> },
    { name: 'Preprocessing', icon: <Settings2 size={20} /> },
    { name: 'Train & Evaluate', icon: <Cpu size={20} /> },
  ];

  // Links at the bottom
  const bottomLinks = [
    { name: 'Compare Results', icon: <BarChart2 size={20} /> },
    { name: 'Reports', icon: <FileText size={20} /> },
  ];

  // Combine them based on state
  const navLinks = hasActiveProject 
    ? [...baseLinks, ...hiddenLinks, ...bottomLinks]
    : [...baseLinks, ...bottomLinks];

  return (
    <div className={`${isOpen ? 'w-64' : 'w-20'} h-screen bg-light-panel dark:bg-dark-panel border-r border-light-border dark:border-dark-border transition-all duration-300 flex flex-col relative`}>
      
      <button onClick={() => setIsOpen(!isOpen)} className="absolute -right-3 top-6 bg-primary text-white p-1 rounded-full hover:bg-blue-700 z-10">
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      <div className="flex items-center gap-3 p-5 h-16">
        <div className="text-primary"><Brain size={32} /></div>
        {isOpen && <span className="text-xl font-bold text-light-textPrimary dark:text-dark-textPrimary">ML Evaluator</span>}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        {navLinks.map((link, index) => (
          <button key={index} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-light-textSecondary dark:text-dark-textSecondary hover:bg-blue-50 hover:text-primary dark:hover:bg-gray-800 dark:hover:text-primary transition-colors ${!isOpen && 'justify-center'}`} title={!isOpen ? link.name : ""}>
            {link.icon}
            {isOpen && <span className="font-medium text-sm">{link.name}</span>}
          </button>
        ))}
      </nav>

      {/* Button to unlock the hidden links */}
      <div className="p-4 mt-auto mb-4 border-t border-light-border dark:border-dark-border pt-4">
        <button 
          onClick={createProject}
          className={`w-full flex items-center justify-center gap-2 bg-primary text-white p-2.5 rounded-lg hover:bg-blue-700 transition-colors ${!isOpen && 'px-0'}`}
          title={!isOpen ? "Create Project" : ""}
        >
          <Plus size={20} />
          {isOpen && <span className="font-medium text-sm">Create Project</span>}
        </button>
      </div>
    </div>
  );
}