import { useEffect, useState } from 'react';

const PwaUpdatePrompt = () => {
    const [showUpdate, setShowUpdate] = useState(false);

    useEffect(() => {
        const handleUpdateAvailable = () => setShowUpdate(true);

        window.addEventListener('a1-pwa-update-available', handleUpdateAvailable);

        return () => {
            window.removeEventListener('a1-pwa-update-available', handleUpdateAvailable);
        };
    }, []);

    const handleUpdateNow = () => {
        if (typeof window.a1UpdateServiceWorker === 'function') {
            window.a1UpdateServiceWorker();
            return;
        }

        window.location.reload();
    };

    if (!showUpdate) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-blue-200 bg-white p-3 shadow-lg">
            <p className="text-sm font-semibold text-slate-800">New app update available</p>
            <p className="mt-1 text-xs text-slate-600">Tap update to refresh this app with latest changes.</p>
            <div className="mt-3 flex gap-2">
                <button type="button" className="btn-primary flex-1" onClick={handleUpdateNow}>
                    Update Now
                </button>
                <button type="button" className="btn-light flex-1" onClick={() => setShowUpdate(false)}>
                    Later
                </button>
            </div>
        </div>
    );
};

export default PwaUpdatePrompt;
