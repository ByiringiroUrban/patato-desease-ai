import React, { useState } from 'react';
import { 
  X, Check, Zap, Shield, Sparkles, CreditCard, 
  CheckCircle2, ArrowRight, Lock, Building, Smartphone, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PLANS = [
  {
    id: 'free',
    name: 'Free Plan',
    price: '$0',
    period: '/month',
    badge: 'Current Plan',
    highlight: false,
    description: 'Basic diagnostic scanning for individual home gardeners and hobbyists.',
    features: [
      '10 leaf diagnostics per day',
      'Standard ResNet-50 AI model',
      'Basic disease identification (Blight/Healthy)',
      'Community forum support',
      'Single workspace project'
    ],
    buttonText: 'Current Plan',
    disabled: true
  },
  {
    id: 'pro',
    name: 'Potato Pro Agronomist',
    price: '$19',
    period: '/month',
    badge: 'Most Popular',
    highlight: true,
    description: 'Designed for active commercial growers, agronomists, and farm inspectors.',
    features: [
      'Unlimited high-resolution leaf scans',
      'Potato AI 2.0 Pro (Max) Reasoning Engine',
      'Full treatment & fungicide prescription guides',
      'Exportable PDF & CSV agronomic field reports',
      'Unlimited field project folders & plot tracking',
      'Priority offline model access'
    ],
    buttonText: 'Upgrade to Pro',
    disabled: false
  },
  {
    id: 'enterprise',
    name: 'Commercial Enterprise',
    price: '$79',
    period: '/month',
    badge: 'Enterprise',
    highlight: false,
    description: 'Complete farm monitoring suite with multi-team collaboration and API access.',
    features: [
      'Everything in Pro included',
      'Team multi-seat access (up to 20 users)',
      'REST API access for greenhouse automation',
      'Custom disease fine-tuning on local crop strains',
      'Dedicated agricultural specialist support',
      'SLA guarantee 99.9% uptime'
    ],
    buttonText: 'Upgrade to Enterprise',
    disabled: false
  }
];

const UpgradeModal = ({ isOpen, onClose }) => {
  const { user, updateUserPlan } = useAuth();
  
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [step, setStep] = useState('plans'); // 'plans' | 'checkout' | 'success'
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'momo' | 'paypal'
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [phoneMomo, setPhoneMomo] = useState('');

  if (!isOpen) return null;

  const currentPlanId = user?.plan || 'free';

  const calculatePrice = (basePriceStr) => {
    const num = parseInt(basePriceStr.replace('$', ''), 10);
    if (num === 0) return '$0';
    if (billingCycle === 'yearly') {
      const discounted = Math.round(num * 0.8);
      return `$${discounted}`;
    }
    return basePriceStr;
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setStep('checkout');
  };

  const handleProcessPayment = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      if (updateUserPlan) {
        updateUserPlan(selectedPlan.id);
      }
      setStep('success');
    }, 1800);
  };

  const handleFinish = () => {
    setStep('plans');
    onClose();
  };

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div 
        className="upgrade-modal-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="upgrade-modal-header">
          <div className="upgrade-header-title-group">
            <div className="upgrade-icon-badge">
              <Zap size={22} />
            </div>
            <div>
              <h3>Upgrade Potato AI Subscription</h3>
              <p>Unlock deep neural disease diagnosis, unlimited scans, and field reports</p>
            </div>
          </div>
          <button className="settings-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="upgrade-modal-body">
          {step === 'plans' && (
            <>
              {/* Billing Cycle Toggle */}
              <div className="billing-cycle-switch-container">
                <div className="billing-cycle-switch">
                  <button 
                    className={`cycle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                    onClick={() => setBillingCycle('monthly')}
                  >
                    Monthly Billing
                  </button>
                  <button 
                    className={`cycle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
                    onClick={() => setBillingCycle('yearly')}
                  >
                    <span>Annual Billing</span>
                    <span className="discount-tag">Save 20%</span>
                  </button>
                </div>
              </div>

              {/* Pricing Plans Grid */}
              <div className="plans-grid">
                {PLANS.map((plan) => {
                  const isCurrent = currentPlanId === plan.id;
                  const price = calculatePrice(plan.price);
                  return (
                    <div 
                      key={plan.id} 
                      className={`plan-card ${plan.highlight ? 'highlight' : ''} ${isCurrent ? 'current' : ''}`}
                    >
                      {plan.highlight && (
                        <div className="plan-popular-badge">
                          <Sparkles size={13} />
                          <span>{plan.badge}</span>
                        </div>
                      )}

                      <div className="plan-card-header">
                        <h4>{plan.name}</h4>
                        <div className="plan-price-wrap">
                          <span className="plan-amount">{price}</span>
                          <span className="plan-period">{billingCycle === 'yearly' && price !== '$0' ? '/mo (billed annually)' : plan.period}</span>
                        </div>
                        <p className="plan-description">{plan.description}</p>
                      </div>

                      <div className="plan-divider" />

                      <ul className="plan-features-list">
                        {plan.features.map((feat, idx) => (
                          <li key={idx}>
                            <CheckCircle2 size={16} className="feature-check" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="plan-card-footer">
                        {isCurrent ? (
                          <button className="plan-btn current" disabled>
                            Active Plan
                          </button>
                        ) : (
                          <button 
                            className={`plan-btn ${plan.highlight ? 'primary' : 'secondary'}`}
                            onClick={() => handleSelectPlan(plan)}
                          >
                            <span>{plan.buttonText}</span>
                            <ArrowRight size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trust Footer */}
              <div className="upgrade-security-strip">
                <div className="security-item">
                  <Shield size={16} />
                  <span>256-bit encrypted checkout</span>
                </div>
                <div className="security-item">
                  <Check size={16} />
                  <span>Cancel or switch plans anytime</span>
                </div>
                <div className="security-item">
                  <Globe size={16} />
                  <span>Trusted by over 14,000 potato growers</span>
                </div>
              </div>
            </>
          )}

          {step === 'checkout' && (
            <div className="checkout-layout">
              {/* Left Column: Order Summary */}
              <div className="checkout-summary-card">
                <h4>Order Summary</h4>
                <div className="summary-plan-info">
                  <div className="summary-plan-title">
                    <span className="summary-plan-name">{selectedPlan.name}</span>
                    <span className="summary-plan-price">
                      {calculatePrice(selectedPlan.price)}
                      <span className="summary-sub">/mo</span>
                    </span>
                  </div>
                  <span className="summary-billing-cycle">
                    Billed {billingCycle}
                  </span>
                </div>

                <div className="summary-features">
                  <h5>Included in your upgrade:</h5>
                  <ul>
                    {selectedPlan.features.slice(0, 4).map((f, i) => (
                      <li key={i}>
                        <Check size={14} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  className="checkout-back-link" 
                  onClick={() => setStep('plans')}
                  type="button"
                >
                  ← Choose a different plan
                </button>
              </div>

              {/* Right Column: Payment Gateway Form */}
              <div className="checkout-form-container">
                <h4>Payment Method</h4>

                {/* Gateway Tab Selectors */}
                <div className="payment-tabs">
                  <button 
                    type="button"
                    className={`payment-tab ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <CreditCard size={16} />
                    <span>Credit / Debit Card</span>
                  </button>
                  <button 
                    type="button"
                    className={`payment-tab ${paymentMethod === 'momo' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('momo')}
                  >
                    <Smartphone size={16} />
                    <span>Mobile Money / MPesa</span>
                  </button>
                </div>

                <form onSubmit={handleProcessPayment} className="payment-form">
                  {paymentMethod === 'card' ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">Cardholder Name</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Jean Pierre Byiringiro" 
                          className="form-input"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Card Number</label>
                        <div className="card-input-wrap">
                          <CreditCard size={18} className="card-icon" />
                          <input 
                            type="text" 
                            required
                            placeholder="4242 •••• •••• 4242" 
                            className="form-input card-field"
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-row-two">
                        <div className="form-group">
                          <label className="form-label">Expiration (MM/YY)</label>
                          <input 
                            type="text" 
                            required
                            placeholder="12/28" 
                            className="form-input"
                            maxLength={5}
                            value={cardExp}
                            onChange={(e) => setCardExp(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">CVC / CVV</label>
                          <input 
                            type="text" 
                            required
                            placeholder="123" 
                            className="form-input"
                            maxLength={4}
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Mobile Number (MTN / Airtel / MPesa)</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="+250 788 123 456" 
                        className="form-input"
                        value={phoneMomo}
                        onChange={(e) => setPhoneMomo(e.target.value)}
                      />
                      <p className="form-helper-text">A payment prompt PIN will be sent directly to your phone to authorize transaction.</p>
                    </div>
                  )}

                  <div className="checkout-terms-note">
                    <Lock size={14} />
                    <span>Your subscription will renew automatically. You can cancel at anytime in your Profile Settings.</span>
                  </div>

                  <button 
                    type="submit" 
                    className="pay-now-btn" 
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <span>Processing securely...</span>
                    ) : (
                      <>
                        <Lock size={16} />
                        <span>Pay {calculatePrice(selectedPlan.price)} & Start Subscription</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="upgrade-success-view">
              <div className="upgrade-success-icon-badge">
                <CheckCircle2 size={48} />
              </div>
              <h3>Subscription Upgraded Successfully!</h3>
              <p>Welcome to <strong>{selectedPlan.name}</strong>! Your account now has access to high-accuracy model triage, unlimited diagnostics, and exportable field reports.</p>

              <div className="success-plan-recap">
                <span>Active Status:</span>
                <strong>Pro Member (Active)</strong>
              </div>

              <button className="btn-primary-sm" onClick={handleFinish} style={{ marginTop: '20px', padding: '10px 24px' }}>
                Return to Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
