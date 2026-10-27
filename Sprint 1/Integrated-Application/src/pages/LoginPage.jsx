import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell.jsx';
import FormField from '../components/auth/FormField.jsx';
import StatusMessage from '../components/auth/StatusMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title="Sign in to your account"
      subtitle="Enter your credentials to access your workspace."
      footer="New to the evaluator?"
      alternateLink="/register"
      alternateText="Create an account"
    >
      <form className="auth-form" onSubmit={submit}>
        <StatusMessage message={error} />
        <FormField id="email" label="Email address" type="email" value={form.email} onChange={update} autoComplete="email" placeholder="you@example.com" />
        <FormField id="password" label="Password" type="password" value={form.password} onChange={update} autoComplete="current-password" placeholder="Enter your password" />
        <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <span aria-hidden="true">→</span></button>
      </form>
    </AuthShell>
  );
}
