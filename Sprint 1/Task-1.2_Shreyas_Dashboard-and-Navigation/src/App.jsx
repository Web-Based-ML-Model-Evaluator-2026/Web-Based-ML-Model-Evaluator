import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  return (
    <DashboardLayout>
      {/* Show the real dashboard page instead of the temporary text */}
      <DashboardPage />
    </DashboardLayout>
  );
}

export default App;