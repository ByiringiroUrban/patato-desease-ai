import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './index.css'

const API_BASE_URL = 'http://localhost:8000/api/v1';

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [history, setHistory] = useState([])
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/history`)
      setHistory(response.data)
    } catch (error) {
      console.error("Failed to fetch history", error)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setPrediction(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setIsUploading(true)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      setPrediction(response.data)
      fetchHistory() // Refresh history
    } catch (error) {
      console.error("Prediction failed", error)
      alert("Prediction failed. Make sure the backend is running.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setPrediction(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>Potato Disease AI</h1>
        <p>AI-powered crop analysis for healthier harvests</p>
      </header>

      <div className="grid">
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Analyze Image</h2>
          
          <div 
            className="upload-area"
            onClick={triggerFileInput}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
              accept="image/jpeg, image/png, image/webp"
            />
            {!previewUrl ? (
              <>
                <span className="upload-icon">📸</span>
                <p className="upload-text">Click to upload a potato leaf image</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Supports JPEG, PNG, WEBP</p>
              </>
            ) : (
              <img src={previewUrl} alt="Preview" className="preview-image" />
            )}
          </div>
          
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            {prediction ? (
              <button 
                className="btn btn-secondary" 
                onClick={() => { handleClear(); triggerFileInput(); }}
                style={{ width: '100%' }}
              >
                Analyze Another Image
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '1rem' }}>
                {selectedFile && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleClear}
                    style={{ flex: 1 }}
                  >
                    Clear
                  </button>
                )}
                <button 
                  className="btn" 
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  style={{ flex: selectedFile ? 2 : 1, width: selectedFile ? 'auto' : '100%' }}
                >
                  {isUploading ? <div className="loader"></div> : 'Run Prediction'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Results & History</h2>
          
          {prediction ? (
            <div className="result-section">
              <span style={{ fontSize: '4rem', display: 'block' }}>
                {prediction.class_name === 'Healthy' ? '🌿' : '⚠️'}
              </span>
              <div className="disease-name">
                {prediction.class_name.replace(/_/g, ' ')}
              </div>
              
              <div style={{ width: '100%', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Confidence</span>
                  <span>{(prediction.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="confidence-bar-bg">
                  <div 
                    className="confidence-bar-fill" 
                    style={{ width: `${prediction.confidence * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
             <div className="result-section" style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
               <span style={{ fontSize: '3rem', opacity: 0.5, display: 'block', marginBottom: '1rem' }}>🔬</span>
               <p>Upload an image to see the AI prediction</p>
             </div>
          )}
          
          {history.length > 0 && (
            <div style={{ marginTop: '3rem' }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Recent Predictions</h3>
              <ul className="history-list">
                {history.map((item) => (
                  <li key={item.id} className="history-item">
                    <div>
                      <div className="history-class">{item.predicted_class.replace(/_/g, ' ')}</div>
                      <div className="history-date">{new Date(item.created_at).toLocaleString()}</div>
                    </div>
                    <div style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>
                      {(item.confidence * 100).toFixed(1)}%
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
