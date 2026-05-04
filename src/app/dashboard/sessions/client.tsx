'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { JWTPayload } from '@/lib/auth';
import CancellationModal from '@/components/CancellationModal';
import RatingModal from '@/components/RatingModal';
import PaymentGatewayModal from '@/components/payment/PaymentGatewayModal';
import { CheckCircle2, Clock, AlertCircle, CreditCard, DollarSign, Shield, ShieldCheck } from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: '⌂' },
  { label: 'Search Tutors', href: '/dashboard/search', icon: '' },
  { label: 'My Sessions', href: '/dashboard/sessions', icon: '' },
  { label: 'My Payments', href: '/dashboard/payments', icon: '' },
  { label: 'Messages', href: '/dashboard/messages', icon: '' },
  { label: 'Settings', href: '/dashboard/settings', icon: '' },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#fef9ee', text: '#c47c10' },
  accepted:  { bg: '#edfaf3', text: '#1a7a45' },
  declined:  { bg: '#fef2f2', text: '#c0392b' },
  completed: { bg: '#f0f4ff', text: '#3b5bdb' },
  cancelled: { bg: '#fef2f2', text: '#c0392b' },
};

const paymentStatusColors: Record<string, { bg: string; color: string; icon: any; label: string }> = {
  unpaid:    { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', icon: Clock, label: 'Unpaid' },
  pending:   { bg: 'rgba(99,102,241,0.1)', color: '#6366f1', icon: Clock, label: 'Pending' },
  paid:      { bg: 'rgba(52,168,83,0.1)', color: '#34a853', icon: CheckCircle2, label: 'Paid' },
  failed:    { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', icon: AlertCircle, label: 'Failed' },
  refunded:  { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', icon: DollarSign, label: 'Refunded' },
};

export default function SessionsPageClient({ user }: { user: JWTPayload }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState(false);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  
  // Verification state
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => { if (d.sessions) setSessions(d.sessions); setLoading(false); });
  }, []);

  const handleCancelClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!selectedSessionId) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/sessions/${selectedSessionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setShowCancelModal(false);
        setSelectedSessionId(null);
        // Refresh sessions
        const data = await fetch('/api/sessions').then(r => r.json());
        if (data.sessions) setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Cancellation error:', error);
    } finally {
      setCancelling(false);
    }
  };

  const handleRatingClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async (ratingValue: number, review: string) => {
    if (!selectedSessionId) return;
    setRating(true);
    try {
      const res = await fetch(`/api/sessions/${selectedSessionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: ratingValue, review }),
      });
      if (res.ok) {
        setShowRatingModal(false);
        setSelectedSessionId(null);
        // Refresh sessions
        const data = await fetch('/api/sessions').then(r => r.json());
        if (data.sessions) setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Rating error:', error);
    } finally {
      setRating(false);
    }
  };

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter);

  const handlePayNow = (session: any) => {
    setSelectedSession(session);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    if (!selectedSession) return;
    
    try {
      await fetch(`/api/sessions/${selectedSession._id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          paymentMethod: 'jazzcash',
        }),
      });
      
      // Refresh sessions
      const data = await fetch('/api/sessions').then(r => r.json());
      if (data.sessions) setSessions(data.sessions);
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setShowPaymentModal(false);
      setSelectedSession(null);
    }
  };

  const handleVerifyPayment = async (sessionId: string, verified: boolean) => {
    setVerifying(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified }),
      });
      
      if (res.ok) {
        // Refresh sessions
        const data = await fetch('/api/sessions').then(r => r.json());
        if (data.sessions) setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
    } finally {
      setVerifying(null);
    }
  };

  const isStudent = user.role === 'student';
  const isTutor = user.role === 'tutor';

  return (
    <>
    <DashboardShell user={user} navItems={navItems}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>My Sessions</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>All your booked tutoring sessions</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'accepted', 'declined'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                style={{
                  backgroundColor: filter === f ? 'var(--color-ink)' : 'var(--color-canvas)',
                  color: filter === f ? 'var(--color-canvas)' : 'var(--color-ink-50)',
                  border: `1px solid ${filter === f ? 'var(--color-ink)' : 'var(--color-border)'}`,
                  fontFamily: 'var(--font-sans)',
                }}
              >{f}</button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-canvas)' }}>
          {loading ? (
            <div className="p-10 text-center text-sm" style={{ color: 'var(--color-ink-50)' }}>Loading sessions...</div>
          ) : filtered.length === 0 ? (
            <div className="p-14 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>No {filter === 'all' ? '' : filter} sessions yet.</p>
            </div>
           ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
               {filtered.map(s => {
                 const sc = statusColors[s.status] ?? { bg: '#f5f5f5', text: '#555' };
                 const canCancel = ['pending', 'accepted'].includes(s.status);
                 const canRate = s.status === 'completed' && !s.rating;
                 
                 // Payment status
                 const paymentStatus = s.paymentStatus || 'unpaid';
                 const psConfig = paymentStatusColors[paymentStatus] || paymentStatusColors.unpaid;
                 const PSIcon = psConfig.icon;
                 
                 // Show payment actions
                 const showPayButton = isStudent && (paymentStatus === 'unpaid' || paymentStatus === 'failed');
                 const showVerifyButton = isTutor && paymentStatus === 'paid' && s.tutorPaymentStatus !== 'verified';
                 const isVerified = s.tutorPaymentStatus === 'verified';
                 
                 return (
                   <div key={s._id} className="flex items-center gap-4 px-6 py-4">
                     <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: 'var(--color-gold-pale)', color: 'var(--color-gold)' }}>
                       {isStudent ? (s.tutor?.name?.substring(0, 2).toUpperCase() || 'TU') : (s.student?.name?.substring(0, 2).toUpperCase() || 'ST')}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>{s.subject}</p>
                       <p className="text-xs truncate" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                         {isStudent ? `with ${s.tutor?.name ?? 'Tutor'}` : `with ${s.student?.name ?? 'Student'}`}
                       </p>
                       {s.amount && (
                         <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-sans)' }}>
                           Rs. {s.amount.toLocaleString()} • {s.duration || 1.5} hrs @ Rs. {s.hourlyRate || 500}/hr
                         </p>
                       )}
                     </div>
                     <div className="text-right flex-shrink-0 space-y-1">
                       <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>{new Date(s.scheduledAt).toLocaleString()}</p>
                       
                       {/* Payment Status Badge */}
                       <div className="flex items-center gap-1 justify-end">
                         <span 
                           className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                           style={{ backgroundColor: psConfig.bg, color: psConfig.color }}
                         >
                           <PSIcon className="w-3 h-3" />
                           {psConfig.label}
                         </span>
                         {isVerified && (
                           <span 
                             className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                             style={{ backgroundColor: 'rgba(52,168,83,0.1)', color: '#34a853' }}
                           >
                             <ShieldCheck className="w-3 h-3" />
                             Verified
                           </span>
                         )}
                       </div>
                       
                       <div className="flex items-center gap-2 justify-end flex-wrap">
                         <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.text }}>{s.status}</span>
                         {s.rating && (
                           <span className="text-[10px] font-semibold text-yellow-600">★ {s.rating}</span>
                         )}
                         {canRate && (
                           <button
                             onClick={() => handleRatingClick(s._id)}
                             className="text-[10px] font-semibold px-2 py-0.5 rounded transition-all hover:opacity-90"
                             style={{ backgroundColor: '#fffaed', color: '#d97706', border: '1px solid #fcd34d' }}
                           >
                             Rate
                           </button>
                         )}
                         {canCancel && (
                           <button
                             onClick={() => handleCancelClick(s._id)}
                             className="text-[10px] font-semibold px-2 py-0.5 rounded transition-all hover:opacity-80"
                             style={{ backgroundColor: '#fef2f2', color: '#c0392b', border: '1px solid #f0bcbc' }}
                           >
                             Cancel
                           </button>
                          )}
                          
                          {/* Payment Actions */}
                          {showPayButton && (
                            <button
                              onClick={() => handlePayNow(s)}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded transition-all hover:opacity-90 flex items-center gap-1"
                              style={{ backgroundColor: 'var(--color-emerald)', color: 'white' }}
                            >
                              <CreditCard className="w-3 h-3" />
                              Pay Rs. {s.amount?.toLocaleString()}
                            </button>
                          )}
                          
                          {showVerifyButton && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleVerifyPayment(s._id, true)}
                                disabled={verifying === s._id}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded transition-all hover:opacity-90 flex items-center gap-1 disabled:opacity-50"
                                style={{ backgroundColor: 'var(--color-emerald)', color: 'white' }}
                              >
                                <Shield className="w-3 h-3" />
                                {verifying === s._id ? '...' : 'Verify'}
                              </button>
                              <button
                                onClick={() => handleVerifyPayment(s._id, false)}
                                disabled={verifying === s._id}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded transition-all hover:opacity-80"
                                style={{ backgroundColor: '#fef2f2', color: '#c0392b', border: '1px solid #f0bcbc' }}
                              >
                                Dispute
                              </button>
                            </div>
                          )}
                       </div>
                     </div>
                   </div>
                 );
               })}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
       {showCancelModal && (
         <CancellationModal
           isOpen={showCancelModal}
           onClose={() => { setShowCancelModal(false); setSelectedSessionId(null); }}
           onConfirm={handleCancelConfirm}
           loading={cancelling}
         />
       )}
       {showRatingModal && (
         <RatingModal
           isOpen={showRatingModal}
           onClose={() => { setShowRatingModal(false); setSelectedSessionId(null); }}
           onSubmit={handleRatingSubmit}
           loading={rating}
         />
       )}
       
       {/* Payment Modal */}
       {selectedSession && (
         <PaymentGatewayModal
           isOpen={showPaymentModal}
           onClose={() => { setShowPaymentModal(false); setSelectedSession(null); }}
           onSuccess={handlePaymentSuccess}
           amount={selectedSession.amount || Math.round((selectedSession.hourlyRate || 500) * (selectedSession.duration || 1.5))}
           sessionDetails={{
             subject: selectedSession.subject,
             tutorName: selectedSession.tutor?.name || 'Tutor',
             duration: selectedSession.duration || 1.5,
           }}
         />
       )}
    </>
  );
}
