'use client';

import { useRef } from 'react';
import { X, Download, Printer, CheckCircle2, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
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

interface InvoiceViewerProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: 'tutor' | 'student';
}

export default function InvoiceViewer({ invoice, isOpen, onClose, userRole }: InvoiceViewerProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDownload = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (printWindow && invoiceRef.current) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
              body { font-family: system-ui, sans-serif; margin: 0; padding: 40px; }
              .invoice { max-width: 800px; margin: 0 auto; }
              .header { border-bottom: 2px solid #e5e5e5; padding-bottom: 20px; margin-bottom: 30px; }
              .logo { font-size: 24px; font-weight: bold; color: #b5883a; }
              .invoice-title { font-size: 32px; font-weight: bold; margin-top: 10px; }
              .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
              .status.paid { background: #dcfce7; color: #166534; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
              .section h4 { font-size: 12px; text-transform: uppercase; color: #737373; margin-bottom: 8px; }
              .section p { margin: 4px 0; }
              table { width: 100%; border-collapse: collapse; margin: 30px 0; }
              th { text-align: left; padding: 12px; background: #f5f5f5; font-size: 12px; text-transform: uppercase; color: #737373; }
              td { padding: 16px 12px; border-bottom: 1px solid #e5e5e5; }
              .amount { text-align: right; }
              .totals { margin-top: 30px; border-top: 2px solid #e5e5e5; padding-top: 20px; }
              .total-row { display: flex; justify-content: space-between; margin: 8px 0; }
              .total-row.grand { font-size: 20px; font-weight: bold; margin-top: 16px; padding-top: 16px; border-top: 2px solid #e5e5e5; }
              .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #737373; font-size: 12px; }
              @media print { body { padding: 0; } .no-print { display: none; } }
            </style>
          </head>
          <body>
            ${invoiceRef.current.outerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0">
      {/* Backdrop - hidden when printing */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm no-print" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-auto rounded-2xl shadow-2xl print:shadow-none print:max-w-none print:max-h-none print:overflow-visible"
        style={{ backgroundColor: 'var(--color-canvas)' }}
      >
        {/* Header Actions - hidden when printing */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur no-print" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: 'var(--color-gold)' }} />
            <span className="font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
              Invoice Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--color-ink-50)' }}
              title="Download PDF"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--color-ink-50)' }}
              title="Print"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--color-ink-50)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div ref={invoiceRef} className="p-8 print:p-0">
          <div className="invoice">
            {/* Header */}
            <div className="flex items-start justify-between mb-8 pb-6 border-b-2" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }}>
                    PeerTutor
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                  Pakistan&apos;s Premier Tutoring Platform
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                  support@peertutor.pk • www.peertutor.pk
                </p>
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
                  INVOICE
                </h1>
                <p className="text-lg font-mono mt-1" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-sans)' }}>
                  {invoice.invoiceNumber}
                </p>
                <div className="mt-2">
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: invoice.status === 'paid' ? 'rgba(52,168,83,0.1)' : 'rgba(245,158,11,0.1)',
                      color: invoice.status === 'paid' ? 'var(--color-emerald)' : '#f59e0b',
                    }}
                  >
                    {invoice.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                    {invoice.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Bill To / From */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                  {userRole === 'tutor' ? 'Billed To' : 'Tutor'}
                </h4>
                <div className="space-y-1">
                  <p className="font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                    {userRole === 'tutor' ? invoice.studentName : invoice.tutorName}
                  </p>
                  {userRole === 'tutor' && invoice.studentEmail && (
                    <p className="text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                      {invoice.studentEmail}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                  Invoice Details
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Issue Date:</span>
                    <span style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                      {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {invoice.paidAt && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Paid Date:</span>
                      <span style={{ color: 'var(--color-emerald)', fontFamily: 'var(--font-sans)' }}>
                        {format(new Date(invoice.paidAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  {invoice.transactionId && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Transaction ID:</span>
                      <span className="font-mono" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                        {invoice.transactionId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Session Details */}
            <div className="mb-8">
              <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                Session Details
              </h4>
              <div
                className="p-4 rounded-xl border"
                style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-border)' }}
              >
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Subject</p>
                    <p className="font-medium" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                      {invoice.sessionSubject}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Date</p>
                    <p className="font-medium" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                      {format(new Date(invoice.sessionDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Duration</p>
                    <p className="font-medium" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                      {invoice.duration} hours
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <table className="w-full mb-8">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-paper)' }}>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide rounded-tl-lg" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    Description
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    Rate
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    Hours
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wide rounded-tr-lg" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="py-4 px-4">
                    <p className="font-medium" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                      Tutoring Session - {invoice.sessionSubject}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                      Online tutoring session via PeerTutor platform
                    </p>
                  </td>
                  <td className="py-4 px-4 text-right" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                    Rs. {invoice.hourlyRate.toLocaleString()}/hr
                  </td>
                  <td className="py-4 px-4 text-right" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                    {invoice.duration}
                  </td>
                  <td className="py-4 px-4 text-right font-medium" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                    Rs. {invoice.subtotal.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Subtotal</span>
                  <span style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                    Rs. {invoice.subtotal.toLocaleString()}
                  </span>
                </div>
                {userRole === 'tutor' ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Platform Fee (15%)</span>
                      <span style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-sans)' }}>
                        -Rs. {invoice.platformFee.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-semibold pt-3 border-t" style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                      <span>Your Earnings</span>
                      <span style={{ color: 'var(--color-emerald)' }}>
                        Rs. {(invoice.subtotal - invoice.platformFee).toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Platform Fee</span>
                      <span style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                        Rs. {invoice.platformFee.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-3 border-t-2" style={{ borderColor: 'var(--color-ink)', color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
                      <span>Total Paid</span>
                      <span>Rs. {invoice.totalAmount.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                Thank you for using PeerTutor!
              </p>
              <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                For questions or concerns, please contact support@peertutor.pk
              </p>
              <p className="text-xs mt-4" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                This is a computer-generated invoice and does not require a signature.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
