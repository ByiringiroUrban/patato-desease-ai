import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Image as ImageIcon, Camera, Mic, ArrowUp } from 'lucide-react';

const PromptInput = ({ onPredictionComplete }) => {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please attach an image first.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/api/v1/predictions/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      onPredictionComplete(response.data);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-prompt">
      <h1 className="center-title">What can I identify for you?</h1>
      
      <div className="prompt-input-container">
        <textarea 
          className="prompt-input" 
          placeholder={file ? `Attached: ${file.name}` : "Upload a potato leaf image to analyze..."} 
          readOnly 
        />
        
        {error && <p style={{color: 'var(--error-color)', fontSize: '0.9rem', marginTop: '10px'}}>{error}</p>}

        <div className="prompt-actions">
          <div className="prompt-tools">
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/jpeg, image/png, image/webp" 
              onChange={handleFileChange}
            />
            <button className="tool-btn" onClick={handleTriggerUpload} title="Attach Image">
              <PlusIcon size={18} />
            </button>
            <button className="tool-btn" title="Models">
              <ImageIcon size={18} />
            </button>
            <button className="tool-btn" title="Capture">
              <Camera size={18} />
            </button>
            <button className="tool-btn" title="Voice">
              <Mic size={18} />
            </button>
          </div>
          <button className="submit-btn" onClick={handleSubmit} disabled={loading} title="Submit">
            <ArrowUp size={18} />
          </button>
        </div>
      </div>

      <div className="action-pills">
        <button className="pill" onClick={handleTriggerUpload}>
          <ImageIcon size={16} /> Identify Disease
        </button>
        <button className="pill">
          <HistoryIcon size={16} /> View History
        </button>
        <button className="pill">
          View Documentation
        </button>
        <button className="pill">
          Settings
        </button>
      </div>
    </div>
  );
};

// Quick fix for missing icons
const PlusIcon = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const HistoryIcon = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path></svg>;

export default PromptInput;
