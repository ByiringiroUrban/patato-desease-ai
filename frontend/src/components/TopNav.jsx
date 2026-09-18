import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun, LogOut, Zap, ChevronDown, LogIn, UserPlus, Sidebar as SidebarIcon } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const TopNav = ({ isSidebarCollapsed, onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {isSidebarCollapsed && (
          <button 
            className="icon-btn sidebar-expand-toggle" 
            onClick={onToggleSidebar} 
            title="Expand Sidebar"
          >
            <SidebarIcon size={18} />
          </button>
        )}
        <div className="model-selector">
          <span className="model-name">Potato AI 1.6 Lite</span>
          <ChevronDown size={14} className="model-arrow" />
        </div>
      </div>

      <div className="topbar-actions">
        <div className="credits-badge" title="Available Credits">
          <Zap size={14} className="credits-icon" />
          <span>300</span>
        </div>

        <button className="tool-btn" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user ? (
          <div className="user-nav-group">
            <span className="user-email-tag">{user.email}</span>
            <button className="tool-btn logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="auth-nav-buttons">
            <Link to="/login" className="btn-secondary-sm">
              <LogIn size={15} />
              <span>Sign In</span>
            </Link>
            <Link to="/register" className="btn-primary-sm">
              <UserPlus size={15} />
              <span>Create Account</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNav;
