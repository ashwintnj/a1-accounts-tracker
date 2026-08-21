import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

if (import.meta.env.PROD) {
    const updateServiceWorker = registerSW({
        immediate: true,
        onNeedRefresh() {
            window.dispatchEvent(new Event('a1-pwa-update-available'));
        },
        onOfflineReady() {
            window.dispatchEvent(new Event('a1-pwa-offline-ready'));
        }
    });

    window.a1UpdateServiceWorker = () => updateServiceWorker(true);
} else if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
