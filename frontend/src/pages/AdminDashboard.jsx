import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Users, Activity, Leaf, ShieldCheck, ShieldAlert, TrendingUp,
  AlertTriangle, CheckCircle2, Trash2, RefreshCw, Search,
  ChevronRight, Server, Cpu, Database, Clock, Eye, BarChart3,
  UserX, UserCheck, Crown, AlertCircle, X
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

// ── Small helpers ──────────────────────────────────────────────────────────

const Badge = ({ type, children }) => (
  <span className={`admin-badge admin-badge--${type}`}>{children}</span>
);

const StatCard = ({ icon: Icon, label, value, sub, color, trend }) => (
  <div className="admin-stat-card">
    <div className="admin-stat-card__header">
      <span className="admin-stat-card__label">{label}</span>
      <div className="admin-stat-card__icon" style={{ background: `${color}18`, color }}>
        <Icon size={18} />
      </div>
    </div>
    <div className="admin-stat-card__value" style={{ color: color !== '#60a5fa' ? color : 'var(--text-main)' }}>
      {value}
    </div>
    {sub && <div className="admin-stat-card__sub">{sub}</div>}
  </div>
);

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="admin-modal-overlay" onClick={onCancel}>
    <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
      <div className="admin-modal-icon"><AlertCircle size={28} color="#f87171" /></div>
      <p className="admin-modal-msg">{message}</p>
      <div className="admin-modal-actions">
        <button className="admin-btn admin-btn--ghost" onClick={onCancel}>Cancel</button>
        <button className="admin-btn admin-btn--danger" onClick={onConfirm}>Delete</button>
      </div>
    </div>
  </div>
);

// ── Tab: Overview ──────────────────────────────────────────────────────────

