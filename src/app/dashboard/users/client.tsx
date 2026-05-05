'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardShell from '@/features/dashboard/components/DashboardShell';
import { JWTPayload } from '@/lib/auth';

const navItems = [
  { label: 'Overview',          href: '/dashboard',          icon: '' },
  { label: 'Manage Users',      href: '/dashboard/users',    icon: '' },
  { label: 'Reports',           href: '/dashboard/reports',  icon: '' },
  { label: 'Platform Settings', href: '/dashboard/settings', icon: '' },
];

interface UserRow {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt: string;
}

const ROLE_FILTERS = ['all', 'student', 'tutor', 'admin'] as const;
type RoleFilter = (typeof ROLE_FILTERS)[number];

export default function UsersClient({ user }: { user: JWTPayload }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
        setTotal(data.total ?? 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => { fetchUsers(); }, 300);
    return () => clearTimeout(id);
  }, [fetchUsers]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardShell user={user} navItems={navItems}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
              Manage Users
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
              {total} total user{total !== 1 ? 's' : ''} on the platform
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 px-4 py-2 rounded-lg border text-sm"
            style={{
              fontFamily: 'var(--font-sans)',
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-canvas)',
              color: 'var(--color-ink)',
              outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--color-gold)')}
            onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
          />
          <div className="flex gap-1 p-1 rounded-lg flex-shrink-0" style={{ backgroundColor: 'var(--color-paper)' }}>
            {ROLE_FILTERS.map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all"
                style={{
                  backgroundColor: roleFilter === r ? 'var(--color-canvas)' : 'transparent',
                  color: roleFilter === r ? 'var(--color-ink)' : 'var(--color-ink-50)',
                  fontFamily: 'var(--font-sans)',
                  boxShadow: roleFilter === r ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)' }}>
          <div className="grid grid-cols-4 px-6 py-3 text-xs font-bold uppercase tracking-wider border-b"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
            <span className="col-span-2">User</span>
            <span>Role</span>
            <span>Joined</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--color-ink-50)' }}>Loading users…</div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
              No users match your filters.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {users.map(u => (
                <div key={u._id} className="grid grid-cols-4 px-6 py-3.5 items-center hover:bg-[var(--color-paper)] transition-colors">
                  {/* Name + email */}
                  <div className="col-span-2 flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: 'var(--color-gold-pale)', color: 'var(--color-gold)' }}
                    >
                      {u.name?.substring(0, 2).toUpperCase() ?? '??'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                        {u.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                        {u.email}
                      </p>
                    </div>
                  </div>

                  {/* Role badge */}
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize w-fit"
                    style={{
                      backgroundColor:
                        u.role === 'tutor' ? '#edfaf3' :
                        u.role === 'admin' ? '#fef2f2' :
                        'var(--color-gold-pale)',
                      color:
                        u.role === 'tutor' ? '#1a7a45' :
                        u.role === 'admin' ? '#c0392b' :
                        'var(--color-gold)',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {u.role}
                  </span>

                  {/* Joined */}
                  <p className="text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm" style={{ fontFamily: 'var(--font-sans)' }}>
            <p style={{ color: 'var(--color-ink-50)' }}>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-40"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-40"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
