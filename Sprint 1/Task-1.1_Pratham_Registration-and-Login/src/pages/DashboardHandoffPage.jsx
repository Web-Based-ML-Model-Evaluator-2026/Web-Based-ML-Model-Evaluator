import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardHandoffPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function signOut() {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      setError('Could not sign out. Please try again.');
    }
  }

  return (
    <main className="handoff-page">
      <section className="handoff-card">
        <div className="brand-mark" aria-hidden="true">ML</div>
        <p className="eyebrow">AUTHENTICATION SUCCESSFUL</p>
        <h1>You're signed in, {user?.name || 'user'}.</h1>
        <p>Your account session is active. This is a temporary handoff page for Task 1.1.</p>
        <p className="handoff-note">During final integration, the Sprint 1 integration lead should connect this route to Shreyas's dashboard rather than replacing his application entry point.</p>
        {error && <p className="field-error" role="alert">{error}</p>}
        <button className="primary-button" onClick={signOut}>Sign out <span aria-hidden="true">→</span></button>
      </section>
    </main>
  );
}
