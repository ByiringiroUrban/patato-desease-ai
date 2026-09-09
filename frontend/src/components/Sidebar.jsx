import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Plus, History, BarChart2, Settings, User } from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Sparkles size={24} color="var(--accent-color)" />
        <span>Potato AI</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Plus size={18} />
          <span>New Task</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <History size={18} />
          <span>History</span>
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart2 size={18} />
          <span>Analytics</span>
        </NavLink>
        {user?.is_admin && (
          <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Settings size={18} />
            <span>Admin Panel</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar">
          {user?.email ? user.email[0].toUpperCase() : <User size={16} />}
        </div>
        <div className="user-info">
          <span className="user-name">{user?.email || 'Guest User'}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
