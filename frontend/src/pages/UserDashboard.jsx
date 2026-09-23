import React, { useState, useEffect } from 'react';
import PromptInput from '../components/PromptInput';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2, AlertTriangle, X, Leaf, ShieldAlert,
  Thermometer, Droplets, FlaskConical, Clock, ChevronDown,
  ChevronUp, Sprout, AlertCircle, Info
} from 'lucide-react';

// ── Disease Knowledge Base ─────────────────────────────────────────────────

const DISEASE_INFO = {
  early_blight: {
    key: 'early_blight',
    type: 'disease',
    label: 'Early Blight',
    pathogen: 'Alternaria solani',
    severity: 'moderate',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.3)',
    icon: AlertTriangle,
    summary:
      'Early Blight is a common fungal disease caused by Alternaria solani. It typically attacks older, lower leaves first and spreads upward. Look for dark brown target-shaped spots with yellow halos.',
    symptoms: [
      'Dark brown to black spots with concentric rings (target-board pattern)',
      'Yellow (chlorotic) halo surrounding each lesion',
      'Lesions start on older, lower leaves first',
      'Severe infections cause premature defoliation',
    ],
    conditions: [
      'Warm temperatures (24–29°C / 75–84°F)',
      'Alternating wet and dry periods',
      'High humidity overnight (dew formation)',
      'Poor plant nutrition or drought-stressed crops',
    ],
    treatments: [
      'Apply protectant fungicides (chlorothalonil, mancozeb) before symptoms appear',
      'Use systemic fungicides (azoxystrobin, difenoconazole) at first sign of infection',
      'Remove and destroy infected lower leaves immediately',
      'Rotate FRAC Group 3 and Group 11 fungicides to prevent resistance',
    ],
    prevention: [
      'Maintain proper plant spacing for airflow',
      'Avoid overhead irrigation; use drip irrigation instead',
      'Apply balanced NPK fertilizer to reduce plant stress',
      'Practice 3-year crop rotation with non-solanaceous crops',
    ],
    urgency: 'Act within 3–5 days to prevent spread to upper canopy.',
  },
  late_blight: {
    key: 'late_blight',
    type: 'disease',
    label: 'Late Blight',
    pathogen: 'Phytophthora infestans',
    severity: 'critical',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.3)',
    icon: AlertTriangle,
    summary:
      'Late Blight is a highly destructive oomycete disease caused by Phytophthora infestans — the same pathogen responsible for the Irish Potato Famine. It can destroy an entire crop within days under ideal conditions.',
    symptoms: [
      'Water-soaked, greasy-looking lesions on leaves and stems',
      'White to grey fuzzy sporulation on the underside of leaves',
      'Dark brown to black rotting lesions on stems',
      'Infected tubers show reddish-brown dry rot beneath skin',
    ],
    conditions: [
      'Cool temperatures (10–24°C / 50–75°F)',
      'High humidity above 90% for 10+ consecutive hours',
      'Extended periods of leaf wetness',
      'Cool nights with warm days (common in highland areas)',
    ],
    treatments: [
      '⚠️ Apply systemic fungicides immediately (metalaxyl, cymoxanil, dimethomorph)',
      'Remove and destroy ALL infected plant material — do not compost',
      'Apply copper-based fungicides as a follow-up protectant',
      'Avoid entering the field when plants are wet to prevent further spread',
    ],
    prevention: [
      'Plant certified disease-free seed potatoes',
      'Implement regular 5–7 day preventive fungicide spray calendar',
      'Monitor weather forecasts using Blitecast or similar models',
      'Hill up soil around stems to protect developing tubers',
    ],
    urgency: '🚨 CRITICAL — Treat immediately. Late Blight can destroy an entire field in 7–10 days.',
  },
  healthy: {
    key: 'healthy',
    type: 'healthy',
    label: 'Healthy Potato',
    pathogen: null,
    severity: 'none',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.3)',
    icon: CheckCircle2,
    summary:
      'Great news! Your potato leaf shows no visible signs of disease. The foliage appears healthy with normal coloration and no lesions, spots, or discoloration patterns.',
    symptoms: [
      'Deep green, uniform leaf coloration',
      'No spots, lesions, or discoloration',
      'Firm leaf texture with no water-soaked areas',
      'Normal leaf shape and growth pattern',
    ],
    conditions: [],
    treatments: [],
    prevention: [
      'Continue regular field scouting every 5–7 days',
      'Maintain a preventive fungicide spray schedule as protection',
      'Ensure adequate nutrition with regular soil testing',
      'Keep irrigation consistent to avoid drought stress',
    ],
    urgency: null,
  },
};

function classifyResult(className) {
  if (!className) return DISEASE_INFO.healthy;
  const name = className.toLowerCase();
  if (name.includes('early')) return DISEASE_INFO.early_blight;
  if (name.includes('late')) return DISEASE_INFO.late_blight;
  return DISEASE_INFO.healthy;
}

