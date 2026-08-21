import { useEffect, useState } from 'react';

const THEME_KEY = 'a1-theme';

const getInitialTheme = () => {
    if (typeof window === 'undefined') {
        return 'light';
    }

    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
        return saved;
    }

    return 'light';
};

export const useTheme = () => {
    const [theme, setTheme] = useState(getInitialTheme);
    const isDark = theme === 'dark';

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem(THEME_KEY, theme);
    }, [isDark, theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    return {
        theme,
        isDark,
        setTheme,
        toggleTheme
    };
};
