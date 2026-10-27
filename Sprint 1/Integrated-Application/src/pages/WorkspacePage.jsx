import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Home, FolderKanban, Database, Settings2, Cpu, BarChart3, FileText, Plus, Search, LogOut, MoreHorizontal, Pencil, Trash2, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { projectService } from '../services/projectService.js';

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
const initialForm = { name: '', description: '' };

export default function WorkspacePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);
  const [activeNav, setActiveNav] = useState('Home');

  async function refresh() {
    setLoading(true); setError('');
    try { const data = await projectService.list(); setProjects(data.projects || []); }
    catch (e) { setError(e.message); if (e.status === 401) navigate('/login'); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);
  const filtered = useMemo(() => projects.filter(p => `${p.name} ${p.description || ''}`.toLowerCase().includes(query.toLowerCase())), [projects, query]);

  function openCreate() { setForm(initialForm); setDialog({ type: 'create' }); }
  function openEdit(p) { setForm({ name: p.name, description: p.description || '' }); setDialog({ type: 'edit', project: p }); }
  async function submit(e) {
    e.preventDefault(); setError('');
    const name = form.name.trim().replace(/\s+/g, ' ');
    if (name.length < 3 || name.length > 50) { setError('Project name must be between 3 and 50 characters.'); return; }
    if (!/^[A-Za-z0-9 _.-]+$/.test(name)) { setError('Use only letters, numbers, spaces, hyphens, underscores and dots in the project name.'); return; }
    if (form.description.trim().length > 500) { setError('Description must be 500 characters or fewer.'); return; }
    setBusy(true);
    try {
      if (dialog.type === 'create') await projectService.create({ name, description: form.description.trim() });
      else await projectService.update(dialog.project.id, { name, description: form.description.trim() });
      setDialog(null); await refresh();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function remove(p) {
    if (!window.confirm(`Delete project “${p.name}”? This cannot be undone.`)) return;
    setError('');
    try { await projectService.remove(p.id); await refresh(); }
    catch (e) { setError(e.message); }
  }
  async function signOut() {
    try { await logout(); navigate('/login', { replace: true }); }
    catch (e) { setError(e.message || 'Could not sign out. Please try again.'); }
  }
  const nav = [
    { name: 'Home', icon: Home }, { name: 'Projects', icon: FolderKanban },
    { name: 'Datasets', icon: Database }, { name: 'Preprocessing', icon: Settings2 },
    { name: 'Train & Evaluate', icon: Cpu }, { name: 'Compare Results', icon: BarChart3 },
    { name: 'Reports', icon: FileText }
  ];
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-icon"><Brain size={22}/></span><span>ML Evaluator</span></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{nav.map(item => <button key={item.name} className={`nav-item ${activeNav === item.name ? 'active' : ''}`} onClick={() => { setActiveNav(item.name); if (item.name === 'Projects') document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }); }}><item.icon size={18}/><span>{item.name}</span>{['Datasets','Preprocessing','Train & Evaluate','Compare Results','Reports'].includes(item.name) && <span className="soon">Soon</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="avatar">{(user?.name || 'U').slice(0,1).toUpperCase()}</div><div className="user-meta"><strong>{user?.name || 'User'}</strong><span>{user?.email}</span></div><button className="icon-button" title="Sign out" onClick={signOut}><LogOut size={17}/></button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div><span className="crumb">Workspace</span><span className="slash">/</span><strong>{activeNav}</strong></div><div className="top-actions"><span className="status-dot"></span><span>Workspace ready</span><div className="avatar small">{(user?.name || 'U').slice(0,1).toUpperCase()}</div></div></header>
      <div className="page-content">
        <section className="welcome">
          <div><div className="eyebrow"><Sparkles size={14}/> YOUR MACHINE LEARNING WORKSPACE</div><h1>{greeting()}, {user?.name?.split(' ')[0] || 'there'} <span>👋</span></h1><p>Turn your data into powerful insights. Create a project and keep your ML experiments organized in one place.</p><div className="welcome-actions"><button className="button primary" onClick={openCreate}><Plus size={17}/> Create new project</button><span className="subtle">Your projects are private to your account.</span></div></div>
          <div className="hero-art"><div className="orb orb-one"></div><div className="orb orb-two"></div><div className="chart-card"><div className="chart-top"><span>MODEL PERFORMANCE</span><span className="chart-pill">Preview</span></div><div className="chart-bars"><i style={{height:'36%'}}></i><i style={{height:'54%'}}></i><i style={{height:'43%'}}></i><i style={{height:'74%'}}></i><i style={{height:'62%'}}></i><i style={{height:'91%'}}></i><i style={{height:'78%'}}></i></div><div className="chart-foot"><span>Accuracy</span><b>—</b></div></div></div>
        </section>
        <section className="stats">
          <article className="stat-card"><span className="stat-icon purple"><FolderKanban size={19}/></span><div><span>Total projects</span><strong>{projects.length}</strong></div></article>
          <article className="stat-card"><span className="stat-icon blue"><Database size={19}/></span><div><span>Datasets added</span><strong>0</strong></div></article>
          <article className="stat-card"><span className="stat-icon orange"><Cpu size={19}/></span><div><span>Models evaluated</span><strong>0</strong></div></article>
        </section>
        <section id="projects" className="projects-section">
          <div className="section-head"><div><h2>Your projects</h2><p>Manage your experiments and project details.</p></div><button className="button secondary" onClick={openCreate}><Plus size={16}/> New project</button></div>
          <div className="search-row"><div className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search projects by name or description…" aria-label="Search projects"/></div><span className="count">{filtered.length} {filtered.length === 1 ? 'project' : 'projects'}</span></div>
          {error && <div className="alert" role="alert">{error}</div>}
          {loading ? <div className="empty"><div className="spinner"></div><p>Loading your projects…</p></div> : filtered.length ? <div className="project-grid">{filtered.map(p => <article className="project-card" key={p.id}><div className="project-card-head"><div className="project-icon"><FolderKanban size={20}/></div><button className="icon-button" title={`Options for ${p.name}`} onClick={() => openEdit(p)}><MoreHorizontal size={19}/></button></div><h3>{p.name}</h3><p className="project-description">{p.description || 'No description added yet.'}</p><div className="project-footer"><span className="draft-tag"><span></span> Draft</span><div className="project-actions"><button onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`}><Pencil size={15}/> Edit</button><button className="danger-action" onClick={() => remove(p)} aria-label={`Delete ${p.name}`}><Trash2 size={15}/> Delete</button></div></div><div className="created-date">Created {new Date(p.created_at || p.createdAt).toLocaleDateString()}</div></article>)}</div> : <div className="empty"><div className="empty-icon"><FolderKanban size={24}/></div><h3>{query ? 'No matching projects' : 'Your workspace starts here'}</h3><p>{query ? 'Try a different search term.' : 'Create your first project to start organizing your machine learning experiments.'}</p>{!query && <button className="button primary" onClick={openCreate}><Plus size={17}/> Create your first project</button>}</div>}
        </section>
        <footer className="footer">ML Evaluator <span>•</span> Sprint 1 foundation <span className="footer-right">More ML tools will arrive in upcoming sprints.</span></footer>
      </div>
    </main>
    {dialog && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setDialog(null); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><span className="eyebrow">{dialog.type === 'create' ? 'NEW WORKSPACE PROJECT' : 'PROJECT SETTINGS'}</span><h2 id="modal-title">{dialog.type === 'create' ? 'Create a project' : 'Edit project'}</h2></div><button className="icon-button" onClick={() => { setDialog(null); setError(''); }} aria-label="Close dialog"><X size={19}/></button></div><form onSubmit={submit}><label>Project name <span>*</span><input autoFocus maxLength={50} value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="e.g. Customer Churn Prediction" required/></label><div className="field-hint">3–50 characters. Letters, numbers, spaces, hyphens, underscores and dots.</div><label>Description <small>(optional)</small><textarea maxLength={500} rows={3} value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="What are you trying to evaluate?"/></label>{error && <div className="alert" role="alert">{error}</div>}<div className="modal-actions"><button type="button" className="button secondary" onClick={() => { setDialog(null); setError(''); }}>Cancel</button><button disabled={busy} className="button primary" type="submit">{busy ? 'Saving…' : dialog.type === 'create' ? 'Create project' : 'Save changes'}</button></div></form></section></div>}
  </div>;
}
