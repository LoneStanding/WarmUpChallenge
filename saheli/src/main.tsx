import { render } from 'preact';
import { App } from './app.tsx';
import { AuthProvider } from './lib/auth-context';
import './index.css';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('SW Registered:', registration);
      })
      .catch(registrationError => {
        console.log('SW Registration Failed:', registrationError);
      });
  });
}

render(
  <AuthProvider>
    <App />
  </AuthProvider>,
  document.getElementById('app') as HTMLElement
);
