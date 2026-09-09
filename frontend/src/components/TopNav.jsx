import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopNav = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="topbar">
      <select className="topbar-select" defaultValue="potato-lite">
        <option value="potato-lite">Potato AI Lite</option>
        <option value="potato-pro">Potato AI Pro</option>
      </select>

      <div className="topbar-actions">
        <button className="tool-btn" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {user && (
          <button className="tool-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TopNav;
