'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import TurnstileWidget from '@/components/TurnstileWidget';

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState('');
    const [siteKey, setSiteKey] = useState('');

    useEffect(() => {
        fetch('/api/settings')
            .then(r => r.json())
            .then(data => {
                if (data.settings?.turnstile_site_key) {
                    setSiteKey(data.settings.turnstile_site_key);
                }
            })
            .catch(() => {});
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (siteKey && !turnstileToken) {
            setError('Please complete the human verification.');
            return;
        }

        setLoading(true);
        try {
            await register(username, email, password, turnstileToken);
            router.push('/');
        } catch (err) {
            setError(err.message);
            // Reset turnstile on failure
            if (siteKey && window.turnstile) {
                try { window.turnstile.reset(); } catch {}
            }
            setTurnstileToken('');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card fade-in">
                <h1>Create Account</h1>
                <p className="auth-subtitle">Join YomiTranslate — read manga in any language</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="your_username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            minLength={3}
                            autoComplete="off"
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="off"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Minimum 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                        {password.length > 0 && (
                            <div style={{ fontSize: '0.72rem', marginTop: 4, color: password.length >= 6 ? '#48bb78' : '#e53e3e' }}>
                                {password.length < 6 ? `${6 - password.length} more characters needed` : '✓ Password length OK'}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                        {confirmPassword.length > 0 && password !== confirmPassword && (
                            <div style={{ fontSize: '0.72rem', marginTop: 4, color: '#e53e3e' }}>Passwords do not match</div>
                        )}
                    </div>

                    {siteKey && (
                        <TurnstileWidget
                            siteKey={siteKey}
                            onVerify={(token) => setTurnstileToken(token || '')}
                            onError={() => setError('Turnstile verification error. Please refresh.')}
                        />
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: 8 }}
                        disabled={loading || (siteKey && !turnstileToken)}
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
                    By creating an account, you agree to our{' '}
                    <Link href="/terms" style={{ color: 'var(--accent-light)' }}>Terms & Conditions</Link>{' '}
                    and{' '}
                    <Link href="/privacy" style={{ color: 'var(--accent-light)' }}>Privacy Policy</Link>.
                </p>

                <div className="auth-footer">
                    Already have an account? <Link href="/login">Sign In</Link>
                </div>
            </div>
        </div>
    );
}
