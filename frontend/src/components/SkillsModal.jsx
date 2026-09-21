import React, { useState } from 'react';
import { 
  X, Sparkles, BookOpen, BarChart3, ShieldAlert, Pill, 
  Leaf, Layers, CheckCircle2, ChevronRight, Play, ArrowRight,
  Droplets, Sun, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SKILLS_DATA = [
  {
    id: 'diagnose-leaf',
    title: 'Visual Disease Diagnostic Engine',
    category: 'Computer Vision & Deep Learning',
    badge: 'Core Model',
    icon: Leaf,
    iconColor: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.12)',
    summary: 'Analyzes high-resolution potato leaf images with ResNet-50 deep neural network to identify pathogens in real-time.',
    details: {
      overview: 'Trained on tens of thousands of potato leaf field samples across diverse lighting and environmental conditions. Distinguishes healthy foliage from early blight, late blight, and mosaic viruses with over 98% validated accuracy.',
      capabilities: [
        'Multi-stage symptom pattern recognition (concentric rings vs. water-soaked lesions)',
        'Confidence score & threshold validation with probability breakdown',
        'Automatic batch import & camera capture processing'
      ],
      samplePrompt: 'Please upload a photo of your potato leaf to run full diagnostic analysis.'
    }
  },
  {
    id: 'blight-guide',
    title: 'Blight Differentiation Guide',
    category: 'Pathology Knowledge Base',
    badge: 'Expert System',
    icon: ShieldAlert,
    iconColor: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    summary: 'Instant comparative pathology between Alternaria solani (Early Blight) and Phytophthora infestans (Late Blight).',
    details: {
      overview: 'Rapidly contrast Early Blight and Late Blight symptoms, transmission mechanisms, and risk phases to avoid misdiagnosis and incorrect chemical application.',
      capabilities: [
        'Early Blight (Alternaria solani): "Target-board" concentric rings, lower foliage first, warm & dry-wet cycles',
        'Late Blight (Phytophthora infestans): Rapid water-soaked dark lesions, pale margins, white fungal fuzz in high humidity',
        'Visual symptom comparison checklists and critical triage guidelines'
      ],
      samplePrompt: 'How do I distinguish Early Blight from Late Blight on potato leaves and stems?'
    }
  },
  {
    id: 'treatment-protocol',
    title: 'Targeted Treatment & Fungicide Protocol',
    category: 'Agronomy Recommendations',
    badge: 'Treatment Protocol',
    icon: Pill,
    iconColor: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.12)',
    summary: 'Organic, biological, and systemic chemical spray regimes with exact withholding periods and resistance management.',
    details: {
      overview: 'Formulates scientifically recommended spray and organic management programs tailored to the severity level and disease strain.',
      capabilities: [
        'Organic biocontrols: Copper sulfate, Bacillus subtilis, and potassium bicarbonate spray rotations',
        'Systemic & protectant fungicides: Mancozeb, Chlorothalonil, Metalaxyl (FRAC group rotation to prevent resistance)',
        'Pre-harvest interval (PHI) and re-entry interval (REI) guidance for crop safety'
      ],
      samplePrompt: 'What are recommended organic and chemical treatments for potato leaf diseases?'
    }
  },
  {
    id: 'crop-analytics',
    title: 'Yield Impact & Crop Analytics',
    category: 'Data & Forecasting',
    badge: 'Analytics',
    icon: BarChart3,
    iconColor: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
    summary: 'Evaluate historic scan trends, disease recurrence by plot, and estimated loss projections.',
    details: {
      overview: 'Synthesizes past diagnostic scans and field inspection history to highlight hot-spots and trend lines across planting seasons.',
      capabilities: [
        'Historical infection rate tracking across plots and seasons',
        'Severity index calculation based on leaf lesion surface percentage',
        'Exportable CSV and PDF summary data for farm management audits'
      ],
      samplePrompt: 'Generate a crop health analytics summary and trend analysis for my field.'
    }
  },
  {
    id: 'field-report',
    title: 'Automated Field Inspection Report',
    category: 'Field Automation',
    badge: 'Documentation',
    icon: BookOpen,
    iconColor: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.12)',
    summary: 'Generates professional agronomist-ready field inspection memos complete with action items.',
    details: {
      overview: 'Turns diagnostic scans and field notes into standardized diagnostic memos formatted for agronomists, farm supervisors, and certification bodies.',
      capabilities: [
        'Automatic calculation of field incidence and severity scores',
        'Immediate prioritized action checklist (isolate, prune, spray, irrigate timing)',
        'Shareable diagnostic links and printable reports'
      ],
      samplePrompt: 'Generate a detailed potato field inspection summary report with recommended actions.'
    }
  },
  {
    id: 'soil-health',
    title: 'Soil Nutrition & Preventative Agronomy',
    category: 'Preventative Agronomy',
    badge: 'Soil & Climate',
    icon: Layers,
    iconColor: '#10b981',
    bgColor: 'rgba(168, 85, 247, 0.12)',
    summary: 'Optimize nitrogen balance, canopy airflow, and drip irrigation to build innate plant disease resistance.',
    details: {
      overview: 'Examines cultural practices that dramatically reduce pathogen propagation without over-relying on synthetic chemicals.',
      capabilities: [
        'Nitrogen management: Preventing excessive lush vegetative growth that attracts fungal spores',
        'Drip vs overhead irrigation timing to maintain dry leaf surfaces during spore release',
        'Crop rotation guidelines (3-4 year non-solanaceous rotations to starve resting soil spores)'
      ],
      samplePrompt: 'Explain soil fertilization and irrigation best practices for potato disease resistance.'
    }
  }
];