const OverviewTab = ({ stats, predictions, loading }) => {
  if (loading) return <div className="admin-loading"><RefreshCw className="spinning" size={22} /> Loading stats…</div>;
  if (!stats) return null;

  const diseaseCount = stats.total_predictions - stats.healthy_count;
  const diseaseRate = stats.total_predictions > 0
    ? ((diseaseCount / stats.total_predictions) * 100).toFixed(1) : '0';
  const healthyRate = stats.total_predictions > 0
    ? ((stats.healthy_count / stats.total_predictions) * 100).toFixed(1) : '100';

  const recent = predictions.slice(0, 8);

  return (
    <div className="admin-overview">
      {/* KPI Cards */}
      <div className="admin-stats-grid">
        <StatCard icon={Users} label="Registered Users" value={stats.total_users} sub="Total accounts" color="#60a5fa" />
        <StatCard icon={Leaf} label="Total Scans" value={stats.total_predictions} sub="Across all users" color="#60a5fa" />
        <StatCard icon={CheckCircle2} label="Healthy Rate" value={`${healthyRate}%`} sub={`${stats.healthy_count} healthy samples`} color="#34d399" />
        <StatCard icon={AlertTriangle} label="Disease Rate" value={`${diseaseRate}%`} sub={`${diseaseCount} affected records`} color="#f87171" />
        <StatCard icon={TrendingUp} label="Avg Confidence" value={`${(stats.average_confidence * 100).toFixed(1)}%`} sub="Model certainty" color="#a78bfa" />
        <StatCard icon={BarChart3} label="Early Blight" value={stats.early_blight_count} sub="Alternaria solani" color="#fb923c" />
        <StatCard icon={AlertTriangle} label="Late Blight" value={stats.late_blight_count} sub="Phytophthora infestans" color="#ef4444" />
        <StatCard icon={Activity} label="Model" value="ResNet-50" sub="Active & healthy" color="#34d399" />
      </div>

      {/* Disease Distribution Bar */}
      <div className="admin-panel">
        <div className="admin-panel__header">
          <h3>Disease Classification Distribution</h3>
          <span className="admin-panel__tag">All-time</span>
        </div>
        <div className="admin-dist-bars">
          {[
            { label: 'Early Blight (Alternaria solani)', count: stats.early_blight_count, color: '#fb923c' },
            { label: 'Late Blight (Phytophthora infestans)', count: stats.late_blight_count, color: '#ef4444' },
            { label: 'Healthy Foliage', count: stats.healthy_count, color: '#34d399' },
          ].map(({ label, count, color }) => (
            <div key={label} className="admin-dist-row">
              <div className="admin-dist-meta">
                <span>{label}</span>
                <span className="admin-dist-count">{count} scans</span>
              </div>
              <div className="admin-dist-track">
                <div
                  className="admin-dist-fill"
                  style={{
                    width: stats.total_predictions > 0
                      ? `${(count / stats.total_predictions) * 100}%` : '0%',
                    background: color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="admin-panel">
        <div className="admin-panel__header">
          <h3>Recent Activity</h3>
          <span className="admin-panel__tag">Last 8 scans</span>
        </div>
        <div className="admin-activity-list">
          {recent.length === 0 && <div className="admin-empty">No activity yet</div>}
          {recent.map(p => {
            const isHealthy = p.predicted_class?.toLowerCase().includes('healthy');
            return (
              <div key={p.id} className="admin-activity-item">
                <div className={`admin-activity-dot ${isHealthy ? 'healthy' : 'disease'}`} />
                <div className="admin-activity-info">
                  <span className="admin-activity-class">{p.predicted_class}</span>
                  <span className="admin-activity-meta">{p.user_email} · {(p.confidence * 100).toFixed(1)}% confidence</span>
                </div>
                <span className="admin-activity-time">
                  {new Date(p.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Tab: Users ─────────────────────────────────────────────────────────────

const UsersTab = ({ users, loading, onToggleAdmin, onDeleteUser }) => {
  const [search, setSearch] = useState('');
  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="admin-loading"><RefreshCw className="spinning" size={22} /> Loading users…</div>;

  return (
    <div>
      <div className="admin-table-controls">
        <div className="admin-search-wrap">
          <Search size={15} />
          <input
            placeholder="Search by email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')}><X size={14} /></button>}
        </div>
        <span className="admin-table-count">{filtered.length} users</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Role</th>
              <th>Scans</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="admin-table-empty">No users found</td></tr>
            )}
            {filtered.map(u => (
              <tr key={u.id}>
                <td className="admin-table-id">#{u.id}</td>
                <td>
                  <div className="admin-user-cell">
                    <div className="admin-user-avatar">{u.email[0].toUpperCase()}</div>
                    <span>{u.email}</span>
                  </div>
                </td>
                <td>
                  {u.is_admin
                    ? <Badge type="admin"><Crown size={11} /> Admin</Badge>
                    : <Badge type="user">User</Badge>
                  }
                </td>
                <td><Badge type="neutral">{u.prediction_count}</Badge></td>
                <td className="admin-table-date">
                  {new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td>
                  <div className="admin-action-btns">
                    <button
                      className={`admin-icon-btn ${u.is_admin ? 'demote' : 'promote'}`}
                      title={u.is_admin ? 'Revoke Admin' : 'Make Admin'}
                      onClick={() => onToggleAdmin(u.id)}
                    >
                      {u.is_admin ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                    <button
                      className="admin-icon-btn delete"
                      title="Delete User"
                      onClick={() => onDeleteUser(u.id, u.email)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Tab: Predictions ───────────────────────────────────────────────────────

const PredictionsTab = ({ predictions, loading, onDeletePrediction }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = predictions.filter(p => {
    const matchSearch =
      p.predicted_class?.toLowerCase().includes(search.toLowerCase()) ||
      p.user_email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'healthy' && p.predicted_class?.toLowerCase().includes('healthy')) ||
      (filter === 'early' && p.predicted_class?.toLowerCase().includes('early')) ||
      (filter === 'late' && p.predicted_class?.toLowerCase().includes('late'));
    return matchSearch && matchFilter;
  });

  if (loading) return <div className="admin-loading"><RefreshCw className="spinning" size={22} /> Loading predictions…</div>;

  return (
    <div>
      <div className="admin-table-controls">
        <div className="admin-search-wrap">
          <Search size={15} />
          <input
            placeholder="Search by class or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')}><X size={14} /></button>}
        </div>
        <div className="admin-filter-pills">
          {['all', 'healthy', 'early', 'late'].map(f => (
            <button
              key={f}
              className={`admin-filter-pill ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'healthy' ? '🌿 Healthy' : f === 'early' ? '🟠 Early Blight' : '🔴 Late Blight'}
            </button>
          ))}
        </div>
        <span className="admin-table-count">{filtered.length} records</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Classification</th>
              <th>Confidence</th>
              <th>File</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="admin-table-empty">No predictions found</td></tr>
            )}
            {filtered.map(p => {
              const isHealthy = p.predicted_class?.toLowerCase().includes('healthy');
              const isEarly = p.predicted_class?.toLowerCase().includes('early');
              return (
                <tr key={p.id}>
                  <td className="admin-table-id">#{p.id}</td>
                  <td className="admin-table-email">{p.user_email}</td>
                  <td>
                    <Badge type={isHealthy ? 'healthy' : isEarly ? 'early' : 'late'}>
                      {p.predicted_class}
                    </Badge>
                  </td>
                  <td>
                    <div className="admin-confidence-wrap">
                      <div className="admin-confidence-bar">
                        <div
                          className={`admin-confidence-fill ${isHealthy ? 'healthy' : 'disease'}`}
                          style={{ width: `${(p.confidence * 100).toFixed(0)}%` }}
                        />
                      </div>
                      <span>{(p.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="admin-table-file">{p.image_filename || '—'}</td>
                  <td className="admin-table-date">
                    {new Date(p.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <button
                      className="admin-icon-btn delete"
                      title="Delete Prediction"
                      onClick={() => onDeletePrediction(p.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Tab: System ────────────────────────────────────────────────────────────

const SystemTab = ({ stats }) => {
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/health`)
      .then(r => setHealth(r.data))
      .catch(() => setHealth(null))
      .finally(() => setLoadingHealth(false));
  }, []);

  const items = [
    { icon: Server, label: 'API Status', value: loadingHealth ? 'Checking…' : health ? '● Online' : '● Offline', ok: !!health },
    { icon: Cpu, label: 'AI Model', value: 'ResNet-50 (TensorFlow)', ok: true },
    { icon: Database, label: 'Database', value: 'SQLite (potato_disease.db)', ok: true },
    { icon: ShieldCheck, label: 'Auth', value: 'JWT — HS256 (30-day tokens)', ok: true },
    { icon: Activity, label: 'Total Predictions', value: stats?.total_predictions ?? '…', ok: true },
    { icon: Users, label: 'Registered Users', value: stats?.total_users ?? '…', ok: true },
    { icon: Clock, label: 'Server Time', value: new Date().toLocaleString(), ok: true },
    { icon: Eye, label: 'CORS Origins', value: 'localhost:5173 / :3000', ok: true },
  ];

  return (
    <div className="admin-system-grid">
      {items.map(({ icon: Icon, label, value, ok }) => (
        <div key={label} className="admin-system-card">
          <div className="admin-system-card__icon">
            <Icon size={20} />
          </div>
          <div className="admin-system-card__content">
            <span className="admin-system-card__label">{label}</span>
            <span className={`admin-system-card__value ${!ok ? 'admin-system-card__value--error' : ''}`}>
              {value}
            </span>
          </div>
          <div className={`admin-system-dot ${ok ? 'ok' : 'error'}`} />
        </div>
      ))}
    </div>
  );
};

// ── Main AdminDashboard ────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'predictions', label: 'Predictions', icon: Leaf },
  { id: 'system', label: 'System', icon: Server },
];

const AdminDashboard = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPreds, setLoadingPreds] = useState(true);
  const [confirm, setConfirm] = useState(null); // { message, onConfirm }
  const [toast, setToast] = useState(null);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const r = await axios.get(`${API_BASE}/api/v1/admin/stats`, authHeaders);
      setStats(r.data);
    } catch (e) { console.error(e); }
    finally { setLoadingStats(false); }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const r = await axios.get(`${API_BASE}/api/v1/admin/users`, authHeaders);
      setUsers(r.data);
    } catch (e) { console.error(e); }
    finally { setLoadingUsers(false); }
  }, [token]);

  const fetchPredictions = useCallback(async () => {
    setLoadingPreds(true);
    try {
      const r = await axios.get(`${API_BASE}/api/v1/admin/predictions`, authHeaders);
      setPredictions(r.data);
    } catch (e) { console.error(e); }
    finally { setLoadingPreds(false); }
  }, [token]);

  useEffect(() => {
    if (user?.is_admin) {
      fetchStats();
      fetchUsers();
      fetchPredictions();
    }
  }, [user]);

  const handleToggleAdmin = async (userId) => {
    try {
      const r = await axios.patch(`${API_BASE}/api/v1/admin/users/${userId}/toggle-admin`, {}, authHeaders);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: r.data.is_admin } : u));
      showToast(`${r.data.email} is now ${r.data.is_admin ? 'an Admin' : 'a regular User'}`);
    } catch (e) {
      showToast('Failed to update role', 'error');
    }
  };

  const handleDeleteUser = (userId, email) => {
    setConfirm({
      message: `Delete user "${email}" and all their predictions? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await axios.delete(`${API_BASE}/api/v1/admin/users/${userId}`, authHeaders);
          setUsers(prev => prev.filter(u => u.id !== userId));
          setPredictions(prev => prev.filter(p => p.user_id !== userId));
          fetchStats();
          showToast('User deleted successfully');
        } catch (e) {
          showToast('Failed to delete user', 'error');
        }
      }
    });
  };

  const handleDeletePrediction = (predId) => {
    setConfirm({
      message: `Delete prediction record #${predId}? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await axios.delete(`${API_BASE}/api/v1/admin/predictions/${predId}`, authHeaders);
          setPredictions(prev => prev.filter(p => p.id !== predId));
          fetchStats();
          showToast('Prediction deleted');
        } catch (e) {
          showToast('Failed to delete prediction', 'error');
        }
      }
    });
  };

  // ── Access Denied ────────────────────────────────────────────────────────
  if (!user?.is_admin) {
    return (
      <div className="admin-access-denied">
        <div className="admin-access-denied__inner">
          <ShieldAlert size={52} color="#f87171" />
          <h2>Access Denied</h2>
          <p>You do not have administrator privileges to view this page.</p>
          <p className="admin-access-denied__sub">Contact your system administrator to request access.</p>
        </div>
      </div>
    );
  }

  const refreshAll = () => { fetchStats(); fetchUsers(); fetchPredictions(); };

  return (
    <div className="admin-dashboard">
      {/* Toast */}
      {toast && (
        <div className={`admin-toast admin-toast--${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Confirm Modal */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Page Header */}
      <div className="admin-header">
        <div className="admin-header__left">
          <div className="admin-header__badge">
            <ShieldCheck size={16} />
            <span>Admin</span>
          </div>
          <div>
            <h1 className="admin-header__title">System Dashboard</h1>
            <p className="admin-header__sub">Monitor users, predictions, and system health in real-time</p>
          </div>
        </div>
        <button className="admin-btn admin-btn--refresh" onClick={refreshAll} title="Refresh all data">
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`admin-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={15} />
            <span>{label}</span>
            {id === 'users' && <span className="admin-tab-count">{users.length}</span>}
            {id === 'predictions' && <span className="admin-tab-count">{predictions.length}</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="admin-tab-content">
        {activeTab === 'overview' && (
          <OverviewTab stats={stats} predictions={predictions} loading={loadingStats} />
        )}
        {activeTab === 'users' && (
          <UsersTab
            users={users}
            loading={loadingUsers}
            onToggleAdmin={handleToggleAdmin}
            onDeleteUser={handleDeleteUser}
          />
        )}
        {activeTab === 'predictions' && (
          <PredictionsTab
            predictions={predictions}
            loading={loadingPreds}
            onDeletePrediction={handleDeletePrediction}
          />
        )}
        {activeTab === 'system' && <SystemTab stats={stats} />}
      </div>
    </div>
  );
};

export default AdminDashboard;
