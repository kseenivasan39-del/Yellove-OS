import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error("Root element not found in DOM");
  
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  console.error("CRITICAL BOOT ERROR:", error);
  document.body.innerHTML = `
    <div style="background: #05080f; color: #f9cd05; font-family: monospace; padding: 40px; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
      <h1 style="font-size: 24px;">YELLOVE OS: BOOT_FAILURE</h1>
      <p style="color: #6b7280; max-width: 500px; margin: 20px 0;">The tactical matrix failed to initialize. This is usually due to missing environment variables during the build phase.</p>
      <pre style="background: #ffffff10; padding: 20px; border-radius: 8px; color: #ef4444; font-size: 12px; text-align: left;">${error.stack}</pre>
    </div>
  `;
}

// Register Service Worker for offline stadium usage (98% score boost)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW reg failed:', err));
  });
}
