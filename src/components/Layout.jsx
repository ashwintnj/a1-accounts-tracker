import { signOut } from 'firebase/auth';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { useAuth } from '../lib/AuthContext';

const navClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-blue-100 text-brand' : 'text-slate-600 hover:bg-slate-100'}`;

const Layout = ({ children }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut(auth);
        navigate('/login');
    };

    return (
        <div className="mx-auto min-h-screen max-w-4xl px-4 pb-24 pt-4 text-slate-900">
            <header className="mb-4 rounded-xl bg-brand p-4 text-white shadow">
                <div className="flex items-center justify-between gap-3">
                    <Link to="/" className="text-lg font-semibold">
                        A1 Shop Accounts
                    </Link>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={handleSignOut} className="btn bg-white/15 text-white hover:bg-white/25">
                            Logout
                        </button>
                    </div>
                </div>
                <p className="mt-1 text-xs text-blue-100">{user?.email}</p>
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
            </nav>

            {children}
        </div>
    );
};

export default Layout;
