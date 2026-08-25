// export const toNumber = (value) => {
//     const parsed = Number(value);
//     return Number.isFinite(parsed) ? parsed : 0;
// };

// export const formatINR = (value) =>
//     new Intl.NumberFormat('en-IN', {
//         style: 'currency',
//         currency: 'INR',
//         maximumFractionDigits: 2
//     }).format(toNumber(value));

// export const todayDateString = () => new Date().toISOString().slice(0, 10);

export const toNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const cleanValue = String(value).replace(/,/g, '');
    const parsed = Number(cleanValue);
    // Force the parsed number to drop decimals (paise) entirely
    return Number.isFinite(parsed) ? Math.floor(parsed) : 0;
};

// Helper to extract only the whole number
export const toWholeNumber = (value) => {
    return Math.floor(toNumber(value));
};

export const formatINR = (value) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0, // Hides .00
        maximumFractionDigits: 0  // Drops any scanned paise
    }).format(toNumber(value));

export const todayDateString = () => new Date().toISOString().slice(0, 10);