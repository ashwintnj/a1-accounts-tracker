/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Aptos', 'Segoe UI Variable', 'Segoe UI', 'Inter', 'system-ui', 'sans-serif']
            },
            colors: {
                brand: '#1e40af',
            }
        }
    },
    plugins: []
};
