'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '@/features/dashboard/components/DashboardShell';
import { JWTPayload } from '@/lib/auth';

const navItems = [
  { label: 'Schedule',    href: '/dashboard',          icon: '' },
  { label: 'My Students', href: '/dashboard/students', icon: '' },
  { label: 'Requests',    href: '/dashboard/requests', icon: '' },
  { label: 'Messages',    href: '/dashboard/messages', icon: '' },
  { label: 'Earnings',    href: '/dashboard/earnings', icon: '' },
  { label: 'Profile',     href: '/dashboard/profile',  icon: '' },
];

export default function StudentsClient({ user }: { user: JWTPayload }) {
  const [sessions, setSessions] = useState<Array<{
    status: string;
    scheduledAt: string;
    student?: { _id?: string; name?: string } | string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => { if (d.sessions) setSessions(d.sessions); setLoading(false); });
  }, []);

  // Deduplicate students from accepted sessions
  const studentMap = new Map<string, { name: string; sessionsCount: number; lastSession: string }>();
  sessions.filter(s => s.status === 'accepted').forEach(s => {
    const student = s.student;
    const id = typeof student === 'object' ? student?._id : student;
    const name = typeof student === 'object' ? student?.name : 'Student';
    
    if (!id) return;
    if (studentMap.has(id)) {
      studentMap.get(id)!.sessionsCount++;
    } else {
      studentMap.set(id, { name: name ?? 'Student', sessionsCount: 1, lastSession: s.scheduledAt });
    }
  });
  const students = Array.from(studentMap.entries());

  return (
    <DashboardShell user={user} navItems={navItems}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>My Students</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Students you have active or completed sessions with</p>
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)' }}>
          {loading ? (
            <div className="p-10 text-center text-sm" style={{ color: 'var(--color-ink-50)' }}>Loading...</div>
          ) : students.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-3xl mb-3">🎓</p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>No students yet. Accept a session request to get started.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {students.map(([id, s]) => (
                <div key={id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)', border: '1px solid var(--color-border)' }}>
                    {s.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>{s.name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>{s.sessionsCount} session{s.sessionsCount !== 1 ? 's' : ''}</p>
                  </div>
                  <p className="text-xs flex-shrink-0" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    Last: {new Date(s.lastSession).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
