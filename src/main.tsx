import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Startup configuration log for EmailJS environment tracking
(() => {
  const serviceId = (import.meta as any).env.VITE_EMAILJS_SERVICE_ID || 'service_7qp1jq7';
  const templateId = (import.meta as any).env.VITE_EMAILJS_TEMPLATE_ID || 'template_1xne0rd';
  const publicKey = (import.meta as any).env.VITE_EMAILJS_PUBLIC_KEY || 'Dek9soFEqsS7k5JtxT8OM';
  
  console.log('🚀 [EmailJS Startup Diagnostics]');
  console.log(' - Service ID: ', serviceId);
  console.log(' - Template ID:', templateId);
  console.log(' - Public Key Present:', publicKey ? `Yes (length: ${publicKey.length})` : 'No');
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
