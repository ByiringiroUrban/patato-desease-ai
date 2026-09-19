import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Moon, Sun, LogOut, Zap, ChevronDown, LogIn, UserPlus, 
  Sidebar as SidebarIcon, Settings, Share2, MoreHorizontal, 
  Check, BookOpen, BarChart3, User, Sparkles
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import ProfileSettingsModal from './ProfileSettingsModal';

const TopNav = ({ isSidebarCollapsed, onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const menuRef = useRef(null);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    navigate('/');
  };

  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2500);
  };

  const initialLetter = user?.email ? user.email[0].toUpperCase() : 'U';

  return (
    <>
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
          <div className="model-selector" onClick={() => setIsSettingsOpen(true)} style={{ cursor: 'pointer' }}>
            <span className="model-name">Potato AI 1.6 Lite</span>
            <ChevronDown size={14} className="model-arrow" />
          </div>
        </div>

        <div className="topbar-actions" style={{ position: 'relative' }} ref={menuRef}>
          {/* Share Button */}
          <button className="share-top-btn" onClick={handleShareClick} title="Share Workspace">
            <Share2 size={15} />
            <span>Share</span>
          </button>

          {/* Credits Badge */}
          <div className="credits-badge" title="Available Credits">
            <Zap size={14} className="credits-icon" />
            <span>300</span>
          </div>

          {/* Theme Toggle Button */}
          <button className="tool-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <>
              {/* User Email Tag */}
              <div className="user-nav-group">
                <span 
                  className="user-email-tag" 
                  onClick={() => setIsMenuOpen(!isMenuOpen)} 
                  style={{ cursor: 'pointer' }} 
                  title="Profile & Settings"
                >
                  {user.email}
                </span>
              </div>

              {/* ChatGPT Style 3-Dots Button */}
              <button 
                className={`three-dots-btn ${isMenuOpen ? 'active' : ''}`} 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                title="More Options"
              >
                <MoreHorizontal size={18} />
              </button>

              {/* Floating Profile Popover Dropdown */}
              {isMenuOpen && (
                <div className="user-menu-popover">
                  <div className="popover-user-header">
                    <div className="popover-avatar">{initialLetter}</div>
                    <div className="popover-user-info">
                      <span className="popover-email">{user.email}</span>
                      <span className="popover-plan">Member • Free Plan</span>
                    </div>
                  </div>

                  <button className="popover-item" onClick={() => { setIsMenuOpen(false); setIsSettingsOpen(true); }}>
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>

                  <button className="popover-item" onClick={() => { setIsMenuOpen(false); navigate('/history'); }}>
                    <BookOpen size={16} />
                    <span>Library & History</span>
                  </button>

                  <button className="popover-item" onClick={() => { setIsMenuOpen(false); navigate('/analytics'); }}>
                    <BarChart3 size={16} />
                    <span>Analytics</span>
                  </button>

                  <button className="popover-item" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <div className="popover-divider" />

                  <button className="popover-item logout-item" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </>
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

      {/* Share Toast Banner */}
      {showShareToast && (
        <div className="share-toast">
          <Check size={18} />
          <span>Workspace link copied to clipboard!</span>
        </div>
      )}

      {/* Settings Modal */}
      <ProfileSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
};

export default TopNav;
