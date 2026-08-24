import { onAuthStateChanged } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../firebase';

const AuthContext = createContext({ user: null, loading: true });

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
            setUser(nextUser);
            setLoading(false);
            // Sync updated auth email to Firestore document
            if (nextUser?.uid && nextUser?.email) {
                try {
                    await updateDoc(doc(db, 'users', nextUser.uid), {
                        email: nextUser.email
                    });
                } catch {
                    // Ignore non-critical sync errors on startup
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const value = useMemo(() => ({ user, loading }), [user, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
