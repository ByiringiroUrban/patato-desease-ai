import React, { useState, useEffect } from 'react';
import PromptInput from '../components/PromptInput';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

const UserDashboard = () => {
  const { token, user } = useAuth();
  const [history, setHistory] = useState([]);
  const [latestPrediction, setLatestPrediction] = useState(null);

  const fetchHistory = async () => {
    if (!token) return;
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
    fetchHistory();
  };

  return (
    <div className="dashboard-container">
      <PromptInput onPredictionComplete={handlePredictionComplete} />

      {latestPrediction && (
        <div className="prediction-result-modal-overlay" onClick={() => setLatestPrediction(null)}>
          <div className="prediction-result-card" onClick={(e) => e.stopPropagation()}>
            <div className="result-card-header">
              <div className="result-title-group">
                {latestPrediction.class_name.toLowerCase().includes('healthy') ? (
                  <CheckCircle size={22} color="var(--success-color)" />
                ) : (
                  <AlertTriangle size={22} color="var(--error-color)" />
                )}
                <h3>Analysis Result</h3>
              </div>
              <button className="icon-btn" onClick={() => setLatestPrediction(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="result-card-body">
              <div className="result-row">
                <span className="result-label">Detected Status:</span>
                <span className="result-value highlight">{latestPrediction.class_name}</span>
              </div>
              <div className="result-row">
                <span className="result-label">Confidence Level:</span>
                <span className="result-value">{(latestPrediction.confidence * 100).toFixed(1)}%</span>
              </div>
            </div>
            <div className="result-card-footer">
              <button className="btn-primary-sm" onClick={() => setLatestPrediction(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
