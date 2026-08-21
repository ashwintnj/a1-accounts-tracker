import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { auth } from '../firebase';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isRegisterMode) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (submitError) {
            setError(submitError.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
            <div className="w-full rounded-2xl bg-white p-6 shadow border border-slate-200">
                <h1 className="text-2xl font-semibold text-brand">A1 Shop Accounts</h1>
                <p className="mt-1 text-sm text-slate-600">Login to sync data across devices.</p>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="label">Email</label>
                        <input
                            className="input"
                            type="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    </div>

                    <div>
                        <label className="label">Password</label>
                        <input
                            className="input"
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </div>

                    {error ? <p className="text-sm text-red-600">{error}</p> : null}

                    <button type="submit" className="btn-primary w-full" disabled={loading}>
                        {loading ? 'Please wait...' : isRegisterMode ? 'Create Account' : 'Login'}
                    </button>
                </form>

                <button
                    type="button"
                    className="mt-3 text-sm text-brand underline"
                    onClick={() => setIsRegisterMode((prev) => !prev)}
                >
                    {isRegisterMode ? 'Already have account? Login' : 'First time? Create account'}
                </button>
            </div>
        </div>
    );
};

export default LoginPage;
