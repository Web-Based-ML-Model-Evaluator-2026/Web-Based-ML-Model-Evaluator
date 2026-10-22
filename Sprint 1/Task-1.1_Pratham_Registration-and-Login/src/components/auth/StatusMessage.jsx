export default function StatusMessage({ message, kind = 'error' }) {
  if (!message) return null;
  return <div className={`status-message ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{message}</div>;
}
