'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, RefreshCw, Calendar } from 'lucide-react';

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get('sessionId') || '';
  const status = searchParams.get('status') || '';
  const txnId = searchParams.get('txnId') || '';
  const method = searchParams.get('method') || 'jazzcash';

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  
  // Ref to prevent duplicate API calls in React StrictMode
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      setSuccess(false);
      setMessage('Missing session parameters.');
      return;
    }

    if (verifiedRef.current) return;
    verifiedRef.current = true;

    // Fetch session details first so we can show them on screen
    fetch(`/api/sessions/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.session) {
          setSessionDetails(data.session);
        }
      })
      .catch((err) => console.error('Error fetching session details:', err));

    if (status === 'success') {
      // Finalize payment in DB
      fetch(`/api/sessions/${sessionId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: txnId,
          paymentMethod: method,
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (res.ok) {
            setSuccess(true);
            setMessage(data.message || 'Payment completed successfully.');
          } else {
            setSuccess(false);
            setMessage(data.message || 'Verification failed on server.');
          }
        })
        .catch((err) => {
          console.error(err);
          setSuccess(false);
          setMessage('Network error verifying payment.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
      setSuccess(false);
      setMessage('Payment was cancelled or failed.');
    }
  }, [sessionId, status, txnId, method]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
          <h2 className="text-xl font-bold tracking-wide">Finalizing Payment Status</h2>
          <p className="text-slate-400 text-sm max-w-xs">
            Please wait while we confirm your transaction details with the payment provider. Do not refresh.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-900 to-slate-950 pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/80 border border-slate-700/50 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden p-6 text-center space-y-6">
        {success ? (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Payment Success!</h1>
              <p className="text-sm text-slate-400">{message}</p>
            </div>

            {sessionDetails && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/30 text-left text-sm space-y-2.5">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Subject</span>
                  <span className="font-semibold text-white">{sessionDetails.subject}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Tutor</span>
                  <span className="font-semibold text-white">{sessionDetails.tutor?.name || 'Tutor'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Transaction ID</span>
                  <span className="font-mono text-xs text-indigo-300 select-all">{txnId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Paid</span>
                  <span className="font-bold text-emerald-400">Rs. {Number(sessionDetails.amount || 0).toLocaleString()}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => router.push('/dashboard/sessions')}
              className="w-full py-3 rounded-lg text-sm font-semibold bg-emerald-500 text-white shadow-lg shadow-emerald-500/15 hover:bg-emerald-400 hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Go to My Sessions
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Payment Cancelled</h1>
              <p className="text-sm text-slate-400">{message}</p>
            </div>

            <p className="text-xs text-slate-500">
              No funds were charged. If this was a mistake, you can return to the session bookings page to retry the transaction.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard/sessions')}
                className="flex-1 py-3 rounded-lg text-sm font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sessions
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">Loading confirmation page...</div>}>
      <PaymentCallbackContent />
    </Suspense>
  );
}
