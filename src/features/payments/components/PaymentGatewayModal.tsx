'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Shield, Lock, Clock, CheckCircle2, AlertCircle, Smartphone, CreditCard, Building2 } from 'lucide-react';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transactionId: string) => void;
  amount: number;
  sessionDetails: {
    subject: string;
    tutorName: string;
    duration: number;
  };
}

type PaymentMethod = 'jazzcash' | 'easypaisa' | 'stripe' | 'bank_transfer';
type PaymentStep = 'method' | 'details' | 'processing' | 'success' | 'error';

export default function PaymentGatewayModal({
  isOpen,
  onClose,
  onSuccess,
  amount,
  sessionDetails,
}: PaymentGatewayModalProps) {
  const [step, setStep] = useState<PaymentStep>('method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('jazzcash');
  const [mobileNumber, setMobileNumber] = useState('');
  const [cnic, setCnic] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [transactionId, setTransactionId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const bankTransferReference = useMemo(() => {
    if (!isOpen) return '';
    // eslint-disable-next-line react-hooks/purity
    return `PT-${Date.now().toString().slice(-8)}`;
  }, [isOpen]);

  // Reset state when modal opens - using render phase reset to avoid lint errors
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setStep('method');
    setSelectedMethod('jazzcash');
    setMobileNumber('');
    setCnic('');
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setProcessingProgress(0);
    setTransactionId('');
    setErrorMessage('');
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }


  const generateTransactionId = useCallback(() => {
    const prefix = selectedMethod === 'jazzcash' ? 'JC' :
      selectedMethod === 'easypaisa' ? 'EP' :
      selectedMethod === 'stripe' ? 'ST' : 'BT';
    return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }, [selectedMethod]);

  // Simulate processing
  useEffect(() => {
    if (step === 'processing') {
      const interval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            // 90% success rate simulation
            if (Math.random() > 0.1) {
              const txnId = generateTransactionId();
              setTransactionId(txnId);
              setStep('success');
              setTimeout(() => onSuccess(txnId), 1500);
            } else {
              setErrorMessage('Transaction declined by payment provider. Please try again.');
              setStep('error');
            }
            return 100;
          }
          return prev + Math.random() * 15 + 5;
        });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [step, onSuccess, generateTransactionId]);

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setStep('details');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'jazzcash':
      case 'easypaisa':
        return <Smartphone className="w-6 h-6" />;
      case 'stripe':
        return <CreditCard className="w-6 h-6" />;
      case 'bank_transfer':
        return <Building2 className="w-6 h-6" />;
    }
  };

  const getMethodColor = (method: PaymentMethod) => {
    switch (method) {
      case 'jazzcash':
        return '#c8102e';
      case 'easypaisa':
        return '#00a651';
      case 'stripe':
        return '#635bff';
      case 'bank_transfer':
        return 'var(--color-gold)';
    }
  };

  const getMethodName = (method: PaymentMethod) => {
    switch (method) {
      case 'jazzcash':
        return 'JazzCash';
      case 'easypaisa':
        return 'Easypaisa';
      case 'stripe':
        return 'Credit/Debit Card';
      case 'bank_transfer':
        return 'Bank Transfer';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-canvas)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            {step !== 'method' && step !== 'processing' && step !== 'success' && step !== 'error' && (
              <button
                onClick={() => setStep('method')}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: 'var(--color-ink-50)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <h2
                className="text-lg font-bold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
              >
                {step === 'method' && 'Select Payment Method'}
                {step === 'details' && 'Payment Details'}
                {step === 'processing' && 'Processing Payment'}
                {step === 'success' && 'Payment Successful'}
                {step === 'error' && 'Payment Failed'}
              </h2>
              {step === 'method' && (
                <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                  Secure payment processing
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: 'var(--color-ink-50)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Amount Display */}
          {(step === 'method' || step === 'details') && (
            <div
              className="mb-6 p-4 rounded-xl border"
              style={{ backgroundColor: 'var(--color-gold-pale)', borderColor: 'var(--color-gold)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-sans)' }}>
                    Total Amount to Pay
                  </p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
                    Rs. {amount.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    {sessionDetails.subject}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    with {sessionDetails.tutorName}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    {sessionDetails.duration} hours
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step: Select Method */}
          {step === 'method' && (
            <div className="space-y-3">
              {([
                { id: 'jazzcash', name: 'JazzCash', description: 'Pay via JazzCash Mobile Account', color: '#c8102e' },
                { id: 'easypaisa', name: 'Easypaisa', description: 'Pay via Easypaisa Mobile Account', color: '#00a651' },
                { id: 'stripe', name: 'Credit/Debit Card', description: 'Pay with Visa, Mastercard, or local cards', color: '#635bff' },
                { id: 'bank_transfer', name: 'Bank Transfer', description: 'Direct bank transfer (2-3 business days)', color: 'var(--color-gold)' },
              ] as const).map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id)}
                  className="w-full p-4 rounded-xl border transition-all hover:shadow-md flex items-center gap-4"
                  style={{
                    backgroundColor: 'var(--color-paper)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${method.color}15`, color: method.color }}
                  >
                    {method.id === 'jazzcash' || method.id === 'easypaisa' ? (
                      <Smartphone className="w-6 h-6" />
                    ) : method.id === 'stripe' ? (
                      <CreditCard className="w-6 h-6" />
                    ) : (
                      <Building2 className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p
                      className="font-semibold text-sm"
                      style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}
                    >
                      {method.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                      {method.description}
                    </p>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-ink-50)' }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ))}

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 pt-4">
                <Shield className="w-4 h-4" style={{ color: 'var(--color-emerald)' }} />
                <Lock className="w-4 h-4" style={{ color: 'var(--color-emerald)' }} />
                <span className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                  256-bit SSL Encryption • PCI DSS Compliant
                </span>
              </div>
            </div>
          )}

          {/* Step: Payment Details */}
          {step === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div
                className="flex items-center gap-3 p-3 rounded-lg mb-4"
                style={{ backgroundColor: `${getMethodColor(selectedMethod)}15` }}
              >
                <div style={{ color: getMethodColor(selectedMethod) }}>
                  {getMethodIcon(selectedMethod)}
                </div>
                <span className="font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                  {getMethodName(selectedMethod)}
                </span>
              </div>

              {(selectedMethod === 'jazzcash' || selectedMethod === 'easypaisa') && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2"
                      style={{
                        backgroundColor: 'var(--color-paper)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-ink)',
                        fontFamily: 'var(--font-sans)',
                      }}
                      placeholder="03XX-XXXXXXX"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                      CNIC Last 6 Digits
                    </label>
                    <input
                      type="text"
                      value={cnic}
                      onChange={(e) => setCnic(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2"
                      style={{
                        backgroundColor: 'var(--color-paper)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-ink)',
                        fontFamily: 'var(--font-sans)',
                      }}
                      placeholder="XXXXXX"
                      required
                    />
                  </div>
                </>
              )}

              {selectedMethod === 'stripe' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2"
                      style={{
                        backgroundColor: 'var(--color-paper)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-ink)',
                        fontFamily: 'var(--font-sans)',
                      }}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2"
                        style={{
                          backgroundColor: 'var(--color-paper)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-ink)',
                          fontFamily: 'var(--font-sans)',
                        }}
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                        CVV
                      </label>
                      <input
                        type="password"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full px-4 py-3 rounded-xl border outline-none focus:ring-2"
                        style={{
                          backgroundColor: 'var(--color-paper)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-ink)',
                          fontFamily: 'var(--font-sans)',
                        }}
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {selectedMethod === 'bank_transfer' && (
                <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-border)' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                    Bank Transfer Instructions
                  </p>
                  <div className="space-y-2 text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    <p>1. Transfer Rs. {amount.toLocaleString()} to:</p>
                    <p className="pl-4 font-mono">Account: 0123-4567890123</p>
                    <p className="pl-4 font-mono">Bank: HBL (Habib Bank Limited)</p>
                    <p className="pl-4 font-mono">Title: PeerTutor Pakistan</p>
                    <p>2. Use reference: <strong className="font-mono" style={{ color: 'var(--color-ink)' }}>{bankTransferReference}</strong></p>
                    <p>3. Upload receipt or click confirm below</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 rounded-xl font-semibold text-sm transition-all hover:shadow-lg"
                style={{
                  backgroundColor: getMethodColor(selectedMethod),
                  color: '#ffffff',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Pay Rs. {amount.toLocaleString()}
              </button>

              <div className="flex items-center justify-center gap-2 pt-2">
                <Lock className="w-4 h-4" style={{ color: 'var(--color-emerald)' }} />
                <span className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                  Your payment information is encrypted and secure
                </span>
              </div>
            </form>
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <div className="py-8 text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="var(--color-border)"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={getMethodColor(selectedMethod)}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${processingProgress * 2.51} 251`}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                    {Math.round(processingProgress)}%
                  </span>
                </div>
              </div>
              <p className="text-lg font-semibold mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                Processing your payment...
              </p>
              <p className="text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                Please do not close this window
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 animate-pulse" style={{ color: 'var(--color-gold)' }} />
                <span className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                  Connecting to {getMethodName(selectedMethod)}...
                </span>
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="py-8 text-center">
              <div
                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(52,168,83,0.1)' }}
              >
                <CheckCircle2 className="w-10 h-10" style={{ color: 'var(--color-emerald)' }} />
              </div>
              <p className="text-xl font-bold mb-2" style={{ color: 'var(--color-emerald)', fontFamily: 'var(--font-display)' }}>
                Payment Successful!
              </p>
              <p className="text-sm mb-4" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                Transaction ID: <span className="font-mono" style={{ color: 'var(--color-ink)' }}>{transactionId}</span>
              </p>
              <div
                className="p-4 rounded-xl border mb-4"
                style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-border)' }}
              >
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Amount Paid</span>
                  <span className="font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                    Rs. {amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Payment Method</span>
                  <span className="font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                    {getMethodName(selectedMethod)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Date & Time</span>
                  <span className="font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                    {new Date().toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                A receipt has been sent to your email
              </p>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="py-8 text-center">
              <div
                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
              >
                <AlertCircle className="w-10 h-10" style={{ color: 'var(--color-danger)' }} />
              </div>
              <p className="text-xl font-bold mb-2" style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-display)' }}>
                Payment Failed
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                {errorMessage}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('details')}
                  className="flex-1 py-3 rounded-xl font-medium transition-all border"
                  style={{
                    backgroundColor: 'var(--color-paper)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-ink)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Try Again
                </button>
                <button
                  onClick={() => setStep('method')}
                  className="flex-1 py-3 rounded-xl font-medium transition-all"
                  style={{
                    backgroundColor: 'var(--color-gold)',
                    color: 'var(--color-canvas)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Change Method
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
