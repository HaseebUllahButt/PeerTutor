'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreditCard, Smartphone, ShieldCheck, HelpCircle, Lock, AlertCircle, ArrowRight } from 'lucide-react';

function MockGatewayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const gateway = searchParams.get('gateway') || 'fastpay';
  const orderId = searchParams.get('orderId') || '';
  const amount = searchParams.get('amount') || '0';
  const method = searchParams.get('method') || 'jazzcash';

  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Generate a random phone number if method is wallet
    if (method === 'jazzcash' || method === 'easypaisa') {
      setPhoneNumber('0300' + Math.floor(1000000 + Math.random() * 9000000));
    }
  }, [method]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (gateway === 'stripe') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setError('Please enter a valid 16-digit card number.');
        return;
      }
      handlePay();
    } else {
      if (phoneNumber.length < 10) {
        setError('Please enter a valid mobile number.');
        return;
      }
      setShowOtp(true);
      setError('');
    }
  };

  const handlePay = () => {
    setLoading(true);
    setError('');

    setTimeout(() => {
      const txnId = `${gateway.substring(0, 2).toUpperCase()}-TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      router.push(
        `/dashboard/payments/callback?sessionId=${orderId}&status=success&txnId=${txnId}&method=${method}`
      );
    }, 2000);
  };

  const handleCancel = () => {
    router.push(`/dashboard/payments/callback?sessionId=${orderId}&status=cancelled&method=${method}`);
  };

  const getGatewayColor = () => {
    if (gateway === 'stripe') return '#635bff';
    if (method === 'easypaisa') return '#00a651';
    if (method === 'jazzcash') return '#c8102e';
    return '#f59e0b';
  };

  const getGatewayName = () => {
    if (gateway === 'stripe') return 'Stripe Secure Checkout';
    if (gateway === 'fastpay') return 'FastPay Cash Gateway';
    if (gateway === 'payfast') return 'PayFast Pakistan Aggregator';
    return 'Secure Payment Gateway';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500" />

      <div className="w-full max-w-md bg-slate-800/80 border border-slate-700/50 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Sandbox Warning Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-center flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-xs font-semibold text-amber-300 tracking-wide uppercase">
            Test Environment / Sandbox Mode
          </span>
        </div>

        {/* Brand Header */}
        <div className="p-6 text-center border-b border-slate-700/30">
          <div className="inline-flex items-center gap-2 mb-2">
            {gateway === 'stripe' ? (
              <CreditCard className="w-6 h-6 text-indigo-400" />
            ) : (
              <Smartphone className="w-6 h-6 text-emerald-400" />
            )}
            <h2 className="text-lg font-bold text-slate-200">{getGatewayName()}</h2>
          </div>
          <p className="text-xs text-slate-400">Order ID: {orderId}</p>
        </div>

        {/* Order Details Panel */}
        <div className="mx-6 mt-6 p-4 rounded-xl bg-slate-900/50 border border-slate-700/30 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Amount</p>
            <p className="text-2xl font-bold text-white mt-1">Rs. {Number(amount).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Payment Option</p>
            <span
              className="inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-bold text-white tracking-wide uppercase"
              style={{ backgroundColor: getGatewayColor() }}
            >
              {method}
            </span>
          </div>
        </div>

        {/* Form area */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-300 font-medium">Processing payment on {gateway} sandbox...</p>
              <p className="text-xs text-slate-500">Communicating status back to PeerTutor</p>
            </div>
          ) : (
            <form onSubmit={showOtp ? (e) => { e.preventDefault(); handlePay(); } : handleNext} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* CARD ELEMENT (Stripe) */}
              {gateway === 'stripe' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                        const parts = [];
                        for (let i = 0; i < val.length; i += 4) {
                          parts.push(val.substring(i, i + 4));
                        }
                        setCardNumber(parts.join(' '));
                      }}
                      maxLength={19}
                      placeholder="4242 4242 4242 4242"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Expiry Date</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length >= 2) {
                            setCardExpiry(val.substring(0, 2) + '/' + val.substring(2, 4));
                          } else {
                            setCardExpiry(val);
                          }
                        }}
                        maxLength={5}
                        placeholder="MM/YY"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        maxLength={3}
                        placeholder="123"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* WALLET / MOBILE ELEMENT (FastPay / PayFast) */}
              {gateway !== 'stripe' && !showOtp && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">
                      {method === 'easypaisa' ? 'Easypaisa Account Mobile' : 'JazzCash Wallet Mobile'}
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 03001234567"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    A mock 4-digit verification code will be sent to confirm this wallet payment.
                  </p>
                </div>
              )}

              {/* OTP STEP */}
              {gateway !== 'stripe' && showOtp && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">
                      Enter Verification Code (OTP)
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      maxLength={4}
                      placeholder="Enter 4-digit code (e.g. 1234)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-center text-lg tracking-widest text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-emerald-400 text-center font-medium">
                    Test Mode: You can enter any 4-digit code to authorize the payment.
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 flex items-center justify-center gap-2"
                  style={{ backgroundColor: getGatewayColor() }}
                >
                  {showOtp ? 'Verify & Complete Payment' : gateway === 'stripe' ? 'Confirm Payment' : 'Send Code'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel Transaction
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security Trust Badges */}
        <div className="p-4 bg-slate-900/30 border-t border-slate-700/30 flex items-center justify-between text-slate-500 text-[10px]">
          <div className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            <span>256-bit Secure Layer</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Mock Gateway Verified</span>
          </div>
          <div className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help Support</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MockGatewayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">Loading gateway...</div>}>
      <MockGatewayContent />
    </Suspense>
  );
}
