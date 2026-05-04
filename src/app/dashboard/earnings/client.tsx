'use client';

import { useCallback, useState, useEffect } from 'react';
import DashboardShell from '@/features/dashboard/components/DashboardShell';
import { JWTPayload } from '@/lib/auth';
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight,
  FileText,
  CreditCard,
  Building2,
  Smartphone
} from 'lucide-react';
import { format } from 'date-fns';

const navItems = [
  { label: 'Schedule',    href: '/dashboard',          icon: '' },
  { label: 'My Students', href: '/dashboard/students', icon: '' },
  { label: 'Requests',    href: '/dashboard/requests', icon: '' },
  { label: 'Messages',    href: '/dashboard/messages', icon: '' },
  { label: 'Earnings',    href: '/dashboard/earnings', icon: '' },
  { label: 'Profile',     href: '/dashboard/profile',  icon: '' },
];

interface EarningsData {
  summary: {
    totalEarnings: number;
    pendingEarnings: number;
    availableBalance: number;
    totalWithdrawn: number;
    totalPlatformFees: number;
    hourlyRate: number;
    completedSessions: number;
    pendingPayments: number;
    completedPayments: number;
  };
  monthlyBreakdown: Array<{
    month: string;
    earnings: number;
    withdrawn: number;
    net: number;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    status: string;
    date: string;
    transactionId?: string;
  }>;
}

interface WithdrawalData {
  availableBalance: number;
  pendingAmount: number;
  recentWithdrawals: Array<{
    id: string;
    reference: string;
    amount: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
    processedAt?: string;
    transactionId?: string;
  }>;
}

type EarningsTabId = 'overview' | 'payments' | 'withdrawals';

