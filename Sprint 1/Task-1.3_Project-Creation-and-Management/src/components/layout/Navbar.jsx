import { useState, useContext } from 'react';
// Import our theme context to switch between dark and light mode
import { ThemeContext } from '../../context/ThemeContext';
import { ProjectContext } from '../../context/ProjectContext';
// Import icons from the lucide-react library
import { Search, User, Moon, Sun, ChevronDown } from 'lucide-react';

export function Navbar() {
  // Get the current theme state and the toggle function
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  // Logged-in user (owner of the projects)
  const { user } = useContext(ProjectContext);
  
  // State to control whether the profile dropdown menu is open or closed
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    // The main top navigation bar container
    <header className="h-16 flex items-center justify-between px-6 bg-light-panel dark:bg-dark-panel border-b border-light-border dark:border-dark-border transition-colors">
      
      {/* Left Side: Search Bar */}
      <div className="flex items-center w-96 bg-gray-100 dark:bg-gray-900 rounded-lg px-3 py-2">
        {/* Search icon */}
        <Search size={18} className="text-gray-400" />
        {/* Input field for searching projects (Removed dataset and model text) */}
        <input 
          type="text" 
          placeholder="Search projects..." 
          className="ml-2 bg-transparent border-none outline-none w-full text-sm text-light-textPrimary dark:text-dark-textPrimary placeholder-gray-400"
        />
      </div>

      {/* Right Side: User Profile section (Notification icon is completely removed) */}
      <div className="flex items-center relative">
        
        {/* Button that shows the user's profile and opens the dropdown menu when clicked */}
        <button 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 p-1.5 rounded-lg transition-colors"
        >
          {/* User icon inside a blue circle */}
          <div className="bg-primary text-white p-1 rounded-full">
            <User size={20} />
          </div>
          {/* The name of the logged-in user (Currently dummy text "John Doe") */}
          <span className="text-sm font-medium text-light-textPrimary dark:text-dark-textPrimary">
            {user.name}
          </span>
          {/* Small down arrow icon */}
          <ChevronDown size={16} className="text-gray-500" />
        </button>

        {/* Dropdown Menu: This only shows up if 'isProfileOpen' is true */}
        {isProfileOpen && (
          <div className="absolute right-0 top-12 mt-2 w-48 bg-white dark:bg-dark-panel border border-light-border dark:border-dark-border rounded-lg shadow-lg py-2 z-50">
            
            {/* User details inside the dropdown */}
            <div className="px-4 py-2 border-b border-light-border dark:border-dark-border mb-2">
              <p className="text-sm font-medium text-light-textPrimary dark:text-dark-textPrimary">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>

            {/* Button to toggle between Light Mode and Dark Mode */}
            <button 
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-light-textSecondary dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                {/* Show Sun icon if dark mode is active, otherwise show Moon icon */}
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
            </button>
            
          </div>
        )}
      </div>
    </header>
  );
}