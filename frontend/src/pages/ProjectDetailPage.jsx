import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Folder, ArrowLeft, Plus, Image as ImageIcon, Trash2, 
  Leaf, AlertTriangle, CheckCircle2, Calendar, FileText,
  UploadCloud, Sparkles
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [project, setProject] = useState(null);
  const [projectScans, setProjectScans] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  // Load project metadata from localStorage
  useEffect(() => {
    try {
      const savedProjects = JSON.parse(localStorage.getItem('potato_ai_projects') || '[]');
      const found = savedProjects.find(p => String(p.id) === String(projectId));
      if (found) {
        setProject(found);
      } else {
        setProject({
          id: projectId,
          name: `Project ${projectId}`,
          description: 'Custom potato diagnostic monitoring project.',
          createdAt: new Date().toISOString()
        });
      }

      // Load scans associated with this project
      const savedProjectScans = JSON.parse(localStorage.getItem(`potato_project_scans_${projectId}`) || '[]');
      setProjectScans(savedProjectScans);
    } catch (e) {
      console.error('Error loading project:', e);
    }
  }, [projectId]);

  const handleFileUpload = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await axios.post('http://localhost:8000/api/v1/predictions/predict', formData, { headers });
      
      const newScan = {
        id: Date.now(),
        filename: file.name,
        predicted_class: response.data.class_name,
        confidence: response.data.confidence,
        date: new Date().toISOString()
      };

      const updated = [newScan, ...projectScans];
      setProjectScans(updated);
      localStorage.setItem(`potato_project_scans_${projectId}`, JSON.stringify(updated));

      // Trigger global history sync
      window.dispatchEvent(new Event('taskHistoryUpdated'));
    } catch (err) {
      setError('Failed to analyze and add image to project.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteScan = (scanId) => {
    const updated = projectScans.filter(s => s.id !== scanId);
    setProjectScans(updated);
    localStorage.setItem(`potato_project_scans_${projectId}`, JSON.stringify(updated));
  };

  if (!project) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h3>Loading project...</h3>
      </div>
    );
  }

  const healthyCount = projectScans.filter(s => s.predicted_class?.toLowerCase().includes('healthy')).length;
  const diseaseCount = projectScans.length - healthyCount;

  return (
    <div className="page-container" style={{ maxWidth: '1000px' }}>
      {/* Back Link */}
      <div style={{ marginBottom: '18px' }}>
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} /> Back to Agent Workspace
        </Link>
      </div>

      {/* Project Header Banner */}
      <div className="project-detail-header-card">
        <div className="project-header-left">
          <div className="project-folder-badge">
            <Folder size={26} />
          </div>
          <div>
            <h1 className="project-detail-title">{project.name}</h1>
            <p className="project-detail-desc">
              {project.description || 'Monitoring plot, field batch diagnostic data, and leaf scan history.'}
            </p>
            <div className="project-meta-tags">
              <span className="project-meta-chip">
                <Calendar size={13} />
                <span>Created {new Date(project.createdAt || Date.now()).toLocaleDateString()}</span>
              </span>
              <span className="project-meta-chip">
                <FileText size={13} />
                <span>{projectScans.length} scans attached</span>
              </span>
            </div>
          </div>
        </div>

        <div className="project-header-actions">
          <label className="btn-primary-sm" style={{ cursor: 'pointer' }}>
            <UploadCloud size={15} />
            <span>{isUploading ? 'Analyzing...' : 'Scan New Leaf'}</span>
            <input 
              type="file" 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {error && <div className="prompt-error-message" style={{ marginBottom: '16px' }}>{error}</div>}

      {/* Project Stats Metrics */}
      <div className="analytics-metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card">
          <span className="metric-label">Project Scans</span>
          <div className="metric-value">{projectScans.length}</div>
          <span className="metric-sub">Total leaf images in project</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Healthy Ratio</span>
          <div className="metric-value" style={{ color: '#22c55e' }}>
            {projectScans.length > 0 ? `${((healthyCount / projectScans.length) * 100).toFixed(0)}%` : '100%'}
          </div>
          <span className="metric-sub">{healthyCount} clean leaves</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Pathogen Alert</span>
          <div className="metric-value" style={{ color: '#ef4444' }}>
            {diseaseCount}
          </div>
          <span className="metric-sub">Requires fungicide or isolation</span>
        </div>
      </div>

      {/* Project Files / Scans List */}
      <div className="project-scans-section">
        <div className="project-scans-header">
          <h3>Attached Field Scans & Diagnostics</h3>
          <span className="panel-tag">{projectScans.length} items</span>
        </div>

        {projectScans.length > 0 ? (
          <div className="project-scans-grid">
            {projectScans.map((scan) => {
              const isHealthy = scan.predicted_class?.toLowerCase().includes('healthy');
              return (
                <div key={scan.id} className="project-scan-card">
                  <div className="project-scan-icon" style={{ backgroundColor: isHealthy ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)', color: isHealthy ? '#22c55e' : '#ef4444' }}>
                    {isHealthy ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                  </div>

                  <div className="project-scan-details">
                    <h4 className="scan-card-title">{scan.predicted_class}</h4>
                    <p className="scan-card-filename">{scan.filename}</p>
                    <div className="scan-card-footer">
                      <span className="scan-card-confidence">
                        Confidence: {(scan.confidence * 100).toFixed(1)}%
                      </span>
                      <span className="scan-card-time">
                        {new Date(scan.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button 
                    className="icon-btn-xs" 
                    onClick={() => handleDeleteScan(scan.id)}
                    title="Remove scan from project"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="project-empty-card">
            <div className="project-empty-icon">
              <Folder size={32} />
            </div>
            <h4>No scans added to this project yet</h4>
            <p>Upload potato leaf photos to monitor disease spread and trends specifically for this field or plot.</p>
            <label className="btn-secondary-sm" style={{ cursor: 'pointer', marginTop: '12px' }}>
              <Plus size={15} />
              <span>Add First Leaf Scan</span>
              <input 
                type="file" 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
