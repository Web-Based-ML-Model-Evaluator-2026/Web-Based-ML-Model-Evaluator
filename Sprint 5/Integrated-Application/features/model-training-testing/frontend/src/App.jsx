import React from 'react';
import ModelTrainer from './components/ModelTrainer';

// MAIN APPLICATION COMPONENT
// This serves as the root wrapper for the Sprint 4 tasks.
function App() {
  return (
    // Creates a light gray, full-screen background shell to match standard web app layouts
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Injects the ModelTrainer component into the center of the page */}
      <ModelTrainer />
      
    </div>
  );
}

export default App;