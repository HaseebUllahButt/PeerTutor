'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

type Role = 'student' | 'tutor';

const roleIcons: Record<string, React.ReactElement> = {
  student: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
      <path d="M11 3L2 7.5L11 12L20 7.5L11 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M5 9.5V15C5 15 7.5 18 11 18C14.5 18 17 15 17 15V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 7.5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  tutor: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 19C3 16 6.6 14 11 14C15.4 14 19 16 19 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M15 5L16.5 6.5L19 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const roles: { id: Role; title: string; desc: string }[] = [
  {
    id: 'student',
    title: 'Student',
    desc: 'I want to find tutors and book sessions.',
  },
  {
    id: 'tutor',
    title: 'Tutor',
    desc: "I'm a senior student and want to teach.",
  },
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Pre-select role from URL (?role=tutor)
  useEffect(() => {
    const urlRole = searchParams.get('role');
    if (urlRole === 'tutor') setRole('tutor');
  }, [searchParams]);

  function handleRoleNext(e: FormEvent) {
    e.preventDefault();
    setStep(2);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Registration failed. Please try again.');
      } else {
        // Auto-login after registration
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (loginRes.ok) {
          router.push('/dashboard');
          router.refresh();
        } else {
          router.push('/login');
        }
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* Left Panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[40%] p-14 relative overflow-hidden"
        style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}
      >
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: 'var(--color-gold)' }} />
        <div className="absolute top-10 -right-20 w-64 h-64 rounded-full opacity-5" style={{ backgroundColor: 'var(--color-gold)' }} />

        <Link href="/" className="text-2xl font-bold relative z-10" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-canvas)' }}>
          Peer<span style={{ color: 'var(--color-gold)' }}>Tutor</span>
        </Link>

        <div className="relative z-10" style={{ animation: 'fade-up 0.6s ease both' }}>
          <p className="text-5xl font-bold leading-tight mb-8 italic" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-canvas)' }}>
            {role === 'tutor' ? (
              <>&ldquo;Share what you know. Help someone through what you once survived.&rdquo;</>
            ) : (
              <>&ldquo;The fastest way to learn is alongside someone who&apos;s already figured it out.&rdquo;</>
            )}
          </p>
          <p className="text-sm" style={{ fontFamily: 'var(--font-sans)', color: '#8888a0' }}>
            — PeerTutor · SEECS, NUST
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 relative z-10">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  backgroundColor: step >= s ? 'var(--color-gold)' : '#2a2b2e',
                  color: step >= s ? 'var(--color-ink)' : '#6b6b7a',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {s}
              </div>
              <span className="text-xs hidden sm:block" style={{ color: step >= s ? 'var(--color-canvas)' : '#6b6b7a', fontFamily: 'var(--font-sans)' }}>
                {s === 1 ? 'Choose Role' : 'Your Details'}
              </span>
              {s < 2 && <div className="w-6 h-px mx-1" style={{ backgroundColor: step > s ? 'var(--color-gold)' : '#2a2b2e' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md" style={{ animation: 'fade-up 0.5s ease both' }}>
          <Link href="/" className="lg:hidden block mb-8 text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
            Peer<span style={{ color: 'var(--color-gold)' }}>Tutor</span>
          </Link>

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <form onSubmit={handleRoleNext}>
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
                  Join PeerTutor.
                </h1>
                <p className="text-base" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>
                  First, tell us who you are.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    id={`role-${r.id}`}
                    onClick={() => setRole(r.id)}
                    className="w-full p-5 rounded-xl border-2 text-left transition-all hover:shadow-sm"
                    style={{
                      borderColor: role === r.id ? 'var(--color-gold)' : 'var(--color-border)',
                      backgroundColor: role === r.id ? 'var(--color-gold-pale)' : 'var(--color-canvas)',
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: role === r.id ? 'rgba(181,136,58,0.15)' : 'var(--color-paper)', color: role === r.id ? 'var(--color-gold)' : 'var(--color-ink-50)' }}>{roleIcons[r.id]}</span>
                      <div className="flex-1">
                        <p className="font-bold text-base mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
                          {r.title}
                        </p>
                        <p className="text-sm" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>
                          {r.desc}
                        </p>
                      </div>
                      <div
                        className="w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0"
                        style={{
                          borderColor: role === r.id ? 'var(--color-gold)' : 'var(--color-border)',
                          backgroundColor: role === r.id ? 'var(--color-gold)' : 'transparent',
                        }}
                      >
                        {role === r.id && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                id="role-next"
                type="submit"
                className="w-full py-3.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-canvas)', fontFamily: 'var(--font-sans)' }}
              >
                Continue as {role === 'student' ? 'Student' : 'Tutor'} →
              </button>

              <p className="mt-6 text-center text-sm" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>
                Already have an account?{' '}
                <Link href="/login" className="font-semibold" style={{ color: 'var(--color-gold)' }}>
                  Sign In
                </Link>
              </p>
            </form>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 text-sm mb-4 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}
                >
                  ← Back
                </button>
                <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
                  Your details.
                </h1>
                <p className="text-base" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>
                  Creating a{' '}
                  <span className="font-semibold" style={{ color: 'var(--color-gold)' }}>
                    {role}
                  </span>{' '}
                  account.
                </p>
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-lg text-sm flex items-start gap-2 border" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: 'var(--color-danger)', fontFamily: 'var(--font-sans)' }}>
                  <span className="mt-0.5">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="reg-name" className="block text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-80)' }}>
                    Full Name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Muhammad Ahmad"
                    className="w-full px-4 py-3 rounded-lg border text-sm transition-all"
                    style={{ fontFamily: 'var(--font-sans)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)', outline: 'none' }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--color-gold)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-80)' }}>
                    Email Address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@nust.edu.pk"
                    className="w-full px-4 py-3 rounded-lg border text-sm transition-all"
                    style={{ fontFamily: 'var(--font-sans)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)', outline: 'none' }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--color-gold)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-80)' }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPass ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-4 py-3 rounded-lg border text-sm pr-12 transition-all"
                      style={{ fontFamily: 'var(--font-sans)', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)', color: 'var(--color-ink)', outline: 'none' }}
                      onFocus={(e) => (e.target.style.borderColor = 'var(--color-gold)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium px-2 py-1 rounded" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }} aria-label="Toggle password visibility">
                      {showPass ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  {password.length > 0 && (
                    <div className="mt-1.5 flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all"
                          style={{
                            backgroundColor:
                              password.length >= i * 3
                                ? i <= 2
                                  ? '#e67e22'
                                  : 'var(--color-emerald)'
                                : 'var(--color-border)',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="reg-confirm" className="block text-sm font-semibold mb-1.5" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-80)' }}>
                    Confirm Password
                  </label>
                  <input
                    id="reg-confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-4 py-3 rounded-lg border text-sm transition-all"
                    style={{
                      fontFamily: 'var(--font-sans)',
                      borderColor: confirm && confirm !== password ? 'var(--color-danger)' : 'var(--color-border)',
                      backgroundColor: 'var(--color-canvas)',
                      color: 'var(--color-ink)',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = confirm !== password ? 'var(--color-danger)' : 'var(--color-gold)')}
                    onBlur={(e) => (e.target.style.borderColor = confirm && confirm !== password ? 'var(--color-danger)' : 'var(--color-border)')}
                  />
                  {confirm && confirm !== password && (
                    <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-sans)' }}>
                      Passwords do not match
                    </p>
                  )}
                </div>

                <button
                  id="register-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-canvas)', fontFamily: 'var(--font-sans)' }}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>

                <p className="text-center text-xs mt-2" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>
                  By creating an account, you agree to our Terms & Privacy Policy.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: 'var(--color-paper)' }} />}>
      <RegisterForm />
    </Suspense>
  );
}
