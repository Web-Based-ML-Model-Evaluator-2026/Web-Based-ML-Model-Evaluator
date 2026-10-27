import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell.jsx';
import FormField from '../components/auth/FormField.jsx';
import StatusMessage from '../components/auth/StatusMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function validate(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Enter your name (at least 2 characters).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  if (form.password.length < 8) errors.password = 'Use at least 8 characters.';
  if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setErrors((current) => ({ ...current, [event.target.name]: '' }));
    setMessage('');
  }

  async function submit(event) {
    event.preventDefault();
    const validation = validate(form);
    setErrors(validation);
    setMessage('');
    if (Object.values(validation).some(Boolean)) return;

    setBusy(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setMessage(err.message || 'Unable to create your account.');
      if (err.fieldErrors) setErrors((current) => ({ ...current, ...err.fieldErrors }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      eyebrow="GET STARTED"
      title="Create your account"
      subtitle="Set up your account to begin evaluating machine-learning models."
      footer="Already registered?"
      alternateLink="/login"
      alternateText="Sign in"
    >
      <form className="auth-form" onSubmit={submit} noValidate>
        <StatusMessage message={message} />
        <FormField id="name" label="Full name" value={form.name} onChange={update} autoComplete="name" placeholder="Your full name" error={errors.name} />
        <FormField id="email" label="Email address" type="email" value={form.email} onChange={update} autoComplete="email" placeholder="you@example.com" error={errors.email} />
        <FormField id="password" label="Password" type="password" value={form.password} onChange={update} autoComplete="new-password" placeholder="At least 8 characters" error={errors.password} />
        <FormField id="confirmPassword" label="Confirm password" type="password" value={form.confirmPassword} onChange={update} autoComplete="new-password" placeholder="Enter password again" error={errors.confirmPassword} />
        <p className="password-note">Use at least 8 characters. Your password is hashed by the server before it is stored.</p>
        <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'} <span aria-hidden="true">→</span></button>
      </form>
    </AuthShell>
  );
}
