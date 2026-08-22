import { createWorker } from 'tesseract.js';

/**
 * Map of last-4-digit account suffix → display name (from DEFAULT_BANKS)
 * Update this if constants.js changes.
 */
export const ACCOUNT_SUFFIX_MAP = {
    '2496': 'Indian Bank Current Account (xx2496)',
    '6794': 'Indian Bank Savings Account (xx6794)',
    '0693': 'Jio Payments Bank (xx0693)',
    '2860': 'Bank of Baroda (xx2860)'
};

/**
 * Parse a raw amount string like "₹1,23,456.78", "1,23,456", "Rs.1234" → number
 */
export function parseAmount(raw) {
    if (!raw) return null;
    // Remove currency symbols, spaces, commas
    const cleaned = raw.replace(/[₹Rs\.INR\s,]/gi, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

/**
 * Amount regex — matches Indian number formats.
 * Also handles OCR misreads: ₹ often reads as %, &, #, etc.
 * e.g. "%43,395.97", "27,750.31", "₹13,910.65"
 */
const AMOUNT_REGEX = /(?:[₹%&$#Rs\.INR]+\s*)?(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)/g;

/**
 * From OCR full text, extract balances for known 4-digit account suffixes.
 *
 * Paytm screenshot format (from real OCR output):
 *   Line N:   "Indian Bank-2496 >"       or  "Indian Bank-2496"
 *   Line N+1: "%43,395.97"               or  "Check balance"
 *
 * Strategy:
 * 1. Split text into lines.
 * 2. For each line check if it contains any known 4-digit suffix (e.g. "-2496").
 * 3. Look at that line AND next 2 lines for a valid currency amount.
 * 4. Skip lines that literally say "check balance" — no amount available.
 */
export function parseBalancesFromOcrText(fullText) {
    const lines = fullText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

    const results = [];
    const foundSuffixes = new Set();

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const suffix of Object.keys(ACCOUNT_SUFFIX_MAP)) {
            if (foundSuffixes.has(suffix)) continue;

            // Match suffix: covers formats like "-2496", "xx2496", " 2496", "(2496)"
            const suffixPattern = new RegExp(`[-\\s(xx]${suffix}(?:[\\s>)\\|]|$)`, 'i');
            // Also try bare suffix match as fallback
            const bareSuffixPattern = new RegExp(`\\b${suffix}\\b`);
            if (!suffixPattern.test(line) && !bareSuffixPattern.test(line)) continue;

            // Skip the suffix line itself — amount is always on the next line(s) in Paytm
            const window = lines.slice(i + 1, Math.min(i + 4, lines.length));

            let bestAmount = null;
            for (const wLine of window) {
                // Skip "check balance" lines — no amount to read
                if (/check\s*balance/i.test(wLine)) continue;

                const amountMatches = [...wLine.matchAll(AMOUNT_REGEX)];
                for (const m of amountMatches) {
                    // Remove commas and parse
                    const cleaned = m[1].replace(/,/g, '');
                    const val = parseFloat(cleaned);
                    // Must be a meaningful balance (> 10) and not just the suffix itself
                    if (!isNaN(val) && val > 10 && !wLine.replace(/[^0-9]/g, '').startsWith(suffix)) {
                        bestAmount = val;
                        break;
                    }
                }
                if (bestAmount !== null) break;
            }

            if (bestAmount !== null) {
                results.push({
                    suffix,
                    bankName: ACCOUNT_SUFFIX_MAP[suffix],
                    amount: bestAmount,
                    rawLine: line
                });
                foundSuffixes.add(suffix);
            }
        }
    }

    return results;
}

/**
 * Run Tesseract OCR on an image File/Blob and return parsed bank balances.
 * @param {File} imageFile - The image selected by the user
 * @param {(progress: number, status: string) => void} onProgress - Progress callback (0–100)
 * @returns {Promise<Array<{suffix, bankName, amount, rawLine}>>}
 */
export async function scanImageForBalances(imageFile, onProgress) {
    onProgress?.(0, 'Loading OCR engine...');

    const worker = await createWorker('eng', 1, {
        logger: (m) => {
            if (m.status === 'recognizing text') {
                onProgress?.(Math.round((m.progress || 0) * 90), 'Scanning image...');
            }
        }
    });

    try {
        onProgress?.(5, 'Reading image...');
        const imageUrl = URL.createObjectURL(imageFile);
        const { data: { text } } = await worker.recognize(imageUrl);
        URL.revokeObjectURL(imageUrl);

        onProgress?.(95, 'Parsing balances...');
        const balances = parseBalancesFromOcrText(text);

        onProgress?.(100, 'Done');
        return { balances, rawText: text };
    } finally {
        await worker.terminate();
    }
}
