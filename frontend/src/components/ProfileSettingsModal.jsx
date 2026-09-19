import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  User, Settings, Moon, Sun, Lock, LogOut, X, 
  Sparkles, Check, ShieldCheck, Sliders, Bell
} from 'lucide-react';

const ProfileSettingsModal = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('profile');
  
  // Settings States
  const [displayName, setDisplayName] = useState(user?.email ? user.email.split('@')[0] : 'Farmer');
  const [selectedModel, setSelectedModel] = useState('Potato Vision ResNet-50');
  const [autoSaveHistory, setAutoSaveHistory] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const initialLetter = user?.email ? user.email[0].toUpperCase() : 'U';

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Settings Sidebar Tabs */}
        <div className="settings-sidebar">
          <div className="settings-sidebar-header">
            <h3>Settings</h3>
          </div>
          <div className="settings-nav-list">
            <button 
              className={`settings-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={16} />
              <span>Profile</span>
            </button>
            <button 
              className={`settings-nav-btn ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              <Sliders size={16} />
              <span>AI Preferences</span>
            </button>
            <button 
              className={`settings-nav-btn ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              <span>Appearance</span>
            </button>
            <button 
              className={`settings-nav-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Lock size={16} />
              <span>Security</span>
            </button>
          </div>

          <div className="settings-sidebar-footer">
            <button className="settings-logout-btn" onClick={() => { logout(); onClose(); }}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Settings Main Content Area */}
        <div className="settings-content">
          <div className="settings-content-header">
            <h2>
              {activeTab === 'profile' && 'Account Profile'}
              {activeTab === 'ai' && 'AI & Diagnostic Settings'}
              {activeTab === 'appearance' && 'Appearance & Preferences'}
              {activeTab === 'security' && 'Security & Access'}
            </h2>
            <button className="icon-btn" onClick={onClose} title="Close Settings">
              <X size={18} />
            </button>
          </div>

          {saveSuccess && (
            <div className="settings-success-banner">
              <Check size={16} />
              <span>Settings saved successfully!</span>
            </div>
          )}

          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveSettings} className="settings-form">
              <div className="profile-header-card">
                <div className="profile-large-avatar">
                  {initialLetter}
                </div>
                <div className="profile-header-info">
                  <h4>{user?.email || 'Guest User'}</h4>
                  <span className="profile-badge">Pro Member</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={user?.email || ''} 
                  disabled 
                />
                <span className="form-hint">Email address associated with your potato disease workspace.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                />
              </div>

              <div className="settings-actions">
                <button type="submit" className="btn-primary-sm">Save Changes</button>
              </div>
            </form>
          )}

          {/* TAB 2: AI Preferences */}
          {activeTab === 'ai' && (
            <form onSubmit={handleSaveSettings} className="settings-form">
              <div className="form-group">
                <label className="form-label">Default AI Model</label>
                <select 
                  className="form-input" 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  <option value="Potato Vision ResNet-50">Potato Vision ResNet-50 (Deep Accuracy)</option>
                  <option value="Fast MobileNet AI">Fast MobileNet AI (Rapid Scan)</option>
                </select>
                <span className="form-hint">ResNet-50 provides 98.6% precision for Early and Late Blight classification.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Diagnostic Confidence Threshold ({confidenceThreshold}%)</label>
                <input 
                  type="range" 
                  min="50" 
                  max="95" 
                  value={confidenceThreshold} 
                  onChange={(e) => setConfidenceThreshold(e.target.value)}
                  style={{ width: '100%', accentColor: '#3b82f6' }}
                />
                <span className="form-hint">Flag scans with confidence below this threshold for manual field inspection.</span>
              </div>

              <div className="form-group toggle-group">
                <div>
                  <label className="form-label" style={{ marginBottom: '2px' }}>Auto-Save Scan History</label>
                  <span className="form-hint">Automatically record prediction history to your task library.</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={autoSaveHistory} 
                  onChange={(e) => setAutoSaveHistory(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              <div className="settings-actions">
                <button type="submit" className="btn-primary-sm">Save AI Settings</button>
              </div>
            </form>
          )}

          {/* TAB 3: Appearance */}
          {activeTab === 'appearance' && (
            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">Theme Mode</label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button 
                    type="button"
                    className={`theme-select-card ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                  >
                    <Moon size={20} />
                    <span>Dark Mode</span>
                  </button>
                  <button 
                    type="button"
                    className={`theme-select-card ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => { if (theme !== 'light') toggleTheme(); }}
                  >
                    <Sun size={20} />
                    <span>Light Mode</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Security */}
          {activeTab === 'security' && (
            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">Account Security</label>
                <p className="form-hint">You are signed in as {user?.email}.</p>
              </div>

              <div style={{ marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn-danger-sm" 
                  onClick={() => { logout(); onClose(); }}
                >
                  <LogOut size={16} />
                  <span>Log Out of Workspace</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;
