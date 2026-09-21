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
  const [showShareToast, setShowShareToast] = useState(false);
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
      badge: 'Default',
      badgeColor: '#22c55e',
      description: 'Ultra-fast ResNet-50 vision model optimized for rapid field diagnosis and leaf scanning.'
    },
    {
      id: 'pro',
      name: 'Potato AI 2.0 Pro (Max)',
      badge: 'High Accuracy',
      badgeColor: '#3b82f6',
      description: 'Deep pathology reasoning with integrated micro-symptom triage and treatment protocols.'
    },
    {
      id: 'edge',
      name: 'MobileNet Offline Edge',
      badge: 'Lightweight',
      badgeColor: '#f59e0b',
      description: 'Compressed model for low-bandwidth rural connections and instant local inferences.'
    }
  ];

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
          <div 
            className={`model-selector ${isModelDropdownOpen ? 'active' : ''}`} 
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} 
            style={{ cursor: 'pointer' }}
            title="Switch Potato AI Model"
          >
            <span className="model-name">{selectedModel}</span>
            <ChevronDown 
              size={14} 
              className="model-arrow" 
              style={{ 
                transform: isModelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
          </div>

          {/* Model Switcher Dropdown Popover */}
          {isModelDropdownOpen && (
            <div className="topbar-model-dropdown">
              <div className="topbar-model-header">
                <span className="topbar-model-label">Model Selection</span>
              </div>
              <div className="topbar-model-list">
                {modelsList.map((m) => {
                  const isSelected = selectedModel === m.name;
                  return (
                    <div 
                      key={m.id}
                      className={`topbar-model-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedModel(m.name);
                        setIsModelDropdownOpen(false);
                      }}
                    >
                      <div className="topbar-model-info">
                        <div className="topbar-model-title-row">
                          <span className="topbar-model-name">{m.name}</span>
                          <span 
                            className="topbar-model-badge" 
                            style={{ 
                              backgroundColor: `${m.badgeColor}18`, 
                              color: m.badgeColor,
                              borderColor: `${m.badgeColor}35`
                            }}
                          >
                            {m.badge}
                          </span>
                        </div>
                        <p className="topbar-model-desc">{m.description}</p>
                      </div>
                      {isSelected && (
                        <div className="topbar-model-check">
                          <Check size={16} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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

      {/* Share Toast Banner */}
      {showShareToast && (
        <div className="share-toast">
          <Check size={18} />
          <span>Workspace link copied to clipboard!</span>
        </div>
      )}

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
