import React, { useState, useEffect } from 'react';
import PromptInput from '../components/PromptInput';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const UserDashboard = () => {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [latestPrediction, setLatestPrediction] = useState(null);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/predictions/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const handlePredictionComplete = (result) => {
    setLatestPrediction(result);
    fetchHistory(); // Refresh history
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <PromptInput onPredictionComplete={handlePredictionComplete} />
      </div>

      {/* Optionally show a modal or overlay for the latest prediction result */}
      {latestPrediction && (
        <div style={{ 
          position: 'absolute', top: '20px', right: '20px', 
          backgroundColor: 'var(--bg-sidebar)', padding: '20px', 
          borderRadius: '12px', border: '1px solid var(--border-color)',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10
        }}>
          <h3>Result: {latestPrediction.class_name}</h3>
          <p>Confidence: {(latestPrediction.confidence * 100).toFixed(2)}%</p>
          <button className="pill" style={{marginTop: '10px'}} onClick={() => setLatestPrediction(null)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
