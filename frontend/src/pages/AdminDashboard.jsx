import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { token, user } = useAuth();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // We would ideally have a special admin endpoint here that returns ALL history
    // For now, let's just reuse the history endpoint or assume we add an admin endpoint later.
    const fetchAdminStats = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/predictions/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (user?.is_admin) {
      fetchAdminStats();
    }
  }, [token, user]);

  if (!user?.is_admin) {
    return (
      <div className="page-container">
        <h2 style={{color: 'var(--error-color)'}}>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2 className="page-title">Admin Dashboard</h2>
      
      <div className="auth-card" style={{ maxWidth: '100%' }}>
        <h3>System Overview</h3>
        <p style={{ marginTop: '10px', color: 'var(--text-muted)' }}>
          Total predictions processed: {history.length}
        </p>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User ID</th>
              <th>Predicted Class</th>
              <th>Confidence</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {history.map(item => (
              <tr key={item.id}>
                <td>#{item.id}</td>
                <td>{item.user_id}</td>
                <td>{item.predicted_class}</td>
                <td>{(item.confidence * 100).toFixed(1)}%</td>
                <td>{new Date(item.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
