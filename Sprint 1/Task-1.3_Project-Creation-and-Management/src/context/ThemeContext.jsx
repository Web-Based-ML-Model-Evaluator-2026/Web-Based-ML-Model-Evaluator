import { createContext, useState, useEffect } from 'react';

// Create a context so any component can use the theme
export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  
  // 1. Initialize state by checking localStorage FIRST
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Look inside the browser's storage for a saved theme
    const savedTheme = localStorage.getItem('theme');
    // If it says 'dark', start in dark mode. Otherwise, start in light mode.
    return savedTheme === 'dark';
  });

  // 2. Watch for changes to update the website AND save to localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark'); // Turn website black
      localStorage.setItem('theme', 'dark');          // Save choice to memory
    } else {
      document.documentElement.classList.remove('dark'); // Turn website light
      localStorage.setItem('theme', 'light');            // Save choice to memory
    }
  }, [isDarkMode]);

  // Function to switch between light and dark
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    // Share the state and toggle function with the app
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}