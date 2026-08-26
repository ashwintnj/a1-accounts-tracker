import { useRef, useState } from 'react';
import { formatINR } from '../lib/format';
import { scanImageForBalances } from '../lib/ocrParser';

/**
 * ScreenshotScanner
 * Props:
 *   mode: 'opening' | 'closing'
 *   onApply: (results: Array<{suffix, bankName, amount}>) => void
 */
const ScreenshotScanner = ({ mode, onApply }) => {
    const fileRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [results, setResults] = useState(null);   // null = not scanned yet
    const [rawText, setRawText] = useState('');
    const [showRaw, setShowRaw] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setScanning(true);
        setError('');
        setResults(null);
        setRawText('');
        setProgress(0);

        try {
            const { balances, rawText: rt } = await scanImageForBalances(file, (pct, status) => {
                setProgress(pct);
                setStatusText(status);
            });

            setRawText(rt);
            setResults(balances);

            if (balances.length === 0) {
                setError('No matching accounts found. Try a clearer screenshot or enter manually.');
            }
        } catch (err) {
            setError('OCR failed: ' + (err?.message || 'Unknown error'));
        } finally {
            setScanning(false);
            // Reset file input so same file can be re-selected if needed
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleApply = () => {
        if (results?.length) {
            onApply(results);
            setResults(null);
        }
    };

    const modeLabel = mode === 'opening' ? 'Opening' : 'Closing';
    const modeColor = mode === 'opening' ? 'blue' : 'indigo';

    return (
        <div className={`rounded-xl border border-${modeColor}-200 bg-${modeColor}-50/50 p-3`}>
            {/* Header row */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    {/* Camera icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-${modeColor}-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className={`text-xs font-semibold text-${modeColor}-700`}>
                        Scan Paytm Screenshot → Auto-fill {modeLabel} Balance
                    </span>
                </div>
            </div>

            {/* Upload button */}
            {!scanning && !results && (
                <>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className={`w-full rounded-lg border border-dashed border-${modeColor}-300 bg-white py-2.5 text-sm font-semibold text-${modeColor}-700 hover:bg-${modeColor}-50 flex items-center justify-center gap-2`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload Paytm Balance Screenshot
                    </button>
                </>
            )}

            {/* Scanning progress */}
            {scanning && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>{statusText || 'Processing...'}</span>
                        <span className="font-bold">{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r from-${modeColor}-500 to-${modeColor}-700 transition-all duration-300`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-500 text-center">Please wait — reading image text...</p>
                </div>
            )}

            {/* Error */}
            {error && !scanning && (
                <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700 flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Results preview */}
            {results && results.length > 0 && !scanning && (
                <div className="mt-2 space-y-2">
                    <p className="text-xs font-semibold text-slate-700">Detected balances — confirm and apply:</p>
                    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                        {results.map((r) => (
                            <div key={r.suffix} className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-100 last:border-0">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-800 truncate">{r.bankName}</p>
                                    <p className="text-xs text-slate-400">Last 4: xx{r.suffix}</p>
                                </div>
                                <p className="text-sm font-bold text-emerald-600">{formatINR(r.amount)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleApply}
                            className={`flex-1 rounded-lg bg-${modeColor}-600 py-2 text-sm font-bold text-white hover:bg-${modeColor}-700`}
                        >
                            ✓ Apply to {modeLabel} Balance
                        </button>
                        <button
                            type="button"
                            onClick={() => { setResults(null); setError(''); }}
                            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
                        >
                            Cancel
                        </button>
                    </div>

                    {/* Debug: show raw OCR text toggle */}
                    <button
                        type="button"
                        onClick={() => setShowRaw(!showRaw)}
                        className="text-xs text-slate-400 hover:text-slate-600 underline"
                    >
                        {showRaw ? 'Hide' : 'Show'} raw OCR text (debug)
                    </button>
                    {showRaw && (
                        <pre className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-40 overflow-auto whitespace-pre-wrap text-slate-600">
                            {rawText}
                        </pre>
                    )}
                </div>
            )}

            {/* No results but scan done */}
            {results && results.length === 0 && !scanning && !error && (
                <div className="mt-2 space-y-2">
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                        Could not match any accounts. Check raw OCR text below for details.
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowRaw(!showRaw)}
                        className="text-xs text-slate-400 hover:text-slate-600 underline"
                    >
                        {showRaw ? 'Hide' : 'Show'} raw OCR text
                    </button>
                    {showRaw && (
                        <pre className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-40 overflow-auto whitespace-pre-wrap text-slate-600">
                            {rawText}
                        </pre>
                    )}
                    <button
                        type="button"
                        onClick={() => { setResults(null); setError(''); }}
                        className="w-full rounded-lg bg-slate-100 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
};

export default ScreenshotScanner;
