'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '@/features/dashboard/components/DashboardShell';
import { JWTPayload } from '@/lib/auth';
import PaymentGatewayModal from '@/features/payments/components/PaymentGatewayModal';
import InvoiceViewer from '@/features/payments/components/InvoiceViewer';
import { CreditCard, CheckCircle2, Clock, AlertCircle, FileText, Search, Download } from 'lucide-react';
import { format } from 'date-fns';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: '⌂' },
  { label: 'Search Tutors', href: '/dashboard/search', icon: '' },
  { label: 'My Sessions', href: '/dashboard/sessions', icon: '' },
  { label: 'My Payments', href: '/dashboard/payments', icon: '' },
  { label: 'Messages', href: '/dashboard/messages', icon: '' },
  { label: 'Settings', href: '/dashboard/settings', icon: '' },
];

interface PaymentSession {
  _id: string;
  subject: string;
  scheduledAt: string;
  status: string;
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
  amount?: number;
  duration?: number;
  hourlyRate?: number;
  transactionId?: string;
  paidAt?: string;
  paymentMethod?: string;
  tutor?: {
    name: string;
    email?: string;
  };
  invoice?: {
    invoiceNumber: string;
    status: string;
  };
}

interface InvoicePreview {
  id: string;
  invoiceNumber: string;
  status: string;
  createdAt: string;
  paidAt?: string;
  sessionSubject: string;
  sessionDate: string;
  duration: number;
  hourlyRate: number;
  subtotal: number;
  platformFee: number;
  totalAmount: number;
  transactionId?: string;
  tutorName?: string;
  studentName?: string;
  studentEmail?: string;
}

