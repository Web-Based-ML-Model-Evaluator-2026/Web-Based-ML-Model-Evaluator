import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import WorkspacePage from './pages/WorkspacePage.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Restoring your session…</div>;
  return user ? children : <Navigate to="/login" replace />;
}
export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Restoring your session…</div>;
  return <Routes>
    <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
    <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
    <Route path="/dashboard" element={<Protected><WorkspacePage /></Protected>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