function formatClassName(raw) {
  if (!raw) return 'Unknown';
  return raw.replace(/_{2,}/g, ' ').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Confidence Bar ─────────────────────────────────────────────────────────

const ConfidenceBar = ({ confidence, color }) => {
  const pct = (confidence * 100).toFixed(1);
  return (
    <div className="result-confidence-wrap">
      <div className="result-confidence-labels">
        <span>AI Confidence</span>
        <span style={{ color, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div className="result-confidence-track">
        <div
          className="result-confidence-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
};

// ── Severity Badge ─────────────────────────────────────────────────────────

const SeverityBadge = ({ severity, color }) => {
  const labels = { none: 'No Disease', moderate: 'Moderate Risk', critical: 'Critical' };
  return (
    <span className="result-severity-badge" style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
      {labels[severity] || severity}
    </span>
  );
};

// ── Main Result Card ───────────────────────────────────────────────────────

const PredictionResultCard = ({ prediction, onClose }) => {
  const [showDetails, setShowDetails] = useState(false);
  const info = classifyResult(prediction.class_name);
  const Icon = info.icon;
  const isHealthy = info.type === 'healthy';
  const isCritical = info.severity === 'critical';

  return (
    <div className="prediction-result-modal-overlay" onClick={onClose}>
      <div
        className={`prediction-result-card-v2 ${isCritical ? 'critical-pulse' : ''}`}
        onClick={e => e.stopPropagation()}
        style={{ borderColor: info.border }}
      >
        {/* ── Status Banner ── */}
        <div
          className="result-v2-banner"
          style={{ background: info.bg, borderBottom: `1px solid ${info.border}` }}
        >
          <div className="result-v2-banner-icon" style={{ background: info.color }}>
            <Icon size={24} color="#fff" />
          </div>
          <div className="result-v2-banner-text">
            <div className="result-v2-status-label" style={{ color: info.color }}>
              {isHealthy ? '✅ No Disease Detected' : `⚠️ Disease Detected`}
            </div>
            <div className="result-v2-disease-name">
              {isHealthy ? 'Healthy Potato Leaf' : info.label}
            </div>
            {info.pathogen && (
              <div className="result-v2-pathogen">
                <FlaskConical size={12} /> {info.pathogen}
              </div>
            )}
          </div>
          <div className="result-v2-header-right">
            <SeverityBadge severity={info.severity} color={info.color} />
            <button className="result-v2-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="result-v2-body">
          {/* Confidence Bar */}
          <ConfidenceBar confidence={prediction.confidence} color={info.color} />

          {/* Raw class name (small, disambiguated) */}
          <div className="result-v2-raw-class">
            <Info size={12} />
            AI classification: <code>{formatClassName(prediction.class_name)}</code>
          </div>

          {/* Urgency Banner (diseases only) */}
          {info.urgency && (
            <div
              className="result-v2-urgency"
              style={{ background: isCritical ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', borderColor: info.color, color: info.color }}
            >
              <Clock size={14} />
              <span>{info.urgency}</span>
            </div>
          )}

          {/* Summary */}
          <p className="result-v2-summary">{info.summary}</p>

          {/* Probabilities for all classes */}
          {prediction.probabilities && Object.keys(prediction.probabilities).length > 0 && (
            <div className="result-v2-probs">
              <div className="result-v2-section-label">All class probabilities</div>
              {Object.entries(prediction.probabilities)
                .sort(([, a], [, b]) => b - a)
                .map(([cls, prob]) => {
                  const c = classifyResult(cls);
                  return (
                    <div key={cls} className="result-v2-prob-row">
                      <span className="result-v2-prob-cls">{formatClassName(cls)}</span>
                      <div className="result-v2-prob-track">
                        <div className="result-v2-prob-fill" style={{ width: `${(prob * 100).toFixed(1)}%`, background: c.color }} />
                      </div>
                      <span className="result-v2-prob-pct" style={{ color: c.color }}>{(prob * 100).toFixed(1)}%</span>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Expand/Collapse Details */}
          <button
            className="result-v2-expand-btn"
            onClick={() => setShowDetails(v => !v)}
          >
            {showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            {showDetails ? 'Hide' : 'Show'} detailed disease report
          </button>

          {showDetails && (
            <div className="result-v2-details">
              {/* Symptoms */}
              <div className="result-v2-detail-section">
                <div className="result-v2-detail-title">
                  <Leaf size={14} style={{ color: info.color }} />
                  {isHealthy ? 'Observed Characteristics' : 'Symptoms to Watch For'}
                </div>
                <ul className="result-v2-list">
                  {info.symptoms.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>

              {/* Conditions (diseases only) */}
              {info.conditions.length > 0 && (
                <div className="result-v2-detail-section">
                  <div className="result-v2-detail-title">
                    <Thermometer size={14} style={{ color: '#60a5fa' }} />
                    Favourable Conditions
                  </div>
                  <ul className="result-v2-list info">
                    {info.conditions.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}

              {/* Treatments (diseases only) */}
              {info.treatments.length > 0 && (
                <div className="result-v2-detail-section">
                  <div className="result-v2-detail-title">
                    <FlaskConical size={14} style={{ color: '#a78bfa' }} />
                    Recommended Treatments
                  </div>
                  <ul className="result-v2-list treatment">
                    {info.treatments.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              )}

              {/* Prevention */}
              {info.prevention.length > 0 && (
                <div className="result-v2-detail-section">
                  <div className="result-v2-detail-title">
                    <Sprout size={14} style={{ color: '#34d399' }} />
                    Prevention & Best Practices
                  </div>
                  <ul className="result-v2-list prevention">
                    {info.prevention.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="result-v2-footer">
          <span className="result-v2-footer-note">
            <AlertCircle size={12} />
            Results are AI predictions. Always confirm with an agronomist.
          </span>
          <button
            className="result-v2-done-btn"
            style={{ background: info.color }}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ── UserDashboard ──────────────────────────────────────────────────────────

const UserDashboard = () => {
  const { token } = useAuth();
  const [latestPrediction, setLatestPrediction] = useState(null);

  const handlePredictionComplete = (result) => {
    setLatestPrediction(result);
    window.dispatchEvent(new Event('taskHistoryUpdated'));
  };

  return (
    <div className="dashboard-container">
      <PromptInput onPredictionComplete={handlePredictionComplete} />

      {latestPrediction && (
        <PredictionResultCard
          prediction={latestPrediction}
          onClose={() => setLatestPrediction(null)}
        />
      )}
    </div>
  );
};

export default UserDashboard;
