import { EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail } from 'firebase/auth';
import { useState } from 'react';
import { auth } from '../firebase';
import { useAuth } from '../lib/AuthContext';

const ChangeEmailModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [linkSent, setLinkSent] = useState(false);

    if (!isOpen) return null;

    const handleSendVerification = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const targetEmail = newEmail.trim();

        if (!targetEmail || targetEmail.toLowerCase() === user?.email?.toLowerCase()) {
            setError('Please enter a different valid email address.');
            setLoading(false);
            return;
        }

        try {
            // 1. Re-authenticate user
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);

            // 2. Trigger Firebase email change verification flow
            await verifyBeforeUpdateEmail(auth.currentUser, targetEmail);

            setLinkSent(true);
        } catch (err) {
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Incorrect current password.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('This email is already associated with another account.');
            } else if (err.code === 'auth/requires-recent-login') {
                setError('Session expired. Please log out and log back in before updating.');
            } else {
                setError(err.message || 'Failed to send verification email.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setLinkSent(false);
        setNewEmail('');
        setCurrentPassword('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Change Email Address</h3>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        ✕
                    </button>
                </div>

                {linkSent ? (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
                            <p className="font-semibold text-sm">Confirmation Link Sent</p>
                            <p className="mt-1 text-xs leading-relaxed text-blue-700">
                                A verification email has been sent to <strong>{newEmail}</strong>. Click the link in that email to finalize the update.
                            </p>
                        </div>
                        <button type="button" onClick={handleClose} className="btn-primary w-full">
                            Close
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSendVerification} className="space-y-4">
                        <div>
                            <label className="label">Current Email</label>
                            <input
                                type="text"
                                disabled
                                value={user?.email || ''}
                                className="input bg-slate-100 text-slate-500 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="label">New Email Address</label>
                            <input
                                type="email"
                                required
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="label">Current Password</label>
                            <input
                                type="password"
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                className="input"
                            />
                        </div>

                        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

                        <div className="flex gap-2 pt-2">
                            <button type="submit" disabled={loading} className="btn-primary flex-1">
                                {loading ? 'Sending link...' : 'Send Verification'}
                            </button>
                            <button type="button" onClick={handleClose} disabled={loading} className="btn-light flex-1">
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ChangeEmailModal;