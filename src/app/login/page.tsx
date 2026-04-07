'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed. Please try again.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* Left Panel — Brand */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-14 relative overflow-hidden"
        style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}
      >
        {/* Decorative circle */}
        <div
          className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-10"
          style={{ backgroundColor: 'var(--color-gold)' }}
        />
        <div
          className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-5"
          style={{ backgroundColor: 'var(--color-gold)' }}
        />

        {/* Logo */}
        <div>
          <Link href="/" className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-canvas)' }}>
            Peer<span style={{ color: 'var(--color-gold)' }}>Tutor</span>
          </Link>
        </div>

        {/* Quote */}
        <div className="relative z-10" style={{ animation: 'fade-up 0.6s ease both' }}>
          <p
            className="text-5xl font-bold leading-tight mb-8 italic"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-canvas)' }}
          >
            &ldquo;The best tutors are those who remember the struggle.&rdquo;
          </p>
          <p className="text-sm" style={{ fontFamily: 'var(--font-sans)', color: '#8888a0' }}>
            — PeerTutor · SEECS, NUST
          </p>
        </div>

        {/* Bottom stat */}
        <div className="flex gap-10">
          {['500+ Sessions', '200+ Tutors', '4.8★ Rating'].map((s) => (
            <div key={s}>
              <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-canvas)' }}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md" style={{ animation: 'fade-up 0.5s ease both' }}>
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden block mb-8 text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
            Peer<span style={{ color: 'var(--color-gold)' }}>Tutor</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
              Welcome back.
            </h1>
            <p className="text-base" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>
              Sign in to your PeerTutor account.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-lg text-sm flex items-start gap-2 border"
              style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: 'var(--color-danger)', fontFamily: 'var(--font-sans)' }}
            >
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-semibold mb-1.5"
                style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-80)' }}
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@nust.edu.pk"
                className="w-full px-4 py-3 rounded-lg border text-sm transition-all"
                style={{
                  fontFamily: 'var(--font-sans)',
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-canvas)',
                  color: 'var(--color-ink)',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-gold)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-semibold"
                  style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-80)' }}
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-sans)' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border text-sm transition-all pr-12"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-canvas)',
                    color: 'var(--color-ink)',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-gold)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium px-2 py-1 rounded"
                  style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}
                  aria-label="Toggle password visibility"
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--color-ink)',
                color: 'var(--color-canvas)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
            <span className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>New here?</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
          </div>

          <Link
            href="/register"
            className="flex items-center justify-center w-full py-3.5 rounded-lg text-sm font-semibold border transition-all hover:bg-white"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
