import Link from 'next/link';

const features = [
  {
    number: '01',
    title: 'Find Your Tutor',
    desc: 'Search by subject, availability, or rating. Every tutor is a verified NUST senior.',
  },
  {
    number: '02',
    title: 'Book a Session',
    desc: 'Calendar-integrated booking with instant confirmation. No more back-and-forth on WhatsApp.',
  },
  {
    number: '03',
    title: 'Learn & Review',
    desc: 'Attend your session, then rate your tutor. Quality is maintained through transparent feedback.',
  },
];

const stats = [
  { value: '200+', label: 'Active Tutors' },
  { value: '15+', label: 'Subjects Covered' },
  { value: '4.8★', label: 'Average Rating' },
  { value: '500+', label: 'Sessions Booked' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}>
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-paper)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Peer<span style={{ color: 'var(--color-gold)' }}>Tutor</span>
            </span>
            <span className="hidden sm:block text-xs px-2 py-0.5 rounded-full border font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
              NUST
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded transition-colors"
              style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-80)' }}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium px-5 py-2.5 rounded-md transition-all"
              style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)', fontFamily: 'var(--font-sans)' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="flex-1 relative overflow-hidden">
        {/* Decorative rule */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ backgroundColor: 'var(--color-border)' }} />

        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-16 lg:pt-28 lg:pb-24">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left: Headline */}
            <div className="lg:col-span-7" style={{ animation: 'fade-up 0.6s ease both' }}>
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border text-xs font-medium tracking-widest uppercase" style={{ borderColor: 'var(--color-gold)', color: 'var(--color-gold)', fontFamily: 'var(--font-sans)', backgroundColor: 'var(--color-gold-pale)' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: 'var(--color-gold)' }} />
                Spring 2026 — SEECS, NUST
              </div>
              <h1
                className="text-5xl lg:text-7xl font-bold leading-none tracking-tight mb-6"
                style={{ fontFamily: 'var(--font-display)', lineHeight: '1.05' }}
              >
                Academic help,{' '}
                <span className="italic" style={{ color: 'var(--color-gold)' }}>
                  from those who&apos;ve
                </span>{' '}
                been there.
              </h1>
              <p
                className="text-lg leading-relaxed mb-10 max-w-lg"
                style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}
              >
                PeerTutor connects NUST students with qualified senior peers for affordable,
                structured academic support. No more struggling alone or paying for expensive external tutors.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-md text-base font-semibold transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)', fontFamily: 'var(--font-sans)' }}
                >
                  Find a Tutor
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link
                  href="/register?role=tutor"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-md text-base font-semibold border transition-all hover:bg-white"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}
                >
                  Become a Tutor
                </Link>
              </div>
            </div>

            {/* Right: Decorative card stack */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end" style={{ animation: 'fade-up 0.7s ease 0.1s both' }}>
              <div className="relative w-full max-w-sm">
                {/* Background card */}
                <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border" style={{ backgroundColor: 'var(--color-gold-pale)', borderColor: 'var(--color-gold-light)' }} />
                {/* Main card */}
                <div className="relative rounded-2xl border p-8 shadow-lg" style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--color-gold-pale)', color: 'var(--color-gold)', fontFamily: 'var(--font-sans)' }}>
                      AM
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink)' }}>Ahmad Malik</p>
                      <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>CS Senior · Tutor</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      <span className="text-yellow-500 text-sm">★</span>
                      <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-sans)' }}>4.9</span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-5">
                    {['Data Structures', 'Algorithms', 'OOP'].map((s) => (
                      <span key={s} className="inline-block mr-2 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink-80)', fontFamily: 'var(--font-sans)', border: '1px solid var(--color-border)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Hourly Rate</p>
                      <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Rs. 500</p>
                    </div>
                    <Link
                      href="/register"
                      className="px-5 py-2.5 rounded-lg text-sm font-semibold"
                      style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-canvas)', fontFamily: 'var(--font-sans)' }}
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-t border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
                  {s.value}
                </p>
                <p className="text-sm" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 lg:py-28" style={{ backgroundColor: 'var(--color-paper)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-sans)' }}>
              How It Works
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
              Three steps to better grades.
            </h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.number} className="group p-8 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-md" style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}>
                <p className="text-6xl font-bold mb-6 tabular-nums" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold-light)' }}>
                  {f.number}
                </p>
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
                  {f.title}
                </h3>
                <p className="leading-relaxed" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-50)' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center">
          <h2 className="text-4xl lg:text-6xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-canvas)' }}>
            Ready to get started?
          </h2>
          <p className="text-lg mb-10 max-w-md mx-auto" style={{ fontFamily: 'var(--font-sans)', color: '#a8a8b0' }}>
            Join hundreds of NUST students already learning smarter.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 rounded-md text-base font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}
            >
              Create Your Account
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-md text-base font-semibold border transition-all"
              style={{ borderColor: '#3a3a45', color: 'var(--color-paper)', fontFamily: 'var(--font-sans)' }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-8" style={{ borderColor: '#1f1f28', backgroundColor: 'var(--color-ink)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm" style={{ fontFamily: 'var(--font-sans)', color: '#6b6b7a' }}>
            © 2026 PeerTutor · SEECS, NUST · Software Engineering SE-26
          </p>
          <p className="text-sm" style={{ fontFamily: 'var(--font-sans)', color: '#6b6b7a' }}>
            Built by Team 7
          </p>
        </div>
      </footer>
    </div>
  );
}
