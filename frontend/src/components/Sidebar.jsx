import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  Sparkles, Plus, Search, Sidebar as SidebarIcon, 
  Bot, ShieldCheck, Grid, Clock, BookOpen, Folder, 
  FileText, LogIn, UserPlus, LogOut, X, FolderPlus, Trash2
} from 'lucide-react';

import ProfileSettingsModal from './ProfileSettingsModal';
import SkillsModal from './SkillsModal';

const Sidebar = ({ isCollapsed, onToggleCollapse }) => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [realTasks, setRealTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  
  // Projects state initialized with local storage persistence
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('potato_ai_projects');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'field-north', name: 'North Field Plot A', description: 'Early season Russet Burbank crop monitoring' },
      { id: 'greenhouse-1', name: 'Greenhouse Seedlings', description: 'Seed potato disease screening' }
    ];
  });
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Persist projects to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('potato_ai_projects', JSON.stringify(projects));
    } catch (e) {}
  }, [projects]);

  // Search modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUserHistory = async () => {
    if (!token) {
      setRealTasks([]);
      return;
    }
    setLoadingTasks(true);
    try {
      const response = await axios.get('http://localhost:8000/api/v1/predictions/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRealTasks(response.data);
    } catch (err) {
      console.error('Failed to load task history:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Fetch real user history from backend API & listen for updates
  useEffect(() => {
    fetchUserHistory();

    const handleUpdate = () => fetchUserHistory();
    window.addEventListener('taskHistoryUpdated', handleUpdate);
    return () => window.removeEventListener('taskHistoryUpdated', handleUpdate);
  }, [token]);

  const handleDeleteTask = async (e, taskId) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await axios.delete(`http://localhost:8000/api/v1/predictions/history/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRealTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const newProj = { 
      id: `proj-${Date.now()}`, 
      name: newProjectName.trim(),
      description: 'Active potato crop inspection folder.',
      createdAt: new Date().toISOString()
    };
    setProjects(prev => [newProj, ...prev]);
    setNewProjectName('');
    setShowAddProject(false);
  };

  const handleDeleteProject = (e, projId) => {
    e.stopPropagation();
    setProjects(prev => prev.filter(p => p.id !== projId));
    localStorage.removeItem(`potato_project_scans_${projId}`);
  };

  const filteredTasks = realTasks.filter(task => {
    const title = task.predicted_class || task.class_name || '';
    const file = task.image_filename || task.filename || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase()) || file.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand">
            <Sparkles size={20} className="brand-icon" />
            {!isCollapsed && <span className="brand-name">potato</span>}
          </Link>
          <div className="sidebar-header-actions">
            <button 
              className="icon-btn" 
              onClick={() => setIsSearchOpen(true)} 
              title="Search tasks (Ctrl+K)"
            >
              <Search size={16} />
            </button>
            <button 
              className="icon-btn" 
              onClick={onToggleCollapse} 
              title={isCollapsed ? "Expand Sidebar" : "Minimize Sidebar"}
            >
              <SidebarIcon size={16} />
            </button>
          </div>
        </div>

        <div className="sidebar-scrollable">
          {/* New Task Button */}
          <NavLink 
            to="/dashboard" 
            className="new-task-btn" 
            title="Create New Task"
          >
            <Plus size={18} />
            {!isCollapsed && <span>New task</span>}
          </NavLink>

          {/* Core Menu */}
          <div className="sidebar-menu">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              title="Agent Workspace"
            >
              <Bot size={18} />
              {!isCollapsed && <span>Agent</span>}
            </NavLink>
            <button 
              className="menu-item" 
              onClick={() => setIsSkillsOpen(true)}
              title="Potato AI Skills Library"
              style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <ShieldCheck size={18} />
              {!isCollapsed && (
                <>
                  <span>Skills</span>
                  <span className="badge-new">New</span>
                </>
              )}
            </button>
            <div className="menu-item disabled-item" title="Plugins (Coming soon)">
              <Grid size={18} />
              {!isCollapsed && <span>Plugins</span>}
            </div>
            <div className="menu-item disabled-item" title="Scheduled (Coming soon)">
              <Clock size={18} />
              {!isCollapsed && <span>Scheduled</span>}
            </div>
            <NavLink 
              to="/history" 
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              title="Library & History"
            >
              <BookOpen size={18} />
              {!isCollapsed && <span>Library</span>}
            </NavLink>
          </div>

          {!isCollapsed && (
            <>
              {/* Projects Section */}
              <div className="sidebar-section">
                <div className="section-title">
                  <span>Projects</span>
                  <button 
                    className="icon-btn-xs" 
                    onClick={() => setShowAddProject(!showAddProject)} 
                    title="Add Project Folder"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {showAddProject && (
                  <form onSubmit={handleCreateProject} className="add-project-form">
                    <input 
                      type="text" 
                      placeholder="Folder name..." 
                      value={newProjectName} 
                      onChange={(e) => setNewProjectName(e.target.value)}
                      autoFocus
                    />
                    <button type="submit" className="icon-btn-xs check"><Plus size={12} /></button>
                  </form>
                )}

                {projects.length > 0 ? (
                  projects.map((proj) => (
                    <div 
                      key={proj.id} 
                      className="project-item"
                      onClick={() => navigate(`/project/${proj.id}`)}
                      title={`Open project: ${proj.name}`}
                    >
                      <div className="project-item-left">
                        <Folder size={14} className="folder-icon" />
                        <span className="project-name">{proj.name}</span>
                      </div>
                      <button 
                        className="project-delete-btn" 
                        onClick={(e) => handleDeleteProject(e, proj.id)}
                        title="Delete project"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="sidebar-empty-state">No projects created</div>
                )}
              </div>

              {/* Real Tasks History Section */}
              <div className="sidebar-section">
                <div className="section-title">
                  <span>Tasks</span>
                  <span className="task-count-badge">{realTasks.length}</span>
                </div>

                <div className="tasks-list">
                  {loadingTasks ? (
                    <div className="sidebar-empty-state">Loading history...</div>
                  ) : realTasks.length > 0 ? (
                    realTasks.map((task, idx) => {
                      const title = task.predicted_class || task.class_name || `Scan #${task.id}`;
                      return (
                        <div 
                          key={task.id || idx} 
                          className="task-item" 
                          title={`${title} (${(task.confidence * 100).toFixed(0)}%)`}
                          onClick={() => navigate('/history')}
                        >
                          <div className="task-item-left">
                            <FileText size={14} className="task-icon" />
                            <span className="task-title">{title}</span>
                          </div>
                          <button 
                            className="task-delete-btn" 
                            onClick={(e) => handleDeleteTask(e, task.id)}
                            title="Delete task"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="sidebar-empty-state">
                      {user ? "No task history yet" : "Sign in to save tasks"}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer / Profile */}
        <div className="sidebar-footer">
          {user ? (
            <div 
              className="user-profile" 
              onClick={() => setIsSettingsOpen(true)}
              title="Click to view Profile & Settings"
              style={{ cursor: 'pointer' }}
            >
              <div className="user-avatar">
                {user.email ? user.email[0].toUpperCase() : 'U'}
              </div>
              {!isCollapsed && (
                <>
                  <div className="user-details">
                    <span className="user-name">{user.email}</span>
                    <span className="user-role">Member</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); logout(); }} 
                    className="icon-btn logout-icon" 
                    title="Log out"
                  >
                    <LogOut size={16} />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="guest-footer">
              <div 
                className="user-profile" 
                onClick={() => setIsSettingsOpen(true)}
                title="Click to view Settings"
                style={{ cursor: 'pointer' }}
              >
                <div className="user-avatar guest-avatar">
                  G
                </div>
                {!isCollapsed && (
                  <div className="user-details">
                    <span className="user-name">Guest User</span>
                    <span className="user-role">Free Access</span>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <div className="sidebar-auth-actions">
                  <Link to="/login" className="sidebar-auth-btn signin">
                    <LogIn size={14} />
                    <span>Sign In</span>
                  </Link>
                  <Link to="/register" className="sidebar-auth-btn signup">
                    <UserPlus size={14} />
                    <span>Sign Up</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Profile & Settings Modal */}
      <ProfileSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* Interactive Search Command Palette Modal */}
      {isSearchOpen && (
        <div className="search-modal-overlay" onClick={() => setIsSearchOpen(false)}>
          <div className="search-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-header">
              <Search size={18} className="search-icon-muted" />
              <input 
                type="text" 
                placeholder="Search tasks, predictions, commands..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button className="icon-btn" onClick={() => setIsSearchOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="search-modal-results">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task, idx) => (
                  <div 
                    key={task.id || idx} 
                    className="search-result-item"
                    onClick={() => {
                      setIsSearchOpen(false);
                      navigate('/history');
                    }}
                  >
                    <FileText size={16} />
                    <div className="search-result-info">
                      <span className="search-result-title">{task.class_name}</span>
                      <span className="search-result-sub">Confidence: {(task.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-no-results">
                  {searchQuery ? `No tasks matching "${searchQuery}"` : "Type to search your tasks history..."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Potato AI Skills Library Modal */}
      <SkillsModal 
        isOpen={isSkillsOpen} 
        onClose={() => setIsSkillsOpen(false)}
        onExecuteSkill={(skill) => {
          setIsSkillsOpen(false);
          if (skill.id === 'crop-analytics') {
            navigate('/analytics');
          } else {
            navigate('/dashboard');
            window.dispatchEvent(new CustomEvent('insertPromptText', { detail: skill.details.samplePrompt }));
          }
        }}
      />
    </>
  );
};

export default Sidebar;
