import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { auth, db } from '../firebase';

const PasswordField = ({ label, value, onChange, show, onToggle, minLength = 6, required = true }) => {
    return (
        <div>
            <label className="label">{label}</label>
            <div className="relative">
                <input
                    className="input pr-12"
                    type={show ? 'text' : 'password'}
                    required={required}
                    minLength={minLength}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                />
                <button
                    type="button"
                    className="absolute inset-y-0 right-2 my-auto h-8 rounded px-2 text-slate-600 hover:bg-slate-100"
                    onClick={onToggle}
                    aria-label={show ? 'Hide password' : 'Show password'}
                >
                    {show ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                </button>
            </div>
        </div>
    );
};

const LoginPage = () => {
    const [mode, setMode] = useState('login');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    const [registerName, setRegisterName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPhone, setRegisterPhone] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

    const handleLogin = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
        } catch (submitError) {
            setError(submitError.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (event) => {
        event.preventDefault();
        setError('');

        const trimmedName = registerName.trim();
        const trimmedEmail = registerEmail.trim();
        const trimmedPhone = registerPhone.trim();

        if (!trimmedName) {
            setError('Name is required');
            return;
        }

        if (!trimmedPhone) {
            setError('Phone number is required');
            return;
        }

        if (registerPassword !== registerConfirmPassword) {
            setError('Password and confirm password do not match');
            return;
        }

        setLoading(true);

        try {
            const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, registerPassword);

            await updateProfile(credential.user, {
                displayName: trimmedName
            });

            await setDoc(
                doc(db, 'users', credential.user.uid),
                {
                    uid: credential.user.uid,
                    name: trimmedName,
                    email: trimmedEmail,
                    phoneNumber: trimmedPhone,
                    createdAt: serverTimestamp()
                },
                { merge: true }
            );
        } catch (submitError) {
            setError(submitError.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const isLoginMode = mode === 'login';

    return (
        <div className="mx-auto flex min-h-screen max-w-md items-center px-4 text-slate-900">
            <div
                className={`w-full rounded-2xl border p-6 shadow ${isLoginMode ? 'border-blue-200 bg-white' : 'border-emerald-200 bg-emerald-50/30'}`}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="brand-title text-3xl text-brand">A1 Maligai - Accounts</h1>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                    <button
                        type="button"
                        className={`rounded-lg py-2 text-sm font-semibold ${isLoginMode ? 'bg-white text-brand shadow' : 'text-slate-600'}`}
                        onClick={() => {
                            setMode('login');
                            setError('');
                        }}
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        className={`rounded-lg py-2 text-sm font-semibold ${!isLoginMode ? 'bg-white text-emerald-700 shadow' : 'text-slate-600'}`}
                        onClick={() => {
                            setMode('register');
                            setError('');
                        }}
                    >
                        New User
                    </button>
                </div>

                {isLoginMode ? (
                    <>
                        <p className="mt-1 text-sm text-slate-600">Login to sync data across devices.</p>

                        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                            <div>
                                <label className="label">Email</label>
                                <input
                                    className="input"
                                    type="email"
                                    required
                                    value={loginEmail}
                                    onChange={(event) => setLoginEmail(event.target.value)}
                                />
                            </div>

                            <PasswordField
                                label="Password"
                                value={loginPassword}
                                onChange={setLoginPassword}
                                show={showLoginPassword}
                                onToggle={() => setShowLoginPassword((prev) => !prev)}
                            />

                            {error ? <p className="text-sm text-red-600">{error}</p> : null}

                            <button type="submit" className="btn-primary w-full" disabled={loading}>
                                {loading ? 'Please wait...' : 'Login'}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <p className="mt-1 text-sm text-emerald-700">Create a new user account.</p>

                        <form className="mt-6 space-y-4" onSubmit={handleRegister}>
                            <div>
                                <label className="label">Name</label>
                                <input
                                    className="input"
                                    type="text"
                                    required
                                    value={registerName}
                                    onChange={(event) => setRegisterName(event.target.value)}
                                />
                            </div>

                            <div>
                                <label className="label">Email</label>
                                <input
                                    className="input"
                                    type="email"
                                    required
                                    value={registerEmail}
                                    onChange={(event) => setRegisterEmail(event.target.value)}
                                />
                            </div>

                            <PasswordField
                                label="Password"
                                value={registerPassword}
                                onChange={setRegisterPassword}
                                show={showRegisterPassword}
                                onToggle={() => setShowRegisterPassword((prev) => !prev)}
                            />

                            <PasswordField
                                label="Confirm Password"
                                value={registerConfirmPassword}
                                onChange={setRegisterConfirmPassword}
                                show={showRegisterConfirmPassword}
                                onToggle={() => setShowRegisterConfirmPassword((prev) => !prev)}
                            />

                            <div>
                                <label className="label">Phone Number</label>
                                <input
                                    className="input"
                                    type="tel"
                                    required
                                    value={registerPhone}
                                    onChange={(event) => setRegisterPhone(event.target.value)}
                                    placeholder="10-digit number"
                                />
                            </div>

                            {error ? <p className="text-sm text-red-600">{error}</p> : null}

                            <button
                                type="submit"
                                className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={loading}
                            >
                                {loading ? 'Please wait...' : 'Create Account'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
