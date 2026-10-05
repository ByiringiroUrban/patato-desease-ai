import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Moon, Sun, LogOut, Zap, ChevronDown, LogIn, UserPlus, 
  Sidebar as SidebarIcon, Settings, Share2, MoreHorizontal, 
  Check, BookOpen, BarChart3
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import ProfileSettingsModal from './ProfileSettingsModal';
import ShareModal from './ShareModal';
import UpgradeModal from './UpgradeModal';

const TopNav = ({ isSidebarCollapsed, onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Potato AI 1.6 Lite');
  const menuRef = useRef(null);
  const modelDropdownRef = useRef(null);

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setIsModelDropdownOpen(false);
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
    setIsShareModalOpen(true);
  };

  const initialLetter = user?.email ? user.email[0].toUpperCase() : 'U';

  const modelsList = [
    {
      id: 'lite',
      name: 'Potato AI 1.6 Lite',
      shortTag: 'Default',
      color: '#10b981'
    },
    {
      id: 'pro',
      name: 'Potato AI 2.0 Pro (Max)',
      shortTag: 'Pro',
      color: '#3b82f6'
    },
    {
      id: 'edge',
      name: 'MobileNet Offline Edge',
      shortTag: 'Edge',
      color: '#f59e0b'
    }
  ];

  const currentModel = modelsList.find(m => m.name === selectedModel) || modelsList[0];

  return (
    <>
      <header className="topbar">
        <div className="topbar-left" style={{ position: 'relative' }} ref={modelDropdownRef}>
          {isSidebarCollapsed && (
            <button 
              className="icon-btn sidebar-expand-toggle" 
              onClick={onToggleSidebar} 
              title="Expand Sidebar"
            >
              <SidebarIcon size={18} />
            </button>
          )}

          {/* Simple Small Model Selector Button */}
          <button 
            className={`model-select-btn ${isModelDropdownOpen ? 'open' : ''}`} 
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} 
            type="button"
            aria-expanded={isModelDropdownOpen}
          >
            <span 
              className="model-select-dot" 
              style={{ backgroundColor: currentModel.color }} 
            />
            <span className="model-select-title">{selectedModel}</span>
            <ChevronDown size={13} className="model-select-arrow" />
          </button>

          {/* Compact Minimal Dropdown Menu */}
          {isModelDropdownOpen && (
            <div className="model-mini-dropdown" role="menu">
              {modelsList.map((m) => {
                const isSelected = selectedModel === m.name;
                return (
                  <button
                    key={m.id}
                    className={`model-mini-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedModel(m.name);
                      setIsModelDropdownOpen(false);
                    }}
                    type="button"
                    role="menuitem"
                  >
                    <div className="model-mini-left">
                      <span className="model-mini-dot" style={{ backgroundColor: m.color }} />
                      <span className="model-mini-name">{m.name}</span>
                    </div>
                    <div className="model-mini-right">
                      <span className="model-mini-badge">{m.shortTag}</span>
                      {isSelected && <Check size={13} className="model-mini-check" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
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
                      <span className="popover-plan">
                        {user.plan === 'pro' ? 'Member • Pro Plan' : user.plan === 'enterprise' ? 'Member • Enterprise' : 'Member • Free Plan'}
                      </span>
                    </div>
                  </div>

                  <button 
                    className="popover-item upgrade-popover-item" 
                    onClick={() => { setIsMenuOpen(false); setIsUpgradeOpen(true); }}
                    style={{ color: '#22c55e', fontWeight: 600 }}
                  >
                    <Zap size={16} />
                    <span>{user.plan && user.plan !== 'free' ? 'Manage Subscription' : 'Upgrade Plan'}</span>
                  </button>

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

      {/* Share Modal */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
      />

      {/* Upgrade Subscription Modal */}
      <UpgradeModal 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
      />

      {/* Settings Modal */}
      <ProfileSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
};

export default TopNav;