export default function EarningsClient({ user }: { user: JWTPayload }) {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [withdrawalData, setWithdrawalData] = useState<WithdrawalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EarningsTabId>('overview');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    fetchEarningsData();
    fetchWithdrawalData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      const res = await fetch('/api/tutor/earnings');
      const data = await res.json();
      if (data.summary) {
        setEarningsData(data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawalData = async () => {
    try {
      const res = await fetch('/api/tutor/withdraw');
      const data = await res.json();
      setWithdrawalData(data);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  const summary = earningsData?.summary;

  return (
    <DashboardShell user={user} navItems={navItems}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
              Earnings & Payments
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
              Track your earnings, request withdrawals, and view payment history
            </p>
          </div>
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={!summary || summary.availableBalance < 1000}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: summary && summary.availableBalance >= 1000 ? 'var(--color-gold)' : 'var(--color-border)', 
              color: summary && summary.availableBalance >= 1000 ? 'var(--color-canvas)' : 'var(--color-ink-50)',
              fontFamily: 'var(--font-sans)'
            }}
          >
            <Wallet className="w-4 h-4" />
            Withdraw Funds
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <BalanceCard
            title="Available Balance"
            amount={summary?.availableBalance || 0}
            icon={<Wallet className="w-5 h-5" />}
            color="var(--color-emerald)"
            bgColor="rgba(52,168,83,0.1)"
            loading={loading}
          />
          <BalanceCard
            title="Total Earnings"
            amount={summary?.totalEarnings || 0}
            icon={<TrendingUp className="w-5 h-5" />}
            color="var(--color-gold)"
            bgColor="rgba(181,136,58,0.1)"
            loading={loading}
          />
          <BalanceCard
            title="Pending Earnings"
            amount={summary?.pendingEarnings || 0}
            icon={<Clock className="w-5 h-5" />}
            color="#f59e0b"
            bgColor="rgba(245,158,11,0.1)"
            loading={loading}
          />
          <BalanceCard
            title="Total Withdrawn"
            amount={summary?.totalWithdrawn || 0}
            icon={<ArrowUpRight className="w-5 h-5" />}
            color="#6366f1"
            bgColor="rgba(99,102,241,0.1)"
            loading={loading}
          />
        </div>

        {/* Hourly Rate & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hourly Rate Card */}
          <div 
            className="rounded-2xl p-6 border"
            style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                Your Hourly Rate
              </h3>
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'var(--color-gold-pale)' }}
              >
                <CreditCard className="w-4 h-4" style={{ color: 'var(--color-gold)' }} />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
                  {loading ? '—' : `Rs. ${summary?.hourlyRate || 0}`}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                  per hour
                </p>
              </div>
              <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Platform Fee</span>
                  <span className="font-medium" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>15%</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>You Keep</span>
                  <span className="font-medium" style={{ color: 'var(--color-emerald)', fontFamily: 'var(--font-sans)' }}>85%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Chart */}
          <div 
            className="rounded-2xl p-6 border lg:col-span-2"
            style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                6-Month Earnings Overview
              </h3>
              <select 
                className="text-xs px-3 py-1.5 rounded-lg border outline-none"
                style={{ 
                  backgroundColor: 'var(--color-paper)', 
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-ink)',
                  fontFamily: 'var(--font-sans)'
                }}
              >
                <option>Last 6 Months</option>
                <option>This Year</option>
                <option>Last Year</option>
              </select>
            </div>
            
            {/* Simple Bar Chart */}
            <div className="h-48 flex items-end gap-3">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-pulse text-sm" style={{ color: 'var(--color-ink-50)' }}>Loading chart...</div>
                </div>
              ) : (
                earningsData?.monthlyBreakdown.map((month, index) => {
                  const maxEarnings = Math.max(...(earningsData?.monthlyBreakdown.map(m => m.earnings) || [1]));
                  const height = maxEarnings > 0 ? (month.earnings / maxEarnings) * 100 : 0;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex gap-1 items-end" style={{ height: '140px' }}>
                        <div 
                          className="flex-1 rounded-t-lg transition-all duration-500"
                          style={{ 
                            height: `${height}%`, 
                            backgroundColor: month.earnings > 0 ? 'var(--color-gold)' : 'var(--color-border)',
                            opacity: month.earnings > 0 ? 0.8 : 0.3
                          }}
                          title={`Rs. ${month.earnings.toLocaleString()}`}
                        />
                      </div>
                      <span className="text-xs font-medium" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                        {month.month.split(' ')[0]}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--color-paper)' }}>
          {([
            { id: 'overview', label: 'Overview', count: null },
            { id: 'payments', label: 'Payment History', count: summary?.completedPayments },
            { id: 'withdrawals', label: 'Withdrawals', count: withdrawalData?.recentWithdrawals.length },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: activeTab === tab.id ? 'var(--color-canvas)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-ink)' : 'var(--color-ink-50)',
                fontFamily: 'var(--font-sans)',
                boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span 
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{ 
                    backgroundColor: activeTab === tab.id ? 'var(--color-gold)' : 'var(--color-border)',
                    color: activeTab === tab.id ? 'var(--color-canvas)' : 'var(--color-ink-50)',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'overview' && (
            <OverviewTab 
              summary={summary} 
              recentPayments={earningsData?.recentPayments}
              recentWithdrawals={withdrawalData?.recentWithdrawals}
              loading={loading}
            />
          )}
          {activeTab === 'payments' && (
            <PaymentsTab loading={loading} />
          )}
          {activeTab === 'withdrawals' && (
            <WithdrawalsTab 
              withdrawals={withdrawalData?.recentWithdrawals}
              loading={loading}
            />
          )}
        </div>

        {/* Withdraw Modal would go here */}
        {showWithdrawModal && (
          <WithdrawModal 
            availableBalance={summary?.availableBalance || 0}
            onClose={() => setShowWithdrawModal(false)}
            onSuccess={() => {
              setShowWithdrawModal(false);
              fetchWithdrawalData();
              fetchEarningsData();
            }}
          />
        )}
      </div>
    </DashboardShell>
  );
}

// Balance Card Component
function BalanceCard({ 
  title, 
  amount, 
  icon, 
  color, 
  bgColor,
  loading 
}: { 
  title: string; 
  amount: number; 
  icon: React.ReactNode; 
  color: string; 
  bgColor: string;
  loading: boolean;
}) {
  return (
    <div 
      className="rounded-2xl p-5 border transition-all hover:shadow-lg"
      style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
            {title}
          </p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
            {loading ? '—' : `Rs. ${amount.toLocaleString()}`}
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

// Overview Tab
function OverviewTab({ 
  summary, 
  recentPayments,
  recentWithdrawals,
  loading 
}: { 
  summary?: EarningsData['summary'];
  recentPayments?: EarningsData['recentPayments'];
  recentWithdrawals?: WithdrawalData['recentWithdrawals'];
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Payments */}
      <div 
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
            Recent Payments
          </h3>
          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--color-gold-pale)', color: 'var(--color-gold)' }}>
            {summary?.completedPayments || 0} total
          </span>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--color-ink-50)' }}>Loading...</div>
          ) : recentPayments && recentPayments.length > 0 ? (
            recentPayments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex items-center gap-4 px-6 py-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: payment.status === 'completed' ? 'rgba(52,168,83,0.1)' : 'rgba(245,158,11,0.1)',
                  }}
                >
                  {payment.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--color-emerald)' }} />
                  ) : (
                    <Clock className="w-5 h-5" style={{ color: '#f59e0b' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                    Session Payment
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    {format(new Date(payment.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: 'var(--color-emerald)', fontFamily: 'var(--font-sans)' }}>
                    +Rs. {payment.amount.toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    {payment.status}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: 'var(--color-gold-pale)' }}>
                <Wallet className="w-8 h-8" style={{ color: 'var(--color-gold)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                No payments yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Withdrawals */}
      <div 
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
            Recent Withdrawals
          </h3>
          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--color-gold-pale)', color: 'var(--color-gold)' }}>
            {recentWithdrawals?.length || 0} total
          </span>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--color-ink-50)' }}>Loading...</div>
          ) : recentWithdrawals && recentWithdrawals.length > 0 ? (
            recentWithdrawals.slice(0, 5).map((withdrawal) => (
              <div key={withdrawal.id} className="flex items-center gap-4 px-6 py-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}
                >
                  <ArrowUpRight className="w-5 h-5" style={{ color: '#6366f1' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                    Withdrawal {withdrawal.reference}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    {format(new Date(withdrawal.createdAt), 'MMM d, yyyy')} • {withdrawal.paymentMethod}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                    -Rs. {withdrawal.amount.toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ 
                    color: withdrawal.status === 'completed' ? 'var(--color-emerald)' : 
                           withdrawal.status === 'pending' ? '#f59e0b' : 'var(--color-danger)',
                    fontFamily: 'var(--font-sans)'
                  }}>
                    {withdrawal.status}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: 'var(--color-gold-pale)' }}>
                <ArrowUpRight className="w-8 h-8" style={{ color: 'var(--color-gold)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                No withdrawals yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Payments Tab
interface PaymentsTabItem {
  id: string;
  sessionId?: string;
  sessionSubject: string;
  sessionDate: string;
  duration: number;
  studentName: string;
  amount: number;
  tutorEarnings: number;
  status: string;
}

function PaymentsTab({ loading }: { loading: boolean }) {
  const [payments, setPayments] = useState<PaymentsTabItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch(`/api/tutor/payments?status=${statusFilter}`);
      const data = await res.json();
      setPayments(Array.isArray(data.payments) ? data.payments : []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  }, [statusFilter]);

  useEffect(() => {
    const loadData = async () => {
      await fetchPayments();
    };
    loadData();
  }, [fetchPayments]);

  return (
    <div 
      className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}
    >
      <div className="px-6 py-4 border-b flex items-center justify-between flex-wrap gap-4" style={{ borderColor: 'var(--color-border)' }}>
        <h3 className="font-semibold text-sm" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
          All Payments
        </h3>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg border outline-none"
          style={{ 
            backgroundColor: 'var(--color-paper)', 
            borderColor: 'var(--color-border)',
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-sans)'
          }}
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-paper)' }}>
              <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Session</th>
              <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Duration</th>
              <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm" style={{ color: 'var(--color-ink-50)' }}>Loading...</td>
              </tr>
            ) : payments.length > 0 ? (
              payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                      {payment.sessionSubject}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                      {payment.studentName}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                    {format(new Date(payment.sessionDate), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                    {payment.duration} hrs
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold" style={{ color: 'var(--color-emerald)', fontFamily: 'var(--font-sans)' }}>
                      Rs. {payment.tutorEarnings.toLocaleString()}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                      of Rs. {payment.amount.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span 
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: payment.status === 'completed' ? 'rgba(52,168,83,0.1)' : 
                                        payment.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
                        color: payment.status === 'completed' ? 'var(--color-emerald)' : 
                               payment.status === 'pending' ? '#f59e0b' : '#6366f1',
                      }}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      style={{ color: 'var(--color-ink-50)' }}
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm" style={{ color: 'var(--color-ink-50)' }}>
                  No payments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Withdrawals Tab
function WithdrawalsTab({ 
  withdrawals,
  loading 
}: { 
  withdrawals?: WithdrawalData['recentWithdrawals'];
  loading: boolean;
}) {
  return (
    <div 
      className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: 'var(--color-canvas)', borderColor: 'var(--color-border)' }}
    >
      <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <h3 className="font-semibold text-sm" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
          Withdrawal History
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-paper)' }}>
              <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Reference</th>
              <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Method</th>
              <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>Transaction ID</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm" style={{ color: 'var(--color-ink-50)' }}>Loading...</td>
              </tr>
            ) : withdrawals && withdrawals.length > 0 ? (
              withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                    {withdrawal.reference}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                    {format(new Date(withdrawal.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {withdrawal.paymentMethod === 'jazzcash' && <Smartphone className="w-4 h-4" style={{ color: '#c8102e' }} />}
                      {withdrawal.paymentMethod === 'easypaisa' && <Smartphone className="w-4 h-4" style={{ color: '#00a651' }} />}
                      {withdrawal.paymentMethod === 'bank_transfer' && <Building2 className="w-4 h-4" style={{ color: 'var(--color-ink-50)' }} />}
                      <span className="text-sm capitalize" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                        {withdrawal.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
                    Rs. {withdrawal.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span 
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: withdrawal.status === 'completed' ? 'rgba(52,168,83,0.1)' : 
                                        withdrawal.status === 'pending' ? 'rgba(245,158,11,0.1)' :
                                        withdrawal.status === 'processing' ? 'rgba(99,102,241,0.1)' : 'rgba(239,68,68,0.1)',
                        color: withdrawal.status === 'completed' ? 'var(--color-emerald)' : 
                               withdrawal.status === 'pending' ? '#f59e0b' :
                               withdrawal.status === 'processing' ? '#6366f1' : 'var(--color-danger)',
                      }}
                    >
                      {withdrawal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
                    {withdrawal.transactionId || '—'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm" style={{ color: 'var(--color-ink-50)' }}>
                  No withdrawals found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Withdraw Modal (Simplified - would be expanded)
function WithdrawModal({ 
  availableBalance,
  onClose,
  onSuccess 
}: { 
  availableBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'jazzcash' | 'easypaisa' | 'bank_transfer'>('jazzcash');
  const [mobileNumber, setMobileNumber] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/tutor/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(amount),
          paymentMethod,
          [`${paymentMethod}Details`]: {
            mobileNumber,
            accountTitle,
          },
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to submit withdrawal');
      }
    } catch {
      alert('Network error');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div 
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-canvas)' }}
      >
        <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
            Withdraw Funds
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-ink-50)', fontFamily: 'var(--font-sans)' }}>
            Available Balance: <span className="font-bold" style={{ color: 'var(--color-emerald)' }}>Rs. {availableBalance.toLocaleString()}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
              Amount (Min: Rs. 1,000)
            </label>
            <input
              type="number"
              min="1000"
              max={availableBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border outline-none"
              style={{ 
                backgroundColor: 'var(--color-paper)', 
                borderColor: 'var(--color-border)',
                color: 'var(--color-ink)',
                fontFamily: 'var(--font-sans)'
              }}
              placeholder="Enter amount"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'jazzcash', label: 'JazzCash', color: '#c8102e' },
                { id: 'easypaisa', label: 'Easypaisa', color: '#00a651' },
                { id: 'bank_transfer', label: 'Bank', color: 'var(--color-ink)' },
              ] as const).map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className="py-3 px-2 rounded-xl text-xs font-medium transition-all border"
                  style={{
                    backgroundColor: paymentMethod === method.id ? `${method.color}15` : 'var(--color-paper)',
                    borderColor: paymentMethod === method.id ? method.color : 'var(--color-border)',
                    color: paymentMethod === method.id ? method.color : 'var(--color-ink-50)',
                  }}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
              Mobile Number / Account
            </label>
            <input
              type="text"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border outline-none"
              style={{ 
                backgroundColor: 'var(--color-paper)', 
                borderColor: 'var(--color-border)',
                color: 'var(--color-ink)',
                fontFamily: 'var(--font-sans)'
              }}
              placeholder={paymentMethod === 'bank_transfer' ? 'Account Number' : '03XX-XXXXXXX'}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}>
              Account Title
            </label>
            <input
              type="text"
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border outline-none"
              style={{ 
                backgroundColor: 'var(--color-paper)', 
                borderColor: 'var(--color-border)',
                color: 'var(--color-ink)',
                fontFamily: 'var(--font-sans)'
              }}
              placeholder="Name on account"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-medium transition-all"
              style={{ 
                backgroundColor: 'var(--color-paper)', 
                color: 'var(--color-ink)',
                fontFamily: 'var(--font-sans)'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !amount || parseInt(amount) < 1000 || parseInt(amount) > availableBalance}
              className="flex-1 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
              style={{ 
                backgroundColor: 'var(--color-gold)', 
                color: 'var(--color-canvas)',
                fontFamily: 'var(--font-sans)'
              }}
            >
              {submitting ? 'Processing...' : 'Request Withdrawal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

