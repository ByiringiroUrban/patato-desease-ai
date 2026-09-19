import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, Trash2, Search, CheckCircle, AlertTriangle, 
  Calendar, ShieldAlert, ArrowLeft 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HistoryPage = () => {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const fetchHistory = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/v1/predictions/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const handleDeleteTask = async (taskId) => {
    setDeleteError('');
    try {
      await axios.delete(`http://localhost:8000/api/v1/predictions/history/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(prev => prev.filter(t => t.id !== taskId));
      window.dispatchEvent(new Event('taskHistoryUpdated'));
    } catch (err) {
      console.error('Failed to delete task:', err);
      setDeleteError('Failed to delete task item');
    }
  };

  const filteredTasks = tasks.filter(t => {
    const title = t.predicted_class || t.class_name || '';
    const file = t.image_filename || t.filename || '';
    return title.toLowerCase().includes(search.toLowerCase()) || file.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="page-container" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} /> Back to Agent Workspace
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 className="page-title" style={{ marginBottom: '4px' }}>Library & Task History</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            All stored potato leaf disease diagnostics and AI analysis scans.
          </p>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {deleteError && (
        <div className="prompt-error-message" style={{ marginBottom: '16px' }}>{deleteError}</div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading task history...
        </div>
      ) : filteredTasks.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredTasks.map((task) => {
            const isHealthy = (task.predicted_class || '').toLowerCase().includes('healthy');
            const dateStr = task.created_at ? new Date(task.created_at).toLocaleString() : 'Recent Scan';

            return (
              <div key={task.id} className="history-card-item">
                <div className="history-card-left">
                  <div className={`history-status-icon ${isHealthy ? 'healthy' : 'disease'}`}>
                    {isHealthy ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                  </div>
                  <div>
                    <h4 className="history-task-title">{task.predicted_class || 'Potato Diagnostic Scan'}</h4>
                    <div className="history-task-sub">
                      <span>File: {task.image_filename || `Scan #${task.id}`}</span>
                      <span>•</span>
                      <span>Confidence: {(task.confidence * 100).toFixed(1)}%</span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {dateStr}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="history-card-right">
                  <button 
                    className="delete-task-btn-lg" 
                    onClick={() => handleDeleteTask(task.id)}
                    title="Delete this task history entry"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="history-empty-card">
          <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3>No Tasks Found</h3>
          <p>{search ? `No scan results matching "${search}"` : "You haven't run any potato leaf analysis scans yet."}</p>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
