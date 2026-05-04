'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '@/features/dashboard/components/DashboardShell';
import { JWTPayload } from '@/lib/auth';
import InvoiceViewer from '@/features/payments/components/InvoiceViewer';
import { FileText, Download, Eye, CheckCircle2, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';

const navItems = [
  { label: 'Schedule',    href: '/dashboard',          icon: '' },
  { label: 'My Students', href: '/dashboard/students', icon: '' },
  { label: 'Requests',    href: '/dashboard/requests', icon: '' },
  { label: 'Messages',    href: '/dashboard/messages', icon: '' },
  { label: 'Earnings',    href: '/dashboard/earnings', icon: '' },
  { label: 'Invoices',    href: '/dashboard/invoices', icon: '' },
  { label: 'Profile',     href: '/dashboard/profile',  icon: '' },
];

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

export default function InvoicesClient({ user }: { user: JWTPayload }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/tutor/invoices');
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.sessionSubject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.tutorName && invoice.tutorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (invoice.studentName && invoice.studentName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewerOpen(true);
  };

  return (
    <DashboardShell user={user} navItems={navItems}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
              Invoices & Receipts
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
              View and download all your payment invoices
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
              Total: <strong style={{ color: 'var(--color-ink)' }}>{invoices.length}</strong> invoices
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Invoices"
            count={invoices.length}
            icon={<FileText className="w-5 h-5" />}
            color="var(--color-gold)"
            bgColor="rgba(181,136,58,0.1)"
          />
          <StatCard
            title="Paid"
            count={invoices.filter(i => i.status === 'paid').length}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="var(--color-emerald)"
            bgColor="rgba(52,168,83,0.1)"
          />
          <StatCard
            title="Pending"
            count={invoices.filter(i => i.status === 'generated').length}
            icon={<Clock className="w-5 h-5" />}
            color="#f59e0b"
            bgColor="rgba(245,158,11,0.1)"
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
              placeholder="Search invoices..."
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
            <option value="generated">Generated</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {/* Invoices List */}
        <div 
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-paper)' }}>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    Invoice
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    Session
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
                        Loading invoices...
                      </div>
                    </td>
                  </tr>
                ) : filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: 'var(--color-gold-pale)' }}
                          >
                            <FileText className="w-5 h-5" style={{ color: 'var(--color-gold)' }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold font-mono" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                              {invoice.invoiceNumber}
                            </p>
                            {invoice.transactionId && (
                              <p className="text-xs font-mono" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                                TXN: {invoice.transactionId.slice(0, 12)}...
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                          {invoice.sessionSubject}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                          {invoice.duration} hours @ Rs. {invoice.hourlyRate}/hr
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                          {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                          {format(new Date(invoice.createdAt), 'h:mm a')}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                          Rs. {invoice.totalAmount.toLocaleString()}
                        </p>
                        {user.role === 'tutor' && (
                          <p className="text-xs" style={{ color: 'var(--color-emerald)', fontFamily: 'var(--font-sans)' }}>
                            You earn: Rs. {(invoice.totalAmount - invoice.platformFee).toLocaleString()}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span 
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: invoice.status === 'paid' ? 'rgba(52,168,83,0.1)' : 
                                            invoice.status === 'sent' ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)',
                            color: invoice.status === 'paid' ? 'var(--color-emerald)' : 
                                   invoice.status === 'sent' ? '#6366f1' : '#f59e0b',
                          }}
                        >
                          {invoice.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                          {invoice.status === 'generated' && <Clock className="w-3 h-3" />}
                          {invoice.status === 'sent' && <FileText className="w-3 h-3" />}
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewInvoice(invoice)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{ color: 'var(--color-ink-50)' }}
                            title="View Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{ color: 'var(--color-ink-50)' }}
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--color-gold-pale)' }}>
                        <FileText className="w-8 h-8" style={{ color: 'var(--color-gold)' }} />
                      </div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                        No invoices found
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                        {searchQuery || statusFilter !== 'all' 
                          ? 'Try adjusting your filters' 
                          : 'Invoices will appear here after your first payment'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Viewer Modal */}
        <InvoiceViewer
          invoice={selectedInvoice}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          userRole={user.role as 'tutor' | 'student'}
        />
      </div>
    </DashboardShell>
  );
}

// Stat Card Component
function StatCard({ 
  title, 
  count, 
  icon, 
  color, 
  bgColor 
}: { 
  title: string; 
  count: number; 
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
            {count}
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
