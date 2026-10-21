import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectDialogs } from './components/projects/ProjectDialogs';

function App() {
  return (
    <DashboardLayout>
      <DashboardPage />
      {/* Create / rename / delete popups */}
      <ProjectDialogs />
    </DashboardLayout>
  );
}

export default App;
