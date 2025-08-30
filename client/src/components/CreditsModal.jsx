import React from 'react';
import './CreditsModal.css';

function CreditsModal({ isOpen, onClose, currentCredits, onPurchase }) {
  if (!isOpen) return null;

  const packages = [
    { credits: 50, price: 5, label: 'Starter', save: null },
    { credits: 250, price: 20, label: 'Popular', save: '20%' },
    { credits: 500, price: 35, label: 'Pro', save: '30%' },
    { credits: 1000, price: 60, label: 'Team', save: '40%' },
    { credits: 5000, price: 250, label: 'Enterprise', save: '50%' },
    { credits: 10000, price: 400, label: 'Ultimate', save: '60%' }
  ];

  return (
    <>
      <div className="credits-modal-overlay" onClick={onClose} />
      <div className="credits-modal">
        <div className="credits-modal-header">
          <h2>Buy Credits</h2>
          <button className="credits-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="credits-modal-balance">
          <span>Current Balance:</span>
          <span className="credits-amount">{currentCredits} credits</span>
        </div>
        
        <div className="credits-packages">
          {packages.map(pkg => (
            <div key={pkg.credits} className="credit-package">
              {pkg.save && <div className="package-save">{pkg.save}</div>}
              <div className="package-label">{pkg.label}</div>
              <div className="package-credits">{pkg.credits.toLocaleString()} credits</div>
              <div className="package-price">${pkg.price}</div>
              <button 
                className="package-btn"
                onClick={() => {
                  onPurchase(pkg.credits);
                  onClose();
                }}
              >
                Buy Now
              </button>
            </div>
          ))}
        </div>
        
        <div className="credits-modal-footer">
          <p>Credits never expire • Instant delivery • Secure payment</p>
        </div>
      </div>
    </>
  );
}

export default CreditsModal;