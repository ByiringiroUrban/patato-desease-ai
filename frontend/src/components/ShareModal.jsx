import React, { useState } from 'react';
import { 
  X, Copy, Check, Share2, MessageCircle, 
  Mail, QrCode, Globe, Shield 
} from 'lucide-react';

const TwitterIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 0 0 1.66-1.66 1.66 1.66 0 1 0-3.32 0c0 .92.74 1.66 1.66 1.66m1.39 9.74v-8.37H5.07v8.37h2.78z" />
  </svg>
);

const ShareModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = 'Potato AI Disease Detector - Smart Leaf Health Analysis';
  const shareText = 'Check out this Potato Disease AI diagnostics report and smart agriculture assistant!';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: currentUrl,
        });
      } catch (err) {
        // User canceled or rejected share sheet
      }
    } else {
      handleCopyLink();
    }
  };

  const shareToSocial = (platform) => {
    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedText = encodeURIComponent(`${shareText}\n`);

    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodedText}${encodedUrl}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(
          `${shareText}\n\nLink: ${currentUrl}`
        )}`;
        break;
      default:
        break;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    currentUrl
  )}&bgcolor=ffffff&color=111827&margin=1`;

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div 
        className="share-modal-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="share-modal-header">
          <div className="share-modal-title-group">
            <div className="share-modal-icon-badge">
              <Share2 size={20} />
            </div>
            <div>
              <h3>Share Workspace</h3>
              <p>Collaborate or share diagnostic findings with agronomists & farmers</p>
            </div>
          </div>
          <button className="settings-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="share-modal-body">
          {/* Quick Copy Link Box */}
          <div className="share-link-section">
            <label className="share-label">Workspace Link</label>
            <div className="share-link-input-wrap">
              <Globe size={16} className="share-link-icon" />
              <input 
                type="text" 
                readOnly 
                value={currentUrl} 
                className="share-link-input"
                onClick={(e) => e.target.select()}
              />
              <button 
                className={`share-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <Check size={15} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Platforms Row */}
          <div className="share-platforms-section">
            <label className="share-label">Share via</label>
            <div className="share-platforms-grid">
              <button 
                className="share-platform-btn whatsapp" 
                onClick={() => shareToSocial('whatsapp')}
                title="Share via WhatsApp"
              >
                <div className="platform-icon-circle whatsapp-bg">
                  <MessageCircle size={18} />
                </div>
                <span>WhatsApp</span>
              </button>

              <button 
                className="share-platform-btn twitter" 
                onClick={() => shareToSocial('twitter')}
                title="Share on X"
              >
                <div className="platform-icon-circle twitter-bg">
                  <TwitterIcon size={16} />
                </div>
                <span>X / Twitter</span>
              </button>

              <button 
                className="share-platform-btn linkedin" 
                onClick={() => shareToSocial('linkedin')}
                title="Share on LinkedIn"
              >
                <div className="platform-icon-circle linkedin-bg">
                  <LinkedinIcon size={18} />
                </div>
                <span>LinkedIn</span>
              </button>

              <button 
                className="share-platform-btn email" 
                onClick={() => shareToSocial('email')}
                title="Share via Email"
              >
                <div className="platform-icon-circle email-bg">
                  <Mail size={18} />
                </div>
                <span>Email</span>
              </button>

              <button 
                className={`share-platform-btn qr ${showQr ? 'active' : ''}`} 
                onClick={() => setShowQr(!showQr)}
                title="Generate QR Code"
              >
                <div className="platform-icon-circle qr-bg">
                  <QrCode size={18} />
                </div>
                <span>QR Code</span>
              </button>
            </div>
          </div>

          {/* QR Code preview expandable */}
          {showQr && (
            <div className="share-qr-container">
              <div className="qr-image-wrapper">
                <img src={qrCodeUrl} alt="Workspace QR Code" className="qr-image" />
              </div>
              <p className="qr-helper-text">Scan with camera to instantly open on your phone or tablet</p>
            </div>
          )}

          {/* Access permissions note */}
          <div className="share-security-note">
            <Shield size={16} />
            <span>Public link: Anyone with this link can view the diagnostic insights and leaf scans.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="share-modal-footer">
          {typeof navigator !== 'undefined' && navigator.share && (
            <button className="share-native-btn" onClick={handleNativeShare}>
              <Share2 size={15} />
              <span>More share options...</span>
            </button>
          )}
          <button className="settings-btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
