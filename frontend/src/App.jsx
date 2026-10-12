import { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const STATUSES = ['TODO', 'IN_PROGRESS', 'COMPLETED'];
const STATUS_LABELS = { TODO: 'To do', IN_PROGRESS: 'In progress', COMPLETED: 'Completed' };

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const validation = data?.validationErrors && Object.values(data.validationErrors).join(' ');
    throw new Error(validation || data?.message || data?.error || `Request failed (${response.status})`);
  }
  return data;
}

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const shapes = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></>,
    check: <><path d="m5 12 4 4L19 6"/><circle cx="12" cy="12" r="9"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M7.5 3v4M16.5 3v4M3.5 9.5h17"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    edit: <><path d="m15 5 4 4M4 20l4.3-.9L19 8.4a2.1 2.1 0 0 0-3-3L5.3 16.1 4 20Z"/></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 13h11l1-13M9 7V4h6v3"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/></>,
  };
  return <svg {...common}>{shapes[name]}</svg>;
}

function dateLabel(value) {
  if (!value) return 'Recently added';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return 'Recently added';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function App() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('daymark-session') || 'null'); } catch { return null; }
  });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(Boolean(session?.token));
  const [authMode, setAuthMode] = useState('login');
  const [auth, setAuth] = useState({ name: '', email: '', password: '' });
  const [authBusy, setAuthBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(null);
  const [dialogError, setDialogError] = useState('');

  const signOut = useCallback(() => {
    localStorage.removeItem('daymark-session');
    setSession(null);
    setTasks([]);
    setLoading(false);
    setDialog(null);
  }, []);

  const loadTasks = useCallback(async () => {
    if (!session?.token) return;
    setLoading(true);
    try {
      const data = await request('/api/tasks', { token: session.token });
      setTasks(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      if (/401|unauthorized|full authentication/i.test(err.message)) signOut();
      else setError(err.message);
    } finally { setLoading(false); }
  }, [session?.token, signOut]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const counts = useMemo(() => ({
    ALL: tasks.length,
    TODO: tasks.filter((task) => task.status === 'TODO').length,
    IN_PROGRESS: tasks.filter((task) => task.status === 'IN_PROGRESS').length,
    COMPLETED: tasks.filter((task) => task.status === 'COMPLETED').length,
  }), [tasks]);

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const matchesFilter = filter === 'ALL' || task.status === filter;
    const query = search.trim().toLowerCase();
    return matchesFilter && (!query || `${task.title} ${task.description || ''}`.toLowerCase().includes(query));
  }), [tasks, filter, search]);

  function updateAuth(field, value) { setAuth((current) => ({ ...current, [field]: value })); }

  async function submitAuth(event) {
    event.preventDefault();
    setError(''); setNotice(''); setAuthBusy(true);
    try {
      if (authMode === 'register') {
        await request('/api/auth/register', { method: 'POST', body: JSON.stringify({ name: auth.name.trim(), email: auth.email.trim(), password: auth.password }) });
        setNotice('Your account is ready. Sign in to open your workspace.');
        setAuthMode('login'); setAuth((current) => ({ ...current, password: '' }));
      } else {
        const result = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: auth.email.trim(), password: auth.password }) });
        const nextSession = { token: result.token, email: result.email, role: result.role };
        localStorage.setItem('daymark-session', JSON.stringify(nextSession));
        setSession(nextSession); setAuth({ name: '', email: result.email, password: '' });
      }
    } catch (err) { setError(err.message); }
    finally { setAuthBusy(false); }
  }

  async function saveTask(event) {
    event.preventDefault();
    setDialogError('');
    const editing = Boolean(dialog?.task?.id);
    const payload = { title: dialog.title.trim(), description: dialog.description.trim(), status: dialog.status };
    if (!payload.title) return;
    try {
      const result = await request(editing ? `/api/tasks/${dialog.task.id}` : '/api/tasks', {
        method: editing ? 'PUT' : 'POST', token: session.token, body: JSON.stringify(payload),
      });
      setTasks((current) => editing ? current.map((task) => task.id === result.id ? result : task) : [result, ...current]);
      setDialog(null); setNotice(editing ? 'Task updated.' : 'Task created.');
    } catch (err) { setDialogError(err.message); }
  }

  async function changeStatus(task, status) {
    try {
      const result = await request(`/api/tasks/${task.id}`, { method: 'PUT', token: session.token, body: JSON.stringify({ title: task.title, description: task.description || '', status }) });
      setTasks((current) => current.map((item) => item.id === result.id ? result : item));
    } catch (err) { setError(err.message); }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
    try {
      await request(`/api/tasks/${task.id}`, { method: 'DELETE', token: session.token });
      setTasks((current) => current.filter((item) => item.id !== task.id));
      setNotice('Task deleted.');
    } catch (err) { setError(err.message); }
  }

  function openTask(task = null) {
    setError('');
    setDialogError('');
    setDialog({ task, title: task?.title || '', description: task?.description || '', status: task?.status || 'TODO' });
  }

  if (!session?.token) return <main className="auth-page">
    <section className="auth-brand-panel">
      <div className="brand-lockup"><span className="brand-mark"><Icon name="check" size={22}/></span><span>daymark</span></div>
      <div className="auth-promo">
        <div className="eyebrow"><span className="eyebrow-dot"/> YOUR SPACE, IN FOCUS</div>
        <h1>A calmer way<br/>to get things <em>done.</em></h1>
        <p>Bring your tasks into one clear space. Find your focus, keep your momentum, and make room for what matters.</p>
        <div className="promo-card"><div className="promo-card-top"><span>YOUR DAY, AT A GLANCE</span><Icon name="spark" size={18}/></div><div className="promo-progress"><div className="progress-icon"><Icon name="check" size={18}/></div><div className="promo-progress-copy"><strong>Make progress, your way</strong><span>One task at a time is enough.</span></div><span className="mini-dots">•••</span></div><div className="promo-lines"><i/><i/><i/></div></div>
      </div>
      <div className="auth-footer">A little more clarity, every day.</div>
    </section>
    <section className="auth-form-panel">
      <div className="auth-form-wrap">
        <div className="mobile-brand brand-lockup"><span className="brand-mark"><Icon name="check" size={22}/></span><span>daymark</span></div>
        <div className="auth-heading"><div className="eyebrow">{authMode === 'login' ? 'WELCOME BACK' : 'A FRESH START'}</div><h2>{authMode === 'login' ? 'Sign in to your space' : 'Create your account'}</h2><p>{authMode === 'login' ? 'Pick up right where you left off.' : 'Set up your personal task workspace.'}</p></div>
        {error && <div className="alert error-alert" role="alert">{error}</div>}
        {notice && <div className="alert success-alert" role="status">{notice}</div>}
        <form className="auth-form" onSubmit={submitAuth}>
          {authMode === 'register' && <label>Your name<input autoComplete="name" required minLength="2" maxLength="50" placeholder="Alex Morgan" value={auth.name} onChange={(event) => updateAuth('name', event.target.value)}/></label>}
          <label>Email address<input autoComplete="email" type="email" required placeholder="you@example.com" value={auth.email} onChange={(event) => updateAuth('email', event.target.value)}/></label>
          <label>Password<input autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} type="password" required minLength="6" maxLength="100" placeholder="At least 6 characters" value={auth.password} onChange={(event) => updateAuth('password', event.target.value)}/></label>
          <button className="primary-button auth-submit" disabled={authBusy}>{authBusy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'}<Icon name="arrow" size={18}/></button>
        </form>
        <p className="auth-switch">{authMode === 'login' ? 'New to Daymark?' : 'Already have an account?'} <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); setNotice(''); }}>{authMode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
        <div className="auth-safe"><span className="safe-dot"/> Your tasks are private to your account</div>
      </div>
      <div className="auth-copyright">© {new Date().getFullYear()} Daymark</div>
    </section>
  </main>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-lockup"><span className="brand-mark"><Icon name="check" size={22}/></span><span>daymark</span></div>
      <div className="sidebar-section-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Task views">
        <button className={`nav-item ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}><Icon name="grid"/><span>All tasks</span><b>{counts.ALL}</b></button>
        <button className={`nav-item ${filter === 'TODO' ? 'active' : ''}`} onClick={() => setFilter('TODO')}><span className="nav-status status-todo"/><span>To do</span><b>{counts.TODO}</b></button>
        <button className={`nav-item ${filter === 'IN_PROGRESS' ? 'active' : ''}`} onClick={() => setFilter('IN_PROGRESS')}><span className="nav-status status-progress"/><span>In progress</span><b>{counts.IN_PROGRESS}</b></button>
        <button className={`nav-item ${filter === 'COMPLETED' ? 'active' : ''}`} onClick={() => setFilter('COMPLETED')}><Icon name="check"/><span>Completed</span><b>{counts.COMPLETED}</b></button>
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><span className="note-icon"><Icon name="spark" size={18}/></span><strong>Small steps add up.</strong><span>Keep showing up for the work that matters.</span></div><button className="profile-button" onClick={signOut}><span className="avatar">{(session.email || 'U').charAt(0).toUpperCase()}</span><span className="profile-copy"><strong>{session.email}</strong><small>Personal workspace</small></span><Icon name="logout" size={18}/></button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span className="crumb-separator">/</span><strong>{filter === 'ALL' ? 'All tasks' : STATUS_LABELS[filter]}</strong></div><div className="topbar-right"><div className="today-chip"><Icon name="calendar" size={16}/>{new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</div><span className="avatar top-avatar">{(session.email || 'U').charAt(0).toUpperCase()}</span></div></header>
      <div className="content-wrap">
        <div className="page-intro"><div><div className="eyebrow">YOUR PERSONAL WORKSPACE</div><h1>{filter === 'ALL' ? 'Your tasks' : STATUS_LABELS[filter]}</h1><p>A little progress each day adds up to big results.</p></div><button className="primary-button add-task-button" onClick={() => openTask()}><Icon name="plus" size={19}/> New task</button></div>
        {(error || notice) && <div className={`alert ${error ? 'error-alert' : 'success-alert'}`} role={error ? 'alert' : 'status'}>{error || notice}<button aria-label="Dismiss message" onClick={() => { setError(''); setNotice(''); }}><Icon name="close" size={17}/></button></div>}
        <section className="overview-grid" aria-label="Task summary"><article className="overview-card overview-total"><div className="overview-heading"><span>Total tasks</span><span className="overview-icon lavender"><Icon name="grid" size={18}/></span></div><div className="overview-number">{counts.ALL}<small> tasks</small></div><div className="overview-foot">Everything you’re working on</div></article><article className="overview-card"><div className="overview-heading"><span>To do</span><span className="overview-icon coral"><span className="tiny-status status-todo"/></span></div><div className="overview-number">{counts.TODO}<small> tasks</small></div><div className="overview-foot">Ready when you are</div></article><article className="overview-card"><div className="overview-heading"><span>In progress</span><span className="overview-icon blue"><span className="tiny-status status-progress"/></span></div><div className="overview-number">{counts.IN_PROGRESS}<small> tasks</small></div><div className="overview-foot">Keep the momentum going</div></article><article className="overview-card"><div className="overview-heading"><span>Completed</span><span className="overview-icon green"><Icon name="check" size={18}/></span></div><div className="overview-number">{counts.COMPLETED}<small> tasks</small></div><div className="overview-foot">Look at what you’ve done</div></article></section>
        <section className="tasks-panel"><div className="tasks-panel-heading"><div><h2>Task list</h2><p>{visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'} {filter === 'ALL' ? 'in your workspace' : `· ${STATUS_LABELS[filter]}`}</p></div><div className="task-controls"><label className="search-box"><Icon name="search" size={18}/><input aria-label="Search tasks" placeholder="Search tasks" value={search} onChange={(event) => setSearch(event.target.value)}/>{search && <button aria-label="Clear search" onClick={() => setSearch('')}><Icon name="close" size={15}/></button>}</label><select className="filter-select" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter tasks"><option value="ALL">All tasks</option>{STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select></div></div>
          <div className="task-list">{loading ? <div className="empty-state"><div className="loading-spinner"/><strong>Loading your tasks</strong><span>Getting your workspace ready…</span></div> : visibleTasks.length ? visibleTasks.map((task) => <article className={`task-row ${task.status === 'COMPLETED' ? 'task-done' : ''}`} key={task.id}><button className={`task-check ${task.status === 'COMPLETED' ? 'checked' : ''}`} title={task.status === 'COMPLETED' ? 'Mark as to do' : 'Mark as completed'} onClick={() => changeStatus(task, task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED')}><Icon name="check" size={15}/></button><div className="task-main"><h3>{task.title}</h3>{task.description && <p>{task.description}</p>}<div className="task-meta"><span className={`status-pill pill-${task.status.toLowerCase().replace('_', '-')}`}><i/>{STATUS_LABELS[task.status] || task.status}</span><span className="task-date">Added {dateLabel(task.createdAt)}</span></div></div><div className="task-actions"><select aria-label={`Change status for ${task.title}`} value={task.status} onChange={(event) => changeStatus(task, event.target.value)}>{STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select><button title="Edit task" aria-label={`Edit ${task.title}`} onClick={() => openTask(task)}><Icon name="edit" size={17}/></button><button title="Delete task" aria-label={`Delete ${task.title}`} onClick={() => deleteTask(task)}><Icon name="trash" size={17}/></button></div></article>) : <div className="empty-state"><span className="empty-illustration"><Icon name={search || filter !== 'ALL' ? 'search' : 'check'} size={25}/></span><strong>{search || filter !== 'ALL' ? 'No tasks found' : 'A clear start'}</strong><span>{search || filter !== 'ALL' ? 'Try a different search or status.' : 'Add your first task and make today count.'}</span>{!search && filter === 'ALL' && <button className="text-button" onClick={() => openTask()}><Icon name="plus" size={16}/> Create your first task</button>}</div>}</div>
        </section>
        <footer className="page-footer"><span>Made for steady progress.</span><span>Private by design <i className="footer-dot"/> Secure sign-in</span></footer>
      </div>
    </main>
    {dialog && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}><section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title"><div className="modal-heading"><div><div className="eyebrow">{dialog.task ? 'MAKE AN UPDATE' : 'A NEW FOCUS'}</div><h2 id="task-modal-title">{dialog.task ? 'Edit task' : 'Create a task'}</h2></div><button className="icon-button" aria-label="Close dialog" onClick={() => setDialog(null)}><Icon name="close"/></button></div>{dialogError && <div className="alert error-alert" role="alert">{dialogError}</div>}<form className="task-form" onSubmit={saveTask}><label>Task name<input autoFocus required maxLength="150" placeholder="What would you like to get done?" value={dialog.title} onChange={(event) => setDialog((current) => ({ ...current, title: event.target.value }))}/><small>Keep it clear and specific.</small></label><label>Description <span className="optional">OPTIONAL</span><textarea rows="4" placeholder="Add a few details to help you get started…" value={dialog.description} onChange={(event) => setDialog((current) => ({ ...current, description: event.target.value }))}/></label><label>Status<select value={dialog.status} onChange={(event) => setDialog((current) => ({ ...current, status: event.target.value }))}>{STATUSES.map((status) => <option value={status} key={status}>{STATUS_LABELS[status]}</option>)}</select></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setDialog(null)}>Cancel</button><button className="primary-button" type="submit">{dialog.task ? 'Save changes' : 'Create task'}<Icon name="arrow" size={17}/></button></div></form></section></div>}
  </div>;
}

export default App;
