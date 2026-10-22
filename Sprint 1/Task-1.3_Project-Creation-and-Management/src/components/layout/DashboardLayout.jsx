import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

// The { children } prop represents whatever page content we put inside this layout
export function DashboardLayout({ children }) {
  return (
    // The main wrapper that takes up the full screen height (h-screen)
    <div className="flex h-screen overflow-hidden bg-light-bg dark:bg-dark-bg transition-colors duration-200">
      
      {/* 1. Render the Sidebar on the left side */}
      <Sidebar />

      {/* 2. The main content area on the right side */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Render the Navbar at the very top of the right side */}
        <Navbar />

        {/* Scrollable area below the Navbar where the actual dashboard content goes */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
        
      </div>
      
    </div>
  );
}