export default function PaymentsClient({ user }: { user: JWTPayload }) {
  const [sessions, setSessions] = useState<PaymentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<PaymentSession | null>(null);
  const [, setPaymentProcessing] = useState(false);

  // Invoice viewer state
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoicePreview | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = (session: PaymentSession) => {
    setSelectedSession(session);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (transactionId: string, paymentMethod: string) => {
    if (!selectedSession) return;
    
    setPaymentProcessing(true);
    
    try {
      await fetch(`/api/sessions/${selectedSession._id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          paymentMethod: paymentMethod || selectedSession.paymentMethod || 'jazzcash',
        }),
      });
      
      // Refresh sessions
      await fetchSessions();
    } catch (error) {
      console.error('Error updating payment:', error);
    } finally {
      setPaymentProcessing(false);
      setShowPaymentModal(false);
      setSelectedSession(null);
    }
  };


  const handleViewInvoice = (session: PaymentSession) => {
    if (!session.amount || !session.tutor) return;
    
    setSelectedInvoice({
      id: session._id,
      invoiceNumber: session.invoice?.invoiceNumber || `INV-${format(new Date(), 'yyyyMM')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      status: session.paymentStatus === 'paid' ? 'paid' : 'generated',
      createdAt: session.scheduledAt,
      paidAt: session.paidAt,
      sessionSubject: session.subject,
      sessionDate: session.scheduledAt,
      duration: session.duration || 1.5,
      hourlyRate: session.hourlyRate || 500,
      subtotal: session.amount,
      platformFee: Math.round((session.amount || 0) * 0.15),
      totalAmount: session.amount,
      transactionId: session.transactionId,
      tutorName: session.tutor?.name,
      studentName: user.name,
      studentEmail: user.email,
    });
    setShowInvoice(true);
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = 
      session.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.tutor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.transactionId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || session.paymentStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const unpaidSessions = sessions.filter(s => s.paymentStatus === 'unpaid' || s.paymentStatus === 'pending' || s.paymentStatus === 'failed');
  const paidSessions = sessions.filter(s => s.paymentStatus === 'paid');
  const totalPaid = paidSessions.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalUnpaid = unpaidSessions.reduce((sum, s) => sum + (s.amount || 0), 0);

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; color: string; icon: React.ReactNode; label: string }> = {
      unpaid: { 
        bg: 'rgba(245,158,11,0.1)', 
        color: '#f59e0b', 
        icon: <Clock className="w-3 h-3" />, 
        label: 'Unpaid' 
      },
      pending: { 
        bg: 'rgba(99,102,241,0.1)', 
        color: '#6366f1', 
        icon: <Clock className="w-3 h-3" />, 
        label: 'Pending' 
      },
      paid: { 
        bg: 'rgba(52,168,83,0.1)', 
        color: 'var(--color-emerald)', 
        icon: <CheckCircle2 className="w-3 h-3" />, 
        label: 'Paid' 
      },
      failed: { 
        bg: 'rgba(239,68,68,0.1)', 
        color: 'var(--color-danger)', 
        icon: <AlertCircle className="w-3 h-3" />, 
        label: 'Failed' 
      },
      refunded: { 
        bg: 'rgba(107,114,128,0.1)', 
        color: '#6b7280', 
        icon: <Download className="w-3 h-3" />, 
        label: 'Refunded' 
      },
    };
    
    const config = configs[status] || configs.unpaid;
    
    return (
      <span 
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: config.bg, color: config.color }}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  return (
    <DashboardShell user={user} navItems={navItems}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
              My Payments
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
              Manage your session payments and view payment history
            </p>
          </div>
          {unpaidSessions.length > 0 && (
            <div className="px-4 py-3 rounded-xl border" style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }}>
              <p className="text-xs font-medium" style={{ color: '#f59e0b' }}>
                {unpaidSessions.length} pending payment{unpaidSessions.length > 1 ? 's' : ''}
              </p>
              <p className="text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                Rs. {totalUnpaid.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Paid"
            amount={totalPaid}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="var(--color-emerald)"
            bgColor="rgba(52,168,83,0.1)"
          />
          <StatCard
            title="Pending"
            amount={totalUnpaid}
            icon={<Clock className="w-5 h-5" />}
            color="#f59e0b"
            bgColor="rgba(245,158,11,0.1)"
          />
          <StatCard
            title="Sessions Paid"
            count={paidSessions.length}
            icon={<CreditCard className="w-5 h-5" />}
            color="var(--color-gold)"
            bgColor="rgba(181,136,58,0.1)"
          />
          <StatCard
            title="Sessions Pending"
            count={unpaidSessions.length}
            icon={<AlertCircle className="w-5 h-5" />}
            color="var(--color-danger)"
            bgColor="rgba(239,68,68,0.1)"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-ink-50)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search payments by subject, tutor, or transaction ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none"
              style={{
                backgroundColor: 'var(--color-canvas)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-ink)',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border outline-none"
            style={{
              backgroundColor: 'var(--color-canvas)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <option value="all">All Status</option>
            <option value="unpaid">Unpaid</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Payments List */}
        <div 
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-paper)' }}>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    Session
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    Tutor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="animate-pulse text-sm" style={{ color: 'var(--color-ink-50)' }}>
                        Loading payments...
                      </div>
                    </td>
                  </tr>
                ) : filteredSessions.length > 0 ? (
                  filteredSessions.map((session) => (
                    <tr key={session._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: 'var(--color-gold-pale)' }}
                          >
                            <FileText className="w-5 h-5" style={{ color: 'var(--color-gold)' }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                              {session.subject}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                              {session.duration || 1.5} hours @ Rs. {session.hourlyRate || 500}/hr
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                          {session.tutor?.name || 'Tutor'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                          {format(new Date(session.scheduledAt), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                          {format(new Date(session.scheduledAt), 'h:mm a')}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                          Rs. {(session.amount || 0).toLocaleString()}
                        </p>
                        {session.paymentStatus === 'paid' && session.transactionId && (
                          <p className="text-xs font-mono" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                            {session.transactionId.slice(0, 15)}...
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(session.paymentStatus)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {(session.paymentStatus === 'unpaid' || session.paymentStatus === 'failed') && (
                            <button
                              onClick={() => handlePayNow(session)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                              style={{ backgroundColor: 'var(--color-emerald)', color: 'white' }}
                            >
                              Pay Now
                            </button>
                          )}
                          {session.paymentStatus === 'paid' && (
                            <>
                              <button
                                onClick={() => handleViewInvoice(session)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                style={{ color: 'var(--color-ink-50)' }}
                                title="View Invoice"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              <button
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                style={{ color: 'var(--color-ink-50)' }}
                                title="Download Receipt"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--color-gold-pale)' }}>
                        <CreditCard className="w-8 h-8" style={{ color: 'var(--color-gold)' }} />
                      </div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                        No payments found
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                        {searchQuery || statusFilter !== 'all' 
                          ? 'Try adjusting your filters' 
                          : 'Your payments will appear here after booking sessions'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedSession && (
          <PaymentGatewayModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={handlePaymentSuccess}
            amount={selectedSession.amount || Math.round((selectedSession.hourlyRate || 500) * (selectedSession.duration || 1.5))}
            sessionId={selectedSession._id}
            sessionDetails={{
              subject: selectedSession.subject,
              tutorName: selectedSession.tutor?.name || 'Tutor',
              duration: selectedSession.duration || 1.5,
            }}
          />
        )}

        {/* Invoice Viewer */}
        <InvoiceViewer
          invoice={selectedInvoice}
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
          userRole="student"
        />
      </div>
    </DashboardShell>
  );
}

// Stat Card Component
function StatCard({ 
  title, 
  amount, 
  count,
  icon, 
  color, 
  bgColor 
}: { 
  title: string; 
  amount?: number;
  count?: number;
  icon: React.ReactNode; 
  color: string; 
  bgColor: string;
}) {
  return (
    <div 
      className="p-5 rounded-2xl border"
      style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
            {title}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
            {amount !== undefined ? `Rs. ${amount.toLocaleString()}` : count}
          </p>
        </div>
        <div 
          className="p-2.5 rounded-xl"
          style={{ backgroundColor: bgColor, color }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
