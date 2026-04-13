'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import TurnstileWidget from '@/components/TurnstileWidget';

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        // If Turnstile is configured and token not yet received, block
        if (siteKey && !turnstileToken) {
            setError('Please complete the human verification.');
            return;
        }
        setLoading(true);
        try {
            await login(email, password, turnstileToken);
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
                <h1>Welcome Back</h1>
                <p className="auth-subtitle">Sign in to continue reading</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="off"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="off"
                            required
                        />
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
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    Don't have an account? <Link href="/register">Sign Up</Link>
                </div>
            </div>
        </div>
    );
}
