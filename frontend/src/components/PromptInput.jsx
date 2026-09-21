import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Image as ImageIcon, Camera, Mic, ArrowUp, AtSign, 
  Monitor, Sparkles, X, Leaf, ShieldAlert, BarChart3, 
  FileText, Pill, ChevronDown, Check, Video, HelpCircle, Layers
} from 'lucide-react';

import UpgradeModal from './UpgradeModal';

const PromptInput = ({ onPredictionComplete }) => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [promptText, setPromptText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Model & Tool States
  const [selectedModel, setSelectedModel] = useState('Potato Vision ResNet-50');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  // Handle object URL creation and revocation
  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Camera State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setPromptText(prev => prev ? `${prev} ${currentTranscript}` : currentTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
  }, []);

  // Listen for custom skill execution events from Sidebar or modals
  useEffect(() => {
    const handleInsertPrompt = (e) => {
      if (e.detail) {
        setPromptText(e.detail);
        setError('');
      }
    };
    window.addEventListener('insertPromptText', handleInsertPrompt);
    return () => window.removeEventListener('insertPromptText', handleInsertPrompt);
  }, []);

  // Voice Toggle
  const toggleVoiceInput = () => {
    if (!speechSupported) {
      setError('Voice recognition is not supported in this browser. Please type your prompt.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setError('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  // Camera Modal Open / Stream Start
  const startCamera = async () => {
    setShowCameraModal(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access failed:', err);
      setError('Could not access live camera. Using device file picker instead.');
      setShowCameraModal(false);
      cameraInputRef.current?.click();
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  // Capture Snapshot from Live Video
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], `camera_leaf_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setFile(capturedFile);
        setError('');
      }
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleMentionClick = () => {
    setPromptText(prev => prev.includes('@potato-ai') ? prev : `@potato-ai ${prev}`.trim());
  };

  const handleSubmit = async () => {
    if (!file && !promptText.trim()) {
      setError('Please attach a potato leaf image or enter a diagnosis prompt.');
      return;
    }

    if (!file) {
      setError('Please attach or capture an image of a potato leaf to run AI disease analysis.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await axios.post('http://localhost:8000/api/v1/predictions/predict', formData, { headers });
      onPredictionComplete(response.data);
      setFile(null);
      setPromptText('');
    } catch (err) {
      if (err.response?.status === 401 && !user) {
        setShowAuthPrompt(true);
        setError('Authentication required to process image. Please sign in or register.');
      } else {
        setError(err.response?.data?.detail || 'Failed to analyze image.');
      }
    } finally {
      setLoading(false);
    }
  };

  const setPresetPrompt = (text) => {
    setPromptText(text);
    setError('');
  };

  return (
    <div className="manus-center-container">
      {/* Plan Badge */}
      <div className="plan-badge-container">
        <span className="plan-badge">
          {user?.plan === 'pro' ? 'Pro Agronomist Plan' : user?.plan === 'enterprise' ? 'Enterprise Plan' : 'Free plan'}
        </span>
        <span className="plan-separator">|</span>
        <button 
          className="upgrade-link" 
          onClick={() => setShowUpgradeModal(true)}
          type="button"
        >
          {user?.plan && user.plan !== 'free' ? 'Manage Plan' : 'Upgrade'}
        </button>
      </div>

      {/* Main Title */}
      <h1 className="manus-main-title">What can I do for you?</h1>

      {/* Central Input Box */}
      <div className="manus-input-card">
        <textarea 
          className="manus-textarea" 
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder={file ? "Add questions or notes about this leaf (optional)..." : "Assign a potato scan task or ask for disease diagnostics..."} 
          rows={3}
        />

        {file && (
          <div className="attached-image-preview-container">
            <div className="attached-image-card">
              {filePreview ? (
                <img 
                  src={filePreview} 
                  alt="Attached leaf preview" 
                  className="attached-image-thumb" 
                />
              ) : (
                <div className="attached-image-fallback">
                  <ImageIcon size={20} />
                </div>
              )}
              <button 
                className="remove-attached-image-btn" 
                onClick={() => setFile(null)}
                title="Remove image"
                type="button"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {isListening && (
          <div className="listening-banner">
            <span className="listening-dot" />
            <span>Listening to voice prompt... Speak now</span>
          </div>
        )}

        {error && <div className="prompt-error-message">{error}</div>}

        <div className="manus-input-toolbar">
          <div className="toolbar-left" style={{ position: 'relative' }}>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/jpeg, image/png, image/webp" 
              onChange={handleFileChange}
            />
            <input 
              type="file" 
              ref={cameraInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              capture="environment"
              onChange={handleFileChange}
            />

            <button className="toolbar-icon-btn" onClick={handleTriggerUpload} title="Attach Image File">
              <Plus size={18} />
            </button>
            <button className="toolbar-icon-btn" onClick={handleMentionClick} title="Mention @potato-ai">
              <AtSign size={16} />
            </button>

            {/* Model Chip with Dropdown */}
            <div 
              className="model-chip" 
              title="Select AI Model"
              onClick={() => setShowModelDropdown(!showModelDropdown)}
            >
              <Sparkles size={14} />
              <span>{selectedModel.includes('ResNet') ? 'ResNet-50' : 'MobileNet'}</span>
              <span className="model-plus">+1</span>
            </div>

            {showModelDropdown && (
              <div className="model-selector-dropdown">
                <div 
                  className={`model-option ${selectedModel === 'Potato Vision ResNet-50' ? 'active' : ''}`}
                  onClick={() => { setSelectedModel('Potato Vision ResNet-50'); setShowModelDropdown(false); }}
                >
                  <span>Potato Vision ResNet-50</span>
                  {selectedModel === 'Potato Vision ResNet-50' && <Check size={14} />}
                </div>
                <div 
                  className={`model-option ${selectedModel === 'Fast MobileNet AI' ? 'active' : ''}`}
                  onClick={() => { setSelectedModel('Fast MobileNet AI'); setShowModelDropdown(false); }}
                >
                  <span>Fast MobileNet AI</span>
                  {selectedModel === 'Fast MobileNet AI' && <Check size={14} />}
                </div>
              </div>
            )}

            <button 
              className="desktop-chip" 
              title="Potato Desktop App"
              onClick={() => setShowDesktopModal(true)}
            >
              <Monitor size={14} />
              <span>Potato Desktop</span>
            </button>
          </div>

          <div className="toolbar-right">
            <button 
              className={`toolbar-icon-btn ${isListening ? 'mic-active' : ''}`} 
              onClick={toggleVoiceInput} 
              title={isListening ? "Stop Voice Recording" : "Voice Input"}
            >
              <Mic size={18} />
            </button>
            <button className="toolbar-icon-btn" onClick={startCamera} title="Take Photo with Camera">
              <Camera size={18} />
            </button>
            <button 
              className={`manus-submit-btn ${loading ? 'loading' : ''}`} 
              onClick={handleSubmit} 
              disabled={loading} 
              title="Run Potato Leaf AI Analysis"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Potato Disease AI Domain Action Pills */}
      <div className="manus-action-pills">
        <button className="action-pill" onClick={handleTriggerUpload}>
          <Leaf size={15} style={{ color: '#22c55e' }} />
          <span>Diagnose Leaf</span>
        </button>
        <button className="action-pill" onClick={() => setPresetPrompt("How do I distinguish Early Blight from Late Blight on potato leaves?")}>
          <ShieldAlert size={15} style={{ color: '#f59e0b' }} />
          <span>Blight Guide</span>
        </button>
        <button className="action-pill" onClick={() => navigate('/analytics')}>
          <BarChart3 size={15} style={{ color: '#3b82f6' }} />
          <span>Crop Analytics</span>
        </button>
        <button className="action-pill" onClick={() => setPresetPrompt("What are recommended organic and chemical treatments for potato leaf diseases?")}>
          <Pill size={15} style={{ color: '#ec4899' }} />
          <span>Treatment Tips</span>
        </button>
        <button className="action-pill" onClick={() => setPresetPrompt("Generate a detailed potato field inspection summary report.")}>
          <FileText size={15} style={{ color: '#a855f7' }} />
          <span>Field Report</span>
        </button>
        <button className="action-pill more-pill" onClick={() => setShowMoreActions(!showMoreActions)}>
          <span>{showMoreActions ? "Less" : "More"}</span>
        </button>
      </div>

      {/* Expanded Domain Prompts when More is clicked */}
      {showMoreActions && (
        <div className="more-actions-grid">
          <div className="more-action-card" onClick={() => setPresetPrompt("What fungicide schedule is best for Late Blight prevention?")}>
            <Pill size={16} style={{ color: '#3b82f6' }} />
            <span>Fungicide Schedule</span>
          </div>
          <div className="more-action-card" onClick={() => setPresetPrompt("What weather conditions accelerate potato Early Blight spreading?")}>
            <ShieldAlert size={16} style={{ color: '#ef4444' }} />
            <span>Weather & Risk</span>
          </div>
          <div className="more-action-card" onClick={() => setPresetPrompt("How to manage post-harvest storage to avoid potato rot?")}>
            <Leaf size={16} style={{ color: '#10b981' }} />
            <span>Harvest Care</span>
          </div>
          <div className="more-action-card" onClick={() => setPresetPrompt("Explain soil fertilization best practices for disease resistance.")}>
            <Layers size={16} style={{ color: '#f59e0b' }} />
            <span>Soil Health</span>
          </div>
        </div>
      )}

      {/* Desktop App Download Banner */}
      <div className="manus-download-card">
        <div className="download-text-group">
          <h3>Download Potato AI for Windows or macOS</h3>
          <p>Access local leaf scans and work seamlessly with desktop batch imports.</p>
        </div>
        <div className="download-preview-graphic">
          <div className="mock-window">
            <div className="mock-dots"><span /><span /><span /></div>
            <div className="mock-inner-app">
              <div className="mock-bar" />
              <div className="mock-box" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Carousel Indicator Dots */}
      <div className="carousel-dots">
        <span className="dot active" />
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>

      {/* Live Camera Modal Overlay */}
      {showCameraModal && (
        <div className="camera-modal-overlay">
          <div className="camera-modal-card">
            <div className="camera-modal-header">
              <h3>
                <Camera size={20} />
                <span>Potato Leaf Camera Scanner</span>
              </h3>
              <button className="icon-btn" onClick={stopCamera}>
                <X size={18} />
              </button>
            </div>

            <div className="camera-viewfinder">
              <video ref={videoRef} autoPlay playsInline className="camera-video" />
            </div>

            <div className="camera-actions">
              <button className="btn-secondary-sm" onClick={stopCamera}>Cancel</button>
              <button className="shutter-btn" onClick={captureSnapshot} title="Capture Photo">
                <Camera size={24} color="#fff" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Info Modal */}
      {showDesktopModal && (
        <div className="auth-modal-overlay" onClick={() => setShowDesktopModal(false)}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Potato AI Desktop App</h3>
            <p>Connect local leaf image folders, monitor greenhouse sensors in real time, and auto-sync field diagnosis history.</p>
            <div className="auth-modal-buttons">
              <button className="btn-primary-sm" onClick={() => setShowDesktopModal(false)}>Got It</button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Subscription Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </div>
  );
};

export default PromptInput;