const SkillsModal = ({ isOpen, onClose, onExecuteSkill }) => {
  const [selectedSkill, setSelectedSkill] = useState(SKILLS_DATA[0]);
  const [activeCategory, setActiveCategory] = useState('All');

  if (!isOpen) return null;

  const categories = ['All', 'Computer Vision & Deep Learning', 'Pathology Knowledge Base', 'Agronomy Recommendations', 'Data & Forecasting', 'Field Automation'];

  const filteredSkills = activeCategory === 'All' 
    ? SKILLS_DATA 
    : SKILLS_DATA.filter(s => s.category.toLowerCase().includes(activeCategory.toLowerCase()));

  const handleRunSkill = (skill) => {
    onClose();
    if (onExecuteSkill) {
      onExecuteSkill(skill);
    }
  };

  const IconComponent = selectedSkill.icon;

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div 
        className="skills-modal-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="skills-modal-header">
          <div className="skills-modal-title-group">
            <div className="skills-header-icon-badge">
              <Sparkles size={20} />
            </div>
            <div>
              <h3>Potato AI Skills & Intelligence Library</h3>
              <p>Specialized diagnostic skills, treatment protocols, and agronomy assistants</p>
            </div>
          </div>
          <button className="settings-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="skills-modal-layout">
          {/* Left Column: Skill Selector List */}
          <div className="skills-list-panel">
            <div className="skills-filter-tags">
              {['All', 'Pathology', 'Treatment', 'Analytics'].map((tag) => (
                <button
                  key={tag}
                  className={`skills-pill-tag ${activeCategory === tag ? 'active' : ''}`}
                  onClick={() => setActiveCategory(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="skills-cards-list">
              {filteredSkills.map((skill) => {
                const ItemIcon = skill.icon;
                const isSelected = selectedSkill.id === skill.id;
                return (
                  <div 
                    key={skill.id}
                    className={`skill-item-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedSkill(skill)}
                  >
                    <div className="skill-item-icon" style={{ backgroundColor: skill.bgColor, color: skill.iconColor }}>
                      <ItemIcon size={18} />
                    </div>
                    <div className="skill-item-text">
                      <div className="skill-item-header">
                        <h4>{skill.title}</h4>
                        <span className="skill-badge-chip">{skill.badge}</span>
                      </div>
                      <p>{skill.summary}</p>
                    </div>
                    <ChevronRight size={16} className="skill-item-arrow" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Skill Panel */}
          <div className="skills-detail-panel">
            <div className="skills-detail-header">
              <div className="skill-detail-icon-large" style={{ backgroundColor: selectedSkill.bgColor, color: selectedSkill.iconColor }}>
                <IconComponent size={28} />
              </div>
              <div>
                <span className="skill-detail-cat">{selectedSkill.category}</span>
                <h2>{selectedSkill.title}</h2>
              </div>
            </div>

            <div className="skills-detail-body">
              <div className="detail-section">
                <h5>Overview</h5>
                <p>{selectedSkill.details.overview}</p>
              </div>

              <div className="detail-section">
                <h5>Core Capabilities & Knowledge</h5>
                <ul className="skill-capabilities-list">
                  {selectedSkill.details.capabilities.map((cap, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={16} className="cap-check" />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="detail-section prompt-preview-box">
                <h5>Prompt Query</h5>
                <p className="sample-prompt-text">"{selectedSkill.details.samplePrompt}"</p>
              </div>
            </div>

            <div className="skills-detail-footer">
              <button 
                className="btn-use-skill"
                onClick={() => handleRunSkill(selectedSkill)}
              >
                <Play size={15} />
                <span>Use this Skill in Agent</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsModal;
