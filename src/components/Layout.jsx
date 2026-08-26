// import { Link, NavLink } from 'react-router-dom';

// const navClass = ({ isActive }) =>
//     `rounded-lg px-3 py-2 text-sm font-semibold tracking-tight ${isActive ? 'bg-blue-100 text-brand' : 'text-slate-600 hover:bg-slate-100'}`;

// const Layout = ({ children }) => {
//     return (
//         <div className="mx-auto min-h-screen max-w-4xl px-4 pb-24 pt-4 font-sans text-slate-900">
//             <header className="mb-4 rounded-xl bg-gradient-to-r from-brand to-blue-700 p-4 text-white shadow-lg">
//                 <div className="flex items-center gap-3">
//                     <img src="/a1_logo.png" alt="A1 Logo" className="h-9 w-9 rounded-lg bg-white p-1.5 object-contain shadow-sm" />
//                     <Link to="/" className="brand-title text-2xl leading-none sm:text-3xl">
//                         A1 Maligai - Accounts
//                     </Link>
//                 </div>
//             </header>

//             <nav className="mb-4 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
//                 <NavLink to="/" className={navClass} end>
//                     Home
//                 </NavLink>
//                 <NavLink to="/entry" className={navClass}>
//                     Daily Entry
//                 </NavLink>
//                 <NavLink to="/history" className={navClass}>
//                     History
//                 </NavLink>
//                 <NavLink to="/monthly-summary" className={navClass}>
//                     Monthly Summary
//                 </NavLink>
//             </nav>

//             {children}
//         </div>
//     );
// };

// export default Layout;


import { signOut } from 'firebase/auth';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { auth } from '../firebase';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/useTheme';
import ChangeEmailModal from './ChangeEmailModal';

const navClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold tracking-tight transition-colors ${isActive
        ? 'bg-blue-100 text-brand dark:bg-brand/20 dark:text-blue-300'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`;

const Layout = ({ children }) => {
    const { user } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

    return (
        <div className="mx-auto min-h-screen max-w-4xl px-4 pb-24 pt-4 font-sans text-slate-900">
            <header className="mb-4 rounded-xl bg-gradient-to-r from-brand to-blue-700 p-4 text-white shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <img
                            src="/a1_logo.png"
                            alt="A1 Logo"
                            className="h-9 w-9 rounded-lg bg-white p-1.5 object-contain shadow-sm"
                        />
                        <Link to="/" className="brand-title text-2xl leading-none sm:text-3xl">
                            A1 Maligai - Accounts
                        </Link>
                    </div>

                    {user && (
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="text-right">
                                <p className="text-xs text-blue-100">{user.email}</p>
                                <p className="text-sm font-bold text-white capitalize">{displayName}</p>
                            </div>

                            {/* Dark Mode Toggle Switch */}
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="flex items-center justify-center rounded-lg bg-white/15 p-2 text-white transition hover:bg-white/25 active:scale-95"
                                title="Toggle Theme"
                            >
                                {isDark ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>
                            {/* Change Email Button */}
                            <button
                                type="button"
                                onClick={() => setIsEmailModalOpen(true)}
                                className="flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25 active:scale-95"
                                title="Change Email"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                <span>Edit Email</span>
                            </button>

                            {/* Logout Button */}
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25 active:scale-95"
                                title="Sign out"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                    />
                                </svg>
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <nav className="mb-4 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                <NavLink to="/" className={navClass} end>
                    Home
                </NavLink>
                <NavLink to="/entry" className={navClass}>
                    Daily Entry
                </NavLink>
                <NavLink to="/history" className={navClass}>
                    History
                </NavLink>
                <NavLink to="/monthly-summary" className={navClass}>
                    Monthly Summary
                </NavLink>
                <NavLink to="/summary" className={navClass}>
                    Summary
                </NavLink>
            </nav>

            <ChangeEmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
            />

            {children}
        </div>
    );
};

export default Layout;