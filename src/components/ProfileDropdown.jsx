import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { useAuth } from '../lib/AuthContext';

const ProfileDropdown = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.uid) return;
            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProfile(docSnap.data());
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };
        fetchProfile();
    }, [user?.uid]);

    const handleSignOut = async () => {
        await signOut(auth);
        navigate('/login');
    };

    const displayName = profile?.name || user?.displayName || 'User';
    const email = user?.email || '';
    const phone = profile?.phone || profile?.phoneNumber || user?.phoneNumber || '';

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1.5 text-sm text-white hover:bg-white/25"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">{displayName}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
                        <div className="mb-3 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white font-semibold">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-900 truncate">{displayName}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-slate-600 break-all">{email}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span className="text-slate-600">{phone || 'Not provided'}</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleSignOut}
                            className="mt-3 w-full rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                        >
                            Logout
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProfileDropdown;
