import React from 'react';
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';

const DynamicProvider = ({ children }) => {
  const settings = {
    // Production environment ID for nftreasure
    environmentId: 'b17e8631-c1b7-45d5-95cf-151eb5246423',
    
    // Include wallet connectors (required by Dynamic)
    walletConnectors: [EthereumWalletConnectors],
    
    // Social auth providers FIRST (same as TRESR.com)
    authProviders: [
      'googlesocial',
      'discord', 
      'telegram',
      'emailverification'
    ],
    
    // Force social auth to show first - NOT wallet connect
    initialAuthenticationMode: 'connect-and-sign',
    
    // Prioritize social authentication over wallet connections
    authFlow: 'social-first',
    hideEmbeddedWalletTransactionUIs: false,
    
    // Prevent additional auth prompts when already authenticated
    enableVisitTrackingOnConnectOnly: true,
    
    // Only show primary auth method, not additional linking options
    multiWallet: false,
    
    // UI customization to match TRESR brand
    appName: 'TRESR Creator Tools',
    appLogoUrl: 'https://tresr.com/logo.png',
    
    // Privacy policy (matches TRESR.com)
    privacyPolicyUrl: 'https://tresr.com/privacy',
    termsOfServiceUrl: 'https://tresr.com/terms',
    
    // Callback configuration
    onAuthSuccess: (user) => {
      console.log('Dynamic auth success:', user);
      // Token exchange will happen in the Login component
    },
    
    onAuthFailure: (error) => {
      console.error('Dynamic auth failure:', error);
    },
    
    // UI customization
    cssOverrides: `
      .dynamic-shadow-dom * {
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      }
      
      .dynamic-modal-overlay {
        background: rgba(0, 0, 51, 0.8) !important;
      }
      
      .dynamic-connect-button {
        background: #ffcc33 !important;
        color: #000033 !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 12px 24px !important;
        font-weight: 600 !important;
        transition: all 0.2s ease !important;
      }
      
      .dynamic-connect-button:hover {
        background: #e6b82e !important;
        transform: translateY(-1px) !important;
      }
    `
  };

  return (
    <DynamicContextProvider settings={settings}>
      {children}
    </DynamicContextProvider>
  );
};

export default DynamicProvider;